import { useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { FormSkeleton, ManageDashboardSkeleton, Skeleton, TableSkeleton } from '#/components/ui/skeleton'

// What a page shows while its data loads, picked from where you're going, so
// navigation switches pages straight away instead of holding the old one.
// Routes with their own pendingComponent keep it; this is the default.

function PortalSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Skeleton className="h-28 w-28 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-72 max-w-full" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

function PublicSkeleton() {
  return (
    <div className="min-h-screen w-full bg-[#0d1f36]" aria-busy="true" aria-label="Loading">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 pt-8 pb-24 sm:px-6 lg:px-8 lg:pt-16">
        <div className="space-y-3">
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-5 w-[28rem] max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-3xl bg-zinc-800/40 p-4">
              <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DefaultPending() {
  const path = useRouterState({ select: (s) => s.location.pathname })
  if (path.startsWith('/nominee-portal')) return <PortalSkeleton />
  if (path.startsWith('/admin')) {
    if (/\/(new|edit)$/.test(path)) return <FormSkeleton />
    if (/\/(manage|revenue)$/.test(path) || path === '/admin' || path === '/admin/') return <ManageDashboardSkeleton />
    return <TableSkeleton />
  }
  return <PublicSkeleton />
}

/**
 * Thin progress bar along the top while a navigation is loading. Appears
 * immediately on click, eases towards 90% and completes when the page is in.
 */
export function NavigationProgress() {
  const loading = useRouterState({ select: (s) => s.status === 'pending' || s.isLoading })
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (loading) {
      setVisible(true)
      setWidth(12)
      const t = setInterval(() => setWidth((w) => (w < 90 ? w + (90 - w) * 0.12 : w)), 120)
      return () => clearInterval(t)
    }
    if (!visible) return
    setWidth(100)
    const done = setTimeout(() => { setVisible(false); setWidth(0) }, 260)
    return () => clearTimeout(done)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  if (!visible) return null
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-purple-400 via-purple-500 to-sky-400 shadow-[0_0_10px_rgba(151,164,27,0.7)] transition-[width] duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
