import type { Doc } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'

type DatabaseWriterCtx = Pick<MutationCtx, 'db'>
import {
  daysBetween,
  normalizeFoodName,
  shiftDateKey,
} from './statisticsModel'

type MealForAggregation = Pick<
  Doc<'mealEntries'>,
  | 'dateKey'
  | 'name'
  | 'calories'
  | 'proteinGrams'
  | 'carbohydrateGrams'
  | 'fatGrams'
  | 'fiberGrams'
  | 'fruitVegetableGrams'
  | 'addedSugarGrams'
  | 'saturatedFatGrams'
  | 'sodiumMg'
  | 'totalWaterMl'
  | 'mealCategory'
>

export async function aggregateMeal(
  ctx: DatabaseWriterCtx,
  ownerTokenIdentifier: string,
  meal: MealForAggregation,
  now = Date.now(),
) {
  const existing = await ctx.db
    .query('dailyNutritionTotals')
    .withIndex('by_ownerTokenIdentifier_and_dateKey', (q) =>
      q
        .eq('ownerTokenIdentifier', ownerTokenIdentifier)
        .eq('dateKey', meal.dateKey),
    )
    .unique()
  const isFirstMealOfDay = existing === null
  const isComplete =
    meal.fiberGrams !== undefined &&
    meal.fruitVegetableGrams !== undefined &&
    meal.addedSugarGrams !== undefined &&
    meal.saturatedFatGrams !== undefined &&
    meal.sodiumMg !== undefined &&
    meal.totalWaterMl !== undefined
  const categoryField = meal.mealCategory
    ? (`${meal.mealCategory}Calories` as const)
    : ('uncategorizedCalories' as const)

  if (existing) {
    await ctx.db.patch(existing._id, {
      mealCount: existing.mealCount + 1,
      completeNutritionMealCount:
        existing.completeNutritionMealCount + (isComplete ? 1 : 0),
      calories: existing.calories + meal.calories,
      proteinGrams: existing.proteinGrams + meal.proteinGrams,
      carbohydrateGrams:
        existing.carbohydrateGrams + meal.carbohydrateGrams,
      fatGrams: existing.fatGrams + meal.fatGrams,
      fiberGrams: existing.fiberGrams + (meal.fiberGrams ?? 0),
      fruitVegetableGrams:
        existing.fruitVegetableGrams + (meal.fruitVegetableGrams ?? 0),
      addedSugarGrams:
        existing.addedSugarGrams + (meal.addedSugarGrams ?? 0),
      saturatedFatGrams:
        existing.saturatedFatGrams + (meal.saturatedFatGrams ?? 0),
      sodiumMg: existing.sodiumMg + (meal.sodiumMg ?? 0),
      totalWaterMl: existing.totalWaterMl + (meal.totalWaterMl ?? 0),
      [categoryField]: existing[categoryField] + meal.calories,
      updatedAt: now,
    })
  } else {
    const goalSnapshot = await getGoalSnapshot(ctx, ownerTokenIdentifier)
    await ctx.db.insert('dailyNutritionTotals', {
      ownerTokenIdentifier,
      dateKey: meal.dateKey,
      mealCount: 1,
      completeNutritionMealCount: isComplete ? 1 : 0,
      calories: meal.calories,
      proteinGrams: meal.proteinGrams,
      carbohydrateGrams: meal.carbohydrateGrams,
      fatGrams: meal.fatGrams,
      fiberGrams: meal.fiberGrams ?? 0,
      fruitVegetableGrams: meal.fruitVegetableGrams ?? 0,
      addedSugarGrams: meal.addedSugarGrams ?? 0,
      saturatedFatGrams: meal.saturatedFatGrams ?? 0,
      sodiumMg: meal.sodiumMg ?? 0,
      totalWaterMl: meal.totalWaterMl ?? 0,
      breakfastCalories: meal.mealCategory === 'breakfast' ? meal.calories : 0,
      lunchCalories: meal.mealCategory === 'lunch' ? meal.calories : 0,
      dinnerCalories: meal.mealCategory === 'dinner' ? meal.calories : 0,
      snackCalories: meal.mealCategory === 'snack' ? meal.calories : 0,
      uncategorizedCalories: meal.mealCategory ? 0 : meal.calories,
      goalSnapshot: hasGoalSnapshot(goalSnapshot) ? goalSnapshot : undefined,
      updatedAt: now,
    })
  }

  await aggregateFood(ctx, ownerTokenIdentifier, meal, now)
  if (isFirstMealOfDay) {
    await addLoggedDay(ctx, ownerTokenIdentifier, meal.dateKey, now)
  }
}

async function aggregateFood(
  ctx: DatabaseWriterCtx,
  ownerTokenIdentifier: string,
  meal: MealForAggregation,
  now: number,
) {
  const normalizedName = normalizeFoodName(meal.name)
  const existing = await ctx.db
    .query('dailyFoodTotals')
    .withIndex(
      'by_ownerTokenIdentifier_and_dateKey_and_normalizedName',
      (q) =>
        q
          .eq('ownerTokenIdentifier', ownerTokenIdentifier)
          .eq('dateKey', meal.dateKey)
          .eq('normalizedName', normalizedName),
    )
    .unique()
  if (existing) {
    await ctx.db.patch(existing._id, {
      count: existing.count + 1,
      calories: existing.calories + meal.calories,
      displayName: meal.name,
      updatedAt: now,
    })
  } else {
    await ctx.db.insert('dailyFoodTotals', {
      ownerTokenIdentifier,
      dateKey: meal.dateKey,
      normalizedName,
      displayName: meal.name,
      count: 1,
      calories: meal.calories,
      updatedAt: now,
    })
  }
}

