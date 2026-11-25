import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { count, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { categories, contestants, events, nomineeAccess } from '../db/schema';
import { authMiddleware } from '#/middleware/authMiddleware';
import { arcjetMiddleware } from '#/middleware/arcjetMiddleware';
import { assertContestantAccess, assertEventAccess } from './access-control';
import { decryptToken, encryptToken, hashToken } from './voter-token';
import {
  canonicalCode, clearNomineeSession, currentNominee, generateNomineeCode, issueNomineeSession,
  NOMINEE_CODE_LENGTH, requireNominee,
} from './nominee-access';
import { clearLoginFailures, getClientIp, isLoginLockedOut, LOCKED_OUT_MESSAGE, recordLoginFailure } from './voter-auth';
import { processImageUpload } from './image-upload';
import { asResultsView, loadCategoryStandings, loadOwnVotes, NOMINEE_RESULTS_VIEWS } from './nominee-dashboard';
import { maskPhone, normalizePhone, toSmsRecipient } from '#/lib/phone';

// Nominee portal: admin invites, nominee sign-in and profile completion.

const LOCKOUT_SCOPE = 'nominee';

function portalUrl(code: string): string {
  const base = (process.env.BETTER_AUTH_URL || process.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
  return `${base}/nominee-portal?code=${encodeURIComponent(code)}`;
}

const smsConfigured = () => Boolean(process.env.SMS_API_URL && process.env.SMS_API_KEY && process.env.SMS_SENDER_ID);

// ---------------------------------------------------------------------------
// Admin: invite a nominee
// ---------------------------------------------------------------------------

/**
 * action:
 *   "prepare" -> create the nominee's access code if they have none; no SMS
 *   "sms"     -> the same, then text the invite to the nominee's phone
 *   "reset"   -> replace the code (signs out every device using the old one); no SMS
 * Returns the code and link so the admin can also share them by hand.
 */
export const nomineeInviteFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const contestantId = data?.contestantId;
    const action = data?.action === 'sms' || data?.action === 'reset' ? data.action : 'prepare';
    await assertContestantAccess(admin, contestantId);

    const [row] = await db
      .select({
        name: contestants.name,
        phone: contestants.phone,
        categoryName: categories.name,
        eventTitle: events.title,
        access: { codeEnc: nomineeAccess.codeEnc, activatedAt: nomineeAccess.activatedAt },
      })
      .from(contestants)
      .innerJoin(categories, eq(contestants.categoryId, categories.id))
      .innerJoin(events, eq(categories.eventId, events.id))
      .leftJoin(nomineeAccess, eq(nomineeAccess.contestantId, contestants.id))
      .where(eq(contestants.id, contestantId));
    if (!row) throw new Error('Contestant not found.');
    if (action === 'sms' && !row.phone) throw new Error('Add a phone number to this nominee before sending an invite.');

    let code = row.access?.codeEnc ? decryptToken(row.access.codeEnc) : null;
    if (!code || action === 'reset') {
      // Retry on the (astronomically unlikely) code collision.
      for (let attempt = 0; ; attempt++) {
        const candidate = generateNomineeCode();
        try {
          const values = { codeHash: hashToken(candidate), codeEnc: encryptToken(candidate) };
          await db
            .insert(nomineeAccess)
            .values({ contestantId, ...values, invitedBy: admin.id })
            .onConflictDoUpdate({ target: nomineeAccess.contestantId, set: values });
          code = candidate;
          break;
        } catch (error: any) {
          if (error?.code === '23505' && attempt < 5) continue;
          throw error;
        }
      }
    }

    const link = portalUrl(code);
    let smsSent = false;
    if (action === 'sms') {
      if (!smsConfigured()) throw new Error('SMS is not configured on this server. Copy the link and share it instead.');
      const { sendSms } = await import('./sms');
      await sendSms(
        toSmsRecipient(row.phone!),
        `Heravote: Hi ${row.name}, you're a nominee for ${row.categoryName} in ${row.eventTitle}. ` +
          `Complete your profile and follow your votes at ${link} . Your access code: ${code}. Keep it private.`,
      );
      smsSent = true;
      await db
        .update(nomineeAccess)
        .set({ invitedAt: new Date(), invitedBy: admin.id, inviteCount: sql`${nomineeAccess.inviteCount} + 1` })
        .where(eq(nomineeAccess.contestantId, contestantId));
    }

    return {
      code,
      link,
      smsSent,
      sentTo: smsSent ? maskPhone(row.phone) : null,
      hasPhone: Boolean(row.phone),
      activated: Boolean(row.access?.activatedAt),
      nomineeName: row.name,
    };
  });

// ---------------------------------------------------------------------------
// Nominee: sign in / out, profile
// ---------------------------------------------------------------------------

export const nomineeSignInFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware])
  .handler(async ({ data }: any) => {
    const phone = normalizePhone(data?.phone);
    const code = canonicalCode(data?.code);
    const failure = 'That phone number and access code don\'t match. Check the invite you received.';
    if (!phone || code.length !== NOMINEE_CODE_LENGTH) throw new Error(failure);

    const ip = getClientIp(getRequest());
    if (await isLoginLockedOut(LOCKOUT_SCOPE, phone, ip)) throw new Error(LOCKED_OUT_MESSAGE);

    const codeHash = hashToken(code);
    const [row] = await db
      .select({ contestantId: nomineeAccess.contestantId, phone: contestants.phone, activatedAt: nomineeAccess.activatedAt })
      .from(nomineeAccess)
      .innerJoin(contestants, eq(nomineeAccess.contestantId, contestants.id))
      .where(eq(nomineeAccess.codeHash, codeHash));

    if (!row || normalizePhone(row.phone) !== phone) {
      await recordLoginFailure(LOCKOUT_SCOPE, phone, ip);
      throw new Error(failure);
    }

    await clearLoginFailures(LOCKOUT_SCOPE, phone, ip);
    await db.update(nomineeAccess).set({ lastLoginAt: new Date() }).where(eq(nomineeAccess.contestantId, row.contestantId));
    issueNomineeSession(row.contestantId, codeHash);
    return { activated: Boolean(row.activatedAt) };
  });

