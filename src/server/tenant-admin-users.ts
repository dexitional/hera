import { createServerFn } from '@tanstack/react-start';
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../db';
import { elections, events, user } from '../db/schema';
import { arcjetMiddleware } from '#/middleware/arcjetMiddleware';
import { authMiddleware } from '#/middleware/authMiddleware';
import { auth } from '#/lib/auth';
import { getRequestHeaders } from '@tanstack/react-start/server';

function assertSuperAdmin(context: any) {
  const admin: any = context?.user;
  if (!admin || admin.role !== 'super') {
    throw new Error('Forbidden: super admin access required.');
  }
  return admin;
}

// Paginated, searchable roster of every platform account (tenant admins + super admins).
export const getAllUsersFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    assertSuperAdmin(context);

    const page = Math.max(Number(data?.page) || 1, 1);
    const pageSize = Math.max(Number(data?.pageSize) || 15, 1);
    const searchQuery = (data?.searchQuery || '').trim();

    const limitValue = pageSize;
    const offsetValue = (page - 1) * limitValue;

    const conditions: any = [];
    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      conditions.push(or(ilike(user.name, searchPattern), ilike(user.email, searchPattern)));
    }
    const queryCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [countResult]] = await Promise.all([
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          emailVerified: user.emailVerified,
          banned: user.banned,
          banReason: user.banReason,
          createdAt: user.createdAt,
          electionsCount: sql<number>`count(distinct ${elections.id})::int`,
          eventsCount: sql<number>`count(distinct ${events.id})::int`,
        })
        .from(user)
        .leftJoin(elections, eq(elections.adminId, user.id))
        .leftJoin(events, eq(events.adminId, user.id))
        .where(queryCondition)
        .groupBy(user.id)
        .orderBy(desc(user.createdAt))
        .limit(limitValue)
        .offset(offsetValue),
      db.select({ total: count() }).from(user).where(queryCondition),
    ]);

    const totalCount = countResult?.total ?? 0;
    const totalPages = Math.max(Math.ceil(totalCount / limitValue), 1);

    return {
      users: rows,
      pagination: { totalCount, totalPages, currentPage: page, pageSize: limitValue },
    };
  });

export const getUserByIdFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: userId }: any) => {
    assertSuperAdmin(context);

    const [record] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        emailVerified: user.emailVerified,
        banned: user.banned,
        banReason: user.banReason,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, userId));

    if (!record) {
      throw new Error(`User [${userId}] not found.`);
    }
    return record;
  });

// Toggles emailVerified -- not part of the admin plugin's own action set, so handled directly.
export const setUserEmailVerifiedFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    assertSuperAdmin(context);
    const { userId, emailVerified } = data;

    const [updated] = await db
      .update(user)
      .set({ emailVerified: !!emailVerified, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning();

    return updated;
  });

// Resends the signup verification link to an unverified account. Deliberately
// calls auth.api.sendVerificationEmail with only { email } (no headers) so it
// hits better-auth's no-session branch, which looks the user up by email and
// sends to them directly -- passing the caller's own session headers here
// would instead make better-auth compare the target email against the super
// admin's own session email and reject as a mismatch.
export const resendVerificationEmailFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    assertSuperAdmin(context);
    const { userId } = data;

    const [target] = await db
      .select({ email: user.email, emailVerified: user.emailVerified })
      .from(user)
      .where(eq(user.id, userId));

    if (!target) {
      throw new Error('User not found.');
    }
    if (target.emailVerified) {
      throw new Error('This user is already verified.');
    }

    await auth.api.sendVerificationEmail({ body: { email: target.email } });
    return { success: true };
  });

