import type { Infer } from 'convex/values'
import { v } from 'convex/values'

import type {
  NutritionMetric,
  NutritionStandard,
  NutritionTargetGoal,
  NutritionUnit,
} from './nutritionTargets'

export const nutritionPhysiologyValidator = v.union(
  v.literal('female'),
  v.literal('male'),
  v.literal('neutral_estimate'),
)

export const dailyMovementValidator = v.union(
  v.literal('mostly_sitting'),
  v.literal('some_movement'),
  v.literal('active'),
  v.literal('physically_demanding'),
)

export const exerciseIntensityValidator = v.union(
  v.literal('light'),
  v.literal('moderate'),
  v.literal('vigorous'),
)

export const weightGoalValidator = v.union(
  v.literal('maintain'),
  v.literal('lose'),
  v.literal('gain'),
)

export const dailyObjectiveInputValidator = v.object({
  birthDate: v.string(),
  calculationDate: v.string(),
  heightCm: v.number(),
  weightKg: v.number(),
  physiology: nutritionPhysiologyValidator,
  dailyMovement: dailyMovementValidator,
  exercise: v.object({
    sessionsPerWeek: v.number(),
    minutesPerSession: v.number(),
    intensity: exerciseIntensityValidator,
  }),
  weightGoal: weightGoalValidator,
})

export type NutritionPhysiology = Infer<typeof nutritionPhysiologyValidator>
export type DailyMovement = Infer<typeof dailyMovementValidator>
export type ExerciseIntensity = Infer<typeof exerciseIntensityValidator>
export type WeightGoal = Infer<typeof weightGoalValidator>
export type DailyObjectiveInput = Infer<typeof dailyObjectiveInputValidator>
export type ActivityLevel = 'inactive' | 'low_active' | 'active' | 'very_active'

export type CalculatedNutritionTarget = {
  metric: NutritionMetric
  goal: NutritionTargetGoal
  unit: NutritionUnit
  standard: NutritionStandard
  standardVersion: string
  calculationInputs: Record<string, string | number | boolean>
  isPersonalized: boolean
}

export type DailyObjective = {
  calculationVersion: '1.0.0'
  ageYears: number
  activityLevel: ActivityLevel
  maintenanceCalories: number
  goalAdjustmentPercent: number
  targets: CalculatedNutritionTarget[]
}

const movementEquivalentMinutes: Record<DailyMovement, number> = {
  mostly_sitting: 0,
  some_movement: 30,
  active: 75,
  physically_demanding: 150,
}

const intensityMultiplier: Record<ExerciseIntensity, number> = {
  light: 0.5,
  moderate: 1,
  vigorous: 2,
}

const goalMultiplier: Record<WeightGoal, number> = {
  maintain: 1,
  lose: 0.9,
  gain: 1.1,
}

const roundTo = (value: number, increment: number) =>
  Math.round(value / increment) * increment

function parseIsoDate(value: string, fieldName: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    throw new Error(`${fieldName} must use the YYYY-MM-DD format`)
  }

  const [, yearString, monthString, dayString] = match
  const year = Number(yearString)
  const month = Number(monthString)
  const day = Number(dayString)
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`${fieldName} must be a valid calendar date`)
  }

  return { year, month, day }
}

export function calculateAgeYears(birthDate: string, calculationDate: string) {
  const birth = parseIsoDate(birthDate, 'birthDate')
  const calculation = parseIsoDate(calculationDate, 'calculationDate')

  let age = calculation.year - birth.year
  if (
    calculation.month < birth.month ||
    (calculation.month === birth.month && calculation.day < birth.day)
  ) {
    age -= 1
  }

  if (age < 0) {
    throw new Error('birthDate cannot be after calculationDate')
  }

  return age
}

export function classifyActivityLevel(
  dailyMovement: DailyMovement,
  exercise: DailyObjectiveInput['exercise'],
): ActivityLevel {
  if (
    !Number.isFinite(exercise.sessionsPerWeek) ||
    exercise.sessionsPerWeek < 0 ||
    exercise.sessionsPerWeek > 14
  ) {
    throw new Error('sessionsPerWeek must be between 0 and 14')
  }
  if (
    !Number.isFinite(exercise.minutesPerSession) ||
    exercise.minutesPerSession < 0 ||
    exercise.minutesPerSession > 360
  ) {
    throw new Error('minutesPerSession must be between 0 and 360')
  }

  const dailyExerciseEquivalent =
    (exercise.sessionsPerWeek *
      exercise.minutesPerSession *
      intensityMultiplier[exercise.intensity]) /
    7
  const totalEquivalentMinutes =
    movementEquivalentMinutes[dailyMovement] + dailyExerciseEquivalent

  if (totalEquivalentMinutes >= 150) return 'very_active'
  if (totalEquivalentMinutes >= 75) return 'active'
  if (totalEquivalentMinutes >= 30) return 'low_active'
  return 'inactive'
}

type EerCoefficients = {
  intercept: number
  age: number
  height: number
  weight: number
}

const adultEerCoefficients: Record<
  Exclude<NutritionPhysiology, 'neutral_estimate'>,
  Record<ActivityLevel, EerCoefficients>
> = {
  male: {
    inactive: { intercept: 753.07, age: -10.83, height: 6.5, weight: 14.1 },
    low_active: {
      intercept: 581.47,
      age: -10.83,
      height: 8.3,
      weight: 14.94,
    },
    active: {
      intercept: 1004.82,
      age: -10.83,
      height: 6.52,
      weight: 15.91,
    },
    very_active: {
      intercept: -517.88,
      age: -10.83,
      height: 15.61,
      weight: 19.11,
    },
  },
  female: {
    inactive: {
      intercept: 584.9,
      age: -7.01,
      height: 5.72,
      weight: 11.71,
    },
    low_active: {
      intercept: 575.77,
      age: -7.01,
      height: 6.6,
      weight: 12.14,
    },
    active: {
      intercept: 710.25,
      age: -7.01,
      height: 6.54,
      weight: 12.34,
    },
    very_active: {
      intercept: 511.83,
      age: -7.01,
      height: 9.07,
      weight: 12.56,
    },
  },
}

