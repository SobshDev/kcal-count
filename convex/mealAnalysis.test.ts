import { describe, expect, it } from 'vitest'

import { parseMealAnalysis } from './mealAnalysis'

describe('meal analysis parsing', () => {
  it('normalizes a structured nutrition estimate', () => {
    expect(
      parseMealAnalysis(
        JSON.stringify({
          name: 'Chicken salad',
          calories: 512.4,
          proteinGrams: 42.2,
          carbohydrateGrams: 19.8,
          fatGrams: 27.1,
          fiberGrams: 7.6,
          fruitVegetableGrams: 184.3,
          addedSugarGrams: 2.1,
          saturatedFatGrams: 5.4,
          sodiumMg: 611.7,
          totalWaterMl: 228.2,
          mealCategory: 'lunch',
          confidence: 'medium',
        }),
      ),
    ).toEqual({
      name: 'Chicken salad',
      calories: 512,
      proteinGrams: 42,
      carbohydrateGrams: 20,
      fatGrams: 27,
      fiberGrams: 8,
      fruitVegetableGrams: 184,
      addedSugarGrams: 2,
      saturatedFatGrams: 5,
      sodiumMg: 612,
      totalWaterMl: 228,
      mealCategory: 'lunch',
      confidence: 'medium',
    })
  })

  it('rejects malformed or implausible estimates', () => {
    expect(() => parseMealAnalysis('not json')).toThrow(
      'AI returned invalid meal data',
    )
    expect(() =>
      parseMealAnalysis(
        JSON.stringify({
          name: 'Impossible meal',
          calories: 50_000,
          proteinGrams: 0,
          carbohydrateGrams: 0,
          fatGrams: 0,
          confidence: 'low',
        }),
      ),
    ).toThrow('AI returned invalid calories')
  })
})