// Every election owned by a given tenant admin -- the "election workspace" for that user.
export const getUserElectionsFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: userId }: any) => {
    assertSuperAdmin(context);

    return await db
      .select({
        id: elections.id,
        title: elections.title,
        tag: elections.tag,
        status: elections.status,
        isActive: elections.isActive,
        billVoters: elections.billVoters,
        billAmount: elections.billAmount,
        billPaid: elections.billPaid,
        startAt: elections.startAt,
        endAt: elections.endAt,
        createdAt: elections.createdAt,
      })
      .from(elections)
      .where(eq(elections.adminId, userId))
      .orderBy(asc(elections.title));
  });

// Every event owned by a given tenant admin -- the "event workspace" for that user.
export const getUserEventsFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: userId }: any) => {
    assertSuperAdmin(context);

    return await db
      .select({
        id: events.id,
        title: events.title,
        isActive: events.isActive,
        unitPrice: events.unitPrice,
        startAt: events.startAt,
        endAt: events.endAt,
        createdAt: events.createdAt,
      })
      .from(events)
      .where(eq(events.adminId, userId))
      .orderBy(asc(events.title));
  });

// Super-admin override of an election's billing/enablement fields -- no ownership check,
// since the whole point is managing elections inside another tenant admin's workspace.
export const updateElectionAdminSettingsFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    assertSuperAdmin(context);
    const { electionId, billAmount, billPaid, isActive } = data;

    const patch: any = {};
    if (billAmount !== undefined) patch.billAmount = billAmount === null ? null : Number(billAmount);
    if (billPaid !== undefined) patch.billPaid = !!billPaid;
    if (isActive !== undefined) patch.isActive = !!isActive;

    if (Object.keys(patch).length === 0) {
      throw new Error('No fields supplied to update.');
    }

    const [updated] = await db
      .update(elections)
      .set(patch)
      .where(eq(elections.id, electionId))
      .returning();

    return updated;
  });


// ---------------------------------------------------------------------------
// Password management for other accounts (super admins only). A super admin's
// own password is changed from Account Settings, so both refuse self-targets.
// ---------------------------------------------------------------------------

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export const setUserPasswordFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin = assertSuperAdmin(context);
    const userId = String(data?.userId ?? '');
    const newPassword = String(data?.newPassword ?? '');
    const signOutEverywhere = data?.signOutEverywhere !== false;
    if (!userId) throw new Error('User not found.');
    if (userId === admin.id) throw new Error('Change your own password from Account Settings.');
    if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
      throw new Error(`Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`);
    }

    // better-auth's admin plugin: hashes the password, and creates an
    // email/password login if the user has only signed in with Google so far.
    const headers = getRequestHeaders();
    // Admin-plugin endpoints: auth.ts builds its config `as any`, so the
    // plugin's API isn't in auth.api's static type (it exists at runtime).
    // Not setPassword/revokeSessions -- those act on the caller's own account.
    const adminApi = auth.api as any;
    try {
      await adminApi.setUserPassword({ body: { userId, newPassword }, headers });
      if (signOutEverywhere) await adminApi.revokeUserSessions({ body: { userId }, headers });
    } catch (err: any) {
      throw new Error(err?.body?.message || err?.message || 'Could not set the password.');
    }
    console.info(`[ADMIN] ${admin.email} set a new password for user ${userId}${signOutEverywhere ? ' and signed them out everywhere' : ''}`);
    return { ok: true, signedOut: signOutEverywhere };
  });

export const sendPasswordResetLinkFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin = assertSuperAdmin(context);
    const userId = String(data?.userId ?? '');
    if (userId === admin.id) throw new Error('Change your own password from Account Settings.');
    const [target] = await db.select({ id: user.id, email: user.email }).from(user).where(eq(user.id, userId));
    if (!target) throw new Error('User not found.');
    try {
      await auth.api.requestPasswordReset({ body: { email: target.email, redirectTo: '/auth/reset-password' } });
    } catch (err: any) {
      throw new Error(err?.body?.message || err?.message || 'Could not send the reset email.');
    }
    console.info(`[ADMIN] ${admin.email} emailed a password reset link to user ${userId}`);
    return { ok: true, email: target.email };
  });
