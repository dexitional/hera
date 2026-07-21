import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Plus, Search, Edit2, Trash2,
  CheckCircle, XCircle,
  ArrowLeft, User, PhoneCallIcon, Coins, Hash,
} from "lucide-react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteEventTransactionFn, getEventTransactionsFn } from "#/server/tenant-events";
import { TableSkeleton } from "#/components/ui/skeleton";

const TRANSACTIONS_PAGE_SIZE = 15;

const transactionsQueryOptions = (params: {
  eventId: any;
  page: number;
  pageSize: number;
  searchQuery: string;
  statusFilter: "ALL" | "PAID" | "PENDING";
}) => ({
  queryKey: ['transactions-admin', params.eventId, params.page, params.pageSize, params.searchQuery, params.statusFilter],
  queryFn: () => getEventTransactionsFn({ data: params } as any),
  placeholderData: keepPreviousData,
  refetchInterval: 30 * 1000,
});

export const Route = createFileRoute("/admin/events/$eventId/transactions/")({
  component: TransactionsDirectory,
  loader: async ({ context, params }: any) => {
    const eventId = params.eventId;
    await context.queryClient.ensureQueryData(transactionsQueryOptions({
      eventId, page: 1, pageSize: TRANSACTIONS_PAGE_SIZE, searchQuery: "", statusFilter: "ALL",
    }));
  },
  pendingComponent: () => <TableSkeleton />,
});

function TransactionsDirectory() {
  const queryClient = useQueryClient();
  const { eventId } = Route.useParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");
  const [page, setPage] = useState(1);
  const [jumpToPageInput, setJumpToPageInput] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, statusFilter]);

  const { data }: any = useQuery(transactionsQueryOptions({
    eventId, page, pageSize: TRANSACTIONS_PAGE_SIZE, searchQuery: debouncedSearchQuery, statusFilter,
  }));

  const transactions: any = (data?.transactions ?? []).map((r: any) => ({
    id: r?.transaction.id,
    payAmount: r.transaction?.payAmount,
    payStatus: r.transaction?.payStatus,
    payPhone: r.transaction?.payPhone,
    payRef: r.transaction?.payRef,
    transRef: r.transaction?.transRef,
    votes: r.transaction?.votes,
    channel: r.transaction?.channel,
    createdAt: r.transaction?.createdAt,
    contestantName: r.contestant?.name,
    categoryName: r.category?.name,
  }));

  const totalCount: number = data?.pagination?.totalCount ?? 0;
  const totalPages: number = Math.max(data?.pagination?.totalPages ?? 1, 1);
  const isFetchingTransactions = !data;

  const handleJumpToPage = () => {
    const parsed = Number(jumpToPageInput);
    if (!Number.isFinite(parsed)) return;
    setPage(Math.min(Math.max(Math.floor(parsed), 1), totalPages));
    setJumpToPageInput("");
  };

  const deleteMutation = useMutation({
    mutationFn: deleteEventTransactionFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions-admin'] });
      queryClient.invalidateQueries({ queryKey: ['event-overview', eventId] });
    },
    onError: (error: any) => console.error(error.message),
  });

  const handleDeleteTransaction = (id: any) => {
    if (confirm("Are you sure you want to remove this transaction? This will permanently drop its contribution to the vote tally.")) {
      deleteMutation.mutate({ data: id } as any);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ================= BACK NAVIGATION ================= */}
      <Link
        to="/admin/events/$eventId/manage"
        params={{ eventId }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Management Console
      </Link>

      {/* ================= HEADER RIBBON CONTROLS ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Vote Transactions Manager</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track pay-per-vote transactions, confirm payment status, and manually record or adjust vote credits.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/admin/events/$eventId/transactions/new"
            params={{ eventId }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Transaction</span>
          </Link>
        </div>
      </div>

      {/* ================= FILTERS & QUICK CONTROLS AREA ================= */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by contestant, phone, or ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a192a]/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
        </div>

        <div className="flex items-center gap-2 bg-[#0a192a]/50 p-1 border border-zinc-800 rounded-lg w-full sm:w-auto">
          {(["ALL", "PAID", "PENDING"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`flex-1 sm:flex-initial text-[11px] font-semibold px-3 py-1.5 rounded-md uppercase tracking-wider transition-all ${statusFilter === filter ? "bg-purple-600 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* ================= TRANSACTIONS TABLE DATA GRID ================= */}
      <div className="bg-[#0a192a]/50 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-zinc-900/20 text-zinc-400 text-[11px] font-bold uppercase tracking-wider select-none">
                <th className="px-6 py-4">Contestant</th>
                <th className="px-6 py-4">Voter Phone</th>
                <th className="px-6 py-4 text-center">Amount</th>
                <th className="px-6 py-4 text-center">Votes</th>
                <th className="px-6 py-4 text-center">Channel</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-sm">
              {transactions.length > 0 ? (
                transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-zinc-900/20 transition-colors group">

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-zinc-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white tracking-wide">{tx.contestantName}</span>
                          <span className="text-[11px] text-zinc-500 mt-0.5">{tx.categoryName}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-middle text-xs font-mono text-zinc-400">
                      <div className="inline-flex items-center gap-1.5">
                        <PhoneCallIcon className="w-3 h-3" />
                        <span>{tx.payPhone}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-middle text-center">
                      <div className="inline-flex items-center gap-1 text-xs font-mono font-bold text-zinc-300 bg-zinc-900/60 border border-zinc-800/40 px-2 py-1 rounded">
                        <Coins className="w-3 h-3 text-amber-500" />
                        <span>{tx.payAmount != null ? `₵${Number(tx.payAmount).toFixed(2)}` : "—"}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-middle text-center">
                      <div className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-purple-400 px-2.5 py-1 rounded shadow-inner">
                        <Hash className="w-3 h-3 text-zinc-500" />
                        <span>{tx.votes}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-middle text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                        {tx.channel}
                      </span>
                    </td>

                    <td className="px-6 py-4 align-middle text-center">
                      <div className="inline-flex justify-center">
                        {tx.payStatus ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/20 border border-amber-900/30 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to="/admin/events/$eventId/transactions/$transactionId/edit"
                          params={{ eventId, transactionId: String(tx.id) }}
                          title="Edit Transaction"
                          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          title="Delete Record"
                          className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 border border-dashed border-zinc-900 rounded-b-xl text-zinc-500 text-xs">
                    No transactions tracked matching selected filter parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION BOTTOM ELEMENT BAR ================= */}
        <div className="p-4 bg-zinc-900/40 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-zinc-400">
            {isFetchingTransactions
              ? "Loading transactions..."
              : <>Showing Page <b className="text-white">{page}</b> of <b className="text-white">{totalPages}</b> ({totalCount} entries)</>
            }
          </span>

          <div className="flex gap-2 w-full sm:w-auto justify-end items-center">
            <button
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="flex items-center gap-1 text-xs px-3 py-1.5 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Previous
            </button>

            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpToPageInput}
                onChange={(e) => setJumpToPageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJumpToPage()}
                placeholder={`${page}`}
                className="w-14 bg-[#0a192a]/50 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white text-center placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                disabled={!jumpToPageInput}
                onClick={handleJumpToPage}
                className="text-xs px-3 py-1.5 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Go
              </button>
            </div>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="flex items-center gap-1 text-xs px-3 py-1.5 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
