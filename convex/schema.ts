import { defineSchema, defineTable } from 'convex/server'

import {
  aiAccountLimitValidator,
  aiRateLimitValidator,
  aiTokenReservationValidator,
} from './aiPolicy'
import {
  dailyCalorieTotalValidator,
  mealEntryValidator,
  mealPhotoValidator,
} from './mealEntriesModel'
import { nutritionProfileValidator } from './nutritionProfiles'
import { nutritionTargetValidator } from './nutritionTargets'
import { accountTokenUsageValidator } from './tokenUsageModel'
import {
  accountStatisticsValidator,
  dailyFoodTotalValidator,
  dailyNutritionTotalValidator,
  loggingStreakValidator,
  weightMeasurementValidator,
} from './statisticsModel'

export default defineSchema({
  aiAccountLimits: defineTable(aiAccountLimitValidator).index(
    'by_ownerTokenIdentifier',
    ['ownerTokenIdentifier'],
  ),
  aiRateLimits: defineTable(aiRateLimitValidator).index(
    'by_ownerTokenIdentifier',
    ['ownerTokenIdentifier'],
  ),
  aiTokenReservations: defineTable(aiTokenReservationValidator).index(
    'by_ownerTokenIdentifier_and_expiresAt',
    ['ownerTokenIdentifier', 'expiresAt'],
  ),
  accountTokenUsage: defineTable(accountTokenUsageValidator).index(
    'by_ownerTokenIdentifier',
    ['ownerTokenIdentifier'],
  ),
  dailyCalorieTotals: defineTable(dailyCalorieTotalValidator).index(
    'by_ownerTokenIdentifier_and_dateKey',
    ['ownerTokenIdentifier', 'dateKey'],
  ),
  dailyNutritionTotals: defineTable(dailyNutritionTotalValidator).index(
    'by_ownerTokenIdentifier_and_dateKey',
    ['ownerTokenIdentifier', 'dateKey'],
  ),
  dailyFoodTotals: defineTable(dailyFoodTotalValidator)
    .index('by_ownerTokenIdentifier_and_dateKey', [
      'ownerTokenIdentifier',
      'dateKey',
    ])
    .index('by_ownerTokenIdentifier_and_dateKey_and_normalizedName', [
      'ownerTokenIdentifier',
      'dateKey',
      'normalizedName',
    ]),
  weightMeasurements: defineTable(weightMeasurementValidator).index(
    'by_ownerTokenIdentifier_and_dateKey',
    ['ownerTokenIdentifier', 'dateKey'],
  ),
  loggingStreaks: defineTable(loggingStreakValidator)
    .index('by_ownerTokenIdentifier_and_startDateKey', [
      'ownerTokenIdentifier',
      'startDateKey',
    ])
    .index('by_ownerTokenIdentifier_and_endDateKey', [
      'ownerTokenIdentifier',
      'endDateKey',
    ]),
  accountStatistics: defineTable(accountStatisticsValidator).index(
    'by_ownerTokenIdentifier',
    ['ownerTokenIdentifier'],
  ),
  mealEntries: defineTable(mealEntryValidator)
    .index('by_ownerTokenIdentifier_and_dateKey', [
      'ownerTokenIdentifier',
      'dateKey',
    ])
    .index('by_ownerTokenIdentifier_and_consumedAt', [
      'ownerTokenIdentifier',
      'consumedAt',
    ]),
  mealPhotos: defineTable(mealPhotoValidator)
    .index('by_ownerTokenIdentifier', ['ownerTokenIdentifier'])
    .index('by_storageId', ['storageId']),
  nutritionProfiles: defineTable(nutritionProfileValidator).index(
    'by_ownerTokenIdentifier',
    ['ownerTokenIdentifier'],
  ),
  nutritionTargets: defineTable(nutritionTargetValidator)
    .index('by_ownerTokenIdentifier_and_metric', [
      'ownerTokenIdentifier',
      'metric',
    ])
    .index('by_ownerTokenIdentifier_and_effectiveFrom', [
      'ownerTokenIdentifier',
      'effectiveFrom',
    ]),
})
