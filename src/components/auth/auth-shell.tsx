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
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kcal Count
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
          <div className="mt-14 flex items-end gap-3" aria-hidden="true">
            {[36, 58, 44, 76, 64, 88, 72].map((height, index) => (
              <div
                key={index}
                className="w-8 rounded-full bg-foreground/[0.08]"
                style={{ height }}
              >
                <div
                  className="w-full rounded-full bg-foreground/80"
                  style={{ height: `${Math.max(12, height - 24)}px` }}
                />
              </div>
            ))}
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
