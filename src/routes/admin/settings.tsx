import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import {
  User, Mail, Phone, Shield, ShieldCheck, Key, Laptop, Globe,
  CheckCircle2, AlertCircle, Save, UploadCloud, X,
  Chrome, Lock, ArrowLeft, LogOut, Loader2, Users
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "#/lib/auth-client";
import { uploadAdminAvatarFn } from "#/server/tenant-account";
import moment from "moment";

// Turns a raw browser User-Agent string into a short "Browser on OS" label
function describeUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown device";

  const browser =
    /Edg\//.test(userAgent) ? "Edge" :
    /OPR\//.test(userAgent) ? "Opera" :
    /Chrome\//.test(userAgent) ? "Chrome" :
    /CriOS\//.test(userAgent) ? "Chrome" :
    /Firefox\//.test(userAgent) ? "Firefox" :
    /Safari\//.test(userAgent) ? "Safari" :
    "Unknown Browser";

  const os =
    /iPhone|iPad|iPod/.test(userAgent) ? "iOS" :
    /Mac OS X/.test(userAgent) ? "macOS" :
    /Android/.test(userAgent) ? "Android" :
    /Windows/.test(userAgent) ? "Windows" :
    /Linux/.test(userAgent) ? "Linux" :
    "Unknown OS";

  return `${browser} on ${os}`;
}

export const Route = createFileRoute("/admin/settings")({
  component: AdminAccountSettings,
});

