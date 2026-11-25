import { createFileRoute, Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, LayoutDashboard, LogOut, Megaphone, MessagesSquare, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getNomineeMeFn, nomineeSignOutFn } from "#/server/nominee-portal";
import { useChatSummary } from "#/components/nominee/usePortalData";

// App shell for the nominee portal: its own header (the public site header
// and footer are hidden here), tabs on wide screens and a bottom tab bar on
// phones. Signed-out visitors get only the slim header and the sign-in page.

export const Route = createFileRoute("/nominee-portal")({
  loader: async () => ({ me: await getNomineeMeFn() }),
  component: PortalShell,
});

type Tab = { to: string; label: string; icon: LucideIcon; exact?: boolean };
const TABS: Tab[] = [
  { to: "/nominee-portal", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/nominee-portal/share", label: "Share kit", icon: Megaphone },
  { to: "/nominee-portal/chat", label: "Chat", icon: MessagesSquare },
  { to: "/nominee-portal/profile", label: "Profile", icon: UserRound },
];

function useActive() {
  const path = useRouterState({ select: (s) => s.location.pathname.replace(/\/+$/, "") });
  return (t: Tab) => (t.exact ? path === t.to : path === t.to || path.startsWith(`${t.to}/`));
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-purple-500 px-1 text-[10px] font-bold leading-[18px] text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function AccountMenu({ me }: { me: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("pointerdown", close); window.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-2.5 hover:bg-white/10"
      >
        {me.contestant.imageUrl ? (
          <img src={me.contestant.imageUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="h-7 w-7 rounded-full bg-zinc-700" />
        )}
        <span className="inline max-w-[140px] truncate text-sm font-medium text-zinc-200 max-md:hidden!">{me.contestant.name.split(" ")[0]}</span>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#111f33] shadow-2xl">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">{me.contestant.name}</p>
            <p className="truncate text-xs text-zinc-400">{me.category.name}</p>
          </div>
          <Link to="/nominee-portal/profile" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5">
            <UserRound className="h-4 w-4 text-zinc-400" /> Edit profile
          </Link>
          <a href={`/nominee/${me.contestant.code}`} target="_blank" rel="noreferrer" role="menuitem" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5">
            <ExternalLink className="h-4 w-4 text-zinc-400" /> View voting page
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={async () => { setOpen(false); await nomineeSignOutFn(); await router.navigate({ to: "/nominee-portal", search: { code: undefined } }); await router.invalidate(); }}
            className="flex w-full items-center gap-2.5 border-t border-white/10 px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/5"
          >
            <LogOut className="h-4 w-4 text-zinc-400" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function PortalShell() {
  const { me } = Route.useLoaderData();
  const signedIn = Boolean(me?.activated);
  const isActive = useActive();
  const { data: chat } = useChatSummary(signedIn ? me!.contestant.id : undefined);
  const unread: number = chat?.unread ?? 0;

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#0b1a2e] text-white antialiased">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[520px] rounded-full bg-sky-500/5 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1a2e]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Heravote home">
            <img src="/logo512.png" alt="" className="h-11 w-auto" />
            <span className="block border-l border-white/15 pl-2.5 text-[10px] font-semibold uppercase leading-tight tracking-[0.2em] text-purple-300 max-sm:hidden!">
              Nominee<br />portal
            </span>
          </Link>

          {signedIn && (
            <nav aria-label="Portal" className="ml-4 flex items-center gap-1 max-md:hidden!">
              {TABS.map((t) => {
                const active = isActive(t);
                return (
                  <Link
                    key={t.to}
                    to={t.to as any}
                    aria-current={active ? "page" : undefined}
                    className={`relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${active ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
                  >
                    <t.icon className="h-4 w-4" /> {t.label}
                    {t.label === "Chat" && <Badge count={unread} />}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-3">
            {signedIn ? (
              <>
                <span className="inline max-w-[220px] truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 max-lg:hidden!">
                  {me!.event.title}
                </span>
                <AccountMenu me={me} />
              </>
            ) : (
              <Link to="/" className="text-sm text-zinc-400 hover:text-white">Back to Heravote</Link>
            )}
          </div>
        </div>
      </header>

      <main className={`relative mx-auto w-full max-w-6xl flex-1 px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8 ${signedIn ? "pb-28 md:pb-16" : "pb-16"}`}>
        <Outlet />
      </main>

      {/* Phone tab bar */}
      {signedIn && (
        <nav aria-label="Portal" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b1a2e]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden!">
          <div className="grid grid-cols-4">
            {TABS.map((t) => {
              const active = isActive(t);
              return (
                <Link
                  key={t.to}
                  to={t.to as any}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${active ? "text-white" : "text-zinc-500"}`}
                >
                  {active && <span aria-hidden className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-purple-400" />}
                  <span className="relative">
                    <t.icon className="h-5 w-5" />
                    {t.label === "Chat" && unread > 0 && (
                      <span className="absolute -right-2 -top-1.5 min-w-[16px] rounded-full bg-purple-500 px-1 text-center text-[9px] font-bold leading-4 text-white">{unread > 9 ? "9+" : unread}</span>
                    )}
                  </span>
                  {t.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
