import { v } from 'convex/values'

import { query } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import { validateDateKey } from './mealEntriesModel'
import { getCurrentStreakLength } from './statisticsAggregation'
import { shiftDateKey } from './statisticsModel'

const METRICS = [
  ['calories', 'kcal'],
  ['proteinGrams', 'g'],
  ['fiberGrams', 'g'],
  ['fruitVegetableGrams', 'g'],
  ['addedSugarGrams', 'g'],
  ['saturatedFatGrams', 'g'],
  ['sodiumMg', 'mg'],
  ['totalWaterMl', 'ml'],
] as const

export const dashboard = query({
  args: { todayDateKey: v.string() },
  handler: async (ctx, args) => {
    validateDateKey(args.todayDateKey)
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const owner = identity.tokenIdentifier
    const start56 = shiftDateKey(args.todayDateKey, -55)
    const start30 = shiftDateKey(args.todayDateKey, -29)
    const start7 = shiftDateKey(args.todayDateKey, -6)

    const [dailyRows, foodRows, weights, targets, account, todayStreak, yesterdayStreak] =
      await Promise.all([
        ctx.db
          .query('dailyNutritionTotals')
          .withIndex('by_ownerTokenIdentifier_and_dateKey', (q) =>
            q
              .eq('ownerTokenIdentifier', owner)
              .gte('dateKey', start56)
              .lte('dateKey', args.todayDateKey),
          )
          .take(56),
        ctx.db
          .query('dailyFoodTotals')
          .withIndex('by_ownerTokenIdentifier_and_dateKey', (q) =>
            q
              .eq('ownerTokenIdentifier', owner)
              .gte('dateKey', start30)
              .lte('dateKey', args.todayDateKey),
          )
          .take(1_500),
        ctx.db
          .query('weightMeasurements')
          .withIndex('by_ownerTokenIdentifier_and_dateKey', (q) =>
            q
              .eq('ownerTokenIdentifier', owner)
              .gte('dateKey', start56)
              .lte('dateKey', args.todayDateKey),
          )
          .take(56),
        ctx.db
          .query('nutritionTargets')
          .withIndex('by_ownerTokenIdentifier_and_metric', (q) =>
            q.eq('ownerTokenIdentifier', owner),
          )
          .take(8),
        ctx.db
          .query('accountStatistics')
          .withIndex('by_ownerTokenIdentifier', (q) =>
            q.eq('ownerTokenIdentifier', owner),
          )
          .unique(),
        ctx.db
          .query('loggingStreaks')
          .withIndex('by_ownerTokenIdentifier_and_endDateKey', (q) =>
            q
              .eq('ownerTokenIdentifier', owner)
              .eq('endDateKey', args.todayDateKey),
          )
          .unique(),
        ctx.db
          .query('loggingStreaks')
          .withIndex('by_ownerTokenIdentifier_and_endDateKey', (q) =>
            q
              .eq('ownerTokenIdentifier', owner)
              .eq('endDateKey', shiftDateKey(args.todayDateKey, -1)),
          )
          .unique(),
      ])

    const byDate = new Map(dailyRows.map((row) => [row.dateKey, row]))
    const sevenDays = Array.from({ length: 7 }, (_, index) => {
      const dateKey = shiftDateKey(start7, index)
      return toDay(dateKey, byDate.get(dateKey))
    })
    const today = toDay(
      args.todayDateKey,
      byDate.get(args.todayDateKey),
    )
    const weeklyAverages = METRICS.map(([metric, unit]) => {
      const usableDays = sevenDays.filter(
        (day) => day.logged && (metric === 'calories' || metric === 'proteinGrams' || day.complete),
      )
      const values = sevenDays.map((day) =>
        day.logged && (metric === 'calories' || metric === 'proteinGrams' || day.complete)
          ? day[metric]
          : null,
      )
      return {
        metric,
        unit,
        average: usableDays.length
          ? usableDays.reduce((sum, day) => sum + day[metric], 0) /
            usableDays.length
          : null,
        values,
        trackedDays: usableDays.length,
      }
    })

    const goalDays = sevenDays.map((day) => ({
      dateKey: day.dateKey,
      calories: getCalorieGoalState(day),
      protein: getProteinGoalState(day),
      fiber: getFiberGoalState(day),
    }))
    const foodMap = new Map<
      string,
      { name: string; count: number; calories: number }
    >()
    for (const row of foodRows) {
      const existing = foodMap.get(row.normalizedName)
      if (existing) {
        existing.count += row.count
        existing.calories += row.calories
        existing.name = row.displayName
      } else {
        foodMap.set(row.normalizedName, {
          name: row.displayName,
          count: row.count,
          calories: row.calories,
        })
      }
    }
    const topFoods = [...foodMap.values()]
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
      .slice(0, 5)

    const categoryKeys = [
      ['breakfast', 'breakfastCalories'],
      ['lunch', 'lunchCalories'],
      ['dinner', 'dinnerCalories'],
      ['snack', 'snackCalories'],
      ['other', 'uncategorizedCalories'],
    ] as const
    const categoryCalories = categoryKeys.map(([category, key]) => ({
      category,
      today: today[key],
      average: average(sevenDays.filter((day) => day.logged).map((day) => day[key])),
    }))

    const weightByDate = new Map(weights.map((row) => [row.dateKey, row]))
    const weeklyTrend = Array.from({ length: 8 }, (_, index) => {
      const weekStart = shiftDateKey(start56, index * 7)
      const weekEnd = shiftDateKey(weekStart, 6)
      const days = dailyRows.filter(
        (row) => row.dateKey >= weekStart && row.dateKey <= weekEnd,
      )
      const weekWeights = weights.filter(
        (row) => row.dateKey >= weekStart && row.dateKey <= weekEnd,
      )
      const latestWeight = weekWeights.at(-1)
      return {
        weekStart,
        weekEnd,
        averageCalories: average(days.map((day) => day.calories)),
        weightKg: latestWeight?.weightKg ?? null,
      }
    })
    const latestWeight = [...weightByDate.values()].at(-1) ?? null
    const activeStreak = todayStreak ?? yesterdayStreak

    return {
      today,
      targets: targets.map((target) => ({
        metric: target.metric,
        goal: target.goal,
        unit: target.unit,
      })),
      weeklyAverages,
      goalDays,
      logging: {
        currentStreak: getCurrentStreakLength(activeStreak, args.todayDateKey),
        longestStreak: account?.longestStreak ?? 0,
        consistencyPercent: Math.round(
          (sevenDays.filter((day) => day.logged).length / 7) * 100,
        ),
        days: sevenDays.map((day) => day.logged),
      },
      topFoods,
      categoryCalories,
      weeklyTrend,
      latestWeight: latestWeight
        ? { dateKey: latestWeight.dateKey, weightKg: latestWeight.weightKg }
        : null,
    }
  },
})

