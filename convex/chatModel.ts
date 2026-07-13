import type { Infer } from 'convex/values'
import { v } from 'convex/values'

export const CHAT_RETENTION_MS = 14 * 24 * 60 * 60 * 1_000
export const CHAT_COMPACTION_THRESHOLD_TOKENS = 200_000
export const CHAT_RECENT_MESSAGE_COUNT = 12
export const CHAT_STREAM_FLUSH_INTERVAL_MS = 250
export const CHAT_STREAM_FLUSH_MIN_CHARS = 80
export const MAX_CHAT_MESSAGE_BYTES = 100_000
export const MAX_CHAT_TITLE_LENGTH = 120

export const chatValidator = v.object({
  ownerTokenIdentifier: v.string(),
  title: v.string(),
  status: v.union(v.literal('active'), v.literal('streaming')),
  model: v.optional(v.string()),
  inputTokens: v.number(),
  outputTokens: v.number(),
  compactedTokens: v.number(),
  summary: v.optional(v.string()),
  summaryThroughSequence: v.optional(v.number()),
  nextSequence: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
  expiresAt: v.number(),
})

export const persistedChatRoleValidator = v.union(
  v.literal('user'),
  v.literal('assistant'),
)

export const chatMessageStatusValidator = v.union(
  v.literal('pending'),
  v.literal('streaming'),
  v.literal('complete'),
  v.literal('failed'),
)

export const persistedChatMessageValidator = v.object({
  chatId: v.id('chats'),
  ownerTokenIdentifier: v.string(),
  sequence: v.number(),
  role: persistedChatRoleValidator,
  content: v.string(),
  status: chatMessageStatusValidator,
  model: v.optional(v.string()),
  inputTokens: v.optional(v.number()),
  outputTokens: v.optional(v.number()),
  error: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

export type PersistedChat = Infer<typeof chatValidator>
export type PersistedChatMessage = Infer<typeof persistedChatMessageValidator>

export function validateNewMessage(content: string) {
  const trimmed = content.trim()
  if (!trimmed) throw new Error('Message content cannot be empty')
  if (new TextEncoder().encode(trimmed).byteLength > MAX_CHAT_MESSAGE_BYTES) {
    throw new Error(
      `Message content cannot exceed ${MAX_CHAT_MESSAGE_BYTES} bytes`,
    )
  }
  return trimmed
}

export function defaultChatTitle(content: string) {
  const oneLine = content.replace(/\s+/g, ' ').trim()
  return oneLine.slice(0, MAX_CHAT_TITLE_LENGTH) || 'New chat'
}
