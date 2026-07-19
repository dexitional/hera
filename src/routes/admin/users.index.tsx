import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Search, UserPlus, ShieldCheck, ShieldOff, Ban, Loader2,
  CheckCircle2, XCircle, KeyRound, FolderCog, X, Shield, Copy, MailCheck
} from "lucide-react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "#/lib/auth-client";
import { getAllUsersFn, setUserEmailVerifiedFn, resendVerificationEmailFn } from "#/server/tenant-admin-users";

const USERS_PAGE_SIZE = 15;

const usersQueryOptions = (params: { page: number; pageSize: number; searchQuery: string }) => ({
  queryKey: ['super-admin-users', params.page, params.pageSize, params.searchQuery],
  queryFn: () => getAllUsersFn({ data: params } as any),
  placeholderData: keepPreviousData,
});

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  const randomValues = new Uint32Array(12);
  globalThis.crypto.getRandomValues(randomValues);
  for (let i = 0; i < 12; i++) result += chars[randomValues[i] % chars.length];
  return result;
}

export const Route = createFileRoute("/admin/users/")({
  component: UsersDirectory,
  beforeLoad: ({ context }: any) => {
    if (context?.user?.role !== 'super') {
      throw redirect({ to: '/admin' });
    }
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      usersQueryOptions({ page: 1, pageSize: USERS_PAGE_SIZE, searchQuery: "" })
    );
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
});

