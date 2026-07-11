import { createFileRoute } from '@tanstack/react-router'

import { SettingsForm } from '@/components/settings/settings-form'

export const Route = createFileRoute('/settings/')({ component: SettingsPage })

function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
      <div className="mb-9">
        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Your profile
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-balance">
          Settings
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Tell us a little about yourself so we can shape your daily targets
          around your body, routine, and goal.
        </p>
      </div>
      <SettingsForm />
    </main>
  )
}
