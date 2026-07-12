import { createFileRoute, redirect } from '@tanstack/react-router'

import { FloatingNavbar } from '@/components/dashboard/floating-navbar'
import { SettingsForm } from '@/components/settings/settings-form'

export const Route = createFileRoute('/settings/')({
  beforeLoad: ({ context }) => {
    if (!context.userId) {
      throw redirect({ to: '/sign-in/$', params: { _splat: '' } })
    }
  },
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <main className="dark relative min-h-svh overflow-hidden bg-[oklch(0.19_0_0)] text-white">
      {/* Lava-lamp blobs — same treatment as the dashboard and sign-up page. */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="animate-lava absolute top-1/4 -left-24 size-[30rem] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, oklch(0.62 0 0 / 0.5), oklch(0.35 0 0 / 0.16) 55%, transparent 72%)',
          }}
        />
        <div
          className="animate-lava-2 absolute -right-20 bottom-4 size-[24rem] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle at 60% 40%, oklch(0.5 0 0 / 0.42), oklch(0.3 0 0 / 0.12) 55%, transparent 72%)',
          }}
        />
      </div>
      {/* Masked grid overlay. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(to right, oklch(1 0 0 / 0.02) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.02) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage:
            'radial-gradient(130% 100% at 50% 0%, #000 55%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(130% 100% at 50% 0%, #000 55%, transparent 100%)',
        }}
      />
      <FloatingNavbar />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pt-28 pb-20 sm:pt-32">
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
    </main>
  )
}
