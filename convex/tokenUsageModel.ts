import type { Infer } from 'convex/values'
import { v } from 'convex/values'

export const accountTokenUsageValidator = v.object({
  ownerTokenIdentifier: v.string(),
  inputTokens: v.number(),
  outputTokens: v.number(),
  totalTokens: v.number(),
  requestCount: v.number(),
  updatedAt: v.number(),
})

export type AccountTokenUsage = Infer<typeof accountTokenUsageValidator>

export type TokenUsageIncrement = Pick<
  AccountTokenUsage,
  'inputTokens' | 'outputTokens'
>

export function isUsageFromCurrentUtcDay(
  usage: Pick<AccountTokenUsage, 'updatedAt'> | null,
  now: number,
) {
  if (!usage) return false
  const usageDate = new Date(usage.updatedAt)
  const currentDate = new Date(now)
  return (
    usageDate.getUTCFullYear() === currentDate.getUTCFullYear() &&
    usageDate.getUTCMonth() === currentDate.getUTCMonth() &&
    usageDate.getUTCDate() === currentDate.getUTCDate()
  )
}

export function validateTokenCount(value: number, fieldName: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative safe integer`)
  }
}

export function addTokenUsage(
  current: Pick<
    AccountTokenUsage,
    'inputTokens' | 'outputTokens' | 'totalTokens' | 'requestCount'
  >,
  increment: TokenUsageIncrement,
) {
  validateTokenCount(increment.inputTokens, 'inputTokens')
  validateTokenCount(increment.outputTokens, 'outputTokens')

  const inputTokens = current.inputTokens + increment.inputTokens
  const outputTokens = current.outputTokens + increment.outputTokens
  const totalTokens = inputTokens + outputTokens
  const requestCount = current.requestCount + 1

  validateTokenCount(inputTokens, 'inputTokens total')
  validateTokenCount(outputTokens, 'outputTokens total')
  validateTokenCount(totalTokens, 'totalTokens')
  validateTokenCount(requestCount, 'requestCount')

  return { inputTokens, outputTokens, totalTokens, requestCount }
}
