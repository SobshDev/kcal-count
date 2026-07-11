import { useState } from 'react'
import {
  Activity,
  CalendarDays,
  Check,
  Dumbbell,
  Target,
  User,
} from 'lucide-react'

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

type WeightGoal = 'lose' | 'maintain' | 'gain'
type Intensity = 'low' | 'moderate' | 'high'

type SettingsState = {
  birthDate: string
  height: string
  heightUnit: string
  weight: string
  weightUnit: string
  physiology: string
  dailyMovement: string
  exerciseFrequency: string
  exerciseDuration: string
  exerciseIntensity: Intensity
  weightGoal: WeightGoal
  targetWeight: string
  weeklyPace: string
}

const INITIAL_STATE: SettingsState = {
  birthDate: '',
  height: '',
  heightUnit: 'cm',
  weight: '',
  weightUnit: 'kg',
  physiology: '',
  dailyMovement: '',
  exerciseFrequency: '',
  exerciseDuration: '',
  exerciseIntensity: 'moderate',
  weightGoal: 'maintain',
  targetWeight: '',
  weeklyPace: 'steady',
}

const PHYSIOLOGY_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'pregnant', label: 'Pregnant' },
  { value: 'breastfeeding', label: 'Breastfeeding' },
]

const MOVEMENT_OPTIONS = [
  { value: 'sedentary', label: 'Mostly sitting' },
  { value: 'light', label: 'Lightly active' },
  { value: 'moderate', label: 'Moderately active' },
  { value: 'very', label: 'Very active' },
]

const INTENSITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
]

const GOAL_OPTIONS = [
  { value: 'lose', label: 'Lose' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain', label: 'Gain' },
]

const PACE_OPTIONS = [
  { value: 'relaxed', label: 'Relaxed · ~0.25 / week' },
  { value: 'steady', label: 'Steady · ~0.5 / week' },
  { value: 'ambitious', label: 'Ambitious · ~0.75 / week' },
]

/** Number input with a static unit label pinned to the trailing edge. */
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

/** Label + optional hint wrapper so every field lines up the same way. */
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
  const [form, setForm] = useState<SettingsState>(INITIAL_STATE)
  const [saved, setSaved] = useState(false)

  function update<Key extends keyof SettingsState>(
    key: Key,
    value: SettingsState[Key],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }))
    setSaved(false)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Persistence isn't wired up yet — this only exercises the UI/UX.
    setSaved(true)
  }

  function handleReset() {
    setForm(INITIAL_STATE)
    setSaved(false)
  }

  const showPace = form.weightGoal !== 'maintain'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" aria-hidden="true" />
            About you
          </CardTitle>
          <CardDescription>
            The basics we use to estimate your daily energy needs.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Birth date"
            htmlFor="birth-date"
            hint="Used to work out your age."
          >
            <div className="relative">
              <Input
                id="birth-date"
                type="date"
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
            hint="Tailors nutrient reference values to your body."
          >
            <Select
              value={form.physiology}
              onValueChange={(value) => update('physiology', value)}
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
            <div className="flex gap-2">
              <Input
                id="height"
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="175"
                value={form.height}
                onChange={(event) => update('height', event.target.value)}
                className="flex-1"
              />
              <Select
                value={form.heightUnit}
                onValueChange={(value) => update('heightUnit', value)}
              >
                <SelectTrigger
                  aria-label="Height unit"
                  className="w-20 shrink-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="in">in</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Field>

          <Field label="Weight" htmlFor="weight">
            <div className="flex gap-2">
              <Input
                id="weight"
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="70"
                value={form.weight}
                onChange={(event) => update('weight', event.target.value)}
                className="flex-1"
              />
              <Select
                value={form.weightUnit}
                onValueChange={(value) => update('weightUnit', value)}
              >
                <SelectTrigger
                  aria-label="Weight unit"
                  className="w-20 shrink-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            How much you move over a typical week.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field
            label="Daily movement"
            htmlFor="daily-movement"
            hint="Your baseline activity outside of workouts."
          >
            <Select
              value={form.dailyMovement}
              onValueChange={(value) => update('dailyMovement', value)}
            >
              <SelectTrigger id="daily-movement">
                <SelectValue placeholder="Select activity level" />
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
                  placeholder="3"
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
                  placeholder="45"
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
            Where you'd like your weight to head.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="Weight goal">
            <SegmentedControl
              aria-label="Weight goal"
              options={GOAL_OPTIONS}
              value={form.weightGoal}
              onValueChange={(value) =>
                update('weightGoal', value as WeightGoal)
              }
            />
          </Field>

          {showPace ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Target weight" htmlFor="target-weight">
                <SuffixInput
                  id="target-weight"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="65"
                  suffix={form.weightUnit}
                  value={form.targetWeight}
                  onChange={(event) =>
                    update('targetWeight', event.target.value)
                  }
                />
              </Field>
              <Field
                label="Weekly pace"
                htmlFor="weekly-pace"
                hint={`How fast to ${form.weightGoal} weight.`}
              >
                <Select
                  value={form.weeklyPace}
                  onValueChange={(value) => update('weeklyPace', value)}
                >
                  <SelectTrigger id="weekly-pace">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PACE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
        {saved ? (
          <p
            role="status"
            className="mr-auto inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background">
              <Check className="size-3" aria-hidden="true" />
            </span>
            Looks good — saving isn't wired up yet.
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full sm:w-auto"
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button type="submit" className="h-10 w-full sm:w-auto">
          Save changes
        </Button>
      </div>
    </form>
  )
}
