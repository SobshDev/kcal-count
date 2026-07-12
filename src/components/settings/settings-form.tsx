import { useEffect, useState } from 'react'
import {
  Activity,
  CalendarDays,
  Check,
  Dumbbell,
  Target,
  User,
} from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Physiology = 'female' | 'male' | 'neutral_estimate'
type DailyMovement =
  'mostly_sitting' | 'some_movement' | 'active' | 'physically_demanding'
type WeightGoal = 'lose' | 'maintain' | 'gain'
type Intensity = 'light' | 'moderate' | 'vigorous'

type SettingsState = {
  birthDate: string
  heightCm: string
  weightKg: string
  physiology: Physiology | ''
  dailyMovement: DailyMovement | ''
  exerciseFrequency: string
  exerciseDuration: string
  exerciseIntensity: Intensity
  weightGoal: WeightGoal
}

const INITIAL_STATE: SettingsState = {
  birthDate: '',
  heightCm: '',
  weightKg: '',
  physiology: '',
  dailyMovement: '',
  exerciseFrequency: '0',
  exerciseDuration: '0',
  exerciseIntensity: 'moderate',
  weightGoal: 'maintain',
}

const PHYSIOLOGY_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'neutral_estimate', label: 'Neutral estimate' },
] satisfies Array<{ value: Physiology; label: string }>

const MOVEMENT_OPTIONS = [
  { value: 'mostly_sitting', label: 'Mostly sitting' },
  { value: 'some_movement', label: 'Some standing or walking' },
  { value: 'active', label: 'Active most of the day' },
  { value: 'physically_demanding', label: 'Physically demanding' },
] satisfies Array<{ value: DailyMovement; label: string }>

const INTENSITY_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'vigorous', label: 'Vigorous' },
]

