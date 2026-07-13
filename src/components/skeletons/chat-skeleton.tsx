import { PAGE_CONTAINER, PageShell } from '@/components/layout/page-shell'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const BAR = 'bg-white/[0.06]'

/**
 * Loading placeholder for the coach chat. Mirrors the header, a short
 * conversation of alternating bubbles, and the message composer pinned to the
 * bottom of the fixed-height viewport.
 */
export function ChatPageSkeleton() {
  return (
    <PageShell className="flex h-svh flex-col">
      <div
        className={cn(
          PAGE_CONTAINER,
          'flex min-h-0 flex-1 flex-col pt-28 pb-6',
        )}
      >
        <div
          className="flex h-full min-h-0 w-full flex-col"
          role="status"
          aria-label="Loading coach"
        >
          <span className="sr-only">Loading coach…</span>

          {/* Header */}
          <header className="flex items-center justify-between gap-3 pb-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <Skeleton className="size-8 shrink-0 rounded-xl bg-white/10" />
              <div className="space-y-1.5">
                <Skeleton className={`h-4 w-32 ${BAR}`} />
                <Skeleton className={`h-3 w-40 ${BAR}`} />
              </div>
            </div>
            <Skeleton className={`h-9 w-28 ${BAR}`} />
          </header>

          {/* Conversation */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 py-2">
            <Bubble align="start" className="h-16 w-3/4" />
            <Bubble align="end" className="h-10 w-1/2" />
            <Bubble align="start" className="h-24 w-4/5" />
            <Bubble align="end" className="h-10 w-2/5" />
          </div>

          {/* Composer */}
          <div className="pt-3">
            <Skeleton className="h-24 w-full rounded-2xl border border-white/10 bg-white/[0.04]" />
            <Skeleton className={`mx-auto mt-2 h-3 w-72 ${BAR}`} />
          </div>
        </div>
      </div>
    </PageShell>
  )
}

function Bubble({
  align,
  className,
}: {
  align: 'start' | 'end'
  className?: string
}) {
  return (
    <Skeleton
      className={cn(
        'rounded-2xl bg-white/[0.05]',
        align === 'end' && 'self-end',
        className,
      )}
    />
  )
}
