import { createFileRoute, redirect } from '@tanstack/react-router'

import { PAGE_CONTAINER, PageShell } from '@/components/layout/page-shell'
import { SettingsForm } from '@/components/settings/settings-form'
import { SettingsPageSkeleton } from '@/components/skeletons/settings-skeleton'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/settings/')({
  beforeLoad: ({ context }) => {
    if (!context.userId) {
      throw redirect({ to: '/sign-in/$', params: { _splat: '' } })
    }
  },
  component: SettingsPage,
  pendingComponent: SettingsPageSkeleton,
})

function SettingsPage() {
  return (
    <PageShell className="min-h-svh">
      <div className={cn(PAGE_CONTAINER, 'pt-28 pb-20 sm:pt-32')}>
        <div className="mb-9">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
            Your profile
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-balance">
            Settings
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
            Tell us a little about yourself so we can shape your daily targets
            around your body, routine, and goal.
          </p>
        </div>
        <SettingsForm />
      </div>
    </PageShell>
  )
}
