import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { categories, contestants, events, nomineeAccess, nomineeChatMessages } from '../db/schema';
import { authMiddleware } from '#/middleware/authMiddleware';
import { arcjetMiddleware } from '#/middleware/arcjetMiddleware';
import { assertEventAccess } from './access-control';
import { requireNominee } from './nominee-access';
import {
  allowChatPost, cleanMessageBody, findChatMessage, loadChatMembers, loadChatMessages, loadChatState,
  loadChatSummary, nextCursor, SLOW_DOWN_MESSAGE,
} from './nominee-chat-queries';

// Nominee group chat: one room per event, for its nominees (with portal
// access) and its admins. Clients poll with a cursor every few seconds.
//
// The polling reads skip arcjetMiddleware on purpose: they need a valid
// session, run one indexed query, and a whole venue of nominees behind one
// IP would otherwise exhaust the shared per-IP bucket. Writes keep it.

const parseSince = (v: unknown): Date | null => {
  if (typeof v !== 'string' || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

// ---------------------------------------------------------------------------
// Nominees
// ---------------------------------------------------------------------------

export const getNomineeChatFn = createServerFn({ method: 'GET' }).handler(async ({ data }: any) => {
  const n = await requireNominee();
  const since = parseSince(data?.since);
  const [messages, state] = await Promise.all([
    loadChatMessages(n.event.id, since),
    loadChatState(n.event.id, n.contestant.id),
  ]);
  return {
    messages,
    cursor: nextCursor(messages, data?.since ?? null),
    full: since === null,
    state,
    me: { contestantId: n.contestant.id },
    event: { title: n.event.title },
  };
});

export const getNomineeChatSummaryFn = createServerFn({ method: 'GET' }).handler(async ({ data }: any) => {
  const n = await requireNominee();
  return loadChatSummary(n.event.id, n.contestant.id, parseSince(data?.since));
});

export const postNomineeChatFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware])
  .handler(async ({ data }: any) => {
    const n = await requireNominee();
    const body = cleanMessageBody(data?.body);
    if (!body) throw new Error('Type a message first.');
    const state = await loadChatState(n.event.id, n.contestant.id);
    if (state.locked) throw new Error('The organiser has locked this chat. Only organisers can post right now.');
    if (state.muted) throw new Error('The organiser has paused your messages in this chat.');
    if (!(await allowChatPost(`n:${n.contestant.id}`))) throw new Error(SLOW_DOWN_MESSAGE);
    const now = new Date();
    const [row] = await db
      .insert(nomineeChatMessages)
      .values({ eventId: n.event.id, contestantId: n.contestant.id, authorType: 'nominee', body, createdAt: now, updatedAt: now })
      .returning({ id: nomineeChatMessages.id });
    return { id: row.id };
  });

/** Nominees can remove their own messages. */
export const deleteOwnNomineeChatFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware])
  .handler(async ({ data }: any) => {
    const n = await requireNominee();
    const msg = await findChatMessage(n.event.id, data?.id);
    if (!msg || msg.contestantId !== n.contestant.id) throw new Error("That message is no longer available.");
    if (!msg.deletedAt) {
      const now = new Date();
      await db
        .update(nomineeChatMessages)
        .set({ deletedAt: now, deletedBy: `nominee:${n.contestant.id}`, body: null, pinned: false, updatedAt: now })
        .where(eq(nomineeChatMessages.id, msg.id));
    }
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Admins
// ---------------------------------------------------------------------------

export const getAdminNomineeChatFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: any) => {
    const eventId = data?.eventId;
    await assertEventAccess(context?.user, eventId);
    const since = parseSince(data?.since);
    const [messages, state, members, [event]] = await Promise.all([
      loadChatMessages(eventId, since),
      loadChatState(eventId),
      // Small (one row per invited nominee), so every poll carries it and mute changes show up.
      loadChatMembers(eventId),
      db.select({ title: events.title }).from(events).where(eq(events.id, eventId)),
    ]);
    return {
      messages,
      cursor: nextCursor(messages, data?.since ?? null),
      full: since === null,
      state,
      members: members.map((m) => ({ ...m, activatedAt: m.activatedAt?.toISOString() ?? null, mutedAt: m.mutedAt?.toISOString() ?? null })),
      event: { title: event?.title ?? '' },
    };
  });

export const postAdminNomineeChatFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const eventId = data?.eventId;
    await assertEventAccess(admin, eventId);
    const body = cleanMessageBody(data?.body);
    if (!body) throw new Error('Type a message first.');
    if (!(await allowChatPost(`a:${admin.id}`))) throw new Error(SLOW_DOWN_MESSAGE);
    const now = new Date();
    const [row] = await db
      .insert(nomineeChatMessages)
      .values({ eventId, adminId: admin.id, authorType: 'admin', body, pinned: Boolean(data?.pin), createdAt: now, updatedAt: now })
      .returning({ id: nomineeChatMessages.id });
    return { id: row.id };
  });

/**
 * action: delete | pin | unpin (messageId), mute | unmute (contestantId),
 * lock | unlock (the whole chat).
 */
export const moderateNomineeChatFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const eventId = data?.eventId;
    const action = data?.action;
    await assertEventAccess(admin, eventId);
    const now = new Date();

    if (action === 'delete' || action === 'pin' || action === 'unpin') {
      const msg = await findChatMessage(eventId, data?.messageId);
      if (!msg || msg.deletedAt) throw new Error("That message is no longer available.");
      await db
        .update(nomineeChatMessages)
        .set(
          action === 'delete'
            ? { deletedAt: now, deletedBy: `admin:${admin.id}`, body: null, pinned: false, updatedAt: now }
            : { pinned: action === 'pin', updatedAt: now },
        )
        .where(eq(nomineeChatMessages.id, msg.id));
      return { ok: true };
    }

    if (action === 'mute' || action === 'unmute') {
      const contestantId = data?.contestantId;
      // The nominee must belong to this event.
      const [member] = await db
        .select({ id: nomineeAccess.contestantId })
        .from(nomineeAccess)
        .innerJoin(contestants, eq(nomineeAccess.contestantId, contestants.id))
        .innerJoin(categories, eq(contestants.categoryId, categories.id))
        .where(and(eq(nomineeAccess.contestantId, String(contestantId ?? '')), eq(categories.eventId, eventId)));
      if (!member) throw new Error("We couldn't find that nominee. They may have been removed from this event.");
      await db.update(nomineeAccess).set({ chatMutedAt: action === 'mute' ? now : null }).where(eq(nomineeAccess.contestantId, member.id));
      return { ok: true };
    }

    if (action === 'lock' || action === 'unlock') {
      await db.update(events).set({ nomineeChatLocked: action === 'lock' }).where(eq(events.id, eventId));
      return { ok: true };
    }

    throw new Error("That action isn't available.");
  });
