import { PAGE_CONTAINER, PageShell } from '@/components/layout/page-shell'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const BAR = 'bg-white/[0.06]'

/**
 * Loading placeholder for the settings page. Mirrors the "Your profile"
 * heading and the three stacked form cards (About you, Activity, Goal).
 */
export function SettingsPageSkeleton() {
  return (
    <PageShell className="min-h-svh">
      <div
        className={cn(PAGE_CONTAINER, 'pt-28 pb-20 sm:pt-32')}
        role="status"
        aria-label="Loading settings"
      >
        <span className="sr-only">Loading settings…</span>

        <div className="mb-9 space-y-3">
          <Skeleton className={`h-3 w-20 ${BAR}`} />
          <Skeleton className={`h-9 w-40 ${BAR}`} />
          <Skeleton className={`h-4 w-full max-w-md ${BAR}`} />
        </div>

        <div className="space-y-6">
          <FormCard rows={2} />
          <FormCard rows={2} />
          <FormCard rows={1} />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Skeleton className={`h-10 w-full sm:w-40 ${BAR}`} />
            <Skeleton className={`h-10 w-full sm:w-44 ${BAR}`} />
          </div>
        </div>
      </div>
    </PageShell>
  )
}

function FormCard({ rows }: { rows: number }) {
  return (
    <div className="space-y-5 rounded-2xl border bg-card p-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}
