import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, ShieldCheck, Ban, ToggleLeft, ToggleRight,
  Save, Calendar, Mail, User as UserIcon, ArrowUpRight, Plus
} from "lucide-react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getUserByIdFn, getUserElectionsFn, getUserEventsFn, updateElectionAdminSettingsFn } from "#/server/tenant-admin-users";
import { FormSkeleton } from "#/components/ui/skeleton";
import moment from "moment";

const userQueryOptions = (userId: string) => ({
  queryKey: ['super-admin-user', userId],
  queryFn: () => getUserByIdFn({ data: userId } as any),
});

const userElectionsQueryOptions = (userId: string) => ({
  queryKey: ['super-admin-user-elections', userId],
  queryFn: () => getUserElectionsFn({ data: userId } as any),
});

const userEventsQueryOptions = (userId: string) => ({
  queryKey: ['super-admin-user-events', userId],
  queryFn: () => getUserEventsFn({ data: userId } as any),
});

export const Route = createFileRoute("/admin/users/$userId")({
  component: UserWorkspacePage,
  beforeLoad: ({ context }: any) => {
    if (context?.user?.role !== 'super') {
      throw redirect({ to: '/admin' });
    }
  },
  loader: async ({ context, params }) => {
    const { userId } = params;
    await Promise.all([
      context.queryClient.ensureQueryData(userQueryOptions(userId)),
      context.queryClient.ensureQueryData(userElectionsQueryOptions(userId)),
      context.queryClient.ensureQueryData(userEventsQueryOptions(userId)),
    ]);
  },
  pendingComponent: () => <FormSkeleton />,
});

function ElectionBillingRow({ election, userId }: { election: any; userId: string }) {
  const queryClient = useQueryClient();
  const [billAmount, setBillAmount] = useState(election.billAmount != null ? String(election.billAmount) : "");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['super-admin-user-elections', userId] });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateElectionAdminSettingsFn({ data: { electionId: election.id, ...payload } } as any),
    onSuccess: invalidate,
    onError: (error: any) => alert(error?.message || "Failed to update election."),
  });

  const handleSaveBillAmount = () => {
    const parsed = billAmount.trim() === "" ? null : Number(billAmount);
    if (parsed !== null && !Number.isFinite(parsed)) {
      alert("Enter a valid bill amount.");
      return;
    }
    updateMutation.mutate({ billAmount: parsed });
  };

  return (
    <tr className="hover:bg-zinc-900/20 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="font-semibold text-white tracking-wide">{election.title}</span>
          <span className="text-xs text-zinc-500 font-mono mt-0.5">{election.tag}</span>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <div className="flex flex-col gap-1">
          <span className="w-fit text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
            {election.status}
          </span>
          {election.endAt && (
            <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3 text-zinc-600" /> Ends {moment(election.endAt).format("MMM D, YYYY")}
            </span>
          )}
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-mono">GHS</span>
            <input
              type="number"
              step="0.01"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              placeholder="0.00"
              className="w-28 bg-[#0a192a]/50 border border-zinc-800 rounded-lg pl-9 pr-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveBillAmount}
            disabled={updateMutation.isPending}
            title="Save bill amount"
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>

      <td className="px-6 py-4 align-middle text-center">
        <button
          type="button"
          onClick={() => updateMutation.mutate({ billPaid: !election.billPaid })}
          disabled={updateMutation.isPending}
          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full border transition-colors disabled:opacity-40 ${election.billPaid ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30 hover:bg-emerald-950/40' : 'text-amber-400 bg-amber-950/20 border-amber-900/30 hover:bg-amber-950/40'}`}
        >
          {election.billPaid ? "Paid" : "Unpaid"}
        </button>
      </td>

      <td className="px-6 py-4 align-middle text-center">
        <button
          type="button"
          onClick={() => updateMutation.mutate({ isActive: !election.isActive })}
          disabled={updateMutation.isPending}
          title={election.isActive ? "Disable election" : "Enable election"}
          className="inline-flex focus:outline-none transition-transform active:scale-95 disabled:opacity-40"
        >
          {election.isActive ? (
            <ToggleRight className="w-8 h-8 text-emerald-400" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-zinc-600" />
          )}
        </button>
      </td>

      <td className="px-6 py-4 align-middle text-right">
        <Link
          to="/admin/elections/$electionId/manage"
          params={{ electionId: String(election.id) }}
          title="Open election console"
          className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
        >
          <span>Console</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </td>
    </tr>
  );
}

