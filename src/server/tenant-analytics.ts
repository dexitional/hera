import { createServerFn } from '@tanstack/react-start';
import { authMiddleware } from '#/middleware/authMiddleware';
import { arcjetMiddleware } from '#/middleware/arcjetMiddleware';
import { db } from '../db';
import { isSuperAdmin } from './access-control';
import { computeRevenue, round2 } from './event-revenue';
import { loadCollectionsByEvent, loadWithdrawnByEvent } from './event-revenue-queries';
import {
  countAccounts,
  dayKeys,
  loadChannelSplit,
  loadDailyBallots,
  loadDailyCollections,
  loadRecentPayments,
  loadScopedElections,
  loadScopedEvents,
  loadTurnout,
  periodStart,
} from './analytics-queries';

// Admin dashboard analytics. Super admins get platform-wide figures; every
// other admin gets the same dashboard limited to their own events/elections.

export const getDashboardAnalyticsFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const superAdmin = isSuperAdmin(admin);
    // Allowed periods mirror the dashboard's 7 / 30 / 90 day presets.
    const days = [7, 30, 90].includes(Number(data?.days)) ? Number(data.days) : 30;
    const since = periodStart(days);

    const [scopedEvents, scopedElections] = await Promise.all([loadScopedEvents(admin), loadScopedElections(admin)]);
    const eventIds = scopedEvents.map((e) => e.id);
    const electionIds = scopedElections.map((e) => e.id);
    const feeByEvent = new Map(scopedEvents.map((e) => [e.id, e.platformFeePercent]));

    const [collections, withdrawn, daily, channels, recentPayments, turnout, dailyBallots, accounts] = await Promise.all([
      loadCollectionsByEvent(db, eventIds),
      loadWithdrawnByEvent(db, eventIds),
      loadDailyCollections(eventIds, since),
      loadChannelSplit(eventIds, since),
      loadRecentPayments(eventIds, 10),
      loadTurnout(electionIds),
      loadDailyBallots(electionIds, since),
      superAdmin ? countAccounts() : Promise.resolve(null),
    ]);

    // ---- all-time money, summed per event so each event's own fee % applies
    const allTime = scopedEvents.reduce(
      (t, e) => {
        const c = collections.get(e.id);
        const r = computeRevenue({ gross: c?.gross ?? 0, feePercent: e.platformFeePercent, withdrawn: withdrawn.get(e.id) ?? 0 });
        return {
          gross: round2(t.gross + r.gross),
          fee: round2(t.fee + r.fee),
          organiserShare: round2(t.organiserShare + r.organiserShare),
          withdrawn: round2(t.withdrawn + r.withdrawn),
          balance: round2(t.balance + r.balance),
          votes: t.votes + (c?.votes ?? 0),
          payments: t.payments + (c?.payments ?? 0),
        };
      },
      { gross: 0, fee: 0, organiserShare: 0, withdrawn: 0, balance: 0, votes: 0, payments: 0 },
    );

    // ---- gap-free daily series for the period
    const series = new Map(dayKeys(since).map((d) => [d, { date: d, gross: 0, fee: 0, votes: 0, payments: 0, ballots: 0 }]));
    const byEvent = new Map<string, { gross: number; votes: number; payments: number }>();
    for (const row of daily) {
      const point = series.get(row.day);
      const gross = Number(row.gross) || 0;
      if (point) {
        point.gross = round2(point.gross + gross);
        point.fee = round2(point.fee + computeRevenue({ gross, feePercent: feeByEvent.get(row.eventId) ?? 0, withdrawn: 0 }).fee);
        point.votes += Number(row.votes) || 0;
        point.payments += Number(row.payments) || 0;
      }
      const ev = byEvent.get(row.eventId) ?? { gross: 0, votes: 0, payments: 0 };
      byEvent.set(row.eventId, { gross: round2(ev.gross + gross), votes: ev.votes + (Number(row.votes) || 0), payments: ev.payments + (Number(row.payments) || 0) });
    }
    for (const row of dailyBallots) {
      const point = series.get(row.day);
      if (point) point.ballots += Number(row.ballots) || 0;
    }
    const seriesList = [...series.values()];
    const period = seriesList.reduce(
      (t, p) => ({ gross: round2(t.gross + p.gross), fee: round2(t.fee + p.fee), votes: t.votes + p.votes, payments: t.payments + p.payments, ballots: t.ballots + p.ballots }),
      { gross: 0, fee: 0, votes: 0, payments: 0, ballots: 0 },
    );

    // ---- top events in the period
    const eventById = new Map(scopedEvents.map((e) => [e.id, e]));
    const topEvents = [...byEvent.entries()]
      .map(([id, v]) => ({ id, title: eventById.get(id)?.title ?? '', ownerName: eventById.get(id)?.ownerName ?? null, ownerOrganization: eventById.get(id)?.ownerOrganization ?? null, ...v }))
      .sort((a, b) => b.gross - a.gross)
      .slice(0, 5);

    // ---- elections
    const now = Date.now();
    const isLive = (e: (typeof scopedElections)[number]) =>
      e.status === 'started' && (!e.startAt || e.startAt.getTime() <= now) && (!e.endAt || e.endAt.getTime() >= now);
    let registeredVoters = 0;
    let votedVoters = 0;
    for (const t of turnout.values()) {
      registeredVoters += t.registered;
      votedVoters += t.voted;
    }
    const liveElections = scopedElections
      .filter(isLive)
      .map((e) => ({
        id: e.id,
        title: e.title,
        tag: e.tag,
        endAt: e.endAt?.toISOString() ?? null,
        ownerName: e.ownerName,
        ownerOrganization: e.ownerOrganization,
        registered: turnout.get(e.id)?.registered ?? 0,
        voted: turnout.get(e.id)?.voted ?? 0,
      }))
      .sort((a, b) => (a.endAt ?? '').localeCompare(b.endAt ?? ''))
      .slice(0, 6);

    return {
      scope: superAdmin ? ('platform' as const) : ('organisation' as const),
      days,
      since: since.toISOString(),
      counts: {
        events: scopedEvents.length,
        activeEvents: scopedEvents.filter((e) => e.isActive).length,
        elections: scopedElections.length,
        liveElections: scopedElections.filter(isLive).length,
        registeredVoters,
        votedVoters,
        accounts,
      },
      allTime,
      period,
      series: seriesList,
      channels: channels
        .map((c) => ({ channel: c.channel || 'WEB', gross: round2(Number(c.gross) || 0), payments: Number(c.payments) || 0 }))
        .sort((a, b) => b.gross - a.gross),
      topEvents,
      liveElections,
      recentPayments,
    };
  });