function UsersDirectory() {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [jumpToPageInput, setJumpToPageInput] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "user" });

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  const { data }: any = useQuery(
    usersQueryOptions({ page, pageSize: USERS_PAGE_SIZE, searchQuery: debouncedSearchQuery })
  );

  const users: any[] = data?.users ?? [];
  const totalCount: number = data?.pagination?.totalCount ?? 0;
  const totalPages: number = Math.max(data?.pagination?.totalPages ?? 1, 1);
  const isFetchingUsers = !data;

  const handleJumpToPage = () => {
    const parsed = Number(jumpToPageInput);
    if (!Number.isFinite(parsed)) return;
    setPage(Math.min(Math.max(Math.floor(parsed), 1), totalPages));
    setJumpToPageInput("");
  };

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });

  const createUserMutation = useMutation({
    mutationFn: (payload: typeof createForm) => authClient.admin.createUser(payload as any),
    onSuccess: () => {
      invalidateUsers();
      setIsCreateModalOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "user" });
    },
    onError: (error: any) => alert(error?.message || "Failed to create user."),
  });

  const verifyMutation = useMutation({
    mutationFn: (payload: { userId: string; emailVerified: boolean }) => setUserEmailVerifiedFn({ data: payload } as any),
    onSuccess: invalidateUsers,
    onError: (error: any) => alert(error?.message || "Failed to update verification status."),
  });

  const resendVerificationMutation = useMutation({
    mutationFn: (userId: string) => resendVerificationEmailFn({ data: { userId } } as any),
    onSuccess: () => alert("Verification email sent."),
    onError: (error: any) => alert(error?.message || "Failed to send verification email."),
  });

  const banMutation = useMutation({
    mutationFn: (userId: string) => authClient.admin.banUser({ userId }),
    onSuccess: invalidateUsers,
    onError: (error: any) => alert(error?.message || "Failed to disable user."),
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => authClient.admin.unbanUser({ userId }),
    onSuccess: invalidateUsers,
    onError: (error: any) => alert(error?.message || "Failed to enable user."),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: { userId: string; newPassword: string }) => authClient.admin.setUserPassword(payload),
    onError: (error: any) => alert(error?.message || "Failed to reset password."),
  });

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(createForm);
  };

  const handleResetPassword = async (targetUser: any) => {
    if (!confirm(`Reset the password for ${targetUser.name} (${targetUser.email})? A new temporary password will be generated.`)) return;
    const newPassword = generateTempPassword();
    await resetPasswordMutation.mutateAsync({ userId: targetUser.id, newPassword });
    // Surface the generated password once -- there's no email infra to deliver it automatically,
    // so the super admin has to relay it to the tenant admin out of band.
    prompt(`Password reset for ${targetUser.email}. Share this temporary password with them (copy it now, it won't be shown again):`, newPassword);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ================= BACK NAVIGATION ================= */}
      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
      </Link>

      {/* ================= HEADER RIBBON CONTROLS ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            <span>Users Registry</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Super admin console — create tenant accounts, verify or disable access, reset credentials, and manage each account's election workspace.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            className="flex items-center gap-2 bg-[#E3F09B] text-black text-xs font-bold hover:bg-zinc-800 hover:text-white border border-zinc-800 px-3.5 py-2 rounded-lg transition-all"
          >
            <span>{totalCount} Accounts</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a192a]/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
        </div>
      </div>

      {/* ================= USERS TABLE ================= */}
      <div className="bg-[#0a192a]/50 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-zinc-900/20 text-zinc-400 text-[11px] font-bold uppercase tracking-wider select-none">
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-center">Verified</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Elections</th>
                <th className="px-6 py-4 text-center">Events</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-sm">
              {users.length > 0 ? (
                users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-zinc-900/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white tracking-wide">{u.name}</span>
                        <span className="text-xs text-zinc-500 mt-0.5">{u.email}</span>
                        {u.phone && <span className="text-[11px] text-zinc-600 font-mono mt-0.5">{u.phone}</span>}
                      </div>
                    </td>

                    <td className="px-6 py-4 align-middle">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${u.role === 'super' ? 'text-purple-400 bg-purple-950/30 border-purple-900/30' : 'text-zinc-400 bg-zinc-900 border-zinc-800'}`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="px-6 py-4 align-middle text-center">
                      {u.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/20 border border-amber-900/30 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 align-middle text-center">
                      {u.banned ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/20 border border-red-900/30 px-2 py-0.5 rounded-full">
                          <Ban className="w-3 h-3" /> Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 align-middle text-center">
                      <span className="font-mono text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-1 rounded">
                        {u.electionsCount}
                      </span>
                    </td>

                    <td className="px-6 py-4 align-middle text-center">
                      <span className="font-mono text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-1 rounded">
                        {u.eventsCount}
                      </span>
                    </td>

                    <td className="px-6 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title={u.emailVerified ? "Mark as unverified" : "Mark as verified"}
                          onClick={() => verifyMutation.mutate({ userId: u.id, emailVerified: !u.emailVerified })}
                          disabled={verifyMutation.isPending}
                          className="p-1.5 rounded text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/20 transition-colors disabled:opacity-40"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>

                        {!u.emailVerified && (
                          <button
                            type="button"
                            title="Send verification email"
                            onClick={() => resendVerificationMutation.mutate(u.id)}
                            disabled={resendVerificationMutation.isPending}
                            className="p-1.5 rounded text-zinc-400 hover:text-purple-400 hover:bg-purple-950/20 transition-colors disabled:opacity-40"
                          >
                            <MailCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          title={u.banned ? "Enable account" : "Disable account"}
                          onClick={() => (u.banned ? unbanMutation.mutate(u.id) : banMutation.mutate(u.id))}
                          disabled={banMutation.isPending || unbanMutation.isPending}
                          className={`p-1.5 rounded transition-colors disabled:opacity-40 ${u.banned ? 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/20' : 'text-zinc-400 hover:text-red-400 hover:bg-red-950/20'}`}
                        >
                          {u.banned ? <ShieldOff className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          title="Reset password"
                          onClick={() => handleResetPassword(u)}
                          disabled={resetPasswordMutation.isPending}
                          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          to="/admin/users/$userId"
                          params={{ userId: u.id }}
                          title="Manage election workspace"
                          className="p-1.5 rounded text-zinc-400 hover:text-purple-400 hover:bg-purple-950/20 transition-colors"
                        >
                          <FolderCog className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 border border-dashed border-zinc-900 rounded-b-xl text-zinc-500 text-xs">
                    No accounts found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION BOTTOM ELEMENT BAR ================= */}
        <div className="p-4 bg-zinc-900/40 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-zinc-400">
            {isFetchingUsers
              ? "Loading accounts..."
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

      {/* ========================================================================= */}
      {/* CREATE USER MODAL                                                          */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 px-4 duration-200">
          <div className="bg-[#0a192a]/50 border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-5 relative animate-in zoom-in-95 duration-150 text-zinc-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-400" /> Create Tenant Account
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Provisions a new sign-in account. Share the password with the account owner directly.
            </p>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-zinc-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#0a192a]/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-zinc-400">Email</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-[#0a192a]/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-zinc-400">Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    minLength={8}
                    value={createForm.password}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="flex-1 bg-[#0a192a]/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCreateForm((prev) => ({ ...prev, password: generateTempPassword() }))}
                    title="Generate a password"
                    className="px-3 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-zinc-400">Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-[#0a192a]/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="user">Tenant Admin</option>
                  <option value="super">Super Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-900 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-white font-semibold rounded-md transition-all shadow-md"
                >
                  {createUserMutation.isPending ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