const GOAL_OPTIONS = [
  { value: 'lose', label: 'Lose' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain', label: 'Gain' },
]

const METRIC_ORDER = [
  'calories',
  'protein',
  'fiber',
  'fruit_and_vegetables',
  'added_sugar',
  'saturated_fat',
  'sodium',
  'total_water',
]

const METRIC_LABELS: Record<string, string> = {
  calories: 'Energy',
  protein: 'Protein',
  fiber: 'Fiber',
  fruit_and_vegetables: 'Fruit & vegetables',
  added_sugar: 'Added sugar',
  saturated_fat: 'Saturated fat',
  sodium: 'Sodium',
  total_water: 'Total water',
}

function getLocalIsoDate() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function formatGoal(
  goal:
    | { kind: 'minimum'; minimum: number }
    | { kind: 'target'; target: number }
    | { kind: 'maximum'; maximum: number }
    | { kind: 'range'; minimum: number; maximum: number },
  unit: string,
) {
  if (goal.kind === 'minimum') return `At least ${goal.minimum} ${unit}`
  if (goal.kind === 'maximum') return `Up to ${goal.maximum} ${unit}`
  if (goal.kind === 'range') {
    return `${goal.minimum}–${goal.maximum} ${unit}`
  }
  return `${goal.target.toLocaleString()} ${unit}`
}

function SuffixInput({
  suffix,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { suffix: string }) {
  return (
    <div className="relative">
      <Input className={cn('pr-14', className)} {...props} />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
        {suffix}
      </span>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? (
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function SettingsForm() {
  const savedSettings = useQuery(api.dailyObjectives.current)
  const saveSettings = useMutation(api.dailyObjectives.save)
  const [form, setForm] = useState<SettingsState>(INITIAL_STATE)
  const [hasHydrated, setHasHydrated] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestObjective, setLatestObjective] = useState<
    Awaited<ReturnType<typeof saveSettings>> | undefined
  >()

  useEffect(() => {
    if (savedSettings === undefined || hasHydrated) return

    if (savedSettings) {
      const { profile } = savedSettings
      setForm({
        birthDate: profile.birthDate,
        heightCm: String(profile.heightCm),
        weightKg: String(profile.weightKg),
        physiology: profile.physiology,
        dailyMovement: profile.dailyMovement,
        exerciseFrequency: String(profile.exercise.sessionsPerWeek),
        exerciseDuration: String(profile.exercise.minutesPerSession),
        exerciseIntensity: profile.exercise.intensity,
        weightGoal: profile.weightGoal,
      })
    }
    setHasHydrated(true)
  }, [hasHydrated, savedSettings])

  function update<TKey extends keyof SettingsState>(
    key: TKey,
    value: SettingsState[TKey],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }))
    setSaved(false)
    setError(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(false)
    setError(null)

    if (!form.physiology || !form.dailyMovement) {
      setError('Choose a physiology profile and daily movement level.')
      return
    }

    setIsSaving(true)
    try {
      const objective = await saveSettings({
        birthDate: form.birthDate,
        calculationDate: getLocalIsoDate(),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        physiology: form.physiology,
        dailyMovement: form.dailyMovement,
        exercise: {
          sessionsPerWeek: Number(form.exerciseFrequency),
          minutesPerSession: Number(form.exerciseDuration),
          intensity: form.exerciseIntensity,
        },
        weightGoal: form.weightGoal,
      })
      setLatestObjective(objective)
      setSaved(true)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message.replace(/^.*Uncaught Error: /, '')
          : 'We could not save your settings. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleReset() {
    if (!savedSettings) {
      setForm(INITIAL_STATE)
    } else {
      const { profile } = savedSettings
      setForm({
        birthDate: profile.birthDate,
        heightCm: String(profile.heightCm),
        weightKg: String(profile.weightKg),
        physiology: profile.physiology,
        dailyMovement: profile.dailyMovement,
        exerciseFrequency: String(profile.exercise.sessionsPerWeek),
        exerciseDuration: String(profile.exercise.minutesPerSession),
        exerciseIntensity: profile.exercise.intensity,
        weightGoal: profile.weightGoal,
      })
    }
    setSaved(false)
    setError(null)
  }

  if (!hasHydrated) {
    return (
      <div className="space-y-6" aria-label="Loading nutrition settings">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-44 animate-pulse rounded-2xl border bg-muted/40"
          />
        ))}
      </div>
    )
  }

  const storedTargets = savedSettings?.targets ?? []
  const displayedTargets = latestObjective?.targets ?? storedTargets
  const orderedTargets = [...displayedTargets].sort(
    (left, right) =>
      METRIC_ORDER.indexOf(left.metric) - METRIC_ORDER.indexOf(right.metric),
  )
  const maintenanceCalories =
    latestObjective?.maintenanceCalories ??
    savedSettings?.profile.maintenanceCalories
  const activityLevel =
    latestObjective?.activityLevel ?? savedSettings?.profile.activityLevel

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" aria-hidden="true" />
            About you
          </CardTitle>
          <CardDescription>
            The basics used to estimate your daily energy needs.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Birth date"
            htmlFor="birth-date"
            hint="Daily objectives currently support adults aged 19 and over."
          >
            <div className="relative">
              <Input
                id="birth-date"
                type="date"
                required
                max={getLocalIsoDate()}
                value={form.birthDate}
                onChange={(event) => update('birthDate', event.target.value)}
                className="pr-10"
              />
              <CalendarDays
                className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </Field>

          <Field
            label="Nutrition physiology"
            htmlFor="physiology"
            hint="Used only to select the reference energy and water equations."
          >
            <Select
              value={form.physiology}
              onValueChange={(value) =>
                update('physiology', value as Physiology)
              }
            >
              <SelectTrigger id="physiology">
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>
              <SelectContent>
                {PHYSIOLOGY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Height" htmlFor="height">
            <SuffixInput
              id="height"
              type="number"
              inputMode="decimal"
              min={100}
              max={250}
              step="0.1"
              required
              placeholder="175"
              suffix="cm"
              value={form.heightCm}
              onChange={(event) => update('heightCm', event.target.value)}
            />
          </Field>

          <Field label="Weight" htmlFor="weight">
            <SuffixInput
              id="weight"
              type="number"
              inputMode="decimal"
              min={30}
              max={350}
              step="0.1"
              required
              placeholder="70"
              suffix="kg"
              value={form.weightKg}
              onChange={(event) => update('weightKg', event.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            Activity
          </CardTitle>
          <CardDescription>
            Your typical movement across an ordinary week.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field
            label="Daily movement"
            htmlFor="daily-movement"
            hint="Your baseline activity outside structured exercise."
          >
            <Select
              value={form.dailyMovement}
              onValueChange={(value) =>
                update('dailyMovement', value as DailyMovement)
              }
            >
              <SelectTrigger id="daily-movement">
                <SelectValue placeholder="Select movement level" />
              </SelectTrigger>
              <SelectContent>
                {MOVEMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="space-y-4 rounded-2xl border border-dashed border-border p-4">
            <div className="flex items-center gap-2">
              <Dumbbell
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-sm font-medium">Exercise</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Frequency" htmlFor="exercise-frequency">
                <SuffixInput
                  id="exercise-frequency"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={14}
                  step={1}
                  required
                  suffix="/ week"
                  value={form.exerciseFrequency}
                  onChange={(event) =>
                    update('exerciseFrequency', event.target.value)
                  }
                />
              </Field>
              <Field label="Duration" htmlFor="exercise-duration">
                <SuffixInput
                  id="exercise-duration"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={360}
                  step={1}
                  required
                  suffix="min"
                  value={form.exerciseDuration}
                  onChange={(event) =>
                    update('exerciseDuration', event.target.value)
                  }
                />
              </Field>
            </div>
            <Field label="Intensity">
              <SegmentedControl
                aria-label="Exercise intensity"
                options={INTENSITY_OPTIONS}
                value={form.exerciseIntensity}
                onValueChange={(value) =>
                  update('exerciseIntensity', value as Intensity)
                }
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            Goal
          </CardTitle>
          <CardDescription>
            Choose the direction for your daily energy target.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field
            label="Weight goal"
            hint="Loss and gain use a conservative 10% adjustment from maintenance."
          >
            <SegmentedControl
              aria-label="Weight goal"
              options={GOAL_OPTIONS}
              value={form.weightGoal}
              onValueChange={(value) =>
                update('weightGoal', value as WeightGoal)
              }
            />
          </Field>
        </CardContent>
      </Card>

      {orderedTargets.length > 0 ? (
        <section
          aria-labelledby="daily-objective-title"
          className="overflow-hidden rounded-2xl border bg-card"
        >
          <div className="flex flex-col gap-2 border-b px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="daily-objective-title"
                className="text-base font-semibold tracking-[-0.01em]"
              >
                Daily objective
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on a {activityLevel?.replace('_', ' ')} routine and{' '}
                {maintenanceCalories?.toLocaleString()} kcal maintenance.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Calculated daily</p>
          </div>
          <dl className="divide-y">
            {orderedTargets.map((target) => (
              <div
                key={target.metric}
                className="flex items-baseline justify-between gap-6 px-6 py-3.5"
              >
                <dt className="text-sm text-muted-foreground">
                  {METRIC_LABELS[target.metric]}
                </dt>
                <dd className="text-right text-sm font-semibold tabular-nums">
                  {formatGoal(target.goal, target.unit)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
        {saved ? (
          <p
            role="status"
            className="mr-auto inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background">
              <Check className="size-3" aria-hidden="true" />
            </span>
            Settings and daily objectives saved.
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full sm:w-auto"
          onClick={handleReset}
          disabled={isSaving}
        >
          Discard changes
        </Button>
        <Button
          type="submit"
          className="h-10 w-full sm:w-auto"
          disabled={isSaving}
        >
          {isSaving ? 'Saving…' : 'Save and calculate'}
        </Button>
      </div>
    </form>
  )
}
