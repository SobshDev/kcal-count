import { PAGE_CONTAINER, PageShell } from '@/components/layout/page-shell'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const GLASS =
  'border border-white/10 bg-white/[0.04] shadow-[0_24px_70px_-24px_rgba(0,0,0,0.7)] backdrop-blur-md'
const BAR = 'bg-white/[0.06]'

/**
 * Loading placeholder for the statistics page. Mirrors the "Insights" heading
 * and the KPI + chart card grids of the real dashboard.
 */
export function StatisticsPageSkeleton() {
  return (
    <PageShell className="min-h-svh">
      <div
        className={cn(PAGE_CONTAINER, 'pt-32 pb-20')}
        role="status"
        aria-label="Loading statistics"
      >
        <span className="sr-only">Loading statistics…</span>

        <div className="mb-9 space-y-3">
          <Skeleton className={`h-3 w-16 ${BAR}`} />
          <Skeleton className={`h-9 w-44 ${BAR}`} />
          <Skeleton className={`h-4 w-full max-w-md ${BAR}`} />
        </div>

        {/* Today */}
        <StatSection>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Card key={index} className="h-32" />
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="h-64" />
            <Card className="h-64 lg:col-span-2" />
          </div>
        </StatSection>

        {/* This week */}
        <StatSection>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="h-72" />
            <Card className="h-72" />
          </div>
        </StatSection>
      </div>
    </PageShell>
  )
}

function StatSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <Skeleton className={`mb-4 h-3 w-20 ${BAR}`} />
      {children}
    </section>
  )
}

function Card({ className }: { className?: string }) {
  return <Skeleton className={cn('rounded-2xl', GLASS, className)} />
}
