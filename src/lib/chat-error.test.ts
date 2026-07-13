import { describe, expect, it } from 'vitest'

import { getChatErrorMessage } from './chat-error'

const friendlyMessage =
  'You don\u2019t have enough AI tokens left for this message. Try a shorter message or come back tomorrow.'

describe('getChatErrorMessage', () => {
  it('maps structured token exhaustion errors', () => {
    expect(
      getChatErrorMessage({
        data: {
          code: 'TOKENS_EXHAUSTED',
          message: 'You do not have enough tokens left for this request',
          remainingTokens: 8_134,
        },
      }),
    ).toBe(friendlyMessage)
  })

  it('maps serialized token exhaustion errors saved on failed messages', () => {
    expect(
      getChatErrorMessage(
        'Uncaught ConvexError: {"code":"TOKENS_EXHAUSTED","remainingTokens":8134}',
      ),
    ).toBe(friendlyMessage)
  })

  it('preserves other server messages', () => {
    expect(getChatErrorMessage({ data: { message: 'Chat expired' } })).toBe(
      'Chat expired',
    )
  })
})
