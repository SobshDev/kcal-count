import { defineSchema, defineTable } from 'convex/server'

import {
  aiAccountLimitValidator,
  aiRateLimitValidator,
  aiTokenReservationValidator,
} from './aiPolicy'
import { nutritionProfileValidator } from './nutritionProfiles'
import { nutritionTargetValidator } from './nutritionTargets'
import { accountTokenUsageValidator } from './tokenUsageModel'

export default defineSchema({
  aiAccountLimits: defineTable(aiAccountLimitValidator).index(
    'by_ownerTokenIdentifier',
    ['ownerTokenIdentifier'],
  ),
  aiRateLimits: defineTable(aiRateLimitValidator).index(
    'by_ownerTokenIdentifier',
    ['ownerTokenIdentifier'],
  ),
  aiTokenReservations: defineTable(aiTokenReservationValidator).index(
    'by_ownerTokenIdentifier_and_expiresAt',
    ['ownerTokenIdentifier', 'expiresAt'],
  ),
  accountTokenUsage: defineTable(accountTokenUsageValidator).index(
    'by_ownerTokenIdentifier',
    ['ownerTokenIdentifier'],
  ),
  nutritionProfiles: defineTable(nutritionProfileValidator).index(
    'by_ownerTokenIdentifier',
    ['ownerTokenIdentifier'],
  ),
  nutritionTargets: defineTable(nutritionTargetValidator)
    .index('by_ownerTokenIdentifier_and_metric', [
      'ownerTokenIdentifier',
      'metric',
    ])
    .index('by_ownerTokenIdentifier_and_effectiveFrom', [
      'ownerTokenIdentifier',
      'effectiveFrom',
    ]),
})
