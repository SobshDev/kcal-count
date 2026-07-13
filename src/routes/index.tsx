import { createFileRoute } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-react-start'

import { PAGE_CONTAINER, PageShell } from '@/components/layout/page-shell'
import { AddFoodCard } from '@/components/dashboard/add-food-card'
import { DashboardPageSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: Home,
  pendingComponent: DashboardPageSkeleton,
})

export function Home() {
  const { user } = useUser()
  const name = user?.firstName ?? user?.username

  return (
    <PageShell className="min-h-svh">
      <section className={cn(PAGE_CONTAINER, 'pt-32 pb-20')}>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
            {name ? `Welcome, ${name}` : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Log a meal to keep today on track.
          </p>
        </div>
        <AddFoodCard />
      </section>
    </PageShell>
  )
}
