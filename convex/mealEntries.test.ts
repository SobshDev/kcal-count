/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

import { api, internal } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

describe('meal entries', () => {
  it('aggregates calories for an account and day', async () => {
    const t = convexTest(schema, modules).withIdentity({
      tokenIdentifier: 'https://clerk.test|meal-account',
    })
    const baseMeal = {
      dateKey: '2026-07-11',
      description: 'Chicken salad',
      name: 'Chicken salad',
      proteinGrams: 40,
      carbohydrateGrams: 20,
      fatGrams: 25,
      fiberGrams: 8,
      fruitVegetableGrams: 180,
      addedSugarGrams: 2,
      saturatedFatGrams: 5,
      sodiumMg: 620,
      totalWaterMl: 220,
      mealCategory: 'lunch' as const,
      confidence: 'medium' as const,
      model: 'openai/gpt-5.6-luna',
    }

    await t.mutation(internal.mealEntries.saveAnalyzed, {
      ...baseMeal,
      calories: 500,
    })
    await t.mutation(internal.mealEntries.saveAnalyzed, {
      ...baseMeal,
      description: 'Greek yogurt',
      name: 'Greek yogurt',
      calories: 180,
    })

    await expect(
      t.query(api.mealEntries.day, { dateKey: '2026-07-11' }),
    ).resolves.toMatchObject({
      totalCalories: 680,
      mealCount: 2,
      meals: [{ name: 'Greek yogurt' }, { name: 'Chicken salad' }],
    })
  })

  it('does not expose another account’s meals', async () => {
    const t = convexTest(schema, modules)
    const owner = t.withIdentity({
      tokenIdentifier: 'https://clerk.test|meal-owner',
    })
    await owner.mutation(internal.mealEntries.saveAnalyzed, {
      dateKey: '2026-07-11',
      description: 'Toast',
      name: 'Toast',
      calories: 200,
      proteinGrams: 6,
      carbohydrateGrams: 30,
      fatGrams: 5,
      fiberGrams: 3,
      fruitVegetableGrams: 0,
      addedSugarGrams: 1,
      saturatedFatGrams: 1,
      sodiumMg: 280,
      totalWaterMl: 40,
      mealCategory: 'breakfast',
      confidence: 'high',
      model: 'openai/gpt-5.6-luna',
    })

    const otherAccount = t.withIdentity({
      tokenIdentifier: 'https://clerk.test|other-account',
    })
    await expect(
      otherAccount.query(api.mealEntries.day, { dateKey: '2026-07-11' }),
    ).resolves.toMatchObject({ totalCalories: 0, mealCount: 0, meals: [] })
  })
})
