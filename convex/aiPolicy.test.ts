import { describe, expect, it } from 'vitest'

import {
  AI_RATE_LIMIT_MAX_REQUESTS,
  AI_RATE_LIMIT_WINDOW_MS,
  calculateTokenReservation,
  getRateLimitState,
  MAX_CHAT_INPUT_BYTES,
} from './aiPolicy'

describe('AI access policy', () => {
  it('reserves a conservative input bound plus output tokens', () => {
    expect(
      calculateTokenReservation([{ role: 'user', content: 'hello' }], 100),
    ).toBe(121)
  })

  it('rejects oversized prompts', () => {
    expect(() =>
      calculateTokenReservation(
        [{ role: 'user', content: 'a'.repeat(MAX_CHAT_INPUT_BYTES + 1) }],
        100,
      ),
    ).toThrow(`message content cannot exceed ${MAX_CHAT_INPUT_BYTES} bytes`)
  })

  it('blocks requests after the per-minute account limit', () => {
    const state = getRateLimitState(
      { windowStartedAt: 1_000, requestCount: AI_RATE_LIMIT_MAX_REQUESTS },
      2_000,
    )

    expect(state).toEqual({
      allowed: false,
      windowStartedAt: 1_000,
      requestCount: AI_RATE_LIMIT_MAX_REQUESTS,
      retryAfterMs: AI_RATE_LIMIT_WINDOW_MS - 1_000,
    })
  })

  it('starts a fresh rate-limit window after one minute', () => {
    expect(
      getRateLimitState(
        { windowStartedAt: 1_000, requestCount: AI_RATE_LIMIT_MAX_REQUESTS },
        1_000 + AI_RATE_LIMIT_WINDOW_MS,
      ),
    ).toMatchObject({ allowed: true, requestCount: 1 })
  })
})
