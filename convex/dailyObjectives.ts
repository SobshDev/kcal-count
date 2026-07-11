import { query } from './_generated/server'
import {
  calculateDailyObjective,
  dailyObjectiveInputValidator,
} from './nutritionCalculator'

export const preview = query({
  args: dailyObjectiveInputValidator.fields,
  handler: (_ctx, args) => calculateDailyObjective(args),
})
