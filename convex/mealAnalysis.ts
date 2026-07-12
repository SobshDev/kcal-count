export type MealAnalysis = {
  name: string
  calories: number
  proteinGrams: number
  carbohydrateGrams: number
  fatGrams: number
  fiberGrams: number
  fruitVegetableGrams: number
  addedSugarGrams: number
  saturatedFatGrams: number
  sodiumMg: number
  totalWaterMl: number
  mealCategory: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  confidence: 'low' | 'medium' | 'high'
}

export const mealAnalysisResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'meal_nutrition',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: [
        'name',
        'calories',
        'proteinGrams',
        'carbohydrateGrams',
        'fatGrams',
        'fiberGrams',
        'fruitVegetableGrams',
        'addedSugarGrams',
        'saturatedFatGrams',
        'sodiumMg',
        'totalWaterMl',
        'mealCategory',
        'confidence',
      ],
      properties: {
        name: { type: 'string' },
        calories: { type: 'number', minimum: 0 },
        proteinGrams: { type: 'number', minimum: 0 },
        carbohydrateGrams: { type: 'number', minimum: 0 },
        fatGrams: { type: 'number', minimum: 0 },
        fiberGrams: { type: 'number', minimum: 0 },
        fruitVegetableGrams: { type: 'number', minimum: 0 },
        addedSugarGrams: { type: 'number', minimum: 0 },
        saturatedFatGrams: { type: 'number', minimum: 0 },
        sodiumMg: { type: 'number', minimum: 0 },
        totalWaterMl: { type: 'number', minimum: 0 },
        mealCategory: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        },
        confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
    },
  },
} as const

export function parseMealAnalysis(content: string): MealAnalysis {
  let value: unknown
  try {
    value = JSON.parse(content)
  } catch {
    throw new Error('AI returned invalid meal data')
  }
  if (typeof value !== 'object' || value === null) {
    throw new Error('AI returned invalid meal data')
  }

  const record = value as Record<string, unknown>
  const name = requireName(record.name)
  const calories = requireNutritionNumber(record.calories, 'calories', 10_000)
  const proteinGrams = requireNutritionNumber(
    record.proteinGrams,
    'proteinGrams',
    1_000,
  )
  const carbohydrateGrams = requireNutritionNumber(
    record.carbohydrateGrams,
    'carbohydrateGrams',
    2_000,
  )
  const fatGrams = requireNutritionNumber(record.fatGrams, 'fatGrams', 1_000)
  const fiberGrams = requireNutritionNumber(
    record.fiberGrams,
    'fiberGrams',
    500,
  )
  const fruitVegetableGrams = requireNutritionNumber(
    record.fruitVegetableGrams,
    'fruitVegetableGrams',
    5_000,
  )
  const addedSugarGrams = requireNutritionNumber(
    record.addedSugarGrams,
    'addedSugarGrams',
    1_000,
  )
  const saturatedFatGrams = requireNutritionNumber(
    record.saturatedFatGrams,
    'saturatedFatGrams',
    1_000,
  )
  const sodiumMg = requireNutritionNumber(record.sodiumMg, 'sodiumMg', 50_000)
  const totalWaterMl = requireNutritionNumber(
    record.totalWaterMl,
    'totalWaterMl',
    20_000,
  )
  const mealCategory = requireMealCategory(record.mealCategory)
  const confidence = record.confidence
  if (
    confidence !== 'low' &&
    confidence !== 'medium' &&
    confidence !== 'high'
  ) {
    throw new Error('AI returned an invalid confidence level')
  }

  return {
    name,
    calories,
    proteinGrams,
    carbohydrateGrams,
    fatGrams,
    fiberGrams,
    fruitVegetableGrams,
    addedSugarGrams,
    saturatedFatGrams,
    sodiumMg,
    totalWaterMl,
    mealCategory,
    confidence,
  }
}

function requireMealCategory(value: unknown): MealAnalysis['mealCategory'] {
  if (
    value !== 'breakfast' &&
    value !== 'lunch' &&
    value !== 'dinner' &&
    value !== 'snack'
  ) {
    throw new Error('AI returned an invalid meal category')
  }
  return value
}

function requireName(value: unknown) {
  if (typeof value !== 'string' || !value.trim() || value.length > 120) {
    throw new Error('AI returned an invalid meal name')
  }
  return value.trim()
}

function requireNutritionNumber(
  value: unknown,
  fieldName: string,
  maximum: number,
) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`AI returned invalid ${fieldName}`)
  }
  const rounded = Math.round(value)
  if (rounded < 0 || rounded > maximum) {
    throw new Error(`AI returned invalid ${fieldName}`)
  }
  return rounded
}
