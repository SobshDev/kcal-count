import { describe, expect, it } from 'vitest'

import {
  applyOpenRouterStreamChunk,
  parseOpenRouterCompletion,
  parseSseData,
} from './openRouterModel'

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

describe('OpenRouter streaming parsing', () => {
  it('accumulates deltas and reads usage from the final chunk', () => {
    let state = applyOpenRouterStreamChunk(
      { content: '' },
      { model: 'openai/gpt-5.2', choices: [{ delta: { content: 'Hi' } }] },
    )
    state = applyOpenRouterStreamChunk(state, {
      choices: [{ delta: { content: ' there' } }],
      usage: { prompt_tokens: 9, completion_tokens: 2, total_tokens: 11 },
    })
    expect(state).toEqual({
      content: 'Hi there',
      model: 'openai/gpt-5.2',
      inputTokens: 9,
      outputTokens: 2,
      totalTokens: 11,
    })
  })

  it('parses complete SSE events and ignores comment lines', () => {
    expect(
      parseSseData(
        ': OPENROUTER PROCESSING\n\ndata: {"choices":[]}\n\ndata: [DONE]\n\npartial',
      ),
    ).toEqual({ events: ['{"choices":[]}', '[DONE]'], remainder: 'partial' })
  })
})
