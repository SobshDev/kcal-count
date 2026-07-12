import { useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from 'motion/react'
import { Link } from '@tanstack/react-router'
import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'

import { Button } from '@/components/ui/button'

type NavItem = { label: string; to?: '/' | '/statistics' | '/settings' }

const NAV_ITEMS: Array<NavItem> = [
  { label: 'Dashboard', to: '/' },
  { label: 'Statistics', to: '/statistics' },
  { label: 'Settings', to: '/settings' },
]

/**
 * Adapted from Aceternity UI's Floating Navbar: it hides when scrolling down
 * and reveals when scrolling up. Unlike the original (which hides at the very
 * top of the page), this stays visible near the top so it always shows on the
 * short landing page. Widened and restyled to match the sign-up page.
 */
export function FloatingNavbar() {
  const { scrollY } = useScroll()
  const [visible, setVisible] = useState(true)

  useMotionValueEvent(scrollY, 'change', (current) => {
    const previous = scrollY.getPrevious() ?? 0
    const direction = current - previous

    if (current <= 40) {
      setVisible(true)
    } else {
      setVisible(direction < 0)
    }
  })

  return (
    <AnimatePresence mode="wait">
      <motion.nav
        initial={{ opacity: 1, y: 0 }}
        animate={{ y: visible ? 0 : -120, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-x-0 top-6 z-50 mx-auto flex w-[min(94vw,80rem)] items-center justify-between gap-6 rounded-2xl border border-white/10 bg-[oklch(0.19_0_0)] px-6 py-3 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) =>
            item.to ? (
              <Button
                key={item.label}
                asChild
                variant="ghost"
                size="default"
                className="rounded-xl px-4 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.to === '/' }}
                  activeProps={{ className: 'bg-white/10 text-white' }}
                >
                  {item.label}
                </Link>
              </Button>
            ) : (
              <Button
                key={item.label}
                variant="ghost"
                size="default"
                className="rounded-xl px-4 text-white/70 hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Button>
            ),
          )}
        </div>

        <div className="flex items-center">
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="redirect">
              <Button
                variant="ghost"
                size="default"
                className="rounded-xl px-4 text-white/70 hover:bg-white/10 hover:text-white"
              >
                Sign in
              </Button>
            </SignInButton>
          </Show>
        </div>
      </motion.nav>
    </AnimatePresence>
  )
}
