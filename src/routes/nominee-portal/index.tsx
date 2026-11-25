import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock, Copy, ExternalLink, Megaphone, Pencil, QrCode } from "lucide-react";
import ShareMenu from "#/components/ShareMenu";
import { getNomineeMeFn } from "#/server/nominee-portal";
import { NomineeDashboard, PANEL } from "#/components/nominee/NomineeDashboard";
import { ChatSummaryCard } from "#/components/nominee/ChatSummaryCard";
import { SignInPanel } from "#/components/nominee/SignInPanel";

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

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** "2d 04h 12m 09s" style countdown parts. */
function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/**
 * The admin's on/off switch decides whether voting is open (votes are
 * accepted while it's on, as the rest of the site does); the dates only add
 * a countdown.
 */
function votingStatus(event: any, now: number) {
  const start = event.startAt ? Date.parse(event.startAt) : null;
  const end = event.endAt ? Date.parse(event.endAt) : null;
  if (!event.isActive) return { live: false, label: "Voting closed", target: null as number | null, targetLabel: "" };
  if (start !== null && now < start) return { live: false, label: "Opens soon", target: start, targetLabel: "Voting opens in" };
  return { live: true, label: "Voting open", target: end !== null && end > now ? end : null, targetLabel: "Voting closes in" };
}

function Countdown({ target, label }: { target: number; label: string }) {
  const now = useNow(1000);
  const p = parts(target - now);
  const unit = (v: number, u: string) => (
    <span className="flex min-w-[52px] flex-col items-center rounded-xl border border-white/10 bg-black/25 px-2 py-1.5">
      <span className="font-mono text-xl font-black tabular-nums text-white">{String(v).padStart(2, "0")}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">{u}</span>
    </span>
  );
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400"><Clock className="h-3 w-3" /> {label}</p>
      <div className="flex gap-1.5" role="timer" aria-label={`${label} ${p.d} days ${p.h} hours ${p.m} minutes`}>
        {unit(p.d, "days")}{unit(p.h, "hrs")}{unit(p.m, "min")}{unit(p.s, "sec")}
      </div>
    </div>
  );
}

function QuickShare({ me, publicUrl }: { me: any; publicUrl: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <section className={`${PANEL} relative overflow-hidden p-5`}>
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/20 blur-2xl" />
      <h3 className="relative flex items-center gap-2 text-sm font-bold text-white"><Megaphone className="h-4 w-4 text-purple-300" /> Your voting code</h3>
      <div className="relative mt-3 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-4 py-3">
        <span className="select-all font-mono text-3xl font-black tracking-[0.15em] text-white">{me.contestant.code}</span>
        <button
          type="button"
          aria-label="Copy voting code"
          onClick={async () => { try { await navigator.clipboard.writeText(publicUrl || me.contestant.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* selectable */ } }}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Link copied" : "Copy link"}
        </button>
      </div>
      <Link to="/nominee-portal/share" className="relative mt-3 flex items-center justify-between rounded-xl border border-purple-400/30 bg-purple-500/10 px-4 py-3 text-sm font-semibold text-purple-100 hover:bg-purple-500/20">
        <span className="flex items-center gap-2"><QrCode className="h-4 w-4" /> Posters, QR code & captions</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function Overview({ me }: { me: any }) {
  const now = useNow(60_000);
  const status = votingStatus(me.event, now);
  const publicPath = `/nominee/${me.contestant.code}`;
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  // Absolute once the browser's origin is known (empty during server render).
  const publicUrl = origin ? `${origin}${publicPath}` : "";

  return (
    <div className="space-y-6">
      <div className={`${PANEL} relative overflow-hidden`}>
        {me.event.imageUrl && (
          <img src={me.event.imageUrl} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.14] blur-2xl" />
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/15 via-transparent to-sky-500/10" />
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/70 to-transparent" />

        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="relative w-fit self-start">
            <div className={`w-fit rounded-[22px] p-[3px] ${status.live ? "bg-gradient-to-br from-emerald-300 via-purple-400 to-sky-400" : "bg-white/15"}`}>
              <img src={me.contestant.imageUrl} alt="" className="h-28 w-28 rounded-[19px] object-cover sm:h-32 sm:w-32" />
            </div>
            {status.live && (
              <span className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border border-emerald-400/40 bg-[#0d2a22] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" /> Live
              </span>
            )}
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-purple-200">{me.category.name}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.live ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-zinc-400"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.live ? "bg-emerald-400" : "bg-zinc-500"}`} /> {status.label}
              </span>
            </div>
            <p className="text-sm text-zinc-400">Welcome back,</p>
            <h1 className="break-words text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">{me.contestant.name}</h1>
            <p className="text-sm text-zinc-300">{me.contestant.tagline}</p>
            <p className="text-xs text-zinc-500">{me.event.title}</p>
          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            {status.target && <Countdown target={status.target} label={status.targetLabel} />}
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <ShareMenu
                title={me.contestant.name}
                text={`Vote for ${me.contestant.name} in ${me.category.name}! Voting code: ${me.contestant.code}`}
                url={publicUrl || undefined}
                heading="Share your voting page"
                align="right"
                buttonClassName="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition-colors hover:bg-purple-500"
              />
              <Link to="/nominee-portal/profile" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/10">
                <Pencil className="h-4 w-4" /> Edit
              </Link>
              <a href={publicPath} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/10">
                <ExternalLink className="h-4 w-4" /> Voting page
              </a>
            </div>
          </div>
        </div>
      </div>

      <NomineeDashboard
        contestantId={me.contestant.id}
        aside={<><ChatSummaryCard contestantId={me.contestant.id} /><QuickShare me={me} publicUrl={publicUrl} /></>}
      />
    </div>
  );
}

function NomineePortal() {
  const { me } = Route.useLoaderData();
  const { code } = Route.useSearch();
  return me ? <Overview me={me} /> : <SignInPanel initialCode={code} />;
}