function EventRow({ event }: { event: any }) {
  return (
    <tr className="hover:bg-zinc-900/20 transition-colors group">
      <td className="px-6 py-4">
        <span className="font-semibold text-white tracking-wide">{event.title}</span>
      </td>
      <td className="px-6 py-4 align-middle">
        {event.endAt && (
          <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
            <Calendar className="w-3 h-3 text-zinc-600" /> Ends {moment(event.endAt).format("MMM D, YYYY")}
          </span>
        )}
      </td>
      <td className="px-6 py-4 align-middle text-center">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full border ${event.isActive ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30' : 'text-zinc-400 bg-zinc-900 border-zinc-800'}`}
        >
          {event.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-6 py-4 align-middle text-right">
        <Link
          to="/admin/events/$eventId/manage"
          params={{ eventId: String(event.id) }}
          title="Open event console"
          className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
        >
          <span>Console</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </td>
    </tr>
  );
}

function UserWorkspacePage() {
  const { userId } = Route.useParams();
  const { data: user }: any = useSuspenseQuery(userQueryOptions(userId));
  const { data: elections }: any = useSuspenseQuery(userElectionsQueryOptions(userId));
  const { data: events }: any = useSuspenseQuery(userEventsQueryOptions(userId));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ================= BACK NAVIGATION ================= */}
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Users Registry
      </Link>

      {/* ================= USER SUMMARY HEADER ================= */}
      <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">{user.name}</h1>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-zinc-500" /> {user.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${user.role === 'super' ? 'text-purple-400 bg-purple-950/30 border-purple-900/30' : 'text-zinc-400 bg-zinc-900 border-zinc-800'}`}>
            {user.role}
          </span>
          {user.banned ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/20 border border-red-900/30 px-2 py-0.5 rounded-full">
              <Ban className="w-3 h-3" /> Disabled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" /> Active
            </span>
          )}
        </div>
      </div>

      {/* ================= ELECTION WORKSPACE TABLE ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Election Workspace <span className="text-zinc-600 font-normal">({elections.length})</span>
          </h2>
          <Link
            to="/admin/elections/new"
            search={{ forUserId: userId, forUserName: user.name }}
            className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Create Election
          </Link>
        </div>

        <div className="bg-[#0a192a]/50 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/20 text-zinc-400 text-[11px] font-bold uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Election</th>
                  <th className="px-6 py-4">Timeline</th>
                  <th className="px-6 py-4">Bill Amount</th>
                  <th className="px-6 py-4 text-center">Payment</th>
                  <th className="px-6 py-4 text-center">State</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm">
                {elections.length > 0 ? (
                  elections.map((election: any) => (
                    <ElectionBillingRow key={election.id} election={election} userId={userId} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 border border-dashed border-zinc-900 rounded-b-xl text-zinc-500 text-xs">
                      This account has not created any elections yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= EVENT WORKSPACE TABLE ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Event Workspace <span className="text-zinc-600 font-normal">({events.length})</span>
          </h2>
          <Link
            to="/admin/events/new"
            search={{ forUserId: userId, forUserName: user.name }}
            className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Create Event
          </Link>
        </div>

        <div className="bg-[#0a192a]/50 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/20 text-zinc-400 text-[11px] font-bold uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Timeline</th>
                  <th className="px-6 py-4 text-center">State</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm">
                {events.length > 0 ? (
                  events.map((event: any) => (
                    <EventRow key={event.id} event={event} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-12 border border-dashed border-zinc-900 rounded-b-xl text-zinc-500 text-xs">
                      This account has not created any events yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
