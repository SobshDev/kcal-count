import { describe, expect, it } from 'vitest'

import { addTokenUsage, validateTokenCount } from './tokenUsageModel'

describe('token usage', () => {
  it('adds input and output tokens to an account total', () => {
    expect(
      addTokenUsage(
        {
          inputTokens: 100,
          outputTokens: 40,
          totalTokens: 140,
          requestCount: 2,
        },
        { inputTokens: 25, outputTokens: 10 },
      ),
    ).toEqual({
      inputTokens: 125,
      outputTokens: 50,
      totalTokens: 175,
      requestCount: 3,
    })
  })

  it('counts requests that use zero tokens', () => {
    expect(addTokenUsage({ ...emptyUsage }, emptyIncrement)).toEqual({
      ...emptyUsage,
      requestCount: 1,
    })
  })

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid token count %s',
    (value) => {
      expect(() => validateTokenCount(value, 'inputTokens')).toThrow(
        'inputTokens must be a non-negative safe integer',
      )
    },
  )

  it('rejects totals that exceed the safe integer range', () => {
    expect(() =>
      addTokenUsage(
        {
          inputTokens: Number.MAX_SAFE_INTEGER,
          outputTokens: 0,
          totalTokens: Number.MAX_SAFE_INTEGER,
          requestCount: 1,
        },
        { inputTokens: 1, outputTokens: 0 },
      ),
    ).toThrow('inputTokens total must be a non-negative safe integer')
  })
})

const emptyUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  requestCount: 0,
}

const emptyIncrement = { inputTokens: 0, outputTokens: 0 }
