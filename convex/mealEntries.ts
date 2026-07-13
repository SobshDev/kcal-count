import { ConvexError, v } from 'convex/values'

import { internalMutation, mutation, query } from './_generated/server'
import { mealConfidenceValidator, validateDateKey } from './mealEntriesModel'
import { aggregateMeal, deaggregateMeal } from './statisticsAggregation'
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
    const nutritionSummary = await ctx.db
      .query('dailyNutritionTotals')
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
      totalCalories: nutritionSummary?.calories ?? summary?.totalCalories ?? 0,
      mealCount: nutritionSummary?.mealCount ?? summary?.mealCount ?? 0,
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

export const remove = mutation({
  args: { mealId: v.id('mealEntries') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError({
        code: 'UNAUTHENTICATED',
        message: 'You must be signed in to delete a meal',
      })
    }

    const meal = await ctx.db.get(args.mealId)
    if (!meal || meal.ownerTokenIdentifier !== identity.tokenIdentifier) {
      throw new ConvexError({
        code: 'MEAL_NOT_FOUND',
        message: 'This meal was not found',
      })
    }

    const now = Date.now()

    // Reverse the lightweight per-day calorie rollup maintained by saveAnalyzed.
    const calorieTotal = await ctx.db
      .query('dailyCalorieTotals')
      .withIndex('by_ownerTokenIdentifier_and_dateKey', (q) =>
        q
          .eq('ownerTokenIdentifier', identity.tokenIdentifier)
          .eq('dateKey', meal.dateKey),
      )
      .unique()
    if (calorieTotal) {
      const mealCount = calorieTotal.mealCount - 1
      if (mealCount <= 0) {
        await ctx.db.delete(calorieTotal._id)
      } else {
        await ctx.db.patch(calorieTotal._id, {
          totalCalories: Math.max(
            0,
            calorieTotal.totalCalories - meal.calories,
          ),
          mealCount,
          updatedAt: now,
        })
      }
    }

    // Reverse the richer statistics aggregates for meals that were aggregated
    // (statisticsVersion is set once a meal has been folded into the totals).
    if (meal.statisticsVersion !== undefined) {
      await deaggregateMeal(ctx, identity.tokenIdentifier, meal, now)
    }

    // Drop the photo record and its stored blob.
    const photoStorageId = meal.photoStorageId
    if (photoStorageId) {
      const photo = await ctx.db
        .query('mealPhotos')
        .withIndex('by_storageId', (q) => q.eq('storageId', photoStorageId))
        .unique()
      if (photo) await ctx.db.delete(photo._id)
      await ctx.storage.delete(photoStorageId)
    }

    await ctx.db.delete(meal._id)

    return { mealId: meal._id }
  },
})
