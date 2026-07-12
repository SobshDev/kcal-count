import { describe, expect, it } from 'vitest'

import { defaultChatTitle, validateNewMessage } from './chatModel'

describe('chat model', () => {
  it('normalizes an initial message into a bounded title', () => {
    expect(defaultChatTitle('  hello\n   there  ')).toBe('hello there')
  })

  it('rejects empty messages', () => {
    expect(() => validateNewMessage('   ')).toThrow('cannot be empty')
  })
})
