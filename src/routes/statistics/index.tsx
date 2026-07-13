import { createFileRoute, redirect } from '@tanstack/react-router'

import { PAGE_CONTAINER, PageShell } from '@/components/layout/page-shell'
import { StatisticsDashboard } from '@/components/statistics/statistics-dashboard'
import { StatisticsPageSkeleton } from '@/components/skeletons/statistics-skeleton'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/statistics/')({
  beforeLoad: ({ context }) => {
    if (!context.userId) {
      throw redirect({ to: '/sign-in/$', params: { _splat: '' } })
    }
  },
  component: StatisticsPage,
  pendingComponent: StatisticsPageSkeleton,
})

function StatisticsPage() {
  return (
    <PageShell className="min-h-svh">
      <div className={cn(PAGE_CONTAINER, 'pt-32 pb-20')}>
        <div className="mb-9">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
            Insights
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-balance">
            Statistics
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
            Your day at a glance, weekly trends, logging habits, and how intake
            lines up with your weight.
          </p>
        </div>
        <StatisticsDashboard />
      </div>
    </PageShell>
  )
}
