import { and, asc, desc, eq, gt, isNull } from 'drizzle-orm';
import { db } from '../db';
import { categories, contestants, events, nomineeAccess, nomineeChatMessages, user } from '../db/schema';
import { fastRedis } from './redis-fast';

// Nominee group chat: reads, validation and rate limiting.
//
// Kept out of the createServerFn module for the client-bundle stripping
// reason documented in paystack-credit.ts.

export const MAX_MESSAGE_LENGTH = 1000;
const INITIAL_PAGE = 100;
const MAX_UPDATES = 300;
/**
 * Polls re-read this much history before the client's cursor, so a message
 * whose transaction committed just after a newer one was read isn't missed.
 * Clients merge by id, so the overlap is harmless.
 */
const CURSOR_OVERLAP_MS = 5000;

/** Trims, caps blank lines and length; null when there's nothing left to send. */
export function cleanMessageBody(input: unknown): string | null {
  const text = String(input ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!text) return null;
  if (text.length > MAX_MESSAGE_LENGTH) throw new Error(`Messages can be at most ${MAX_MESSAGE_LENGTH} characters.`);
  return text;
}

export type ChatMessage = {
  id: string;
  body: string | null;
  deleted: boolean;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    type: 'nominee' | 'admin';
    contestantId: string | null;
    name: string;
    imageUrl: string | null;
    category: string | null;
  };
};

function baseQuery() {
  return db
    .select({
      id: nomineeChatMessages.id,
      body: nomineeChatMessages.body,
      deletedAt: nomineeChatMessages.deletedAt,
      pinned: nomineeChatMessages.pinned,
      createdAt: nomineeChatMessages.createdAt,
      updatedAt: nomineeChatMessages.updatedAt,
      authorType: nomineeChatMessages.authorType,
      contestantId: nomineeChatMessages.contestantId,
      nomineeName: contestants.name,
      nomineeImage: contestants.imageUrl,
      categoryName: categories.name,
      adminName: user.name,
      adminOrganization: user.organization,
    })
    .from(nomineeChatMessages)
    .leftJoin(contestants, eq(nomineeChatMessages.contestantId, contestants.id))
    .leftJoin(categories, eq(contestants.categoryId, categories.id))
    .leftJoin(user, eq(nomineeChatMessages.adminId, user.id));
}

type Row = Awaited<ReturnType<ReturnType<typeof baseQuery>['execute']>>[number];

function toMessage(r: Row): ChatMessage {
  const deleted = r.deletedAt !== null;
  const isAdmin = r.authorType === 'admin';
  return {
    id: r.id,
    body: deleted ? null : r.body,
    deleted,
    pinned: !deleted && r.pinned,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    author: {
      type: isAdmin ? 'admin' : 'nominee',
      contestantId: r.contestantId,
      name: isAdmin ? r.adminOrganization || r.adminName || 'Organiser' : r.nomineeName ?? 'Nominee',
      imageUrl: isAdmin ? null : r.nomineeImage,
      category: isAdmin ? null : r.categoryName,
    },
  };
}

/**
 * Without `since`: the latest messages (oldest first) plus every pinned one.
 * With `since`: everything new or changed after that cursor (with overlap).
 */
