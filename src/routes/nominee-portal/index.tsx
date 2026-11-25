import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Clock, Copy, ExternalLink, KeyRound, Loader2, LogOut, Megaphone, Pencil, Phone, Smartphone } from "lucide-react";
import ShareMenu from "#/components/ShareMenu";
import { USSD_SHORTCODE } from "#/lib/utils";
import { getNomineeMeFn, nomineeSignInFn, nomineeSignOutFn } from "#/server/nominee-portal";
import { NomineeDashboard, PANEL } from "#/components/nominee/NomineeDashboard";

export const Route = createFileRoute("/nominee-portal/")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code.slice(0, 16) : undefined,
  }),
  loader: async () => {
    const me = await getNomineeMeFn();
    // First sign-in: the profile has to be completed before anything else.
    if (me && !me.activated) throw redirect({ to: "/nominee-portal/profile" });
    return { me };
  },
  head: () => ({ meta: [{ title: "Nominee Portal | Heravote" }, { name: "robots", content: "noindex" }] }),
  component: NomineePortal,
});

const field =
  "w-full rounded-xl border border-zinc-700 bg-[#0a192a]/60 py-3 pl-10 pr-3 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500";

function SignIn({ initialCode }: { initialCode?: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState((initialCode ?? "").toUpperCase());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r: any = await nomineeSignInFn({ data: { phone, code } } as any);
      if (!r.activated) await router.navigate({ to: "/nominee-portal/profile" });
      else await router.invalidate();
    } catch (err: any) {
      setError(err?.message || "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <form onSubmit={submit} className={`${PANEL} space-y-4 p-6 sm:p-8`}>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">Sign in</h2>
          <p className="text-sm text-zinc-400">Use the phone number your organiser has on file and the access code from your invite.</p>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Phone number</span>
          <span className="relative block">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input type="tel" inputMode="tel" autoComplete="tel" required placeholder="0241234567" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
          </span>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Access code</span>
          <span className="relative block">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              required
              autoComplete="one-time-code"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="8 characters"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className={`${field} font-mono tracking-[0.2em]`}
            />
          </span>
        </label>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
        </button>
        <p className="text-center text-xs text-zinc-500">No code? Ask the event organiser to send you an invite.</p>
      </form>
    </div>
  );
}

function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

const span = (ms: number) => {
  const m = Math.max(0, Math.floor(ms / 60_000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${mm}m` : `${mm}m`;
};

/**
 * "Voting open · closes in 2d 4h", "Opens in 3d", or "Voting closed". The
 * admin's on/off switch decides (votes are accepted while it's on, as the
 * rest of the site does); the dates only add a countdown.
 */
function votingStatus(event: any, now: number) {
  const start = event.startAt ? Date.parse(event.startAt) : null;
  const end = event.endAt ? Date.parse(event.endAt) : null;
  if (!event.isActive) return { live: false, label: "Voting closed", detail: null };
  if (start !== null && now < start) return { live: false, label: "Voting opens soon", detail: `Opens in ${span(start - now)}` };
  return { live: true, label: "Voting open", detail: end !== null && end > now ? `Closes in ${span(end - now)}` : null };
}

function CopyChip({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* selectable on screen */ }
      }}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CampaignKit({ me, publicUrl }: { me: any; publicUrl: string }) {
  return (
    <section className={`${PANEL} space-y-4 p-5`}>
      <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Megaphone className="h-4 w-4 text-purple-300" /> Campaign kit</h3>
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Your voting code</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="select-all font-mono text-3xl font-black tracking-[0.15em] text-white">{me.contestant.code}</span>
          <CopyChip value={me.contestant.code} label="voting code" />
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
        <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" />
        <p className="text-xs leading-relaxed text-zinc-300">
          Voters without data can dial <span className="font-mono font-bold text-white">{USSD_SHORTCODE}</span> and enter <span className="font-mono font-bold text-white">{me.contestant.code}</span>.
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Voting page link</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="select-all truncate font-mono text-xs text-zinc-300">{publicUrl.replace(/^https?:\/\//, "")}</span>
          <CopyChip value={publicUrl} label="voting page link" />
        </div>
      </div>
    </section>
  );
}

function Home({ me }: { me: any }) {
  const router = useRouter();
  const now = useNow();
  const publicPath = `/nominee/${me.contestant.code}`;
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  // Absolute once the browser's origin is known (empty during server render).
  const publicUrl = origin ? `${origin}${publicPath}` : "";
  const status = votingStatus(me.event, now);

  return (
    <div className="space-y-6">
      {/* Hero: who they are, where voting stands, share */}
      <div className={`${PANEL} relative overflow-hidden`}>
        {me.event.imageUrl && (
          <img src={me.event.imageUrl} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.12] blur-2xl" />
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-sky-500/5" />
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/70 to-transparent" />

        <div className="relative flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center">
          <div className="relative shrink-0 self-start">
            <img src={me.contestant.imageUrl} alt="" className="h-28 w-28 rounded-2xl border border-white/15 object-cover shadow-xl sm:h-32 sm:w-32" />
            {status.live && <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#13243a] bg-emerald-400" aria-hidden />}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-purple-200">{me.category.name}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.live ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-zinc-400"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.live ? "bg-emerald-400" : "bg-zinc-500"}`} />
                {status.label}
              </span>
              {status.detail && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                  <Clock className="h-3 w-3" /> {status.detail}
                </span>
              )}
            </div>
            <h2 className="break-words text-2xl font-extrabold leading-tight text-white sm:text-3xl">{me.contestant.name}</h2>
            <p className="text-sm text-zinc-300">{me.contestant.tagline}</p>
            <p className="text-xs text-zinc-500">{me.event.title}</p>
          </div>

          <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch">
            <ShareMenu
              title={me.contestant.name}
              text={`Vote for ${me.contestant.name} in ${me.category.name}! Voting code: ${me.contestant.code}`}
              url={publicUrl || undefined}
              heading="Share your voting page"
              align="right"
              buttonClassName="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition-colors hover:bg-purple-500"
            />
            <Link to="/nominee-portal/profile" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/10">
              <Pencil className="h-4 w-4" /> Edit profile
            </Link>
            <a href={publicPath} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/10">
              <ExternalLink className="h-4 w-4" /> Voting page
            </a>
          </div>
        </div>
      </div>

      <NomineeDashboard aside={<CampaignKit me={me} publicUrl={publicUrl} />} />

      <button
        type="button"
        onClick={async () => { await nomineeSignOutFn(); await router.invalidate(); }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}

function NomineePortal() {
  const { me } = Route.useLoaderData();
  const { code } = Route.useSearch();
  return (
    <div className="min-h-screen bg-[#0d1f36] text-white antialiased font-sans">
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="w-full pt-6 pb-8 sm:pt-12 lg:pt-20">
          <h1 className="mb-2 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">Nominee Portal</h1>
          <p className="max-w-2xl text-lg text-zinc-300">
            {me ? `Welcome back, ${me.contestant.name.split(" ")[0]}.` : "Manage your nominee profile and follow your campaign."}
          </p>
        </section>
        <section className="w-full pb-24">{me ? <Home me={me} /> : <SignIn initialCode={code} />}</section>
      </main>
    </div>
  );
}
