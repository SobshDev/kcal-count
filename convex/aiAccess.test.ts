/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

import { api, internal } from './_generated/api'
import { AI_RATE_LIMIT_MAX_REQUESTS } from './aiPolicy'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

describe('AI account access', () => {
  it('requires an authenticated account', async () => {
    const t = convexTest(schema, modules)

    await expect(
      t.mutation(internal.aiAccess.authorize, { reservedTokens: 100 }),
    ).rejects.toMatchObject({
      data: { code: 'UNAUTHENTICATED' },
    })
  })

  it('reserves, records, and exposes account token usage', async () => {
    const t = convexTest(schema, modules).withIdentity({
      tokenIdentifier: 'https://clerk.test|account-1',
    })
    const reservation = await t.mutation(internal.aiAccess.authorize, {
      reservedTokens: 1_000,
    })

    await t.mutation(internal.aiAccess.complete, {
      reservationId: reservation.reservationId,
      inputTokens: 10,
      outputTokens: 5,
    })

    await expect(t.query(api.tokenUsage.current, {})).resolves.toMatchObject({
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
      requestCount: 1,
      tokenLimit: 100_000,
      reservedTokens: 0,
      remainingTokens: 99_985,
    })
  })

  it('blocks an account when it has no tokens left', async () => {
    const t = convexTest(schema, modules).withIdentity({
      tokenIdentifier: 'https://clerk.test|account-2',
    })
    const reservation = await t.mutation(internal.aiAccess.authorize, {
      reservedTokens: 100_000,
    })
    await t.mutation(internal.aiAccess.complete, {
      reservationId: reservation.reservationId,
      inputTokens: 100_000,
      outputTokens: 0,
    })

    await expect(
      t.mutation(internal.aiAccess.authorize, { reservedTokens: 1 }),
    ).rejects.toMatchObject({
      data: { code: 'TOKENS_EXHAUSTED', remainingTokens: 0 },
    })
  })

  it('limits each account to ten AI requests per minute', async () => {
    const t = convexTest(schema, modules).withIdentity({
      tokenIdentifier: 'https://clerk.test|account-3',
    })

    for (let request = 0; request < AI_RATE_LIMIT_MAX_REQUESTS; request += 1) {
      await t.mutation(internal.aiAccess.authorize, { reservedTokens: 1 })
    }

    await expect(
      t.mutation(internal.aiAccess.authorize, { reservedTokens: 1 }),
    ).rejects.toMatchObject({
      data: { code: 'RATE_LIMITED' },
    })
  })
})