export async function loadChatMessages(eventId: string, since?: Date | null): Promise<ChatMessage[]> {
  if (since) {
    const rows = await baseQuery()
      .where(and(eq(nomineeChatMessages.eventId, eventId), gt(nomineeChatMessages.updatedAt, new Date(since.getTime() - CURSOR_OVERLAP_MS))))
      .orderBy(asc(nomineeChatMessages.updatedAt))
      .limit(MAX_UPDATES);
    return rows.map(toMessage);
  }
  const [latest, pinned] = await Promise.all([
    baseQuery()
      .where(and(eq(nomineeChatMessages.eventId, eventId), isNull(nomineeChatMessages.deletedAt)))
      .orderBy(desc(nomineeChatMessages.createdAt))
      .limit(INITIAL_PAGE),
    baseQuery().where(and(eq(nomineeChatMessages.eventId, eventId), eq(nomineeChatMessages.pinned, true), isNull(nomineeChatMessages.deletedAt))),
  ]);
  const byId = new Map<string, ChatMessage>();
  for (const r of [...latest, ...pinned]) byId.set(r.id, toMessage(r));
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** The newest updated_at among the messages, as the next poll's cursor. */
export function nextCursor(messages: ChatMessage[], previous?: string | null): string | null {
  let best = previous ?? null;
  for (const m of messages) if (!best || m.updatedAt > best) best = m.updatedAt;
  return best;
}

export async function loadChatState(eventId: string, contestantId?: string) {
  const [[event], access] = await Promise.all([
    db.select({ locked: events.nomineeChatLocked }).from(events).where(eq(events.id, eventId)),
    contestantId
      ? db.select({ mutedAt: nomineeAccess.chatMutedAt }).from(nomineeAccess).where(eq(nomineeAccess.contestantId, contestantId))
      : Promise.resolve([]),
  ]);
  return { locked: Boolean(event?.locked), muted: Boolean(access[0]?.mutedAt) };
}

/** Nominees of the event who have portal access, with their mute state (admin view). */
export async function loadChatMembers(eventId: string) {
  return db
    .select({
      contestantId: contestants.id,
      name: contestants.name,
      imageUrl: contestants.imageUrl,
      category: categories.name,
      activatedAt: nomineeAccess.activatedAt,
      mutedAt: nomineeAccess.chatMutedAt,
    })
    .from(nomineeAccess)
    .innerJoin(contestants, eq(nomineeAccess.contestantId, contestants.id))
    .innerJoin(categories, eq(contestants.categoryId, categories.id))
    .where(eq(categories.eventId, eventId))
    .orderBy(asc(categories.name), asc(contestants.name));
}

/** A message of this event by id (for moderation and own-message deletes). */
export async function findChatMessage(eventId: string, id: unknown) {
  if (typeof id !== 'string' || !id) return null;
  const [row] = await db
    .select({ id: nomineeChatMessages.id, contestantId: nomineeChatMessages.contestantId, deletedAt: nomineeChatMessages.deletedAt })
    .from(nomineeChatMessages)
    .where(and(eq(nomineeChatMessages.id, id), eq(nomineeChatMessages.eventId, eventId)));
  return row ?? null;
}

/** Unread count after `since` (not counting the reader's own) and the newest message. */
export async function loadChatSummary(eventId: string, contestantId: string, since: Date | null) {
  const latest = await baseQuery()
    .where(and(eq(nomineeChatMessages.eventId, eventId), isNull(nomineeChatMessages.deletedAt)))
    .orderBy(desc(nomineeChatMessages.createdAt))
    .limit(30);
  const notMine = latest.filter((r) => r.contestantId !== contestantId);
  const unread = since ? notMine.filter((r) => r.createdAt > since).length : notMine.length;
  return { latest: latest[0] ? toMessage(latest[0]) : null, unread, unreadCapped: unread >= notMine.length && notMine.length === 30 };
}

// ---------------------------------------------------------------------------
// Posting rate limit: 8 messages per 20 seconds per author. Fails open when
// Redis is down (the Arcjet IP limit still applies).
// ---------------------------------------------------------------------------

const RATE_WINDOW_SECONDS = 20;
const RATE_MAX = 8;

export async function allowChatPost(authorKey: string): Promise<boolean> {
  try {
    const key = `nomineechat:rl:${authorKey}`;
    const count = await fastRedis.incr(key);
    if (count === 1) await fastRedis.expire(key, RATE_WINDOW_SECONDS);
    return count <= RATE_MAX;
  } catch {
    return true;
  }
}

export const SLOW_DOWN_MESSAGE = 'You are sending messages too quickly. Please wait a few seconds.';
