import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_ITEMS = ['Dashboard', 'Statistics', 'Settings'] as const

export function FloatingNavbar() {
  return (
    <nav className="fixed inset-x-0 top-8 z-50 flex justify-center px-4">
      <div
        className={cn(
          'relative flex items-center gap-3 rounded-2xl px-4 py-2.5',
          'border border-white/20 bg-background/50 backdrop-blur-2xl backdrop-saturate-150',
          'shadow-xl shadow-black/10 ring-1 ring-white/10 ring-inset',
          // Glossy top-edge highlight/sheen that fades toward the bottom.
          'before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl',
          'before:bg-gradient-to-b before:from-white/25 before:to-transparent',
          'before:[mask-image:linear-gradient(to_bottom,black,transparent_60%)]',
        )}
      >
        <div className="relative flex items-center gap-2">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item}
              variant="ghost"
              size="default"
              className="rounded-xl px-4"
            >
              {item}
            </Button>
          ))}

          <div className="mx-2 h-6 w-px bg-border/60" />

          <div className="flex items-center pl-1">
            <Show when="signed-in">
              <UserButton />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="redirect">
                <Button
                  variant="ghost"
                  size="default"
                  className="rounded-xl px-4"
                >
                  Sign in
                </Button>
              </SignInButton>
            </Show>
          </div>
        </div>
      </div>
    </nav>
  )
}
