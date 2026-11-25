import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { candidates, categories, contestants, elections, events, positions, voters } from '../db/schema';

// Tenant ownership guards for admin server functions.
//
// Kept in its own module (not alongside the createServerFn exports in
// tenant-elections.ts / tenant-events.ts) for the same client-bundle stripping
// reason documented in paystack-credit.ts.
//
// Every guard throws a generic "not found" error both when the record does not
// exist and when it belongs to another tenant, so callers can't use the error
// message to probe for valid IDs in other tenants' accounts.

type SessionUser = { id: string; role?: string | null } | null | undefined;

function requireUser(admin: SessionUser): { id: string; role?: string | null } {
  if (!admin?.id) throw new Error('Unauthorized');
  return admin;
}

export function isSuperAdmin(admin: SessionUser): boolean {
  return admin?.role === 'super';
}

/** Throws unless the caller is a super admin. */
export function assertSuperAdmin(admin: SessionUser) {
  const user = requireUser(admin);
  if (!isSuperAdmin(user)) throw new Error('Forbidden: super admin access required.');
  return user;
}

/**
 * WHERE fragment restricting a query to the caller's own events. Returns
 * undefined for super admins, which drizzle's and() simply drops -- so the
 * same query serves both "my events" and "every organisation's events".
 */
export function eventOwnerScope(admin: SessionUser) {
  return isSuperAdmin(admin) ? undefined : eq(events.adminId, requireUser(admin).id);
}

/** Same as eventOwnerScope, for election queries. */
export function electionOwnerScope(admin: SessionUser) {
  return isSuperAdmin(admin) ? undefined : eq(elections.adminId, requireUser(admin).id);
}

/** Super admins may access any election; regular admins only their own. */
export async function assertElectionAccess(admin: SessionUser, electionId: unknown) {
  const user = requireUser(admin);
  if (typeof electionId !== 'string' || !electionId) throw new Error("We couldn't find that election. It may have been removed, or you may not have access to it.");

  const [row] = await db
    .select({ id: elections.id })
    .from(elections)
    .where(
      isSuperAdmin(user)
        ? eq(elections.id, electionId)
        : and(eq(elections.id, electionId), eq(elections.adminId, user.id)),
    );
  if (!row) throw new Error("We couldn't find that election. It may have been removed, or you may not have access to it.");
  return row;
}

export async function assertPositionAccess(admin: SessionUser, positionId: unknown) {
  const user = requireUser(admin);
  if (typeof positionId !== 'string' || !positionId) throw new Error("We couldn't find that position. It may have been removed, or you may not have access to it.");

  const [row] = await db
    .select({ id: positions.id })
    .from(positions)
    .innerJoin(elections, eq(positions.electionId, elections.id))
    .where(
      isSuperAdmin(user)
        ? eq(positions.id, positionId)
        : and(eq(positions.id, positionId), eq(elections.adminId, user.id)),
    );
  if (!row) throw new Error("We couldn't find that position. It may have been removed, or you may not have access to it.");
  return row;
}

export async function assertCandidateAccess(admin: SessionUser, candidateId: unknown) {
  const user = requireUser(admin);
  if (typeof candidateId !== 'string' || !candidateId) throw new Error("We couldn't find that candidate. They may have been removed, or you may not have access to them.");

  const [row] = await db
    .select({ id: candidates.id })
    .from(candidates)
    .innerJoin(positions, eq(candidates.positionId, positions.id))
    .innerJoin(elections, eq(positions.electionId, elections.id))
    .where(
      isSuperAdmin(user)
        ? eq(candidates.id, candidateId)
        : and(eq(candidates.id, candidateId), eq(elections.adminId, user.id)),
    );
  if (!row) throw new Error("We couldn't find that candidate. They may have been removed, or you may not have access to them.");
  return row;
}

export async function assertEventAccess(admin: SessionUser, eventId: unknown) {
  const user = requireUser(admin);
  if (typeof eventId !== 'string' || !eventId) throw new Error("We couldn't find that event. It may have been removed, or you may not have access to it.");

  const [row] = await db
    .select({ id: events.id })
    .from(events)
    .where(
      isSuperAdmin(user)
        ? eq(events.id, eventId)
        : and(eq(events.id, eventId), eq(events.adminId, user.id)),
    );
  if (!row) throw new Error("We couldn't find that event. It may have been removed, or you may not have access to it.");
  return row;
}

export async function assertCategoryAccess(admin: SessionUser, categoryId: unknown) {
  const user = requireUser(admin);
  if (typeof categoryId !== 'string' || !categoryId) throw new Error("We couldn't find that category. It may have been removed, or you may not have access to it.");

  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .innerJoin(events, eq(categories.eventId, events.id))
    .where(
      isSuperAdmin(user)
        ? eq(categories.id, categoryId)
        : and(eq(categories.id, categoryId), eq(events.adminId, user.id)),
    );
  if (!row) throw new Error("We couldn't find that category. It may have been removed, or you may not have access to it.");
  return row;
}

export async function assertContestantAccess(admin: SessionUser, contestantId: unknown) {
  const user = requireUser(admin);
  if (typeof contestantId !== 'string' || !contestantId) throw new Error("We couldn't find that nominee. They may have been removed, or you may not have access to them.");

  const [row] = await db
    .select({ id: contestants.id })
    .from(contestants)
    .innerJoin(categories, eq(contestants.categoryId, categories.id))
    .innerJoin(events, eq(categories.eventId, events.id))
    .where(
      isSuperAdmin(user)
        ? eq(contestants.id, contestantId)
        : and(eq(contestants.id, contestantId), eq(events.adminId, user.id)),
    );
  if (!row) throw new Error("We couldn't find that nominee. They may have been removed, or you may not have access to them.");
  return row;
}

export async function assertVoterAccess(admin: SessionUser, voterId: unknown) {
  const user = requireUser(admin);
  if (typeof voterId !== 'string' || !voterId) throw new Error("We couldn't find that voter. They may have been removed, or you may not have access to them.");

  const [row] = await db
    .select({ id: voters.id, electionId: voters.electionId })
    .from(voters)
    .innerJoin(elections, eq(voters.electionId, elections.id))
    .where(
      isSuperAdmin(user)
        ? eq(voters.id, voterId)
        : and(eq(voters.id, voterId), eq(elections.adminId, user.id)),
    );
  if (!row) throw new Error("We couldn't find that voter. They may have been removed, or you may not have access to them.");
  return row;
}
