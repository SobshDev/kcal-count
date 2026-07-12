import { v } from 'convex/values'

import { internalMutation, query } from './_generated/server'
import { DEFAULT_ACCOUNT_TOKEN_LIMIT } from './aiPolicy'
import { addTokenUsage, validateTokenCount } from './tokenUsageModel'

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

    if (!usage) {
      return {
        ...emptyUsage,
        tokenLimit,
        reservedTokens,
        remainingTokens: Math.max(0, tokenLimit - reservedTokens),
        updatedAt: null,
      }
    }

    return {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      requestCount: usage.requestCount,
      tokenLimit,
      reservedTokens,
      remainingTokens: Math.max(
        0,
        tokenLimit - usage.totalTokens - reservedTokens,
      ),
      updatedAt: usage.updatedAt,
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
    const totals = addTokenUsage(existing ?? emptyUsage, args)
    const updatedAt = Date.now()

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
