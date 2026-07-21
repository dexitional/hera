// Shared loading-state building blocks. Swapped in for pendingComponent's
// centered spinner across admin/elections/events pages so a route's loading
// state roughly previews the shape of the content about to render, instead
// of a blank screen with just a spinner in the middle.

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/5 ${className}`} />;
}

// Header ribbon + filter bar + table, matching the *.index.tsx list pages
// (elections, events, voters, candidates, users, positions, categories,
// contestants, transactions, organizations).
export function TableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Skeleton className="h-4 w-40" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#233554] p-6 rounded-xl border border-zinc-800">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
        <Skeleton className="h-9 w-72 rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>

      <div className="bg-[#233554] rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="border-b border-zinc-800/60 bg-zinc-900/20 p-4 flex gap-6">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        <div className="divide-y divide-zinc-900">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-6">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} className={`h-4 flex-1 ${j === 0 ? 'max-w-40' : 'max-w-24'}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stat tiles + management sector cards, matching the *.manage.tsx dashboards.
export function ManageDashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Skeleton className="h-4 w-48" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#233554] p-6 rounded-xl border border-zinc-800">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <Skeleton className="h-14 w-40 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-[#233554] border border-zinc-800 p-4 rounded-xl space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[#233554] border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// A single centered form card, matching *.new.tsx / *.edit.tsx pages.
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="w-full max-w-2xl mx-auto my-10 px-4 space-y-4">
      <Skeleton className="h-4 w-40" />
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="p-6 space-y-5">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Stat strip + a large content panel, matching feed/results/pay/invoice pages.
export function PanelSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Skeleton className="h-4 w-40" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[#233554] border border-zinc-800 p-4 rounded-xl space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
      <div className="bg-[#233554] border border-zinc-800 rounded-xl p-6 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    </div>
  );
}

// Grid of cards, matching the public /elections and /events listing pages.
export function CardGridSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-3xl bg-slate-600/10 border border-slate-600/20 overflow-hidden">
          <Skeleton className="h-56 w-full rounded-none" />
          <div className="px-4 py-4 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
