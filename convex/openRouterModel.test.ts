import { describe, expect, it } from 'vitest'

import { parseOpenRouterCompletion } from './openRouterModel'

describe('OpenRouter response parsing', () => {
  it('reads text and native token usage from a completion', () => {
    expect(
      parseOpenRouterCompletion({
        model: 'openai/gpt-5.2',
        choices: [{ message: { content: 'Hello!' } }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 4,
          total_tokens: 14,
        },
      }),
    ).toEqual({
      content: 'Hello!',
      model: 'openai/gpt-5.2',
      inputTokens: 10,
      outputTokens: 4,
      totalTokens: 14,
    })
  })

  it('rejects missing or inconsistent token usage', () => {
    expect(() =>
      parseOpenRouterCompletion({
        model: 'openai/gpt-5.2',
        choices: [{ message: { content: 'Hello!' } }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 4,
          total_tokens: 12,
        },
      }),
    ).toThrow('OpenRouter returned inconsistent token usage')
  })
})
