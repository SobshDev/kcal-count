/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

import { api, internal } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

const objective = {
  birthDate: '1996-01-01',
  calculationDate: '2026-07-11',
  heightCm: 180,
  weightKg: 80,
  physiology: 'male' as const,
  dailyMovement: 'mostly_sitting' as const,
  exercise: {
    sessionsPerWeek: 0,
    minutesPerSession: 0,
    intensity: 'light' as const,
  },
  weightGoal: 'lose' as const,
}

const meal = {
  description: 'Chicken salad',
  name: 'Chicken Salad',
  calories: 820,
  proteinGrams: 34,
  carbohydrateGrams: 48,
  fatGrams: 28,
  fiberGrams: 20,
  fruitVegetableGrams: 180,
  addedSugarGrams: 3,
  saturatedFatGrams: 6,
  sodiumMg: 620,
  totalWaterMl: 260,
  mealCategory: 'lunch' as const,
  confidence: 'medium' as const,
  model: 'test-model',
}

describe('statistics', () => {
  it('aggregates meals, goals, foods, and arbitrary-order streaks', async () => {
    const t = convexTest(schema, modules).withIdentity({
      tokenIdentifier: 'https://clerk.test|statistics-account',
    })
    await t.mutation(api.dailyObjectives.save, objective)
    for (const dateKey of ['2026-07-09', '2026-07-11', '2026-07-10']) {
      await t.mutation(internal.mealEntries.saveAnalyzed, { ...meal, dateKey })
    }
    await t.mutation(internal.mealEntries.saveAnalyzed, {
      ...meal,
      dateKey: '2026-07-11',
      name: '  chicken   salad ',
      mealCategory: 'dinner',
    })

    const result = await t.query(api.statistics.dashboard, {
      todayDateKey: '2026-07-11',
    })
    expect(result).toMatchObject({
      today: {
        calories: 1640,
        proteinGrams: 68,
        lunchCalories: 820,
        dinnerCalories: 820,
        complete: true,
      },
      logging: { currentStreak: 3, longestStreak: 3 },
      topFoods: [{ count: 4 }],
      latestWeight: { dateKey: '2026-07-11', weightKg: 80 },
    })
    expect(
      result?.weeklyAverages.find((item) => item.metric === 'fiberGrams'),
    ).toMatchObject({ average: 80 / 3, trackedDays: 3 })
    expect(result?.goalDays.at(-1)).toMatchObject({
      calories: 'missed',
      protein: 'missed',
      fiber: 'met',
    })
  })

  it('splits the logging streak when a middle day’s only meal is deleted', async () => {
    const token = 'https://clerk.test|streak-delete-account'
    const t = convexTest(schema, modules).withIdentity({
      tokenIdentifier: token,
    })
    for (const dateKey of ['2026-07-09', '2026-07-10', '2026-07-11']) {
      await t.mutation(internal.mealEntries.saveAnalyzed, { ...meal, dateKey })
    }

    const before = await t.run((ctx) =>
      ctx.db.query('loggingStreaks').collect(),
    )
    expect(before).toHaveLength(1)
    expect(before[0]).toMatchObject({
      startDateKey: '2026-07-09',
      endDateKey: '2026-07-11',
      length: 3,
    })

    const middle = await t.query(api.mealEntries.day, { dateKey: '2026-07-10' })
    await t.mutation(api.mealEntries.remove, { mealId: middle!.meals[0]._id })

    const after = await t.run((ctx) =>
      ctx.db
        .query('loggingStreaks')
        .withIndex('by_ownerTokenIdentifier_and_startDateKey', (q) =>
          q.eq('ownerTokenIdentifier', token),
        )
        .collect(),
    )
    expect(
      after.map((streak) => ({
        start: streak.startDateKey,
        end: streak.endDateKey,
        length: streak.length,
      })),
    ).toEqual([
      { start: '2026-07-09', end: '2026-07-09', length: 1 },
      { start: '2026-07-11', end: '2026-07-11', length: 1 },
    ])

    await expect(
      t.query(api.mealEntries.day, { dateKey: '2026-07-10' }),
    ).resolves.toMatchObject({ totalCalories: 0, mealCount: 0, meals: [] })

    const dashboard = await t.query(api.statistics.dashboard, {
      todayDateKey: '2026-07-11',
    })
    // The broken streak drops the current run to the single day ending today,
    // but the longest-streak achievement stays at its 3-day high-water mark.
    expect(dashboard).toMatchObject({
      logging: { currentStreak: 1, longestStreak: 3 },
    })

    const account = await t.run((ctx) =>
      ctx.db.query('accountStatistics').first(),
    )
    expect(account?.loggedDayCount).toBe(2)
  })

  it('upserts same-day weight and keeps accounts isolated', async () => {
    const base = convexTest(schema, modules)
    const owner = base.withIdentity({
      tokenIdentifier: 'https://clerk.test|weight-owner',
    })
    await owner.mutation(api.dailyObjectives.save, objective)
    await owner.mutation(api.dailyObjectives.save, {
      ...objective,
      weightKg: 79.5,
    })

    const measurements = await base.run((ctx) =>
      ctx.db.query('weightMeasurements').take(10),
    )
    expect(measurements).toHaveLength(1)
    expect(measurements[0].weightKg).toBe(79.5)

    const other = base.withIdentity({
      tokenIdentifier: 'https://clerk.test|weight-other',
    })
    const result = await other.query(api.statistics.dashboard, {
      todayDateKey: '2026-07-11',
    })
    expect(result).toMatchObject({
      today: { calories: 0 },
      topFoods: [],
      latestWeight: null,
    })
  })
})
