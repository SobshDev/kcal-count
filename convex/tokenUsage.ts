import { v } from 'convex/values'

import { internalMutation, query } from './_generated/server'
import { DEFAULT_ACCOUNT_TOKEN_LIMIT } from './aiPolicy'
import {
  addTokenUsage,
  isUsageFromCurrentUtcDay,
  validateTokenCount,
} from './tokenUsageModel'

const emptyUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  requestCount: 0,
}

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const usage = await ctx.db
      .query('accountTokenUsage')
      .withIndex('by_ownerTokenIdentifier', (q) =>
        q.eq('ownerTokenIdentifier', identity.tokenIdentifier),
      )
      .unique()
    const accountLimit = await ctx.db
      .query('aiAccountLimits')
      .withIndex('by_ownerTokenIdentifier', (q) =>
        q.eq('ownerTokenIdentifier', identity.tokenIdentifier),
      )
      .unique()
    const tokenLimit = accountLimit?.tokenLimit ?? DEFAULT_ACCOUNT_TOKEN_LIMIT
    const reservedTokens = accountLimit?.reservedTokens ?? 0
    const currentUsage = isUsageFromCurrentUtcDay(usage, Date.now())
      ? usage
      : null

    if (!currentUsage) {
      return {
        ...emptyUsage,
        tokenLimit,
        reservedTokens,
        remainingTokens: Math.max(0, tokenLimit - reservedTokens),
        updatedAt: null,
      }
    }

    return {
      inputTokens: currentUsage.inputTokens,
      outputTokens: currentUsage.outputTokens,
      totalTokens: currentUsage.totalTokens,
      requestCount: currentUsage.requestCount,
      tokenLimit,
      reservedTokens,
      remainingTokens: Math.max(
        0,
        tokenLimit - currentUsage.totalTokens - reservedTokens,
      ),
      updatedAt: currentUsage.updatedAt,
    }
  },
})

export const record = internalMutation({
  args: {
    ownerTokenIdentifier: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
  },
  handler: async (ctx, args) => {
    if (!args.ownerTokenIdentifier.trim()) {
      throw new Error('ownerTokenIdentifier is required')
    }
    validateTokenCount(args.inputTokens, 'inputTokens')
    validateTokenCount(args.outputTokens, 'outputTokens')

    const existing = await ctx.db
      .query('accountTokenUsage')
      .withIndex('by_ownerTokenIdentifier', (q) =>
        q.eq('ownerTokenIdentifier', args.ownerTokenIdentifier),
      )
      .unique()
    const updatedAt = Date.now()
    const currentUsage = isUsageFromCurrentUtcDay(existing, updatedAt)
      ? existing
      : null
    const totals = addTokenUsage(currentUsage ?? emptyUsage, args)

    if (existing) {
      await ctx.db.patch(existing._id, { ...totals, updatedAt })
    } else {
      await ctx.db.insert('accountTokenUsage', {
        ownerTokenIdentifier: args.ownerTokenIdentifier,
        ...totals,
        updatedAt,
      })
    }

    return totals
  },
})
