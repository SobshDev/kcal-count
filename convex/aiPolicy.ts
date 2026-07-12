import { v } from 'convex/values'

export const DEFAULT_ACCOUNT_TOKEN_LIMIT = 100_000
export const AI_RATE_LIMIT_MAX_REQUESTS = 10
export const AI_RATE_LIMIT_WINDOW_MS = 60_000
export const AI_RESERVATION_TTL_MS = 2 * 60_000
export const DEFAULT_MAX_OUTPUT_TOKENS = 512
export const MAX_OUTPUT_TOKENS = 2_048
export const MAX_CHAT_MESSAGES = 20
export const MAX_CHAT_INPUT_BYTES = 24_000

export const chatRoleValidator = v.union(
  v.literal('system'),
  v.literal('user'),
  v.literal('assistant'),
)

export const chatMessageValidator = v.object({
  role: chatRoleValidator,
  content: v.string(),
})

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export const aiAccountLimitValidator = v.object({
  ownerTokenIdentifier: v.string(),
  tokenLimit: v.number(),
  reservedTokens: v.number(),
  updatedAt: v.number(),
})

export const aiRateLimitValidator = v.object({
  ownerTokenIdentifier: v.string(),
  windowStartedAt: v.number(),
  requestCount: v.number(),
})

export const aiTokenReservationValidator = v.object({
  ownerTokenIdentifier: v.string(),
  reservedTokens: v.number(),
  expiresAt: v.number(),
})

export function validateChatRequest(
  messages: ChatMessage[],
  maxOutputTokens: number,
) {
  if (messages.length === 0 || messages.length > MAX_CHAT_MESSAGES) {
    throw new Error(
      `messages must contain between 1 and ${MAX_CHAT_MESSAGES} items`,
    )
  }
  if (
    !Number.isSafeInteger(maxOutputTokens) ||
    maxOutputTokens < 1 ||
    maxOutputTokens > MAX_OUTPUT_TOKENS
  ) {
    throw new Error(
      `maxOutputTokens must be an integer between 1 and ${MAX_OUTPUT_TOKENS}`,
    )
  }

  const inputBytes = messages.reduce((total, message) => {
    if (!message.content.trim()) {
      throw new Error('message content cannot be empty')
    }
    return total + new TextEncoder().encode(message.content).byteLength
  }, 0)

  if (inputBytes > MAX_CHAT_INPUT_BYTES) {
    throw new Error(
      `message content cannot exceed ${MAX_CHAT_INPUT_BYTES} bytes`,
    )
  }

  return inputBytes
}

export function calculateTokenReservation(
  messages: ChatMessage[],
  maxOutputTokens: number,
) {
  const inputBytes = validateChatRequest(messages, maxOutputTokens)

  // A tokenizer token cannot contain less than one input byte. Reserving the
  // UTF-8 byte count plus per-message overhead is intentionally conservative.
  return inputBytes + messages.length * 16 + maxOutputTokens
}

export function getRateLimitState(
  current: { windowStartedAt: number; requestCount: number } | null,
  now: number,
) {
  if (!current || now - current.windowStartedAt >= AI_RATE_LIMIT_WINDOW_MS) {
    return {
      allowed: true as const,
      windowStartedAt: now,
      requestCount: 1,
      retryAfterMs: 0,
    }
  }

  if (current.requestCount >= AI_RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false as const,
      windowStartedAt: current.windowStartedAt,
      requestCount: current.requestCount,
      retryAfterMs: Math.max(
        1,
        current.windowStartedAt + AI_RATE_LIMIT_WINDOW_MS - now,
      ),
    }
  }

  return {
    allowed: true as const,
    windowStartedAt: current.windowStartedAt,
    requestCount: current.requestCount + 1,
    retryAfterMs: 0,
  }
}
