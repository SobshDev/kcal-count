import { ConvexError, v } from 'convex/values'

import type { Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import { internalMutation } from './_generated/server'
import {
  AI_RATE_LIMIT_MAX_REQUESTS,
  AI_RESERVATION_TTL_MS,
  DEFAULT_ACCOUNT_TOKEN_LIMIT,
  getRateLimitState,
} from './aiPolicy'
import { addTokenUsage, validateTokenCount } from './tokenUsageModel'

const emptyUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  requestCount: 0,
}

async function requireOwnerTokenIdentifier(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new ConvexError({
      code: 'UNAUTHENTICATED',
      message: 'You must be signed in to use AI',
    })
  }
  return identity.tokenIdentifier
}

export const authorize = internalMutation({
  args: { reservedTokens: v.number() },
  handler: async (ctx, args) => {
    const ownerTokenIdentifier = await requireOwnerTokenIdentifier(ctx)
    validateTokenCount(args.reservedTokens, 'reservedTokens')
    if (args.reservedTokens === 0) {
      throw new Error('reservedTokens must be greater than zero')
    }

    const now = Date.now()
    const currentRateLimit = await ctx.db
      .query('aiRateLimits')
      .withIndex('by_ownerTokenIdentifier', (q) =>
        q.eq('ownerTokenIdentifier', ownerTokenIdentifier),
      )
      .unique()
    const nextRateLimit = getRateLimitState(currentRateLimit, now)

    if (!nextRateLimit.allowed) {
      throw new ConvexError({
        code: 'RATE_LIMITED',
        message: `Too many AI requests. Try again in ${Math.ceil(nextRateLimit.retryAfterMs / 1_000)} seconds`,
        retryAfterMs: nextRateLimit.retryAfterMs,
      })
    }

    const expiredReservations = await ctx.db
      .query('aiTokenReservations')
      .withIndex('by_ownerTokenIdentifier_and_expiresAt', (q) =>
        q
          .eq('ownerTokenIdentifier', ownerTokenIdentifier)
          .lte('expiresAt', now),
      )
      .take(AI_RATE_LIMIT_MAX_REQUESTS * 4)
    const expiredTokenCount = expiredReservations.reduce(
      (total, reservation) => total + reservation.reservedTokens,
      0,
    )

    const accountLimit = await ctx.db
      .query('aiAccountLimits')
      .withIndex('by_ownerTokenIdentifier', (q) =>
        q.eq('ownerTokenIdentifier', ownerTokenIdentifier),
      )
      .unique()
    const usage = await ctx.db
      .query('accountTokenUsage')
      .withIndex('by_ownerTokenIdentifier', (q) =>
        q.eq('ownerTokenIdentifier', ownerTokenIdentifier),
      )
      .unique()
    const tokenLimit = accountLimit?.tokenLimit ?? DEFAULT_ACCOUNT_TOKEN_LIMIT
    const reservedTokens = Math.max(
      0,
      (accountLimit?.reservedTokens ?? 0) - expiredTokenCount,
    )
    const remainingTokens = Math.max(
      0,
      tokenLimit - (usage?.totalTokens ?? 0) - reservedTokens,
    )

    if (args.reservedTokens > remainingTokens) {
      throw new ConvexError({
        code: 'TOKENS_EXHAUSTED',
        message: 'You do not have enough tokens left for this request',
        remainingTokens,
      })
    }

    for (const reservation of expiredReservations) {
      await ctx.db.delete(reservation._id)
    }

    if (currentRateLimit) {
      await ctx.db.patch(currentRateLimit._id, {
        windowStartedAt: nextRateLimit.windowStartedAt,
        requestCount: nextRateLimit.requestCount,
      })
    } else {
      await ctx.db.insert('aiRateLimits', {
        ownerTokenIdentifier,
        windowStartedAt: nextRateLimit.windowStartedAt,
        requestCount: nextRateLimit.requestCount,
      })
    }

    const updatedReservedTokens = reservedTokens + args.reservedTokens
    if (accountLimit) {
      await ctx.db.patch(accountLimit._id, {
        reservedTokens: updatedReservedTokens,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('aiAccountLimits', {
        ownerTokenIdentifier,
        tokenLimit,
        reservedTokens: updatedReservedTokens,
        updatedAt: now,
      })
    }

    const reservationId = await ctx.db.insert('aiTokenReservations', {
      ownerTokenIdentifier,
      reservedTokens: args.reservedTokens,
      expiresAt: now + AI_RESERVATION_TTL_MS,
    })

    return {
      reservationId,
      remainingTokens: remainingTokens - args.reservedTokens,
    }
  },
})

export const complete = internalMutation({
  args: {
    reservationId: v.id('aiTokenReservations'),
    inputTokens: v.number(),
    outputTokens: v.number(),
  },
  handler: async (ctx, args) => {
    const ownerTokenIdentifier = await requireOwnerTokenIdentifier(ctx)
    validateTokenCount(args.inputTokens, 'inputTokens')
    validateTokenCount(args.outputTokens, 'outputTokens')

    const reservation = await getOwnedReservation(
      ctx,
      args.reservationId,
      ownerTokenIdentifier,
    )
    const accountLimit = await ctx.db
      .query('aiAccountLimits')
      .withIndex('by_ownerTokenIdentifier', (q) =>
        q.eq('ownerTokenIdentifier', ownerTokenIdentifier),
      )
      .unique()
    if (!accountLimit) throw new Error('AI account limit was not found')

    const existingUsage = await ctx.db
      .query('accountTokenUsage')
      .withIndex('by_ownerTokenIdentifier', (q) =>
        q.eq('ownerTokenIdentifier', ownerTokenIdentifier),
      )
      .unique()
    const totals = addTokenUsage(existingUsage ?? emptyUsage, args)
    const now = Date.now()

    if (existingUsage) {
      await ctx.db.patch(existingUsage._id, { ...totals, updatedAt: now })
    } else {
      await ctx.db.insert('accountTokenUsage', {
        ownerTokenIdentifier,
        ...totals,
        updatedAt: now,
      })
    }

    const reservedTokens = Math.max(
      0,
      accountLimit.reservedTokens - reservation.reservedTokens,
    )
    await ctx.db.patch(accountLimit._id, { reservedTokens, updatedAt: now })
    await ctx.db.delete(reservation._id)

    return {
      ...totals,
      remainingTokens: Math.max(
        0,
        accountLimit.tokenLimit - totals.totalTokens - reservedTokens,
      ),
    }
  },
})

export const release = internalMutation({
  args: { reservationId: v.id('aiTokenReservations') },
  handler: async (ctx, args) => {
    const ownerTokenIdentifier = await requireOwnerTokenIdentifier(ctx)
    const reservation = await ctx.db.get(args.reservationId)
    if (!reservation) return null
    if (reservation.ownerTokenIdentifier !== ownerTokenIdentifier) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'This token reservation belongs to another account',
      })
    }

    const accountLimit = await ctx.db
      .query('aiAccountLimits')
      .withIndex('by_ownerTokenIdentifier', (q) =>
        q.eq('ownerTokenIdentifier', ownerTokenIdentifier),
      )
      .unique()
    if (accountLimit) {
      await ctx.db.patch(accountLimit._id, {
        reservedTokens: Math.max(
          0,
          accountLimit.reservedTokens - reservation.reservedTokens,
        ),
        updatedAt: Date.now(),
      })
    }
    await ctx.db.delete(reservation._id)
    return null
  },
})

async function getOwnedReservation(
  ctx: MutationCtx,
  reservationId: Id<'aiTokenReservations'>,
  ownerTokenIdentifier: string,
) {
  const reservation = await ctx.db.get(reservationId)
  if (!reservation) throw new Error('AI token reservation was not found')
  if (reservation.ownerTokenIdentifier !== ownerTokenIdentifier) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'This token reservation belongs to another account',
    })
  }
  return reservation
}
