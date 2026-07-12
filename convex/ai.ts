import { ConvexError, v } from 'convex/values'

import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { action, env } from './_generated/server'
import {
  calculateTokenReservation,
  chatMessageValidator,
  DEFAULT_MAX_OUTPUT_TOKENS,
} from './aiPolicy'
import {
  getOpenRouterErrorMessage,
  parseOpenRouterCompletion,
} from './openRouterModel'

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-5.6-luna'

type AiChatResponse = {
  content: string
  model: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  remainingTokens: number
}

export const chat = action({
  args: {
    messages: v.array(chatMessageValidator),
    maxOutputTokens: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<AiChatResponse> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError({
        code: 'UNAUTHENTICATED',
        message: 'You must be signed in to use AI',
      })
    }

    const apiKey = env.OPENROUTER_API_KEY?.trim()
    if (!apiKey) {
      throw new ConvexError({
        code: 'AI_NOT_CONFIGURED',
        message: 'AI is not configured',
      })
    }

    const maxOutputTokens = args.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS
    let reservedTokens: number
    try {
      reservedTokens = calculateTokenReservation(args.messages, maxOutputTokens)
    } catch (error) {
      throw new ConvexError({
        code: 'INVALID_AI_REQUEST',
        message: error instanceof Error ? error.message : 'Invalid AI request',
      })
    }

    const reservation: {
      reservationId: Id<'aiTokenReservations'>
      remainingTokens: number
    } = await ctx.runMutation(internal.aiAccess.authorize, { reservedTokens })
    let reservationCompleted = false

    try {
      const response = await fetch(OPENROUTER_CHAT_URL, {
        method: 'POST',
        headers: createOpenRouterHeaders(apiKey),
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          model: env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL,
          messages: args.messages,
          max_tokens: maxOutputTokens,
          stream: false,
        }),
      })
      const payload: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        const providerMessage = getOpenRouterErrorMessage(
          typeof payload === 'object' && payload !== null && 'error' in payload
            ? payload.error
            : null,
        )
        throw new ConvexError({
          code: 'OPENROUTER_ERROR',
          message: providerMessage,
          status: response.status,
          retryAfter: response.headers.get('Retry-After'),
        })
      }
      if (typeof payload !== 'object' || payload === null) {
        throw new Error('OpenRouter returned an invalid response')
      }

      const completion = parseOpenRouterCompletion(payload)
      const totals: { remainingTokens: number } = await ctx.runMutation(
        internal.aiAccess.complete,
        {
          reservationId: reservation.reservationId,
          inputTokens: completion.inputTokens,
          outputTokens: completion.outputTokens,
        },
      )
      reservationCompleted = true

      return {
        content: completion.content,
        model: completion.model,
        usage: {
          inputTokens: completion.inputTokens,
          outputTokens: completion.outputTokens,
          totalTokens: completion.totalTokens,
        },
        remainingTokens: totals.remainingTokens,
      }
    } catch (error) {
      if (!reservationCompleted) {
        await ctx.runMutation(internal.aiAccess.release, {
          reservationId: reservation.reservationId,
        })
      }
      if (error instanceof ConvexError) throw error
      throw new ConvexError({
        code: 'AI_REQUEST_FAILED',
        message: error instanceof Error ? error.message : 'AI request failed',
      })
    }
  },
})

function createOpenRouterHeaders(apiKey: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
  if (env.OPENROUTER_APP_URL) {
    headers['HTTP-Referer'] = env.OPENROUTER_APP_URL
  }
  if (env.OPENROUTER_APP_TITLE) {
    headers['X-OpenRouter-Title'] = env.OPENROUTER_APP_TITLE
  }
  return headers
}
