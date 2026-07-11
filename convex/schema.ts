import { defineSchema, defineTable } from 'convex/server'

import { nutritionTargetValidator } from './nutritionTargets'

export default defineSchema({
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
