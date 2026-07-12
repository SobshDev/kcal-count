import { v } from 'convex/values'

export const mealCategoryValidator = v.union(
  v.literal('breakfast'),
  v.literal('lunch'),
  v.literal('dinner'),
  v.literal('snack'),
)

export type MealCategory =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'

export const goalSnapshotValidator = v.object({
  calorieTarget: v.optional(v.number()),
  proteinMinimum: v.optional(v.number()),
  proteinMaximum: v.optional(v.number()),
  fiberMinimum: v.optional(v.number()),
})

export const dailyNutritionTotalValidator = v.object({
  ownerTokenIdentifier: v.string(),
  dateKey: v.string(),
  mealCount: v.number(),
  completeNutritionMealCount: v.number(),
  calories: v.number(),
  proteinGrams: v.number(),
  carbohydrateGrams: v.number(),
  fatGrams: v.number(),
  fiberGrams: v.number(),
  fruitVegetableGrams: v.number(),
  addedSugarGrams: v.number(),
  saturatedFatGrams: v.number(),
  sodiumMg: v.number(),
  totalWaterMl: v.number(),
  breakfastCalories: v.number(),
  lunchCalories: v.number(),
  dinnerCalories: v.number(),
  snackCalories: v.number(),
  uncategorizedCalories: v.number(),
  goalSnapshot: v.optional(goalSnapshotValidator),
  updatedAt: v.number(),
})

export const dailyFoodTotalValidator = v.object({
  ownerTokenIdentifier: v.string(),
  dateKey: v.string(),
  normalizedName: v.string(),
  displayName: v.string(),
  count: v.number(),
  calories: v.number(),
  updatedAt: v.number(),
})

export const weightMeasurementValidator = v.object({
  ownerTokenIdentifier: v.string(),
  dateKey: v.string(),
  weightKg: v.number(),
  source: v.literal('settings'),
  updatedAt: v.number(),
})

export const loggingStreakValidator = v.object({
  ownerTokenIdentifier: v.string(),
  startDateKey: v.string(),
  endDateKey: v.string(),
  length: v.number(),
  updatedAt: v.number(),
})

export const accountStatisticsValidator = v.object({
  ownerTokenIdentifier: v.string(),
  loggedDayCount: v.number(),
  longestStreak: v.number(),
  updatedAt: v.number(),
})

export function normalizeFoodName(name: string) {
  return name.trim().toLocaleLowerCase().replace(/\s+/g, ' ')
}

export function shiftDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

export function daysBetween(startDateKey: string, endDateKey: string) {
  const start = Date.parse(`${startDateKey}T00:00:00Z`)
  const end = Date.parse(`${endDateKey}T00:00:00Z`)
  return Math.round((end - start) / 86_400_000)
}
