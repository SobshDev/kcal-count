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
