import { CalendarCheck, Droplet, Flame, Trophy, Utensils } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  AreaTrend,
  BarChart,
  DualTrend,
  RangeBar,
  Ring,
  Sparkline,
} from './charts'

const GLASS =
  'border-white/10 bg-white/[0.04] shadow-[0_24px_70px_-24px_rgba(0,0,0,0.7)] backdrop-blur-md'

// ---------------------------------------------------------------------------
// Placeholder data — none of this is wired to the backend yet.
// ---------------------------------------------------------------------------

const TODAY = {
  calories: { consumed: 1840, target: 2360 },
  protein: { value: 96, lo: 90, hi: 160, axis: 180, unit: 'g' },
  fiber: { value: 21, min: 30, unit: 'g' },
  fruitVeg: { value: 3, target: 5, unit: 'servings' },
  addedSugar: { value: 28, max: 50, unit: 'g' },
  satFat: { value: 14, max: 22, unit: 'g' },
  sodium: { value: 1900, max: 2300, unit: 'mg' },
  water: { value: 1.6, target: 2.5, unit: 'L' },
}

const WEEKLY_AVERAGES = [
  {
    label: 'Calories',
    avg: '2,180',
    unit: 'kcal',
    data: [2100, 2320, 1980, 2260, 2020, 2410, 1980],
  },
  {
    label: 'Protein',
    avg: '104',
    unit: 'g',
    data: [92, 110, 98, 120, 96, 118, 100],
  },
  { label: 'Fiber', avg: '26', unit: 'g', data: [22, 28, 24, 30, 21, 29, 28] },
  {
    label: 'Fruit & veg',
    avg: '4.1',
    unit: 'servings',
    data: [3, 5, 4, 5, 3, 5, 4],
  },
  {
    label: 'Added sugar',
    avg: '34',
    unit: 'g',
    data: [40, 30, 36, 28, 44, 26, 34],
  },
  {
    label: 'Sat. fat',
    avg: '17',
    unit: 'g',
    data: [20, 16, 18, 14, 22, 15, 17],
  },
  {
    label: 'Sodium',
    avg: '2,050',
    unit: 'mg',
    data: [2200, 1950, 2100, 1800, 2400, 1900, 2050],
  },
  {
    label: 'Water',
    avg: '2.1',
    unit: 'L',
    data: [1.8, 2.4, 2.0, 2.6, 1.6, 2.5, 2.2],
  },
]

const GOALS = [
  { label: 'In calorie range', met: 5, days: [1, 1, 0, 1, 1, 1, 0] },
  { label: 'Protein goal', met: 4, days: [1, 0, 1, 1, 0, 1, 0] },
  { label: 'Fiber goal', met: 3, days: [1, 0, 0, 1, 0, 1, 0] },
]

const RECENT_DAYS = [1, 1, 0, 1, 1, 1, 1]

const TOP_FOODS = [
  { name: 'Greek yogurt', count: 14 },
  { name: 'Chicken breast', count: 11 },
  { name: 'Banana', count: 9 },
  { name: 'Overnight oats', count: 8 },
  { name: 'Almonds', count: 6 },
]

const MEAL_CALORIES = [
  { label: 'Breakfast', value: 420 },
  { label: 'Lunch', value: 640 },
  { label: 'Dinner', value: 580 },
  { label: 'Snacks', value: 200 },
]

const MEAL_AVERAGES = [
  { label: 'Breakfast', value: 510 },
  { label: 'Lunch', value: 680 },
  { label: 'Dinner', value: 720 },
  { label: 'Snacks', value: 240 },
]

const WEIGHT_HISTORY = [78.6, 78.4, 78.1, 78.0, 77.7, 77.6, 77.3, 77.1]
const INTAKE_TREND = [2320, 2280, 2250, 2210, 2200, 2180, 2170, 2150]

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="mb-4 text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Tile({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.03] p-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

function NutrientTile({
  name,
  value,
  caption,
  note,
  children,
}: {
  name: string
  value: string
  caption: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <Tile>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-white/80">{name}</span>
        <span className="text-xs text-white/45">{caption}</span>
      </div>
      <div className="mt-1 text-lg font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      <div className="mt-3">{children}</div>
      {note ? <p className="mt-2 text-xs text-white/45">{note}</p> : null}
    </Tile>
  )
}

