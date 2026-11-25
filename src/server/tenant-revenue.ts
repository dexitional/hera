import { createServerFn } from '@tanstack/react-start';
import { desc, eq } from 'drizzle-orm';
import { authMiddleware } from '#/middleware/authMiddleware';
import { arcjetMiddleware } from '#/middleware/arcjetMiddleware';
import { db } from '../db';
import { events, eventWithdrawals, user } from '../db/schema';
import { assertEventAccess, assertSuperAdmin, isSuperAdmin } from './access-control';
import { computeRevenue, parseFeePercent, parseVoidReason, parseWithdrawalInput, round2 } from './event-revenue';
import { loadCollectionsByEvent, loadWithdrawalLedger, loadWithdrawnByEvent, lockEventRevenue } from './event-revenue-queries';

// Event revenue, platform fees and the withdrawal ledger.
//
// Super admins: see every event's revenue, set each event's fee %, record
// and void withdrawals. Event owners: read-only view of their own event.

// ---------------------------------------------------------------------------
// Super admin: revenue across every event
// ---------------------------------------------------------------------------

export const getRevenueOverviewFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context }: any) => {
    assertSuperAdmin(context?.user);

    const [eventRows, collections, withdrawn] = await Promise.all([
      db
        .select({
          id: events.id,
          title: events.title,
          imageUrl: events.imageUrl,
          isActive: events.isActive,
          unitPrice: events.unitPrice,
          startAt: events.startAt,
          endAt: events.endAt,
          platformFeePercent: events.platformFeePercent,
          ownerName: user.name,
          ownerOrganization: user.organization,
          ownerEmail: user.email,
        })
        .from(events)
        .innerJoin(user, eq(events.adminId, user.id))
        .orderBy(desc(events.createdAt)),
      loadCollectionsByEvent(db),
      loadWithdrawnByEvent(db),
    ]);

    const rows = eventRows.map((e) => {
      const c = collections.get(e.id);
      const revenue = computeRevenue({ gross: c?.gross ?? 0, feePercent: e.platformFeePercent, withdrawn: withdrawn.get(e.id) ?? 0 });
      return {
        ...e,
        startAt: e.startAt?.toISOString() ?? null,
        endAt: e.endAt?.toISOString() ?? null,
        payments: c?.payments ?? 0,
        votes: c?.votes ?? 0,
        lastPaymentAt: c?.lastPaymentAt ? new Date(c.lastPaymentAt).toISOString() : null,
        ...revenue,
      };
    });

    const totals = rows.reduce(
      (t, r) => ({
        gross: round2(t.gross + r.gross),
        fee: round2(t.fee + r.fee),
        organiserShare: round2(t.organiserShare + r.organiserShare),
        withdrawn: round2(t.withdrawn + r.withdrawn),
        balance: round2(t.balance + r.balance),
        payments: t.payments + r.payments,
        votes: t.votes + r.votes,
      }),
      { gross: 0, fee: 0, organiserShare: 0, withdrawn: 0, balance: 0, payments: 0, votes: 0 },
    );

    return { events: rows, totals };
  });

// ---------------------------------------------------------------------------
// One event: summary + ledger (super admin, or the event's owner read-only)
// ---------------------------------------------------------------------------

export const getEventRevenueFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: eventId }: any) => {
    const admin: any = context?.user;
    await assertEventAccess(admin, eventId);

    const [[event], collections, withdrawn, ledger] = await Promise.all([
      db
        .select({
          id: events.id,
          title: events.title,
          imageUrl: events.imageUrl,
          isActive: events.isActive,
          unitPrice: events.unitPrice,
          platformFeePercent: events.platformFeePercent,
          ownerName: user.name,
          ownerOrganization: user.organization,
          ownerEmail: user.email,
        })
        .from(events)
        .innerJoin(user, eq(events.adminId, user.id))
        .where(eq(events.id, eventId)),
      loadCollectionsByEvent(db, [eventId]),
      loadWithdrawnByEvent(db, [eventId]),
      loadWithdrawalLedger(db, eventId),
    ]);
    if (!event) throw new Error('Event not found.');

    const c = collections.get(eventId);
    return {
      event,
      canManage: isSuperAdmin(admin),
      collections: {
        payments: c?.payments ?? 0,
        votes: c?.votes ?? 0,
        lastPaymentAt: c?.lastPaymentAt ? new Date(c.lastPaymentAt).toISOString() : null,
      },
      revenue: computeRevenue({ gross: c?.gross ?? 0, feePercent: event.platformFeePercent, withdrawn: withdrawn.get(eventId) ?? 0 }),
      withdrawals: ledger,
    };
  });

// ---------------------------------------------------------------------------
// Super admin writes. Each runs in a transaction that locks the event row, so
// concurrent fee changes / withdrawals for the same event are serialised and
// the balance check can't be raced.
// ---------------------------------------------------------------------------

export const setEventFeePercentFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    assertSuperAdmin(context?.user);
    const eventId = String(data?.eventId ?? '');
    const feePercent = parseFeePercent(data?.feePercent);

    return await db.transaction(async (tx) => {
      const projected = await lockEventRevenue(tx, eventId, feePercent);
      if (projected.balance < 0) {
        throw new Error(
          `A ${feePercent}% fee would leave the organiser GHS ${projected.organiserShare.toFixed(2)}, less than the GHS ${projected.withdrawn.toFixed(2)} already withdrawn.`,
        );
      }
      await tx.update(events).set({ platformFeePercent: feePercent }).where(eq(events.id, eventId));
      return projected;
    });
  });

export const recordWithdrawalFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin = assertSuperAdmin(context?.user);
    const eventId = String(data?.eventId ?? '');
    const input = parseWithdrawalInput(data);

    return await db.transaction(async (tx) => {
      const revenue = await lockEventRevenue(tx, eventId);
      if (input.amount > revenue.balance) {
        throw new Error(`Only GHS ${revenue.balance.toFixed(2)} is available to withdraw for this event.`);
      }
      const [row] = await tx
        .insert(eventWithdrawals)
        .values({ eventId, ...input, recordedBy: admin.id })
        .returning({ id: eventWithdrawals.id });
      return { id: row.id, balance: round2(revenue.balance - input.amount) };
    });
  });

export const voidWithdrawalFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin = assertSuperAdmin(context?.user);
    const withdrawalId = String(data?.withdrawalId ?? '');
    const reason = parseVoidReason(data?.reason);

    return await db.transaction(async (tx) => {
      const [w] = await tx
        .select({ id: eventWithdrawals.id, eventId: eventWithdrawals.eventId, voidedAt: eventWithdrawals.voidedAt })
        .from(eventWithdrawals)
        .where(eq(eventWithdrawals.id, withdrawalId))
        .for('update');
      if (!w) throw new Error('Withdrawal not found.');
      if (w.voidedAt) throw new Error('This withdrawal has already been cancelled.');
      await tx
        .update(eventWithdrawals)
        .set({ voidedAt: new Date(), voidedBy: admin.id, voidReason: reason })
        .where(eq(eventWithdrawals.id, withdrawalId));
      return { id: w.id, eventId: w.eventId };
    });
  });
