import type { Infer } from 'convex/values'
import { v } from 'convex/values'

export const nutritionMetricValidator = v.union(
  v.literal('calories'),
  v.literal('protein'),
  v.literal('fiber'),
  v.literal('fruit_and_vegetables'),
  v.literal('added_sugar'),
  v.literal('saturated_fat'),
  v.literal('sodium'),
  v.literal('total_water'),
)

export const nutritionUnitValidator = v.union(
  v.literal('kcal'),
  v.literal('g'),
  v.literal('mg'),
  v.literal('ml'),
)

export const nutritionStandardValidator = v.union(
  v.literal('us_dga_2025_2030'),
  v.literal('us_dri'),
  v.literal('who_2026'),
  v.literal('custom'),
)

export const nutritionTargetGoalValidator = v.union(
  v.object({
    kind: v.literal('minimum'),
    minimum: v.number(),
  }),
  v.object({
    kind: v.literal('target'),
    target: v.number(),
  }),
  v.object({
    kind: v.literal('maximum'),
    maximum: v.number(),
  }),
  v.object({
    kind: v.literal('range'),
    minimum: v.number(),
    maximum: v.number(),
  }),
)

export const calculationInputValueValidator = v.union(
  v.string(),
  v.number(),
  v.boolean(),
)

export const nutritionTargetFields = {
  ownerTokenIdentifier: v.string(),
  metric: nutritionMetricValidator,
  goal: nutritionTargetGoalValidator,
  unit: nutritionUnitValidator,
  standard: nutritionStandardValidator,
  standardVersion: v.string(),
  calculationInputs: v.record(v.string(), calculationInputValueValidator),
  isPersonalized: v.boolean(),
  effectiveFrom: v.string(),
}

export const nutritionTargetValidator = v.object(nutritionTargetFields)

export type NutritionMetric = Infer<typeof nutritionMetricValidator>
export type NutritionUnit = Infer<typeof nutritionUnitValidator>
export type NutritionStandard = Infer<typeof nutritionStandardValidator>
export type NutritionTargetGoal = Infer<typeof nutritionTargetGoalValidator>
export type NutritionTarget = Infer<typeof nutritionTargetValidator>