function DayDots({ days }: { days: Array<number> }) {
  return (
    <div className="flex items-center gap-1.5">
      {days.map((filled, index) => (
        <div
          key={index}
          className="flex flex-col items-center gap-1"
          title={DAY_LABELS[index]}
        >
          <span
            className={cn(
              'size-2.5 rounded-full',
              filled ? 'bg-white/85' : 'bg-white/15',
            )}
          />
        </div>
      ))}
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className="gap-1 border-white/15 bg-white/[0.06] text-white/70"
    >
      {children}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function StatisticsDashboard() {
  const caloriesRemaining = TODAY.calories.target - TODAY.calories.consumed
  const fiberPct = (TODAY.fiber.value / TODAY.fiber.min) * 100
  const fruitVegPct = (TODAY.fruitVeg.value / TODAY.fruitVeg.target) * 100
  const waterPct = (TODAY.water.value / TODAY.water.target) * 100
  const sugarPct = (TODAY.addedSugar.value / TODAY.addedSugar.max) * 100
  const satFatPct = (TODAY.satFat.value / TODAY.satFat.max) * 100
  const sodiumPct = (TODAY.sodium.value / TODAY.sodium.max) * 100

  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      <Section title="Today">
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className={cn(GLASS, 'lg:col-span-1')}>
            <CardHeader>
              <CardTitle>Calories</CardTitle>
              <CardDescription className="text-white/60">
                Consumed vs daily target
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <Ring value={TODAY.calories.consumed} max={TODAY.calories.target}>
                <span className="text-2xl font-semibold tracking-tight tabular-nums">
                  {TODAY.calories.consumed.toLocaleString()}
                </span>
                <span className="text-xs text-white/50">
                  of {TODAY.calories.target.toLocaleString()}
                </span>
              </Ring>
              <div className="space-y-1">
                <p className="text-xs tracking-[0.14em] text-white/45 uppercase">
                  Remaining
                </p>
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {caloriesRemaining.toLocaleString()}
                </p>
                <p className="text-sm text-white/50">kcal left today</p>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(GLASS, 'lg:col-span-2')}>
            <CardHeader>
              <CardTitle>Nutrients</CardTitle>
              <CardDescription className="text-white/60">
                Progress against today&apos;s goals and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <NutrientTile
                name="Protein"
                value={`${TODAY.protein.value} ${TODAY.protein.unit}`}
                caption="in range"
                note={`Recommended ${TODAY.protein.lo}–${TODAY.protein.hi} ${TODAY.protein.unit}`}
              >
                <RangeBar
                  value={TODAY.protein.value}
                  lo={TODAY.protein.lo}
                  hi={TODAY.protein.hi}
                  max={TODAY.protein.axis}
                />
              </NutrientTile>

              <NutrientTile
                name="Fiber"
                value={`${TODAY.fiber.value} / ${TODAY.fiber.min} ${TODAY.fiber.unit}`}
                caption="minimum"
                note={`${TODAY.fiber.min - TODAY.fiber.value} ${TODAY.fiber.unit} to go`}
              >
                <Progress value={fiberPct} />
              </NutrientTile>

              <NutrientTile
                name="Fruit & veg"
                value={`${TODAY.fruitVeg.value} / ${TODAY.fruitVeg.target}`}
                caption="servings"
                note={`${TODAY.fruitVeg.target - TODAY.fruitVeg.value} more to hit your goal`}
              >
                <Progress value={fruitVegPct} />
              </NutrientTile>

              <NutrientTile
                name="Added sugar"
                value={`${TODAY.addedSugar.max - TODAY.addedSugar.value} ${TODAY.addedSugar.unit} left`}
                caption="max"
                note={`${TODAY.addedSugar.value} of ${TODAY.addedSugar.max} ${TODAY.addedSugar.unit}`}
              >
                <Progress value={sugarPct} />
              </NutrientTile>

              <NutrientTile
                name="Saturated fat"
                value={`${TODAY.satFat.max - TODAY.satFat.value} ${TODAY.satFat.unit} left`}
                caption="max"
                note={`${TODAY.satFat.value} of ${TODAY.satFat.max} ${TODAY.satFat.unit}`}
              >
                <Progress value={satFatPct} />
              </NutrientTile>

              <NutrientTile
                name="Sodium"
                value={`${(TODAY.sodium.max - TODAY.sodium.value).toLocaleString()} ${TODAY.sodium.unit} left`}
                caption="max"
                note={`${TODAY.sodium.value.toLocaleString()} of ${TODAY.sodium.max.toLocaleString()} ${TODAY.sodium.unit}`}
              >
                <Progress value={sodiumPct} />
              </NutrientTile>

              <NutrientTile
                name="Water"
                value={`${TODAY.water.value} / ${TODAY.water.target} ${TODAY.water.unit}`}
                caption="target"
                note={`${(TODAY.water.target - TODAY.water.value).toFixed(1)} ${TODAY.water.unit} to target`}
              >
                <Progress value={waterPct} />
              </NutrientTile>

              <Tile className="flex items-center gap-3 bg-white/[0.02]">
                <Droplet className="size-4 text-white/40" aria-hidden="true" />
                <p className="text-xs text-white/50">
                  Limits fill toward their maximum — keep these below the line.
                </p>
              </Tile>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      <Section title="This week">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className={GLASS}>
            <CardHeader>
              <CardTitle>Seven-day averages</CardTitle>
              <CardDescription className="text-white/60">
                Daily average per metric over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-white/5">
              {WEEKLY_AVERAGES.map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="w-28 shrink-0 text-sm text-white/70">
                    {metric.label}
                  </span>
                  <Sparkline
                    data={metric.data}
                    className="h-7 flex-1 text-white/50"
                  />
                  <span className="w-24 shrink-0 text-right text-sm font-medium tabular-nums">
                    {metric.avg}
                    <span className="ml-1 text-xs text-white/40">
                      {metric.unit}
                    </span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card className={GLASS}>
              <CardHeader>
                <CardTitle>Goals met</CardTitle>
                <CardDescription className="text-white/60">
                  Days you hit each goal this week
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {GOALS.map((goal) => (
                  <Tile
                    key={goal.label}
                    className="flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-white/80">
                        {goal.label}
                      </p>
                      <p className="text-2xl font-semibold tracking-tight tabular-nums">
                        {goal.met}
                        <span className="text-base font-normal text-white/40">
                          {' '}
                          / 7 days
                        </span>
                      </p>
                    </div>
                    <DayDots days={goal.days} />
                  </Tile>
                ))}
              </CardContent>
            </Card>

            <Card className={GLASS}>
              <CardHeader>
                <CardTitle>Logging consistency</CardTitle>
                <CardDescription className="text-white/60">
                  How completely you&apos;ve been tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Tile>
                    <Flame
                      className="size-4 text-white/40"
                      aria-hidden="true"
                    />
                    <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                      6
                    </p>
                    <p className="text-xs text-white/45">Current streak</p>
                  </Tile>
                  <Tile>
                    <Trophy
                      className="size-4 text-white/40"
                      aria-hidden="true"
                    />
                    <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                      21
                    </p>
                    <p className="text-xs text-white/45">Longest streak</p>
                  </Tile>
                  <Tile>
                    <CalendarCheck
                      className="size-4 text-white/40"
                      aria-hidden="true"
                    />
                    <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                      86%
                    </p>
                    <p className="text-xs text-white/45">Consistency</p>
                  </Tile>
                </div>
                <Tile className="flex items-center justify-between gap-4">
                  <p className="text-sm text-white/60">This week</p>
                  <DayDots days={RECENT_DAYS} />
                </Tile>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      <Section title="Foods & meals">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className={GLASS}>
            <CardHeader>
              <CardTitle>Most logged foods</CardTitle>
              <CardDescription className="text-white/60">
                Your go-to items over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {TOP_FOODS.map((food, index) => (
                <div key={food.name} className="flex items-center gap-3">
                  <span className="w-5 text-sm text-white/40 tabular-nums">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-white/80">{food.name}</span>
                      <span className="text-xs text-white/45 tabular-nums">
                        {food.count}×
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-white/70"
                        style={{
                          width: `${(food.count / TOP_FOODS[0].count) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={GLASS}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="size-4 text-white/50" aria-hidden="true" />
                Calories by meal
              </CardTitle>
              <CardDescription className="text-white/60">
                Today&apos;s split, with 7-day averages below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BarChart
                data={MEAL_CALORIES.map((meal) => ({
                  label: meal.label,
                  value: meal.value,
                  caption: meal.value.toLocaleString(),
                }))}
              />
              <div className="grid grid-cols-4 gap-2 border-t border-white/5 pt-4">
                {MEAL_AVERAGES.map((meal) => (
                  <div key={meal.label} className="text-center">
                    <p className="text-sm font-semibold tabular-nums">
                      {meal.value}
                    </p>
                    <p className="text-xs text-white/45">avg {meal.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      <Section title="Weight & balance">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className={GLASS}>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Weight history</CardTitle>
                <CardDescription className="text-white/60">
                  Last 8 weeks
                </CardDescription>
              </div>
              <Chip>↓ 0.2 kg / week</Chip>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">
                  77.1
                </span>
                <span className="text-sm text-white/50">kg today</span>
              </div>
              <AreaTrend data={WEIGHT_HISTORY} />
            </CardContent>
          </Card>

          <Card className={GLASS}>
            <CardHeader>
              <CardTitle>Intake vs weight trend</CardTitle>
              <CardDescription className="text-white/60">
                Weekly average intake compared with weight
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
                <span className="flex items-center gap-2 text-white/70">
                  <span className="h-0.5 w-4 rounded-full bg-white/90" />
                  Intake
                </span>
                <span className="flex items-center gap-2 text-white/70">
                  <span className="h-0 w-4 border-t-2 border-dashed border-white/40" />
                  Weight
                </span>
              </div>
              <DualTrend primary={INTAKE_TREND} secondary={WEIGHT_HISTORY} />
              <p className="mt-3 text-xs text-white/45">
                Intake is trending down and weight is following — you&apos;re in
                a steady, gentle deficit.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  )
}
