import { mutation, query } from './_generated/server'
import {
  calculateDailyObjective,
  dailyObjectiveInputValidator,
} from './nutritionCalculator'
import { upsertWeightMeasurement } from './statisticsAggregation'

export const preview = query({
  args: dailyObjectiveInputValidator.fields,
  handler: (_ctx, args) => calculateDailyObjective(args),
})

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const profile = await ctx.db
      .query('nutritionProfiles')
      .withIndex('by_ownerTokenIdentifier', (q) =>
        q.eq('ownerTokenIdentifier', identity.tokenIdentifier),
      )
      .unique()

    if (!profile) return null

    const targets = await ctx.db
      .query('nutritionTargets')
      .withIndex('by_ownerTokenIdentifier_and_effectiveFrom', (q) =>
        q
          .eq('ownerTokenIdentifier', identity.tokenIdentifier)
          .eq('effectiveFrom', profile.calculationDate),
      )
      .take(8)

    return { profile, targets }
  },
})

export const save = mutation({
  args: dailyObjectiveInputValidator.fields,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('You must be signed in to save settings')

    const objective = calculateDailyObjective(args)
    const ownerTokenIdentifier = identity.tokenIdentifier
    const existingProfile = await ctx.db
      .query('nutritionProfiles')
      .withIndex('by_ownerTokenIdentifier', (q) =>
        q.eq('ownerTokenIdentifier', ownerTokenIdentifier),
      )
      .unique()
    const profile = {
      ownerTokenIdentifier,
      birthDate: args.birthDate,
      heightCm: args.heightCm,
      weightKg: args.weightKg,
      physiology: args.physiology,
      dailyMovement: args.dailyMovement,
      exercise: args.exercise,
      weightGoal: args.weightGoal,
      calculationDate: args.calculationDate,
      calculationVersion: objective.calculationVersion,
      activityLevel: objective.activityLevel,
      maintenanceCalories: objective.maintenanceCalories,
      goalAdjustmentPercent: objective.goalAdjustmentPercent,
      updatedAt: Date.now(),
    }

    if (existingProfile) {
      await ctx.db.replace(existingProfile._id, profile)
    } else {
      await ctx.db.insert('nutritionProfiles', profile)
    }

    for (const target of objective.targets) {
      const existingTarget = await ctx.db
        .query('nutritionTargets')
        .withIndex('by_ownerTokenIdentifier_and_metric', (q) =>
          q
            .eq('ownerTokenIdentifier', ownerTokenIdentifier)
            .eq('metric', target.metric),
        )
        .unique()
      const savedTarget = {
        ...target,
        ownerTokenIdentifier,
        effectiveFrom: args.calculationDate,
      }

      if (existingTarget) {
        await ctx.db.replace(existingTarget._id, savedTarget)
      } else {
        await ctx.db.insert('nutritionTargets', savedTarget)
      }
    }

    await upsertWeightMeasurement(
      ctx,
      ownerTokenIdentifier,
      args.calculationDate,
      args.weightKg,
    )
    const currentDay = await ctx.db
      .query('dailyNutritionTotals')
      .withIndex('by_ownerTokenIdentifier_and_dateKey', (q) =>
        q
          .eq('ownerTokenIdentifier', ownerTokenIdentifier)
          .eq('dateKey', args.calculationDate),
      )
      .unique()
    if (currentDay) {
      const calorie = objective.targets.find(
        (target) => target.metric === 'calories',
      )
      const protein = objective.targets.find(
        (target) => target.metric === 'protein',
      )
      const fiber = objective.targets.find(
        (target) => target.metric === 'fiber',
      )
      await ctx.db.patch(currentDay._id, {
        goalSnapshot: {
          calorieTarget:
            calorie?.goal.kind === 'target' ? calorie.goal.target : undefined,
          proteinMinimum:
            protein?.goal.kind === 'range' ? protein.goal.minimum : undefined,
          proteinMaximum:
            protein?.goal.kind === 'range' ? protein.goal.maximum : undefined,
          fiberMinimum:
            fiber?.goal.kind === 'minimum' ? fiber.goal.minimum : undefined,
        },
      })
    }

    return objective
  },
})