function AdminAccountSettings() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: sessionData, isPending: sessionPending } = authClient.useSession();
  const user: any = sessionData?.user;
  const currentSessionToken = sessionData?.session?.token;

  // Editable profile fields, synced once the real session resolves
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user?.id]);

  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ================= LINKED SIGN-IN ACCOUNTS =================
  const { data: accounts } = useQuery({
    queryKey: ['admin-accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await authClient.listAccounts();
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!user,
  });

  const isGoogleLinked = (accounts ?? []).some((acc: any) => acc.providerId === "google");
  const isCredentialsLinked = (accounts ?? []).some((acc: any) => acc.providerId === "credential");

  const linkGoogleMutation = useMutation({
    mutationFn: () => authClient.linkSocial({ provider: "google", callbackURL: "/admin/settings" }),
  });

  const unlinkMutation = useMutation({
    mutationFn: (providerId: string) => authClient.unlinkAccount({ providerId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-accounts'] }),
    onError: (error: any) => alert(error?.message || "Failed to unlink provider."),
  });

  const handleUnlinkGoogle = () => {
    if (!confirm("Unlink your Google sign-in? You'll only be able to sign in with your email and password afterward.")) return;
    unlinkMutation.mutate("google");
  };

  // ================= ACTIVE SESSIONS =================
  const { data: sessions } = useQuery({
    queryKey: ['admin-sessions', user?.id],
    queryFn: async () => {
      const { data, error } = await authClient.listSessions();
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!user,
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (token: string) => authClient.revokeSession({ token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-sessions'] }),
    onError: (error: any) => alert(error?.message || "Failed to revoke session."),
  });

  const handleRevokeSession = (token: string) => {
    if (!confirm("Sign out this device? It will need to sign in again.")) return;
    revokeSessionMutation.mutate(token);
  };

  const revokeOtherSessionsMutation = useMutation({
    mutationFn: () => authClient.revokeOtherSessions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-sessions'] }),
    onError: (error: any) => alert(error?.message || "Failed to sign out other sessions."),
  });

  const handleRevokeOtherSessions = () => {
    if (!confirm("Sign out every other device? They'll all need to sign in again.")) return;
    revokeOtherSessionsMutation.mutate();
  };

  // ================= AVATAR SELECTION =================
  const handlePhotoSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Invalid file formatting. Please supply an image asset.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Asset payload bounds exceeded. Portrait maximum limit is 2MB.");
      return;
    }
    setUploadError(null);
    setPendingImageFile(file);
    setPendingImagePreview(URL.createObjectURL(file));
  };

  const removeProfilePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingImageFile(null);
    setPendingImagePreview(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(false);

    try {
      let imageUrl: string | undefined = undefined;

      if (pendingImageFile) {
        const formData = new FormData();
        formData.set("image", pendingImageFile);
        const result: any = await uploadAdminAvatarFn({ data: formData } as any);
        if (!result?.success) throw new Error(result?.error || "Avatar upload failed.");
        imageUrl = result.imageUrl;
      }

      const { error } = await authClient.updateUser({
        name,
        phone,
        ...(imageUrl ? { image: imageUrl } : {}),
      } as any);
      if (error) throw new Error(error.message);

      setPendingImageFile(null);
      setPendingImagePreview(null);
      setProfileSuccess(true);
    } catch (err: any) {
      setUploadError(err?.message || "Failed to save profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordState((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordSuccess(false);
    setPasswordError(null);

    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setPasswordError("Confirm password values do not match.");
      setIsUpdatingPassword(false);
      return;
    }

    try {
      const { error } = await authClient.changePassword({
        currentPassword: passwordState.currentPassword,
        newPassword: passwordState.newPassword,
        revokeOtherSessions: false,
      });
      if (error) throw new Error(error.message);

      setPasswordSuccess(true);
      setPasswordState({ currentPassword: "", newPassword: "", confirmPassword: "" });
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
    } catch (err: any) {
      setPasswordError(err?.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (sessionPending) {
    return (
      <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
    );
  }

  const displayImage = pendingImagePreview || user?.image || "";
  const initials = (user?.name || "")
    .split(" ")
    .map((part: string) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ================= BACK NAVIGATION ================= */}
      <Link
        to="/admin/elections"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
      </Link>

      {/* ================= SECTION HEADER ================= */}
      <div className="bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <span>Admin Settings</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage your profile details, sign-in methods, password, and active sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ================= LEFT CONTAINER: PORTRAIT + LINKED PROVIDERS ================= */}
        <div className="space-y-6 lg:col-span-1">

          {/* Identity Profile Badge + Avatar Upload */}
          <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 text-center space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handlePhotoSelect(e.target.files[0])}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center cursor-pointer group overflow-hidden transition-all hover:border-purple-500/50"
            >
              {displayImage ? (
                <img src={displayImage} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-white text-lg font-black select-none">{initials || "?"}</div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <UploadCloud className="w-4 h-4 text-white" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">{user?.name}</h3>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5 truncate select-all">{user?.id}</p>
            </div>

            {pendingImagePreview && (
              <button
                type="button"
                onClick={removeProfilePhoto}
                className="text-[10px] text-red-400 hover:text-red-300 font-semibold transition-colors flex items-center gap-1 mx-auto"
              >
                <X className="w-3 h-3" /> Discard New Photo
              </button>
            )}

            {uploadError && (
              <p className="text-red-400 text-[10px] mt-1 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> {uploadError}
              </p>
            )}

            <div className="pt-2 border-t border-zinc-900 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/20 px-2 py-1 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>{user?.role || "admin"}</span>
            </div>
          </div>

          {/* LINKED SIGN-IN PROVIDERS */}
          <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider text-[10px]">Linked Sign-In Methods</span>

            <div className="space-y-2">
              {/* Provider A: Google OAuth */}
              <div className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${isGoogleLinked ? 'bg-zinc-900/30 border-zinc-800' : 'bg-transparent border-zinc-900'}`}>
                <div className="flex items-center gap-2">
                  <Chrome className="w-4 h-4 text-blue-400" />
                  <span className="font-medium text-zinc-200">Google Single Sign-On</span>
                </div>
                {isGoogleLinked ? (
                  <button
                    type="button"
                    onClick={handleUnlinkGoogle}
                    disabled={unlinkMutation.isPending || !isCredentialsLinked}
                    title={!isCredentialsLinked ? "Set a password first so you can still sign in" : "Unlink Google"}
                    className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-sm select-none text-emerald-400 bg-emerald-950/20 border border-emerald-900/20 hover:text-red-400 hover:border-red-900/30 hover:bg-red-950/20 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Linked
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => linkGoogleMutation.mutate()}
                    disabled={linkGoogleMutation.isPending}
                    className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-sm select-none text-zinc-400 bg-zinc-900 border border-zinc-800 hover:text-purple-400 hover:border-purple-900/40 transition-colors"
                  >
                    {linkGoogleMutation.isPending ? "Linking..." : "Link"}
                  </button>
                )}
              </div>

              {/* Provider B: Email/Password Credentials */}
              <div className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${isCredentialsLinked ? 'bg-zinc-900/30 border-zinc-800' : 'bg-transparent border-zinc-900 opacity-40'}`}>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span className="font-medium text-zinc-200">Email & Password</span>
                </div>
                <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-sm select-none ${isCredentialsLinked ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/20' : 'text-zinc-600 bg-zinc-900'}`}>
                  {isCredentialsLinked ? "Linked" : "Unlinked"}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ================= RIGHT CONTAINER: CORE FIELDS CONFIGURATIONS ================= */}
        <div className="lg:col-span-2 space-y-6">

          {/* SECTION 1: PROFILE INFORMATION */}
          <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-zinc-900/40 border-b border-zinc-800/80 px-5 py-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">Personal Profile Information</h3>
            </div>

            <form onSubmit={handleProfileSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-zinc-400">Display Name</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      name="name"
                      required
                      disabled={isSavingProfile}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#0a192a]/50 border border-zinc-800 focus:border-purple-500 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                    <User className="absolute left-2.5 w-3.5 h-3.5 text-zinc-600" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-zinc-400">Phone Number</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      name="phone"
                      disabled={isSavingProfile}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+233240000000"
                      className="w-full bg-[#0a192a]/50 border border-zinc-800 focus:border-purple-500 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                    />
                    <Phone className="absolute left-2.5 w-3.5 h-3.5 text-zinc-600" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 opacity-70">
                <label className="text-[11px] uppercase font-bold text-zinc-500">Contact Email (read-only)</label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    readOnly
                    value={user?.email || ""}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-lg pl-8 pr-3 py-2 text-xs cursor-not-allowed"
                  />
                  <Mail className="absolute left-2.5 w-3.5 h-3.5 text-zinc-700" />
                </div>
              </div>

              {/* Profile Success Toast */}
              {profileSuccess && (
                <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Profile updated successfully.</span>
                </div>
              )}

              <div className="flex justify-end border-t border-zinc-900 pt-3">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md disabled:opacity-50"
                >
                  {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSavingProfile ? "Saving Changes..." : "Save Profile"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: UPDATE CREDENTIALS ACCOUNT PASSWORD (Conditional on credentials setup) */}
          {isCredentialsLinked && (
            <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
              <div className="bg-zinc-900/40 border-b border-zinc-800/80 px-5 py-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">Security Credentials</h3>
              </div>

              <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase font-bold text-zinc-400">Current Password</label>
                    <div className="relative flex items-center">
                      <input
                        type="password"
                        name="currentPassword"
                        required
                        disabled={isUpdatingPassword}
                        value={passwordState.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full bg-[#0a192a]/50 border border-zinc-800 focus:border-purple-500 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <Key className="absolute left-2.5 w-3.5 h-3.5 text-zinc-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase font-bold text-zinc-400">New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        required
                        minLength={8}
                        disabled={isUpdatingPassword}
                        value={passwordState.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full bg-[#0a192a]/50 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase font-bold text-zinc-400">Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        required
                        minLength={8}
                        disabled={isUpdatingPassword}
                        value={passwordState.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full bg-[#0a192a]/50 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Feedback Toasts */}
                {passwordError && (
                  <div className="bg-red-950/20 border border-red-900/40 text-red-400 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Password updated successfully.</span>
                  </div>
                )}

                <div className="flex justify-end border-t border-zinc-900 pt-3">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md disabled:opacity-50"
                  >
                    {isUpdatingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isUpdatingPassword ? "Updating..." : "Update Password"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 3: ACTIVE SESSION LOGS */}
          <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-zinc-900/40 border-b border-zinc-800/80 px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">Active Session Logs</h3>
                <span className="text-[9px] font-mono font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                  {(sessions ?? []).length}
                </span>
              </div>
              {(sessions ?? []).length > 1 && (
                <button
                  type="button"
                  onClick={handleRevokeOtherSessions}
                  disabled={revokeOtherSessionsMutation.isPending}
                  className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-40"
                >
                  {revokeOtherSessionsMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Users className="w-3 h-3" />
                  )}
                  Sign Out All Other Devices
                </button>
              )}
            </div>

            <div className="divide-y divide-zinc-900/60">
              {(sessions ?? []).length > 0 ? (sessions ?? []).map((sess: any) => {
                const isCurrent = sess.token === currentSessionToken;
                return (
                  <div key={sess.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0 mt-0.5">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 truncate">{describeUserAgent(sess.userAgent)}</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-zinc-600" /> IP: {sess.ipAddress || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      {isCurrent ? (
                        <span className="text-[9px] uppercase font-black bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded-sm select-none">
                          This Device
                        </span>
                      ) : (
                        <>
                          <span className="text-[10px] font-mono font-medium text-zinc-600">
                            Expires {moment(sess.expiresAt).fromNow()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(sess.token)}
                            disabled={revokeSessionMutation.isPending}
                            className="inline-flex items-center gap-1 text-[9px] uppercase font-black text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-40"
                          >
                            <LogOut className="w-3 h-3" /> Sign Out
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="p-6 text-center text-zinc-500 text-xs italic">
                  No active sessions found.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
 );
}
