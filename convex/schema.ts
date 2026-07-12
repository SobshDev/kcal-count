import { defineSchema, defineTable } from 'convex/server'

import { nutritionProfileValidator } from './nutritionProfiles'
import { nutritionTargetValidator } from './nutritionTargets'

export default defineSchema({
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
