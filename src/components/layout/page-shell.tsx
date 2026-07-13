import { FloatingNavbar } from '@/components/dashboard/floating-navbar'
import { cn } from '@/lib/utils'

/**
 * Shared width for every page's content column. Centralized here so all pages
 * (and their loading skeletons) line up identically and make better use of the
 * desktop viewport. Combine with per-page vertical padding via `cn()`.
 */
export const PAGE_CONTAINER = 'relative z-10 mx-auto w-full max-w-6xl px-6'

/**
 * Decorative dark backdrop shared by every page: the two lava-lamp blobs plus
 * the masked grid overlay. Purely presentational, so it is hidden from
 * assistive tech.
 */
export function PageBackground() {
  return (
    <>
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
    </>
  )
}

/**
 * Full-height page frame: dark surface, decorative backdrop, and the floating
 * navbar. Pages and their loading skeletons render their content as children so
 * the chrome stays pixel-identical between the two — the skeleton reads as the
 * same page mid-load rather than a separate screen.
 *
 * `className` sets the sizing/layout of the `<main>` (e.g. `min-h-svh` for
 * scrolling pages, `flex h-svh flex-col` for the chat's fixed viewport).
 */
export function PageShell({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <main
      className={cn(
        'dark relative overflow-hidden bg-[oklch(0.19_0_0)] text-white',
        className,
      )}
    >
      <PageBackground />
      <FloatingNavbar />
      {children}
    </main>
  )
}
