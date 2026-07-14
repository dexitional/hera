import { createServerFn } from '@tanstack/react-start';
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../db';
import { elections, events, user } from '../db/schema';
import { arcjetMiddleware } from '#/middleware/arcjetMiddleware';
import { authMiddleware } from '#/middleware/authMiddleware';

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
