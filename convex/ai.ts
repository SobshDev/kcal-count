import { ConvexError, v } from 'convex/values'

import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import type { ActionCtx } from './_generated/server'
import { action, env } from './_generated/server'
import type { ChatMessage } from './aiPolicy'
import {
  calculateTokenReservation,
  chatMessageValidator,
  DEFAULT_MAX_OUTPUT_TOKENS,
} from './aiPolicy'
import { mealAnalysisResponseFormat, parseMealAnalysis } from './mealAnalysis'
import { validateDateKey } from './mealEntriesModel'
import type { OpenRouterCompletion } from './openRouterModel'
import {
  getOpenRouterErrorMessage,
  parseOpenRouterCompletion,
} from './openRouterModel'

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-5.6-luna'
const MEAL_ANALYSIS_MAX_OUTPUT_TOKENS = 400
const MEAL_PHOTO_TOKEN_RESERVATION = 4_096

type OpenRouterMessage =
  | ChatMessage
  | {
      role: 'user'
      content: Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } }
      >
    }

type CompletionResult = OpenRouterCompletion & {
  remainingTokens: number
}

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
    const reservedTokens = calculateReservationOrThrow(
      args.messages,
      args.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    )
    const completion = await requestOpenRouterCompletion(
      ctx,
      args.messages,
      args.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      reservedTokens,
    )

    return {
      content: completion.content,
      model: completion.model,
      usage: {
        inputTokens: completion.inputTokens,
        outputTokens: completion.outputTokens,
        totalTokens: completion.totalTokens,
      },
      remainingTokens: completion.remainingTokens,
    }
  },
})

export const analyzeMeal = action({
  args: {
    description: v.string(),
    dateKey: v.string(),
    localMinutes: v.number(),
    photoId: v.optional(v.id('mealPhotos')),
  },
  handler: async (ctx, args) => {
    const description = args.description.trim()
    if ((!description && !args.photoId) || description.length > 2_000) {
      throw new ConvexError({
        code: 'INVALID_MEAL_DESCRIPTION',
        message: 'Add a description, a photo, or both',
      })
    }
    try {
      validateDateKey(args.dateKey)
    } catch (error) {
      throw new ConvexError({
        code: 'INVALID_MEAL_DATE',
        message: error instanceof Error ? error.message : 'Invalid meal date',
      })
    }
    if (
      !Number.isInteger(args.localMinutes) ||
      args.localMinutes < 0 ||
      args.localMinutes > 1_439
    ) {
      throw new ConvexError({
        code: 'INVALID_LOCAL_TIME',
        message: 'Local meal time must be between 00:00 and 23:59',
      })
    }

    const photo: { storageId: Id<'_storage'>; url: string } | null =
      args.photoId
        ? await ctx.runQuery(internal.mealPhotos.getForAnalysis, {
            photoId: args.photoId,
          })
        : null
    const localHour = String(Math.floor(args.localMinutes / 60)).padStart(
      2,
      '0',
    )
    const localMinute = String(args.localMinutes % 60).padStart(2, '0')
    const mealPrompt = description
      ? `Meal description: ${description}`
      : 'Estimate the nutrition shown in this meal photo.'
    const textPrompt = `${mealPrompt}\nUser local logging time: ${localHour}:${localMinute}. Use the food and time together to classify breakfast, lunch, dinner, or snack.`
    const analysisMessages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'Estimate the nutrition for the described or photographed meal. Use typical portions when quantities are missing. Include fiber, fruit and vegetable weight, added sugar, saturated fat, sodium, and total water from food and drinks. Return only the requested JSON. Keep the meal name concise. Nutrition values must describe the entire meal.',
      },
      { role: 'user', content: textPrompt },
    ]
    const openRouterMessages: OpenRouterMessage[] = photo
      ? [
          analysisMessages[0],
          {
            role: 'user',
            content: [
              { type: 'text', text: textPrompt },
              { type: 'image_url', image_url: { url: photo.url } },
            ],
          },
        ]
      : analysisMessages
    const reservedTokens =
      calculateReservationOrThrow(
        analysisMessages,
        MEAL_ANALYSIS_MAX_OUTPUT_TOKENS,
      ) + (photo ? MEAL_PHOTO_TOKEN_RESERVATION : 0)

    const completion = await requestOpenRouterCompletion(
      ctx,
      openRouterMessages,
      MEAL_ANALYSIS_MAX_OUTPUT_TOKENS,
      reservedTokens,
      mealAnalysisResponseFormat,
    )
    const analysis = parseMealAnalysis(completion.content)
    const saved: {
      mealId: Id<'mealEntries'>
      totalCalories: number
      mealCount: number
    } = await ctx.runMutation(internal.mealEntries.saveAnalyzed, {
      dateKey: args.dateKey,
      description,
      ...analysis,
      model: completion.model,
      photoStorageId: photo?.storageId,
    })

    return {
      mealId: saved.mealId,
      meal: analysis,
      totalCalories: saved.totalCalories,
      mealCount: saved.mealCount,
      remainingTokens: completion.remainingTokens,
    }
  },
})

async function requestOpenRouterCompletion(
  ctx: ActionCtx,
  messages: OpenRouterMessage[],
  maxOutputTokens: number,
  reservedTokens: number,
  responseFormat?: object,
): Promise<CompletionResult> {
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
        messages,
        max_tokens: maxOutputTokens,
        response_format: responseFormat,
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

    return { ...completion, remainingTokens: totals.remainingTokens }
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
}

function calculateReservationOrThrow(
  messages: ChatMessage[],
  maxOutputTokens: number,
) {
  try {
    return calculateTokenReservation(messages, maxOutputTokens)
  } catch (error) {
    throw new ConvexError({
      code: 'INVALID_AI_REQUEST',
      message: error instanceof Error ? error.message : 'Invalid AI request',
    })
  }
}

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
