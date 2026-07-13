import { PAGE_CONTAINER, PageShell } from '@/components/layout/page-shell'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Matches the glass treatment of the real dashboard cards so the skeleton reads
// as the same surface mid-load.
const GLASS =
  'border border-white/10 bg-white/[0.04] shadow-[0_24px_70px_-24px_rgba(0,0,0,0.7)] backdrop-blur-md'
const BAR = 'bg-white/[0.06]'

/**
 * Loading placeholder for the dashboard (`/` and `/dashboard`). Mirrors the
 * welcome heading, the "Add food" card, and the "Today" meal list.
 */
export function DashboardPageSkeleton() {
  return (
    <PageShell className="min-h-svh">
      <section
        className={cn(PAGE_CONTAINER, 'pt-32 pb-20')}
        role="status"
        aria-label="Loading dashboard"
      >
        <span className="sr-only">Loading dashboard…</span>

        <div className="mb-8">
          <Skeleton className={`h-9 w-56 ${BAR}`} />
          <Skeleton className={`mt-3 h-4 w-64 ${BAR}`} />
        </div>

        <div className="space-y-8">
          {/* Add food card */}
          <div className={`space-y-4 rounded-2xl p-6 ${GLASS}`}>
            <div className="space-y-2">
              <Skeleton className={`h-5 w-28 ${BAR}`} />
              <Skeleton className={`h-4 w-full max-w-prose ${BAR}`} />
            </div>
            <Skeleton className="h-28 w-full rounded-xl bg-black/20" />
            <div className="flex flex-wrap justify-between gap-3 pt-1">
              <Skeleton className={`h-11 w-28 ${BAR}`} />
              <Skeleton className={`h-11 w-36 ${BAR}`} />
            </div>
          </div>

          {/* Today */}
          <section>
            <div className="flex items-end justify-between gap-6 border-b border-white/10 pb-4">
              <div className="space-y-2">
                <Skeleton className={`h-4 w-14 ${BAR}`} />
                <Skeleton className={`h-9 w-40 ${BAR}`} />
              </div>
              <Skeleton className={`h-4 w-16 ${BAR}`} />
            </div>
            <div className="space-y-3 py-5">
              <Skeleton className="h-12 w-full rounded-xl bg-white/[0.04]" />
              <Skeleton className="h-12 w-full rounded-xl bg-white/[0.04]" />
              <Skeleton className="h-12 w-full rounded-xl bg-white/[0.04]" />
            </div>
          </section>
        </div>
      </section>
    </PageShell>
  )
}
