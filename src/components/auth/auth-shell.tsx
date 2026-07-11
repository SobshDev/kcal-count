import { Link } from '@tanstack/react-router'
import { ArrowLeft, Check } from 'lucide-react'

type AuthShellProps = {
  children: React.ReactNode
  eyebrow: string
  title: string
  description: string
}

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
}: AuthShellProps) {
  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(30rem,0.78fr)]">
      <section className="relative hidden overflow-hidden border-r bg-[oklch(0.975_0.006_110)] px-14 py-12 lg:flex lg:flex-col">
        <Link
          to="/"
          aria-label="Back to home"
          className="inline-flex size-9 w-fit items-center justify-center rounded-full border border-transparent text-foreground/70 transition-colors hover:border-border hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
        <div className="my-auto max-w-xl pb-12">
          <p className="mb-7 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Nutrition, in focus
          </p>
          <h2 className="max-w-lg text-[3.5rem] leading-[1.02] font-semibold tracking-[-0.045em] text-balance">
            A clearer view of your everyday choices.
          </h2>
          <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">
            Track what matters, understand your day, and move forward without
            the noise.
          </p>
          <div
            className="mt-14 w-full max-w-xs rounded-2xl border bg-background p-6 shadow-sm"
            aria-hidden="true"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Today
              </p>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                Goal 2,360
              </span>
            </div>
            <div className="mt-5 flex items-center gap-5">
              <div className="relative flex shrink-0 items-center justify-center">
                <svg viewBox="0 0 120 120" className="size-24 -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    strokeWidth="9"
                    className="stroke-foreground/10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray="326.7"
                    strokeDashoffset="104.5"
                    className="stroke-foreground"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-lg font-semibold tracking-tight tabular-nums">
                    1,840
                  </span>
                  <span className="text-[0.625rem] text-muted-foreground">
                    kcal
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-3 text-sm">
                {[
                  { label: 'Protein', value: '96 g' },
                  { label: 'Carbs', value: '180 g' },
                  { label: 'Fat', value: '58 g' },
                ].map((macro) => (
                  <div
                    key={macro.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-muted-foreground">{macro.label}</span>
                    <span className="font-medium tabular-nums">
                      {macro.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background">
            <Check className="size-3" aria-hidden="true" />
          </span>
          Private by design. Your data stays yours.
        </div>
      </section>
      <section className="flex min-h-svh items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-[25rem]">
          <Link
            to="/"
            className="mb-14 inline-flex items-center gap-2 text-sm font-semibold lg:hidden"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-xs text-background">
              K
            </span>
            Kcal Count
          </Link>
          <div className="mb-9">
            <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {eyebrow}
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] text-balance">
              {title}
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          {children}
        </div>
      </section>
    </main>
  )
}
