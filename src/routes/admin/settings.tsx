import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect, useRef } from "react";
import { 
  User, Mail, Phone, Shield, ShieldCheck, Key, Laptop, Globe, 
  CheckCircle2, AlertCircle, Save, UploadCloud, FileImage, X, 
  Chrome, Lock 
} from "lucide-react";

interface AdminProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  isSubscribed: boolean;
  subscriptionPlan: string;
  image: string; // Maps back onto your user.image Drizzle column text link string
}

interface ActiveSessionLog {
  id: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  isCurrent: boolean;
}

interface LinkedProvider {
  providerId: string; // 'google' | 'credential'
  accountId: string;
  createdAt: string;
}

export const Route = createFileRoute("/admin/settings")({
  component: AdminAccountSettings,
});

function AdminAccountSettings() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydrating state data matching the user pgTable fields
  const [profile, setProfile] = useState<AdminProfileData>({
    id: "usr_cl7w9x8120000jk8s9zxx41p0",
    name: "John Doe",
    email: "johndoe@festora.com",
    phone: "+233240001111",
    isSubscribed: true,
    subscriptionPlan: "Enterprise Pro Tier",
    image: "", // Empty initial state for profile photo
  });

  // Hydrating password variables for the 'account' credentials row mutations
  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // State tracing active associated sign-in provider rows in your 'account' table schema
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedProvider[]>([
    { providerId: "credential", accountId: "johndoe@festora.com", createdAt: "12 Jan 2026" },
    { providerId: "google", accountId: "109283019283019283", createdAt: "24 Feb 2026" },
  ]);

  // Mock sessions tracking rows matching the 'session' table schema rules
  const [sessions] = useState<ActiveSessionLog[]>([
    { id: "sess_1", ipAddress: "154.160.2.14", userAgent: "Chrome / macOS (14.4)", expiresAt: "27 May 2026", isCurrent: true },
    { id: "sess_2", ipAddress: "102.176.45.89", userAgent: "Safari / iOS (17.4)", expiresAt: "23 May 2026", isCurrent: false },
  ]);

  // Image Upload Sub-lifecycle state matrices
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingToBucket, setUploadingToBucket] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordState((prev) => ({ ...prev, [name]: value }));
  };

  // Processing photo upload directly into secure S3 / R2 block loops
  const handlePhotoUploadAction = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Invalid file formatting. Please supply an image asset.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Asset payload bounds exceeded. Portrait maximum limit is 2MB.");
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    setUploadingToBucket(true);
    setUploadProgress(20);

    try {
      // Simulate network chunks transport delay latency to S3 / Cloudflare R2 bucket endpoints
      await new Promise((resolve) => setTimeout(resolve, 400));
      setUploadProgress(70);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUploadProgress(100);

      const generatedStorageBucketLink = `https://festora-storage.internal{crypto.randomUUID()}-${file.name}`;
      setProfile((prev) => ({ ...prev, image: generatedStorageBucketLink }));
    } catch (err) {
      setUploadError("Storage destination synchronization handshake broke. Please retry.");
      setSelectedFile(null);
    } finally {
      setUploadingToBucket(false);
    }
  };

  const removeProfilePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadError(null);
    setProfile((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Committed user table fields directly into Drizzle context schema instance:", {
        name: profile.name,
        phone: profile.phone,
        image: profile.image, // Writes the public remote cloud path to your user.image column text row
      });
      setProfileSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
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
      await new Promise((resolve) => setTimeout(resolve, 1200));
      console.log("Committed updated credentials hash onto the core account pgTable broker logic");
      setPasswordSuccess(true);
      setPasswordState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const isGoogleLinked = linkedAccounts.some(acc => acc.providerId === "google");
  const isCredentialsLinked = linkedAccounts.some(acc => acc.providerId === "credential");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        
        {/* ================= SECTION HEADER ================= */}
        <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <span>Admin Settings Console</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Modify structural user attributes, manage multi-provider sign-in authentication methods (`google`, `credentials`), upload remote profile photo assets, and audit secure sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* ================= LEFT CONTAINER: CLOUD PORTRAIT STORAGE ZONE ================= */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Identity Profile Badge + S3/R2 Dropzone Interface */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 text-center space-y-4">
              <input 
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhotoUploadAction(e.target.files[0])}
              />
              
              <div 
                onClick={() => !uploadingToBucket && fileInputRef.current?.click()}
                className="relative w-20 h-20 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center cursor-pointer group overflow-hidden transition-all hover:border-purple-500/50"
              >
                {profile.image ? (
                  <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-white text-lg font-black select-none">JD</div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <UploadCloud className="w-4 h-4 text-white" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{profile.name}</h3>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5 truncate select-all">{profile.id}</p>
              </div>

              {profile.image && (
                <button
                  type="button"
                  onClick={removeProfilePhoto}
                  className="text-[10px] text-red-400 hover:text-red-300 font-semibold transition-colors flex items-center gap-1 mx-auto"
                >
                  <X className="w-3 h-3" /> Remove Photo
                </button>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden border border-zinc-800/40">
                  <div className="bg-purple-500 h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}

              {uploadError && (
                <p className="text-red-400 text-[10px] mt-1 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {uploadError}
                </p>
              )}

              <div className="pt-2 border-t border-zinc-900 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/20 px-2 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>{profile.subscriptionPlan}</span>
              </div>
            </div>

            {/* RELATIONAL PROVIDERS INTERACTION BLOCK (Better Auth account mapping display matrix) */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider text-[10px]">Linked Sign-In Brokers</span>
              
              <div className="space-y-2">
                {/* Provider A: Google OAuth */}
                <div className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${isGoogleLinked ? 'bg-zinc-900/30 border-zinc-800' : 'bg-transparent border-zinc-900 opacity-40'}`}>
                  <div className="flex items-center gap-2">
                    <Chrome className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-zinc-200">Google Single Sign-On</span>
                  </div>
                  <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-sm select-none ${isGoogleLinked ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/20' : 'text-zinc-600 bg-zinc-900'}`}>
                    {isGoogleLinked ? "Linked" : "Unlinked"}
                  </span>
                </div>

                {/* Provider B: Email/Password Credentials */}
                <div className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${isCredentialsLinked ? 'bg-zinc-900/30 border-zinc-800' : 'bg-transparent border-zinc-900 opacity-40'}`}>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span className="font-medium text-zinc-200">Email & Credentials</span>
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
            
            {/* SECTION 1: METADATA FIELDS SUBMISSION */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
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
                        value={profile.name}
                        onChange={handleProfileChange}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                      <User className="absolute left-2.5 w-3.5 h-3.5 text-zinc-600" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase font-bold text-zinc-400">Phone Code Mapping</label>
                    <div className="relative flex items-center">
                      <input 
                        type="text" 
                        name="phone" 
                        required
                        disabled={isSavingProfile}
                        value={profile.phone}
                        onChange={handleProfileChange}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                      />
                      <Phone className="absolute left-2.5 w-3.5 h-3.5 text-zinc-600" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 opacity-70">
                  <label className="text-[11px] uppercase font-bold text-zinc-500">Immutable Contact Email</label>
                  <div className="relative flex items-center">
                    <input 
                      type="email" 
                      readOnly 
                      value={profile.email}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-lg pl-8 pr-3 py-2 text-xs cursor-not-allowed"
                    />
                    <Mail className="absolute left-2.5 w-3.5 h-3.5 text-zinc-700" />
                  </div>
                </div>

                {/* Profile Success Toast */}
                {profileSuccess && (
                  <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Profile row elements committed successfully to your database node layer.</span>
                  </div>
                )}

                <div className="flex justify-end border-t border-zinc-900 pt-3">
                  <button
                    type="submit"
                    disabled={isSavingProfile || uploadingToBucket}
                    className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingProfile ? "Saving Changes..." : "Save Profile"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* SECTION 2: UPDATE CREDENTIALS ACCOUNT PASSWORD (Conditional on credentials setup) */}
            {isCredentialsLinked && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
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
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none"
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
                          disabled={isUpdatingPassword}
                          value={passwordState.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase font-bold text-zinc-400">Confirm New Password</label>
                        <input 
                          type="password" 
                          name="confirmPassword" 
                          required
                          disabled={isUpdatingPassword}
                          value={passwordState.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
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
                      <span>Account secure hash updated successfully via credentials broker plugin.</span>
                    </div>
                  )}

                  <div className="flex justify-end border-t border-zinc-900 pt-3">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md disabled:opacity-50"
                    >
                      <span>{isUpdatingPassword ? "Encrypting Strings..." : "Update Password"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SECTION 3: SESSION HANDSHAKE AUDIT LOGS TABLE */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
              <div className="bg-zinc-900/40 border-b border-zinc-800/80 px-5 py-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">Active Session Logs</h3>
              </div>
              
              <div className="divide-y divide-zinc-900/60 bg-zinc-950/40">
                {sessions.map((sess) => (
                  <div key={sess.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0 mt-0.5">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 truncate">{sess.userAgent}</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-zinc-600" /> IP: {sess.ipAddress}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      {sess.isCurrent ? (
                        <span className="text-[9px] uppercase font-black bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded-sm select-none">
                          This Device
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-medium text-zinc-600">
                          Expires: {sess.expiresAt}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

    </div>
 );
}
