import { Link, useRouterState } from '@tanstack/react-router'
import {
  ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink, LogOut, Menu, Monitor, Moon, Search, Sun, User2, X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { signOut } from '#/lib/auth-client'
import {
  applyAdminTheme, readAdminThemePref, resolveAdminTheme, writeAdminThemePref, type AdminThemePref,
} from '#/lib/admin-theme'
import { CommandPalette } from './CommandPalette'
import { MAIN_NAV, SECONDARY_NAV, breadcrumbsFor, isNavActive, navFor, type NavItem } from './nav'

const SIDEBAR_KEY = 'heravote-admin-sidebar'

function readCollapsed(): boolean {
  try { return window.localStorage.getItem(SIDEBAR_KEY) === 'collapsed' } catch { return false }
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

function useAdminTheme() {
  // null until the saved preference is read: the pre-paint script already
  // applied it, so nothing is (re)applied before then -- no flicker.
  const [pref, setPref] = useState<AdminThemePref | null>(null)
  useEffect(() => setPref(readAdminThemePref()), [])
  useEffect(() => {
    if (pref === null) return
    applyAdminTheme(resolveAdminTheme(pref))
    if (pref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => applyAdminTheme(resolveAdminTheme('system'))
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [pref])
  // Leaving the admin hands <html> back to the public site's theme.
  useEffect(() => () => applyAdminTheme(null), [])
  const choose = (p: AdminThemePref) => {
    writeAdminThemePref(p)
    setPref(p)
  }
  return [pref ?? 'system', choose] as const
}

const THEME_OPTIONS: { value: AdminThemePref; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

function ThemeSwitch({ pref, onChange }: { pref: AdminThemePref; onChange: (p: AdminThemePref) => void }) {
  return (
    <div role="radiogroup" aria-label="Colour theme" className="flex items-center rounded-lg border border-zinc-800 p-0.5">
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={pref === value}
          title={`${label} theme`}
          onClick={() => onChange(value)}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${pref === value ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function NavLink({ item, pathname, collapsed, onNavigate }: { item: NavItem; pathname: string; collapsed: boolean; onNavigate?: () => void }) {
  const active = isNavActive(item, pathname)
  const Icon = item.icon
  return (
    <Link
      to={item.to as any}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-zinc-800/80 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
      } ${collapsed ? 'justify-center px-0' : ''}`}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-purple-500" aria-hidden />}
      <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-purple-400' : ''}`} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}

function SidebarContent({ isSuper, pathname, collapsed, onNavigate }: { isSuper: boolean; pathname: string; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link to="/admin" onClick={onNavigate} className={`flex h-14 shrink-0 items-center gap-2.5 border-b border-zinc-800 ${collapsed ? 'justify-center' : 'px-4'}`}>
        <img src="/icon-192.png" alt="" className="h-8 w-8 rounded-full" />
        {!collapsed && (
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-wide text-white">HERAVOTE</span>
            <span className="block text-[10px] text-zinc-500">{isSuper ? 'Super admin' : 'Admin'}</span>
          </span>
        )}
      </Link>
      <nav aria-label="Admin" className="flex-1 space-y-1 overflow-y-auto p-3">
        {navFor(MAIN_NAV, isSuper).map((item) => (
          <NavLink key={item.to} item={item} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="space-y-1 border-t border-zinc-800 p-3">
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.to} item={item} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
        <a
          href="/"
          title={collapsed ? 'Public site' : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <ExternalLink className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Public site</span>}
        </a>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Top bar pieces
// ---------------------------------------------------------------------------

function Breadcrumbs({ pathname }: { pathname: string }) {
  const crumbs = breadcrumbsFor(pathname)
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => (
          // Earlier crumbs are dropped on phones. max-sm:hidden! (important) because
          // legacy utilities in styles.css (.hidden/.flex) override responsive variants.
          <li key={`${c.label}-${i}`} className={`flex min-w-0 items-center gap-1.5 ${i < crumbs.length - 2 ? 'max-sm:hidden!' : ''}`}>
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden />}
            {c.to ? (
              <Link to={c.to as any} className="truncate text-zinc-400 hover:text-white">{c.label}</Link>
            ) : (
              <span aria-current="page" className="truncate font-semibold text-white">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

function ProfileMenu({ user, themePref, onTheme }: { user: any; themePref: AdminThemePref; onTheme: (p: AdminThemePref) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-900 hover:border-zinc-500"
      >
        {user?.image ? <img src={user.image} alt="" className="h-full w-full object-cover" /> : <User2 className="h-4 w-4 text-zinc-400" />}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-zinc-800 bg-[#0a192a] p-1 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-zinc-500">{user?.email}</p>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-800 px-3 py-2.5">
            <span className="text-xs text-zinc-400">Theme</span>
            <ThemeSwitch pref={themePref} onChange={onTheme} />
          </div>
          <div className="border-t border-zinc-800 pt-1">
            <Link to="/admin/settings" onClick={() => setOpen(false)} role="menuitem" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white">
              Account settings
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                await signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/auth/signin' } } })
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

export function AdminShell({ user, children }: { user: any; children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isSuper = user?.role === 'super'
  const [themePref, setThemePref] = useAdminTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => setCollapsed(readCollapsed()), [])
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { window.localStorage.setItem(SIDEBAR_KEY, c ? 'expanded' : 'collapsed') } catch { /* per-page only */ }
      return !c
    })
  }

  // ⌘K / Ctrl+K opens the palette from anywhere in the admin.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close the mobile drawer on navigation and on Escape.
  useEffect(() => setDrawerOpen(false), [pathname])
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  return (
    <div id="dashboard-shell" className="flex min-h-screen bg-[#18181b] text-white print:block print:bg-white">
      {/* Desktop sidebar */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 border-r border-zinc-800 bg-zinc-950 transition-[width] duration-200 md:block print:hidden ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent isSuper={isSuper} pathname={pathname} collapsed={collapsed} />
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-[4.25rem] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white"
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-zinc-800 bg-zinc-950 shadow-2xl animate-in slide-in-from-left duration-200">
            <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" className="absolute right-3 top-3.5 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent isSuper={isSuper} pathname={pathname} collapsed={false} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-zinc-800 bg-[#18181b]/90 px-4 backdrop-blur md:px-6 print:hidden">
          <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open navigation" className="-ml-1 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <Breadcrumbs pathname={pathname} />
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex h-8 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 text-sm text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 sm:w-56"
              aria-label="Search (Ctrl+K)"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="ml-auto hidden rounded border border-zinc-700 px-1.5 font-mono text-[10px] sm:inline">⌘K</kbd>
            </button>
            <div className="hidden lg:block">
              <ThemeSwitch pref={themePref} onChange={setThemePref} />
            </div>
            <ProfileMenu user={user} themePref={themePref} onTheme={setThemePref} />
          </div>
        </header>

        <main id="dashboard-content" className="w-full flex-1 bg-[#0a192a]/30 p-4 text-zinc-200 sm:p-6 print:bg-white print:p-0">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} isSuper={isSuper} />
    </div>
  )
}
