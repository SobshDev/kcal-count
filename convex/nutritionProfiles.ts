import { v } from 'convex/values'

import {
  dailyMovementValidator,
  exerciseIntensityValidator,
  nutritionPhysiologyValidator,
  weightGoalValidator,
} from './nutritionCalculator'

export const nutritionProfileValidator = v.object({
  ownerTokenIdentifier: v.string(),
  birthDate: v.string(),
  heightCm: v.number(),
  weightKg: v.number(),
  physiology: nutritionPhysiologyValidator,
  dailyMovement: dailyMovementValidator,
  exercise: v.object({
    sessionsPerWeek: v.number(),
    minutesPerSession: v.number(),
    intensity: exerciseIntensityValidator,
  }),
  weightGoal: weightGoalValidator,
  calculationDate: v.string(),
  calculationVersion: v.string(),
  activityLevel: v.union(
    v.literal('inactive'),
    v.literal('low_active'),
    v.literal('active'),
    v.literal('very_active'),
  ),
  maintenanceCalories: v.number(),
  goalAdjustmentPercent: v.number(),
  updatedAt: v.number(),
})
