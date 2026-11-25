import { CalendarCheck, Landmark, LayoutDashboard, Settings, Sparkles, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  /** Words the command palette also matches on. */
  keywords?: string
  superOnly?: boolean
}

export const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, keywords: 'home overview analytics' },
  { label: 'Elections', to: '/admin/elections', icon: CalendarCheck, keywords: 'ballots voters candidates positions' },
  { label: 'Events', to: '/admin/events', icon: Sparkles, keywords: 'awards nominees categories votes' },
  { label: 'Revenue', to: '/admin/revenue', icon: Landmark, keywords: 'withdrawals payouts fees money', superOnly: true },
  { label: 'Users', to: '/admin/users', icon: Users, keywords: 'accounts admins organisations', superOnly: true },
]

export const SECONDARY_NAV: NavItem[] = [
  { label: 'Settings', to: '/admin/settings', icon: Settings, keywords: 'account profile password' },
]

export const navFor = (items: NavItem[], isSuper: boolean) => items.filter((i) => !i.superOnly || isSuper)

/** Dashboard is active only on /admin itself; sections match their sub-pages too. */
export function isNavActive(item: NavItem, pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  return item.to === '/admin' ? path === '/admin' : path === item.to || path.startsWith(`${item.to}/`)
}

// Breadcrumb labels for path segments.
const SEGMENT_LABELS: Record<string, string> = {
  elections: 'Elections', events: 'Events', revenue: 'Revenue', users: 'Users', settings: 'Settings',
  manage: 'Overview', voters: 'Voters', candidates: 'Candidates', positions: 'Positions', feed: 'Live feed',
  adminfeed: 'Admin feed', results: 'Results', edit: 'Edit', new: 'New', categories: 'Categories',
  contestants: 'Nominees', transactions: 'Transactions', chat: 'Nominees chat', invoice: 'Invoice', receipt: 'Receipt', pay: 'Payment',
  organizations: 'Organisations', public: 'Public page',
}
// What an ID segment is, based on the segment before it.
const ID_LABELS: Record<string, string> = {
  elections: 'Election', events: 'Event', users: 'User', voters: 'Voter', candidates: 'Candidate',
  positions: 'Position', categories: 'Category', contestants: 'Nominee', transactions: 'Transaction',
}
// Where an ID crumb should link (its overview page).
const ID_LINKS: Record<string, (id: string) => string> = {
  elections: (id) => `/admin/elections/${id}/manage`,
  events: (id) => `/admin/events/${id}/manage`,
  users: (id) => `/admin/users/${id}`,
}

export type Crumb = { label: string; to?: string }

export function breadcrumbsFor(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean) // ['admin', ...]
  const crumbs: Crumb[] = [{ label: 'Dashboard', to: '/admin' }]
  let path = '/admin'
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i]
    const prev = segments[i - 1]
    path += `/${seg}`
    const isId = !SEGMENT_LABELS[seg] && (/^[0-9a-f-]{16,}$/i.test(seg) || /^[A-Za-z0-9]{20,}$/.test(seg) || ID_LABELS[prev] !== undefined)
    if (isId) {
      crumbs.push({ label: ID_LABELS[prev] ?? 'Item', to: ID_LINKS[prev]?.(seg) })
    } else {
      crumbs.push({ label: SEGMENT_LABELS[seg] ?? seg.replace(/-/g, ' '), to: path })
    }
  }
  // The last crumb is the current page: not a link.
  if (crumbs.length) crumbs[crumbs.length - 1] = { label: crumbs[crumbs.length - 1].label }
  return crumbs
}