function applyEerCoefficients(
  coefficients: EerCoefficients,
  ageYears: number,
  heightCm: number,
  weightKg: number,
) {
  return (
    coefficients.intercept +
    coefficients.age * ageYears +
    coefficients.height * heightCm +
    coefficients.weight * weightKg
  )
}

export function calculateMaintenanceCalories(
  ageYears: number,
  heightCm: number,
  weightKg: number,
  physiology: NutritionPhysiology,
  activityLevel: ActivityLevel,
) {
  if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250) {
    throw new Error('heightCm must be between 100 and 250')
  }
  if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 350) {
    throw new Error('weightKg must be between 30 and 350')
  }
  if (ageYears < 19 || ageYears > 120) {
    throw new Error('This calculator currently supports adults aged 19 to 120')
  }

  const calculateFor = (profile: 'female' | 'male') =>
    applyEerCoefficients(
      adultEerCoefficients[profile][activityLevel],
      ageYears,
      heightCm,
      weightKg,
    )

  const calories =
    physiology === 'neutral_estimate'
      ? (calculateFor('female') + calculateFor('male')) / 2
      : calculateFor(physiology)

  return roundTo(calories, 10)
}

function createTarget(
  target: Omit<CalculatedNutritionTarget, 'calculationInputs'>,
  calculationInputs: CalculatedNutritionTarget['calculationInputs'],
): CalculatedNutritionTarget {
  return { ...target, calculationInputs }
}

export function calculateDailyObjective(
  input: DailyObjectiveInput,
): DailyObjective {
  const ageYears = calculateAgeYears(input.birthDate, input.calculationDate)
  const activityLevel = classifyActivityLevel(
    input.dailyMovement,
    input.exercise,
  )
  const maintenanceCalories = calculateMaintenanceCalories(
    ageYears,
    input.heightCm,
    input.weightKg,
    input.physiology,
    activityLevel,
  )
  const multiplier = goalMultiplier[input.weightGoal]
  const calorieTarget = roundTo(maintenanceCalories * multiplier, 10)
  const calculationInputs = {
    birthDate: input.birthDate,
    calculationDate: input.calculationDate,
    ageYears,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    physiology: input.physiology,
    dailyMovement: input.dailyMovement,
    exerciseSessionsPerWeek: input.exercise.sessionsPerWeek,
    exerciseMinutesPerSession: input.exercise.minutesPerSession,
    exerciseIntensity: input.exercise.intensity,
    activityLevel,
    weightGoal: input.weightGoal,
    maintenanceCalories,
  }

  const waterMl =
    input.physiology === 'male'
      ? 3700
      : input.physiology === 'female'
        ? 2700
        : 3200

  return {
    calculationVersion: '1.0.0',
    ageYears,
    activityLevel,
    maintenanceCalories,
    goalAdjustmentPercent: Math.round((multiplier - 1) * 100),
    targets: [
      createTarget(
        {
          metric: 'calories',
          goal: { kind: 'target', target: calorieTarget },
          unit: 'kcal',
          standard: 'us_dri',
          standardVersion: '2023',
          isPersonalized: true,
        },
        calculationInputs,
      ),
      createTarget(
        {
          metric: 'protein',
          goal: {
            kind: 'range',
            minimum: Math.round(input.weightKg * 1.2),
            maximum: Math.round(input.weightKg * 1.6),
          },
          unit: 'g',
          standard: 'us_dga_2025_2030',
          standardVersion: '2025-2030',
          isPersonalized: true,
        },
        calculationInputs,
      ),
      createTarget(
        {
          metric: 'fiber',
          goal: {
            kind: 'minimum',
            minimum: Math.max(25, Math.round((calorieTarget / 1000) * 14)),
          },
          unit: 'g',
          standard: 'us_dri',
          standardVersion: '2005',
          isPersonalized: true,
        },
        calculationInputs,
      ),
      createTarget(
        {
          metric: 'fruit_and_vegetables',
          goal: { kind: 'minimum', minimum: 400 },
          unit: 'g',
          standard: 'who_2026',
          standardVersion: '2026',
          isPersonalized: false,
        },
        calculationInputs,
      ),
      createTarget(
        {
          metric: 'added_sugar',
          goal: {
            kind: 'maximum',
            maximum: Math.round((calorieTarget * 0.1) / 4),
          },
          unit: 'g',
          standard: 'who_2026',
          standardVersion: '2026',
          isPersonalized: true,
        },
        calculationInputs,
      ),
      createTarget(
        {
          metric: 'saturated_fat',
          goal: {
            kind: 'maximum',
            maximum: Math.round((calorieTarget * 0.1) / 9),
          },
          unit: 'g',
          standard: 'who_2026',
          standardVersion: '2026',
          isPersonalized: true,
        },
        calculationInputs,
      ),
      createTarget(
        {
          metric: 'sodium',
          goal: { kind: 'maximum', maximum: 2000 },
          unit: 'mg',
          standard: 'who_2026',
          standardVersion: '2026',
          isPersonalized: false,
        },
        calculationInputs,
      ),
      createTarget(
        {
          metric: 'total_water',
          goal: { kind: 'target', target: waterMl },
          unit: 'ml',
          standard: 'us_dri',
          standardVersion: '2005',
          isPersonalized: true,
        },
        calculationInputs,
      ),
    ],
  }
}
