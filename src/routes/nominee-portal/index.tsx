import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, KeyRound, Loader2, LogOut, Pencil, Phone, Share2, Sparkles } from "lucide-react";
import { getNomineeMeFn, nomineeSignInFn, nomineeSignOutFn } from "#/server/nominee-portal";

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
      <form onSubmit={submit} className="space-y-4 rounded-3xl bg-zinc-800/50 p-6 shadow-md sm:p-8">
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

function Home({ me }: { me: any }) {
  const router = useRouter();
  const publicPath = `/nominee/${me.contestant.code}`;
  const share = async () => {
    const url = `${window.location.origin}${publicPath}`;
    const text = `Vote for ${me.contestant.name} in ${me.category.name} (${me.event.title}). Code: ${me.contestant.code}`;
    try {
      if (navigator.share) await navigator.share({ title: me.contestant.name, text, url });
      else await navigator.clipboard.writeText(`${text} ${url}`);
    } catch {
      // Share sheet dismissed.
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 rounded-3xl bg-zinc-800/50 p-6 shadow-md sm:flex-row sm:items-center sm:p-8">
        <img src={me.contestant.imageUrl} alt="" className="h-24 w-24 shrink-0 rounded-2xl border border-zinc-700 object-cover" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">{me.category.name}</p>
          <h2 className="break-words text-2xl font-extrabold leading-tight text-white">{me.contestant.name}</h2>
          <p className="text-sm text-zinc-300">{me.contestant.tagline}</p>
          <p className="text-xs text-zinc-500">
            {me.event.title} · voting code <span className="font-mono font-bold text-zinc-300">{me.contestant.code}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col">
          <Link to="/nominee-portal/profile" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700/40">
            <Pencil className="h-4 w-4" /> Edit profile
          </Link>
          <button type="button" onClick={share} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500">
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <a href={publicPath} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl bg-zinc-800/50 p-5 hover:bg-zinc-800/80">
          <span>
            <span className="block text-sm font-semibold text-white">Your public voting page</span>
            <span className="block text-xs text-zinc-400">What voters see when they vote for you</span>
          </span>
          <ExternalLink className="h-4 w-4 text-zinc-400" />
        </a>
        <div className="flex items-center gap-3 rounded-2xl bg-zinc-800/50 p-5">
          <Sparkles className="h-5 w-5 shrink-0 text-purple-300" />
          <span className="text-xs text-zinc-400">
            {me.event.isActive ? "Voting is open. Share your page and code to collect votes." : "Voting isn't open right now."}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={async () => { await nomineeSignOutFn(); await router.invalidate(); }}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white"
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
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
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