async function addLoggedDay(
  ctx: DatabaseWriterCtx,
  ownerTokenIdentifier: string,
  dateKey: string,
  now: number,
) {
  const previousDateKey = shiftDateKey(dateKey, -1)
  const nextDateKey = shiftDateKey(dateKey, 1)
  const previous = await ctx.db
    .query('loggingStreaks')
    .withIndex('by_ownerTokenIdentifier_and_endDateKey', (q) =>
      q
        .eq('ownerTokenIdentifier', ownerTokenIdentifier)
        .eq('endDateKey', previousDateKey),
    )
    .unique()
  const next = await ctx.db
    .query('loggingStreaks')
    .withIndex('by_ownerTokenIdentifier_and_startDateKey', (q) =>
      q
        .eq('ownerTokenIdentifier', ownerTokenIdentifier)
        .eq('startDateKey', nextDateKey),
    )
    .unique()

  let streakLength = 1
  if (previous && next) {
    streakLength = previous.length + 1 + next.length
    await ctx.db.patch(previous._id, {
      endDateKey: next.endDateKey,
      length: streakLength,
      updatedAt: now,
    })
    await ctx.db.delete(next._id)
  } else if (previous) {
    streakLength = previous.length + 1
    await ctx.db.patch(previous._id, {
      endDateKey: dateKey,
      length: streakLength,
      updatedAt: now,
    })
  } else if (next) {
    streakLength = next.length + 1
    await ctx.db.patch(next._id, {
      startDateKey: dateKey,
      length: streakLength,
      updatedAt: now,
    })
  } else {
    await ctx.db.insert('loggingStreaks', {
      ownerTokenIdentifier,
      startDateKey: dateKey,
      endDateKey: dateKey,
      length: 1,
      updatedAt: now,
    })
  }

  const account = await ctx.db
    .query('accountStatistics')
    .withIndex('by_ownerTokenIdentifier', (q) =>
      q.eq('ownerTokenIdentifier', ownerTokenIdentifier),
    )
    .unique()
  if (account) {
    await ctx.db.patch(account._id, {
      loggedDayCount: account.loggedDayCount + 1,
      longestStreak: Math.max(account.longestStreak, streakLength),
      updatedAt: now,
    })
  } else {
    await ctx.db.insert('accountStatistics', {
      ownerTokenIdentifier,
      loggedDayCount: 1,
      longestStreak: streakLength,
      updatedAt: now,
    })
  }
}

export async function upsertWeightMeasurement(
  ctx: DatabaseWriterCtx,
  ownerTokenIdentifier: string,
  dateKey: string,
  weightKg: number,
  now = Date.now(),
) {
  const existing = await ctx.db
    .query('weightMeasurements')
    .withIndex('by_ownerTokenIdentifier_and_dateKey', (q) =>
      q
        .eq('ownerTokenIdentifier', ownerTokenIdentifier)
        .eq('dateKey', dateKey),
    )
    .unique()
  const value = {
    ownerTokenIdentifier,
    dateKey,
    weightKg,
    source: 'settings' as const,
    updatedAt: now,
  }
  if (existing) await ctx.db.replace(existing._id, value)
  else await ctx.db.insert('weightMeasurements', value)
}

async function getGoalSnapshot(
  ctx: DatabaseWriterCtx,
  ownerTokenIdentifier: string,
) {
  const targets = await ctx.db
    .query('nutritionTargets')
    .withIndex('by_ownerTokenIdentifier_and_metric', (q) =>
      q.eq('ownerTokenIdentifier', ownerTokenIdentifier),
    )
    .take(8)
  const snapshot: {
    calorieTarget?: number
    proteinMinimum?: number
    proteinMaximum?: number
    fiberMinimum?: number
  } = {}
  for (const target of targets) {
    if (target.metric === 'calories' && target.goal.kind === 'target') {
      snapshot.calorieTarget = target.goal.target
    } else if (target.metric === 'protein' && target.goal.kind === 'range') {
      snapshot.proteinMinimum = target.goal.minimum
      snapshot.proteinMaximum = target.goal.maximum
    } else if (target.metric === 'fiber' && target.goal.kind === 'minimum') {
      snapshot.fiberMinimum = target.goal.minimum
    }
  }
  return snapshot
}

function hasGoalSnapshot(snapshot: Record<string, number | undefined>) {
  return Object.values(snapshot).some((value) => value !== undefined)
}

export function getCurrentStreakLength(
  streak: Pick<Doc<'loggingStreaks'>, 'endDateKey' | 'length'> | null,
  todayDateKey: string,
) {
  if (!streak) return 0
  return daysBetween(streak.endDateKey, todayDateKey) <= 1 ? streak.length : 0
}