function toDay(dateKey: string, row?: Doc<'dailyNutritionTotals'>) {
  return {
    dateKey,
    logged: Boolean(row),
    complete: Boolean(row && row.completeNutritionMealCount === row.mealCount),
    mealCount: row?.mealCount ?? 0,
    calories: row?.calories ?? 0,
    proteinGrams: row?.proteinGrams ?? 0,
    carbohydrateGrams: row?.carbohydrateGrams ?? 0,
    fatGrams: row?.fatGrams ?? 0,
    fiberGrams: row?.fiberGrams ?? 0,
    fruitVegetableGrams: row?.fruitVegetableGrams ?? 0,
    addedSugarGrams: row?.addedSugarGrams ?? 0,
    saturatedFatGrams: row?.saturatedFatGrams ?? 0,
    sodiumMg: row?.sodiumMg ?? 0,
    totalWaterMl: row?.totalWaterMl ?? 0,
    breakfastCalories: row?.breakfastCalories ?? 0,
    lunchCalories: row?.lunchCalories ?? 0,
    dinnerCalories: row?.dinnerCalories ?? 0,
    snackCalories: row?.snackCalories ?? 0,
    uncategorizedCalories: row?.uncategorizedCalories ?? 0,
    goalSnapshot: row?.goalSnapshot ?? null,
  }
}

type DashboardDay = ReturnType<typeof toDay>
type GoalState = 'met' | 'missed' | 'unavailable'

function getCalorieGoalState(day: DashboardDay): GoalState {
  const target = day.goalSnapshot?.calorieTarget
  if (!day.logged || target === undefined) return 'unavailable'
  return day.calories >= target * 0.9 && day.calories <= target * 1.1
    ? 'met'
    : 'missed'
}

function getProteinGoalState(day: DashboardDay): GoalState {
  const minimum = day.goalSnapshot?.proteinMinimum
  const maximum = day.goalSnapshot?.proteinMaximum
  if (!day.logged || minimum === undefined || maximum === undefined) {
    return 'unavailable'
  }
  return day.proteinGrams >= minimum && day.proteinGrams <= maximum
    ? 'met'
    : 'missed'
}

function getFiberGoalState(day: DashboardDay): GoalState {
  const minimum = day.goalSnapshot?.fiberMinimum
  if (!day.logged || !day.complete || minimum === undefined) {
    return 'unavailable'
  }
  return day.fiberGrams >= minimum ? 'met' : 'missed'
}

function average(values: number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null
}
