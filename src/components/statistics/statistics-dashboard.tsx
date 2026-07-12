import {
  CalendarCheck,
  Flame,
  Settings,
  TrendingDown,
  TrendingUp,
  Trophy,
  Utensils,
} from 'lucide-react'
import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from 'recharts'

import { api } from '../../../convex/_generated/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
import { useMounted } from '@/lib/use-mounted'
import { cn } from '@/lib/utils'
import { RangeBar } from './charts'

const GLASS =
  'border-white/10 bg-white/[0.04] shadow-[0_24px_70px_-24px_rgba(0,0,0,0.7)] backdrop-blur-md'
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const METRIC_LABELS: Record<string, string> = {
  calories: 'Calories',
  proteinGrams: 'Protein',
  fiberGrams: 'Fiber',
  fruitVegetableGrams: 'Fruit & veg',
  addedSugarGrams: 'Added sugar',
  saturatedFatGrams: 'Sat. fat',
  sodiumMg: 'Sodium',
  totalWaterMl: 'Water',
}
const CATEGORY_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
  other: 'Other',
}
const baseConfig = {
  value: { label: 'Value', color: 'var(--chart-1)' },
  calories: { label: 'Calories', color: 'var(--chart-1)' },
  count: { label: 'Times logged', color: 'var(--chart-1)' },
  weight: { label: 'Weight (kg)', color: 'var(--chart-2)' },
  intake: { label: 'Intake (kcal)', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function StatisticsDashboard() {
  const todayDateKey = useMemo(getLocalDateKey, [])
  const data = useQuery(api.statistics.dashboard, { todayDateKey })
  const mounted = useMounted()

  if (data === undefined) return <DashboardSkeleton />
  if (data === null) {
    return <EmptyCard title="Sign in to see your statistics" />
  }

  const calorieTarget = getTarget(data.targets, 'calories')
  const proteinTarget = getTarget(data.targets, 'protein')
  const fiberTarget = getTarget(data.targets, 'fiber')
  const fruitTarget = getTarget(data.targets, 'fruit_and_vegetables')
  const sugarTarget = getTarget(data.targets, 'added_sugar')
  const fatTarget = getTarget(data.targets, 'saturated_fat')
  const sodiumTarget = getTarget(data.targets, 'sodium')
  const waterTarget = getTarget(data.targets, 'total_water')
  const calorieGoal = targetValue(calorieTarget)
  const caloriesRemaining =
    calorieGoal === null ? null : calorieGoal - data.today.calories
  const caloriePercent = calorieGoal
    ? (data.today.calories / calorieGoal) * 100
    : 0
  const weeklySeries = data.weeklyTrend.map((week, index) => ({
    week: `W${index + 1}`,
    intake: week.averageCalories,
    weight: week.weightKg,
  }))
  const recordedWeights = data.weeklyTrend.filter(
    (week) => week.weightKg !== null,
  )
  const weightChange =
    recordedWeights.length > 1
      ? recordedWeights.at(-1)!.weightKg! - recordedWeights[0].weightKg!
      : null

  return (
    <div>
      {!data.targets.length ? (
        <Card className={cn(GLASS, 'mb-6')}>
          <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium">Add your daily objectives</p>
              <p className="mt-1 text-sm text-white/55">
                Set your profile to compare nutrition with personalized goals.
              </p>
            </div>
            <Button asChild variant="outline">
              <a href="/settings">
                <Settings aria-hidden="true" /> Settings
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Section title="Today">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Calories"
            value={formatNumber(data.today.calories)}
            badge={
              caloriesRemaining === null
                ? 'No target'
                : caloriesRemaining >= 0
                  ? `${formatNumber(caloriesRemaining)} left`
                  : `${formatNumber(Math.abs(caloriesRemaining))} over`
            }
            footnote={
              calorieGoal
                ? `${Math.round(caloriePercent)}% of ${formatNumber(calorieGoal)} kcal`
                : 'Consumed today'
            }
          />
          <KpiCard
            label="Protein"
            value={`${formatNumber(data.today.proteinGrams)} g`}
            badge={goalCaption(data.today.proteinGrams, proteinTarget)}
            footnote={formatTarget(proteinTarget)}
          />
          <KpiCard
            label="Fiber"
            value={
              data.today.complete
                ? `${formatNumber(data.today.fiberGrams)} g`
                : '—'
            }
            badge={
              data.today.complete
                ? goalCaption(data.today.fiberGrams, fiberTarget)
                : 'Incomplete'
            }
            footnote={
              data.today.complete
                ? formatTarget(fiberTarget)
                : 'Available for newly analyzed meals'
            }
          />
          <KpiCard
            label="Water"
            value={
              data.today.complete
                ? `${(data.today.totalWaterMl / 1000).toFixed(1)} L`
                : '—'
            }
            badge={
              data.today.complete
                ? goalCaption(data.today.totalWaterMl, waterTarget)
                : 'Incomplete'
            }
            footnote={formatTarget(waterTarget, true)}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className={GLASS}>
            <CardHeader>
              <CardTitle>Calories</CardTitle>
              <CardDescription className="text-white/60">
                Consumed vs daily target
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartFrame
                mounted={mounted}
                className="mx-auto aspect-square max-h-[220px]"
              >
                <ChartContainer
                  config={baseConfig}
                  className="aspect-auto size-full"
                >
                  <RadialBarChart
                    data={[
                      {
                        value: data.today.calories,
                        fill: 'var(--color-calories)',
                      },
                    ]}
                    startAngle={90}
                    endAngle={-270}
                    innerRadius={80}
                    outerRadius={112}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[
                        0,
                        Math.max(calorieGoal ?? data.today.calories, 1),
                      ]}
                      tick={false}
                    />
                    <RadialBar dataKey="value" background cornerRadius={12} />
                    <PolarRadiusAxis tick={false} axisLine={false}>
                      <Label
                        content={({ viewBox }) =>
                          viewBox && 'cx' in viewBox && 'cy' in viewBox ? (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-white text-3xl font-semibold"
                              >
                                {caloriesRemaining === null
                                  ? formatNumber(data.today.calories)
                                  : formatNumber(
                                      Math.max(0, caloriesRemaining),
                                    )}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy + 24}
                                className="fill-white/50 text-xs"
                              >
                                {caloriesRemaining === null
                                  ? 'kcal logged'
                                  : 'kcal left'}
                              </tspan>
                            </text>
                          ) : null
                        }
                      />
                    </PolarRadiusAxis>
                  </RadialBarChart>
                </ChartContainer>
              </ChartFrame>
            </CardContent>
          </Card>

          <Card className={cn(GLASS, 'lg:col-span-2')}>
            <CardHeader>
              <CardTitle>Nutrients</CardTitle>
              <CardDescription className="text-white/60">
                Progress against today&apos;s goals and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <NutrientTile
                name="Protein"
                value={`${formatNumber(data.today.proteinGrams)} g`}
                target={proteinTarget}
              >
                <RangeBar
                  value={data.today.proteinGrams}
                  lo={goalMinimum(proteinTarget)}
                  hi={goalMaximum(proteinTarget)}
                  max={Math.max(goalMaximum(proteinTarget) * 1.15, 1)}
                />
              </NutrientTile>
              <NutrientTile
                name="Fiber"
                value={completeValue(
                  data.today.complete,
                  data.today.fiberGrams,
                  'g',
                )}
                target={fiberTarget}
              >
                <Progress
                  value={progressValue(
                    data.today.complete ? data.today.fiberGrams : null,
                    fiberTarget,
                  )}
                />
              </NutrientTile>
              <NutrientTile
                name="Fruit & vegetables"
                value={completeValue(
                  data.today.complete,
                  data.today.fruitVegetableGrams,
                  'g',
                )}
                target={fruitTarget}
              >
                <Progress
                  value={progressValue(
                    data.today.complete ? data.today.fruitVegetableGrams : null,
                    fruitTarget,
                  )}
                />
              </NutrientTile>
              <NutrientTile
                name="Added sugar"
                value={completeValue(
                  data.today.complete,
                  data.today.addedSugarGrams,
                  'g',
                )}
                target={sugarTarget}
              >
                <Progress
                  value={progressValue(
                    data.today.complete ? data.today.addedSugarGrams : null,
                    sugarTarget,
                  )}
                />
              </NutrientTile>
              <NutrientTile
                name="Saturated fat"
                value={completeValue(
                  data.today.complete,
                  data.today.saturatedFatGrams,
                  'g',
                )}
                target={fatTarget}
              >
                <Progress
                  value={progressValue(
                    data.today.complete ? data.today.saturatedFatGrams : null,
                    fatTarget,
                  )}
                />
              </NutrientTile>
              <NutrientTile
                name="Sodium"
                value={completeValue(
                  data.today.complete,
                  data.today.sodiumMg,
                  'mg',
                )}
                target={sodiumTarget}
              >
                <Progress
                  value={progressValue(
                    data.today.complete ? data.today.sodiumMg : null,
                    sodiumTarget,
                  )}
                />
              </NutrientTile>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="This week">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className={GLASS}>
            <CardHeader>
              <CardTitle>Seven-day averages</CardTitle>
              <CardDescription className="text-white/60">
                Average across days with usable logs
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-white/5">
              {data.weeklyAverages.map((metric) => (
                <div
                  key={metric.metric}
                  className="flex items-center gap-4 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="w-24 shrink-0 text-sm text-white/70">
                    {METRIC_LABELS[metric.metric]}
                  </span>
                  <ChartFrame mounted={mounted} className="h-8 flex-1">
                    <ChartContainer
                      config={baseConfig}
                      className="aspect-auto size-full"
                    >
                      <LineChart
                        data={metric.values.map((value, index) => ({
                          index,
                          value,
                        }))}
                        margin={{ top: 4, right: 2, bottom: 4, left: 2 }}
                      >
                        <Line
                          dataKey="value"
                          type="monotone"
                          stroke="var(--color-value)"
                          strokeWidth={1.5}
                          dot={false}
                          connectNulls={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ChartContainer>
                  </ChartFrame>
                  <span className="w-24 shrink-0 text-right text-sm font-medium tabular-nums">
                    {metric.average === null
                      ? '—'
                      : formatMetricAverage(metric.metric, metric.average)}
                    {metric.average === null ? null : (
                      <span className="ml-1 text-xs text-white/40">
                        {metric.metric === 'totalWaterMl' ? 'L' : metric.unit}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className={GLASS}>
              <CardHeader>
                <CardTitle>Goals met</CardTitle>
                <CardDescription className="text-white/60">
                  Evaluated tracked days only
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['In calorie range', 'calories'],
                  ['Protein goal', 'protein'],
                  ['Fiber goal', 'fiber'],
                ].map(([label, key]) => {
                  const states = data.goalDays.map(
                    (day) => day[key as 'calories' | 'protein' | 'fiber'],
                  )
                  const available = states.filter(
                    (state) => state !== 'unavailable',
                  ).length
                  return (
                    <Tile
                      key={key}
                      className="flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-white/80">
                          {label}
                        </p>
                        <p className="text-2xl font-semibold tabular-nums">
                          {states.filter((state) => state === 'met').length}
                          <span className="text-base font-normal text-white/40">
                            {' '}
                            / {available}
                          </span>
                        </p>
                      </div>
                      <GoalDots states={states} />
                    </Tile>
                  )
                })}
              </CardContent>
            </Card>
            <Card className={GLASS}>
              <CardHeader>
                <CardTitle>Logging consistency</CardTitle>
                <CardDescription className="text-white/60">
                  Days with at least one meal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <StatTile
                    icon={<Flame />}
                    value={data.logging.currentStreak}
                    label="Current streak"
                  />
                  <StatTile
                    icon={<Trophy />}
                    value={data.logging.longestStreak}
                    label="Longest streak"
                  />
                  <StatTile
                    icon={<CalendarCheck />}
                    value={`${data.logging.consistencyPercent}%`}
                    label="Consistency"
                  />
                </div>
                <Tile className="flex items-center justify-between">
                  <p className="text-sm text-white/60">This week</p>
                  <DayDots days={data.logging.days} />
                </Tile>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>

      <Section title="Foods & meals">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className={GLASS}>
            <CardHeader>
              <CardTitle>Most logged foods</CardTitle>
              <CardDescription className="text-white/60">
                Your go-to items over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.topFoods.length ? (
                <ChartFrame mounted={mounted} className="h-[220px] w-full">
                  <ChartContainer
                    config={baseConfig}
                    className="aspect-auto size-full"
                  >
                    <BarChart
                      data={data.topFoods.map((food) => ({
                        food: food.name,
                        count: food.count,
                      }))}
                      layout="vertical"
                      margin={{ right: 16 }}
                    >
                      <XAxis type="number" dataKey="count" hide />
                      <YAxis
                        type="category"
                        dataKey="food"
                        tickLine={false}
                        axisLine={false}
                        width={110}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Bar
                        dataKey="count"
                        fill="var(--color-count)"
                        radius={6}
                      />
                    </BarChart>
                  </ChartContainer>
                </ChartFrame>
              ) : (
                <InlineEmpty text="Log meals to see your most frequent foods." />
              )}
            </CardContent>
          </Card>
          <Card className={GLASS}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="size-4 text-white/50" />
                Calories by meal
              </CardTitle>
              <CardDescription className="text-white/60">
                Today&apos;s split, with logged-day averages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ChartFrame mounted={mounted} className="h-[200px] w-full">
                <ChartContainer
                  config={baseConfig}
                  className="aspect-auto size-full"
                >
                  <BarChart
                    data={data.categoryCalories.map((item) => ({
                      meal: CATEGORY_LABELS[item.category],
                      calories: item.today,
                    }))}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="meal"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar
                      dataKey="calories"
                      fill="var(--color-calories)"
                      radius={8}
                    />
                  </BarChart>
                </ChartContainer>
              </ChartFrame>
              <div className="grid grid-cols-5 gap-2 border-t border-white/5 pt-4">
                {data.categoryCalories.map((item) => (
                  <div key={item.category} className="text-center">
                    <p className="text-sm font-semibold tabular-nums">
                      {item.average === null ? '—' : formatNumber(item.average)}
                    </p>
                    <p className="text-[11px] text-white/45">
                      avg {CATEGORY_LABELS[item.category]}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Weight & balance">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className={GLASS}>
            <CardHeader>
              <CardTitle>Weight history</CardTitle>
              <CardDescription className="text-white/60">
                Latest settings measurement per week
              </CardDescription>
              {weightChange !== null ? (
                <CardAction>
                  <Chip>
                    {weightChange <= 0 ? <TrendingDown /> : <TrendingUp />}
                    {Math.abs(weightChange).toFixed(1)} kg
                  </Chip>
                </CardAction>
              ) : null}
            </CardHeader>
            <CardContent>
              <div className="mb-3 text-3xl font-semibold tabular-nums">
                {data.latestWeight
                  ? `${data.latestWeight.weightKg.toFixed(1)} kg`
                  : '—'}
              </div>
              {recordedWeights.length ? (
                <ChartFrame mounted={mounted} className="h-[200px] w-full">
                  <ChartContainer
                    config={baseConfig}
                    className="aspect-auto size-full"
                  >
                    <AreaChart data={weeklySeries}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="week" tickLine={false} axisLine={false} />
                      <YAxis domain={['dataMin - 0.4', 'dataMax + 0.4']} hide />
                      <ChartTooltip
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Area
                        dataKey="weight"
                        type="natural"
                        fill="var(--color-weight)"
                        fillOpacity={0.25}
                        stroke="var(--color-weight)"
                        strokeWidth={2}
                        connectNulls={false}
                      />
                    </AreaChart>
                  </ChartContainer>
                </ChartFrame>
              ) : (
                <InlineEmpty text="Saving your settings records a weight measurement." />
              )}
            </CardContent>
          </Card>
          <Card className={GLASS}>
            <CardHeader>
              <CardTitle>Intake vs weight trend</CardTitle>
              <CardDescription className="text-white/60">
                Weekly logged-day intake compared with weight
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartFrame mounted={mounted} className="h-[220px] w-full">
                <ChartContainer
                  config={baseConfig}
                  className="aspect-auto size-full"
                >
                  <LineChart data={weeklySeries}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="week" tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" hide />
                    <YAxis yAxisId="right" orientation="right" hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      yAxisId="left"
                      dataKey="intake"
                      stroke="var(--color-intake)"
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                    <Line
                      yAxisId="right"
                      dataKey="weight"
                      stroke="var(--color-weight)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      connectNulls={false}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </LineChart>
                </ChartContainer>
              </ChartFrame>
              <p className="mt-3 text-xs text-white/45">
                {trendSummary(data.weeklyTrend)}
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  )
}

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
function KpiCard({
  label,
  value,
  badge,
  footnote,
}: {
  label: string
  value: string
  badge: string
  footnote: string
}) {
  return (
    <Card className={cn(GLASS, '@container/card')}>
      <CardHeader>
        <CardDescription className="text-white/55">{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold text-white tabular-nums">
          {value}
        </CardTitle>
        <CardAction>
          <Chip>{badge}</Chip>
        </CardAction>
      </CardHeader>
      <CardFooter className="text-xs text-white/55">{footnote}</CardFooter>
    </Card>
  )
}
function NutrientTile({
  name,
  value,
  target,
  children,
}: {
  name: string
  value: string
  target: Target | null
  children: React.ReactNode
}) {
  return (
    <Tile>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-white/80">{name}</span>
        <span className="text-xs text-white/45">{formatTarget(target)}</span>
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
      <div className="mt-3">{children}</div>
    </Tile>
  )
}
function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
}) {
  return (
    <Tile>
      <span className="text-white/40 [&>svg]:size-4">{icon}</span>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-white/45">{label}</p>
    </Tile>
  )
}
function ChartFrame({
  mounted,
  className,
  children,
}: {
  mounted: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      {mounted ? (
        children
      ) : (
        <div className="size-full animate-pulse rounded-xl bg-white/[0.05]" />
      )}
    </div>
  )
}
function DayDots({ days }: { days: boolean[] }) {
  return (
    <div className="flex gap-1.5">
      {days.map((filled, index) => (
        <span
          key={index}
          title={DAY_LABELS[index]}
          className={cn(
            'size-2.5 rounded-full',
            filled ? 'bg-white/85' : 'bg-white/15',
          )}
        />
      ))}
    </div>
  )
}
function GoalDots({
  states,
}: {
  states: Array<'met' | 'missed' | 'unavailable'>
}) {
  return (
    <div className="flex gap-1.5">
      {states.map((state, index) => (
        <span
          key={index}
          title={`${DAY_LABELS[index]}: ${state}`}
          className={cn(
            'size-2.5 rounded-full border',
            state === 'met'
              ? 'border-white/85 bg-white/85'
              : state === 'missed'
                ? 'border-white/35 bg-transparent'
                : 'border-white/10 bg-white/10',
          )}
        />
      ))}
    </div>
  )
}
function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading statistics">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
        />
      ))}
    </div>
  )
}
function EmptyCard({ title }: { title: string }) {
  return (
    <Card className={GLASS}>
      <CardContent className="py-12 text-center text-white/65">
        {title}
      </CardContent>
    </Card>
  )
}
function InlineEmpty({ text }: { text: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-center text-sm text-white/45">
      {text}
    </div>
  )
}

type Target = {
  metric: string
  goal:
    | { kind: 'minimum'; minimum: number }
    | { kind: 'target'; target: number }
    | { kind: 'maximum'; maximum: number }
    | { kind: 'range'; minimum: number; maximum: number }
  unit: string
}
function getTarget(targets: Target[], metric: string) {
  return targets.find((target) => target.metric === metric) ?? null
}
function targetValue(target: Target | null) {
  if (!target) return null
  if (target.goal.kind === 'target') return target.goal.target
  if (target.goal.kind === 'minimum') return target.goal.minimum
  if (target.goal.kind === 'maximum') return target.goal.maximum
  return target.goal.maximum
}
function goalMinimum(target: Target | null) {
  if (!target) return 0
  if (target.goal.kind === 'range' || target.goal.kind === 'minimum')
    return target.goal.minimum
  return 0
}
function goalMaximum(target: Target | null) {
  const value = targetValue(target)
  return value ?? 1
}
function formatTarget(target: Target | null, liters = false) {
  if (!target) return 'No target'
  const unit = liters && target.unit === 'ml' ? 'L' : target.unit
  const convert = (value: number) =>
    liters && target.unit === 'ml' ? value / 1000 : value
  if (target.goal.kind === 'range')
    return `${formatNumber(convert(target.goal.minimum))}–${formatNumber(convert(target.goal.maximum))} ${unit}`
  const value = convert(targetValue(target) ?? 0)
  return `${target.goal.kind === 'minimum' ? 'At least ' : target.goal.kind === 'maximum' ? 'Up to ' : ''}${formatNumber(value)} ${unit}`
}
function goalCaption(value: number, target: Target | null) {
  if (!target) return 'No target'
  if (target.goal.kind === 'range')
    return value >= target.goal.minimum && value <= target.goal.maximum
      ? 'In range'
      : value < target.goal.minimum
        ? `${formatNumber(target.goal.minimum - value)} g to go`
        : 'Above range'
  const goal = targetValue(target)!
  if (target.goal.kind === 'maximum')
    return value <= goal
      ? `${formatNumber(goal - value)} left`
      : `${formatNumber(value - goal)} over`
  return value >= goal ? 'Goal met' : `${formatNumber(goal - value)} to go`
}
function progressValue(value: number | null, target: Target | null) {
  const goal = targetValue(target)
  return value === null || !goal ? 0 : Math.min(100, (value / goal) * 100)
}
function completeValue(complete: boolean, value: number, unit: string) {
  return complete ? `${formatNumber(value)} ${unit}` : '—'
}
function formatNumber(value: number) {
  return Math.round(value).toLocaleString()
}
function formatMetricAverage(metric: string, value: number) {
  return metric === 'totalWaterMl'
    ? (value / 1000).toFixed(1)
    : formatNumber(value)
}
function getLocalDateKey() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
function trendSummary(
  weeks: Array<{ averageCalories: number | null; weightKg: number | null }>,
) {
  const intake = weeks.filter((week) => week.averageCalories !== null)
  const weight = weeks.filter((week) => week.weightKg !== null)
  if (intake.length < 2 || weight.length < 2)
    return 'Keep logging meals and saving weight to build a meaningful comparison.'
  const intakeDelta =
    intake.at(-1)!.averageCalories! - intake[0].averageCalories!
  const weightDelta = weight.at(-1)!.weightKg! - weight[0].weightKg!
  return `Across recorded weeks, average intake changed ${intakeDelta >= 0 ? '+' : ''}${formatNumber(intakeDelta)} kcal and weight changed ${weightDelta >= 0 ? '+' : ''}${weightDelta.toFixed(1)} kg.`
}
