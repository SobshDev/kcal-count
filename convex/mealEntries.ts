import { ConvexError, v } from 'convex/values'

import { internalMutation, query } from './_generated/server'
import { mealConfidenceValidator, validateDateKey } from './mealEntriesModel'
import { aggregateMeal } from './statisticsAggregation'
import { mealCategoryValidator } from './statisticsModel'

export const day = query({
  args: { dateKey: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    validateDateKey(args.dateKey)

    const summary = await ctx.db
      .query('dailyCalorieTotals')
      .withIndex('by_ownerTokenIdentifier_and_dateKey', (q) =>
        q
          .eq('ownerTokenIdentifier', identity.tokenIdentifier)
          .eq('dateKey', args.dateKey),
      )
      .unique()
    const meals = await ctx.db
      .query('mealEntries')
      .withIndex('by_ownerTokenIdentifier_and_dateKey', (q) =>
        q
          .eq('ownerTokenIdentifier', identity.tokenIdentifier)
          .eq('dateKey', args.dateKey),
      )
      .order('desc')
      .take(50)
    const mealsWithPhotos = await Promise.all(
      meals.map(async (meal) => ({
        ...meal,
        photoUrl: meal.photoStorageId
          ? await ctx.storage.getUrl(meal.photoStorageId)
          : null,
      })),
    )

    return {
      totalCalories: summary?.totalCalories ?? 0,
      mealCount: summary?.mealCount ?? 0,
      meals: mealsWithPhotos,
    }
  },
})

export const saveAnalyzed = internalMutation({
  args: {
    dateKey: v.string(),
    description: v.string(),
    name: v.string(),
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
    mealCategory: mealCategoryValidator,
    confidence: mealConfidenceValidator,
    model: v.string(),
    photoStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError({
        code: 'UNAUTHENTICATED',
        message: 'You must be signed in to add food',
      })
    }
    validateDateKey(args.dateKey)

    const now = Date.now()
    const mealId = await ctx.db.insert('mealEntries', {
      ownerTokenIdentifier: identity.tokenIdentifier,
      consumedAt: now,
      statisticsVersion: 1,
      ...args,
    })
    await aggregateMeal(ctx, identity.tokenIdentifier, args, now)
    const existingTotal = await ctx.db
      .query('dailyCalorieTotals')
      .withIndex('by_ownerTokenIdentifier_and_dateKey', (q) =>
        q
          .eq('ownerTokenIdentifier', identity.tokenIdentifier)
          .eq('dateKey', args.dateKey),
      )
      .unique()
    const totalCalories = (existingTotal?.totalCalories ?? 0) + args.calories
    const mealCount = (existingTotal?.mealCount ?? 0) + 1

    if (existingTotal) {
      await ctx.db.patch(existingTotal._id, {
        totalCalories,
        mealCount,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('dailyCalorieTotals', {
        ownerTokenIdentifier: identity.tokenIdentifier,
        dateKey: args.dateKey,
        totalCalories,
        mealCount,
        updatedAt: now,
      })
    }

    return { mealId, totalCalories, mealCount }
  },
})
