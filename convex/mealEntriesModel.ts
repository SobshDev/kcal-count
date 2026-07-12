import { v } from 'convex/values'

import { mealCategoryValidator } from './statisticsModel'

export const mealConfidenceValidator = v.union(
  v.literal('low'),
  v.literal('medium'),
  v.literal('high'),
)

export const mealEntryValidator = v.object({
  ownerTokenIdentifier: v.string(),
  dateKey: v.string(),
  consumedAt: v.number(),
  description: v.string(),
  name: v.string(),
  calories: v.number(),
  proteinGrams: v.number(),
  carbohydrateGrams: v.number(),
  fatGrams: v.number(),
  fiberGrams: v.optional(v.number()),
  fruitVegetableGrams: v.optional(v.number()),
  addedSugarGrams: v.optional(v.number()),
  saturatedFatGrams: v.optional(v.number()),
  sodiumMg: v.optional(v.number()),
  totalWaterMl: v.optional(v.number()),
  mealCategory: v.optional(mealCategoryValidator),
  statisticsVersion: v.optional(v.number()),
  confidence: mealConfidenceValidator,
  model: v.string(),
  photoStorageId: v.optional(v.id('_storage')),
})

export const mealPhotoValidator = v.object({
  ownerTokenIdentifier: v.string(),
  storageId: v.id('_storage'),
  createdAt: v.number(),
})

export const dailyCalorieTotalValidator = v.object({
  ownerTokenIdentifier: v.string(),
  dateKey: v.string(),
  totalCalories: v.number(),
  mealCount: v.number(),
  updatedAt: v.number(),
})

export function validateDateKey(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!match) throw new Error('dateKey must use the YYYY-MM-DD format')

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
    throw new Error('dateKey must be a valid calendar date')
  }
}
