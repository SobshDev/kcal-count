import { Settings, Target } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'

const GLASS =
  'border-white/10 bg-white/[0.04] shadow-[0_24px_70px_-24px_rgba(0,0,0,0.7)] backdrop-blur-md'

/**
 * Shown when the user has not set any daily objectives yet. It renders a
 * dimmed, blurred silhouette of the real dashboard so the value is obvious,
 * then floats a shadcn Empty block over the center pointing to Settings.
 */
export function EmptyStatisticsState() {
  return (
    <div className="relative">
      {/* Preview of what the dashboard becomes once objectives exist. Purely
          decorative — hidden from assistive tech and non-interactive. Masked
          so it fades out toward the bottom instead of hard-cutting. */}
      <div
        aria-hidden="true"
        className="pointer-events-none max-h-[62vh] overflow-hidden opacity-45 blur-[3px] select-none"
        style={{
          maskImage: 'linear-gradient(to bottom, #000 45%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, #000 45%, transparent 100%)',
        }}
      >
        <SkeletonPreview />
      </div>

      {/* Centered call to action. */}
      <div className="absolute inset-0 flex items-start justify-center px-4 pt-24 sm:items-center sm:pt-0">
        <Empty
          className={cn(
            GLASS,
            'max-w-md rounded-3xl border-solid p-10 text-white',
          )}
        >
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="size-12 rounded-2xl bg-white/10 text-white"
            >
              <Target className="size-6" />
            </EmptyMedia>
            <EmptyTitle className="text-lg text-white">
              Set your daily objectives
            </EmptyTitle>
            <EmptyDescription className="text-white/60">
              Add your profile in settings to unlock personalized statistics —
              calorie and nutrient targets, goal tracking, streaks, and weight
              trends.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild size="lg" className="rounded-2xl">
              <a href="/settings">
                <Settings aria-hidden="true" /> Go to settings
              </a>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </div>
  )
}

/**
 * Low-fidelity silhouette that mirrors the real dashboard's section layout so
 * the empty state previews the shape of what's coming.
 */
function SkeletonPreview() {
  return (
    <div className="animate-pulse space-y-10">
      {/* Today */}
      <SkeletonSection>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonCard key={index} className="gap-3">
              <Bar className="w-16" />
              <Bar className="h-6 w-24" />
              <Bar className="w-20" />
            </SkeletonCard>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <SkeletonCard className="items-center justify-center">
            <div className="my-2 size-40 rounded-full border-[14px] border-white/10" />
          </SkeletonCard>
          <SkeletonCard className="gap-4 lg:col-span-2">
            <Bar className="w-28" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <Bar className="w-24" />
                  <Bar className="h-2.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>
      </SkeletonSection>

      {/* This week */}
      <SkeletonSection>
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard className="gap-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Bar className="w-20" />
                <Sparkline className="flex-1" />
                <Bar className="w-12" />
              </div>
            ))}
          </SkeletonCard>
          <SkeletonCard className="gap-4">
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="size-4 rounded bg-white/10" />
                  <Bar className="h-6 w-12" />
                  <Bar className="w-16" />
                </div>
              ))}
            </div>
            <FauxBars />
          </SkeletonCard>
        </div>
      </SkeletonSection>

      {/* Foods & meals */}
      <SkeletonSection>
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard>
            <FauxBars vertical />
          </SkeletonCard>
          <SkeletonCard>
            <FauxBars />
          </SkeletonCard>
        </div>
      </SkeletonSection>
    </div>
  )
}

function SkeletonSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <Bar className="w-24" />
      {children}
    </section>
  )
}

function SkeletonCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

function Bar({ className }: { className?: string }) {
  return <div className={cn('h-3 rounded bg-white/10', className)} />
}

function Sparkline({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6', className)}
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 18 L20 12 L40 15 L60 6 L80 10 L100 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-white/15"
      />
    </svg>
  )
}

function FauxBars({ vertical = false }: { vertical?: boolean }) {
  const heights = [40, 70, 55, 90, 65, 80]
  if (vertical) {
    return (
      <div className="flex flex-col gap-3">
        {heights.map((height, index) => (
          <div key={index} className="flex items-center gap-3">
            <Bar className="w-20 shrink-0" />
            <div
              className="h-3 rounded bg-white/10"
              style={{ width: `${height}%` }}
            />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="flex h-40 items-end gap-3">
      {heights.map((height, index) => (
        <div
          key={index}
          className="flex-1 rounded-t bg-white/10"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  )
}
