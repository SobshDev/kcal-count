import { createFileRoute } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-react-start'

import { FloatingNavbar } from '@/components/dashboard/floating-navbar'
import { AddFoodCard } from '@/components/dashboard/add-food-card'

export const Route = createFileRoute('/')({ component: Home })

export function Home() {
  const { user } = useUser()
  const name = user?.firstName ?? user?.username

  return (
    <main className="dark relative min-h-svh overflow-hidden bg-[oklch(0.19_0_0)] text-white">
      {/* Lava-lamp blobs — same treatment as the sign-up page. */}
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
      <section className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-32 pb-20">
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
    </main>
  )
}
