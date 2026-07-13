import { useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from 'motion/react'
import { Link } from '@tanstack/react-router'
import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { useQuery } from 'convex/react'
import { Coins } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { api } from '../../../convex/_generated/api'

type NavItem = {
  label: string
  to?: '/dashboard' | '/statistics' | '/chat' | '/settings'
}

const NAV_ITEMS: Array<NavItem> = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Statistics', to: '/statistics' },
  { label: 'Coach', to: '/chat' },
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
                  activeOptions={{ exact: true }}
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
            <UserButtonWithTokens />
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

/**
 * User avatar button whose dropdown surfaces the account's remaining AI token
 * budget. The count comes from the same `tokenUsage.current` query used
 * elsewhere in the app, so it stays in sync with actual usage.
 */
function UserButtonWithTokens() {
  const usage = useQuery(api.tokenUsage.current)

  const tokensLabel =
    usage == null
      ? 'Tokens left: …'
      : `Tokens left: ${usage.remainingTokens.toLocaleString()}`

  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Action
          label={tokensLabel}
          labelIcon={<Coins className="size-4" />}
          onClick={() => {}}
        />
      </UserButton.MenuItems>
    </UserButton>
  )
}
