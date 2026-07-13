import { createFileRoute } from '@tanstack/react-router'

import { Home } from '../index'
import { DashboardPageSkeleton } from '@/components/skeletons/dashboard-skeleton'

export const Route = createFileRoute('/dashboard/')({
  component: Home,
  pendingComponent: DashboardPageSkeleton,
})