export const nomineeSignOutFn = createServerFn({ method: 'POST' }).handler(async () => {
  clearNomineeSession();
  return { ok: true };
});

/** The signed-in nominee's profile, or null when signed out. */
export const getNomineeMeFn = createServerFn({ method: 'GET' }).handler(async () => {
  const n = await currentNominee();
  if (!n) return null;
  return {
    contestant: { id: n.contestant.id, name: n.contestant.name, tagline: n.contestant.tagline, imageUrl: n.contestant.imageUrl, code: n.contestant.code, phone: n.contestant.phone },
    category: n.category,
    event: {
      id: n.event.id,
      title: n.event.title,
      imageUrl: n.event.imageUrl,
      isActive: n.event.isActive,
      startAt: n.event.startAt?.toISOString() ?? null,
      endAt: n.event.endAt?.toISOString() ?? null,
    },
    activated: Boolean(n.access.activatedAt),
  };
});

const MAX_NAME = 80;
const MAX_TAGLINE = 140;

/**
 * The nominee completes or edits their public profile: name, tagline, photo.
 * Category, voting code and phone stay under the admin's control.
 */
export const updateNomineeProfileFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware])
  .handler(async ({ data }: any) => {
    const n = await requireNominee();
    const name = String(data.get('name') ?? '').trim().replace(/\s+/g, ' ');
    const tagline = String(data.get('tagline') ?? '').trim().replace(/\s+/g, ' ');
    if (!name) throw new Error('Please enter your name.');
    if (name.length > MAX_NAME) throw new Error(`Your name can be at most ${MAX_NAME} characters.`);
    if (!tagline) throw new Error('Please add a short tagline.');
    if (tagline.length > MAX_TAGLINE) throw new Error(`Your tagline can be at most ${MAX_TAGLINE} characters.`);

    const image = data.get('image');
    const imageUrl = await processImageUpload(image instanceof File ? image : null, {
      folder: 'contestants',
      maxWidth: 800,
      maxHeight: 800,
      quality: 75,
    });
    if (!imageUrl && !n.contestant.imageUrl) throw new Error('Please add a photo of yourself.');

    await db.transaction(async (tx) => {
      await tx
        .update(contestants)
        .set({ name, tagline, ...(imageUrl && { imageUrl }) })
        .where(eq(contestants.id, n.contestant.id));
      if (!n.access.activatedAt) {
        await tx.update(nomineeAccess).set({ activatedAt: new Date() }).where(eq(nomineeAccess.contestantId, n.contestant.id));
      }
    });
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Nominee dashboard
// ---------------------------------------------------------------------------

/**
 * The signed-in nominee's results, shaped by the event's results setting.
 * "hidden" returns no figures at all; "own" returns their own votes and rank;
 * "standings" adds every nominee in their category.
 */
export const getNomineeDashboardFn = createServerFn({ method: 'GET' }).handler(async () => {
  const n = await requireNominee();
  const [event] = await db
    .select({ view: events.nomineeResultsView, startAt: events.startAt })
    .from(events)
    .where(eq(events.id, n.event.id));
  const view = asResultsView(event?.view);
  if (view === 'hidden') return { view, own: null, rank: null, standings: null };

  const [own, standings] = await Promise.all([
    loadOwnVotes(n.contestant.id, event?.startAt ?? null),
    loadCategoryStandings(n.contestant.categoryId),
  ]);
  const me = standings.find((r) => r.id === n.contestant.id);
  return {
    view,
    own,
    rank: { position: me?.rank ?? standings.length, of: standings.length },
    standings:
      view === 'standings'
        ? standings.map((r) => ({ id: r.id, name: r.name, imageUrl: r.imageUrl, code: r.code, votes: r.votes, rank: r.rank, isYou: r.id === n.contestant.id }))
        : null,
  };
});

// ---------------------------------------------------------------------------
// Admin: the event's nominee portal settings
// ---------------------------------------------------------------------------

export const getNomineePortalSettingsFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const eventId = data?.eventId;
    await assertEventAccess(context?.user, eventId);
    const [[event], [counts]] = await Promise.all([
      db.select({ view: events.nomineeResultsView }).from(events).where(eq(events.id, eventId)),
      db
        .select({
          nominees: count(contestants.id),
          invited: sql<number>`count(${nomineeAccess.contestantId})::int`,
          active: sql<number>`count(${nomineeAccess.activatedAt})::int`,
        })
        .from(contestants)
        .innerJoin(categories, eq(contestants.categoryId, categories.id))
        .leftJoin(nomineeAccess, eq(nomineeAccess.contestantId, contestants.id))
        .where(eq(categories.eventId, eventId)),
    ]);
    return {
      view: asResultsView(event?.view),
      nominees: Number(counts?.nominees) || 0,
      invited: Number(counts?.invited) || 0,
      active: Number(counts?.active) || 0,
    };
  });

export const setNomineeResultsViewFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const eventId = data?.eventId;
    await assertEventAccess(context?.user, eventId);
    if (!(NOMINEE_RESULTS_VIEWS as readonly unknown[]).includes(data?.view)) throw new Error('Unknown results setting.');
    await db.update(events).set({ nomineeResultsView: data.view }).where(eq(events.id, eventId));
    return { view: data.view };
  });
