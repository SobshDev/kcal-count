import { Migrations } from '@convex-dev/migrations'

import { components } from './_generated/api'
import { internalQuery } from './_generated/server'
import schema from './schema'
import { aggregateMeal, upsertWeightMeasurement } from './statisticsAggregation'

export const migrations = new Migrations(components.migrations, { schema })

export const backfillMealStatistics = migrations.define({
  table: 'mealEntries',
  batchSize: 25,
  migrateOne: async (ctx, meal) => {
    if (meal.statisticsVersion !== undefined) return
    await aggregateMeal(
      ctx,
      meal.ownerTokenIdentifier,
      meal,
      meal.consumedAt,
      false,
    )
    await ctx.db.patch(meal._id, { statisticsVersion: 1 })
  },
})

export const seedWeightMeasurements = migrations.define({
  table: 'nutritionProfiles',
  batchSize: 50,
  migrateOne: async (ctx, profile) => {
    await upsertWeightMeasurement(
      ctx,
      profile.ownerTokenIdentifier,
      profile.calculationDate,
      profile.weightKg,
      profile.updatedAt,
    )
  },
})

export const run = migrations.runner()

export const verifyMealStatistics = internalQuery({
  args: {},
  handler: async (ctx) => {
    const remaining = await ctx.db
      .query('mealEntries')
      .withIndex('by_statisticsVersion', (q) =>
        q.eq('statisticsVersion', undefined),
      )
      .take(10)
    return {
      complete: remaining.length === 0,
      sampleRemaining: remaining.map((meal) => meal._id),
    }
  },
})
