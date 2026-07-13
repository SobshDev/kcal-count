import { ConvexError, v } from 'convex/values'

import type { Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import {
  CHAT_RETENTION_MS,
  defaultChatTitle,
  validateNewMessage,
} from './chatModel'
import { buildDynamicUserContext } from './chatContext'
import { shiftDateKey } from './statisticsModel'
import { getCurrentStreakLength } from './statisticsAggregation'

const LIST_LIMIT = 100
const MESSAGE_LIMIT = 1_000

async function requireOwner(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new ConvexError({
      code: 'UNAUTHENTICATED',
      message: 'You must be signed in',
    })
  }
  return identity.tokenIdentifier
}

async function requireOwnedChat(
  ctx: QueryCtx | MutationCtx,
  chatId: Id<'chats'>,
  ownerTokenIdentifier: string,
) {
  const chat = await ctx.db.get(chatId)
  if (!chat || chat.ownerTokenIdentifier !== ownerTokenIdentifier) {
    throw new ConvexError({
      code: 'CHAT_NOT_FOUND',
      message: 'Chat was not found',
    })
  }
  if (chat.expiresAt <= Date.now()) {
    throw new ConvexError({
      code: 'CHAT_EXPIRED',
      message: 'This chat has expired',
    })
  }
  return chat
}

export const create = mutation({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const ownerTokenIdentifier = await requireOwner(ctx)
    const now = Date.now()
    const title = args.title?.trim().slice(0, 120) || 'New chat'
    return await ctx.db.insert('chats', {
      ownerTokenIdentifier,
      title,
      status: 'active',
      inputTokens: 0,
      outputTokens: 0,
      compactedTokens: 0,
      nextSequence: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: now + CHAT_RETENTION_MS,
    })
  },
})

export const list = query({
  args: {},
  handler: async (ctx) => {
    const ownerTokenIdentifier = await requireOwner(ctx)
    const now = Date.now()
    const chats = await ctx.db
      .query('chats')
      .withIndex('by_ownerTokenIdentifier_and_updatedAt', (q) =>
        q.eq('ownerTokenIdentifier', ownerTokenIdentifier),
      )
      .order('desc')
      .take(LIST_LIMIT)
    return chats.filter((chat) => chat.expiresAt > now)
  },
})

export const get = query({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx)
    return await requireOwnedChat(ctx, args.chatId, owner)
  },
})

export const messages = query({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx)
    await requireOwnedChat(ctx, args.chatId, owner)
    return await ctx.db
      .query('chatMessages')
      .withIndex('by_chatId_and_sequence', (q) => q.eq('chatId', args.chatId))
      .order('asc')
      .take(MESSAGE_LIMIT)
  },
})

export const remove = mutation({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx)
    await requireOwnedChat(ctx, args.chatId, owner)
    const rows = await ctx.db
      .query('chatMessages')
      .withIndex('by_chatId_and_sequence', (q) => q.eq('chatId', args.chatId))
      .take(MESSAGE_LIMIT)
    for (const row of rows) await ctx.db.delete(row._id)
    await ctx.db.delete(args.chatId)
    return null
  },
})

export const beginTurn = internalMutation({
  args: { chatId: v.id('chats'), content: v.string() },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx)
    const chat = await requireOwnedChat(ctx, args.chatId, owner)
    if (chat.status === 'streaming') {
      throw new ConvexError({
        code: 'CHAT_BUSY',
        message: 'Wait for the current response',
      })
    }
    let content: string
    try {
      content = validateNewMessage(args.content)
    } catch (error) {
      throw new ConvexError({
        code: 'INVALID_CHAT_MESSAGE',
        message: error instanceof Error ? error.message : 'Invalid message',
      })
    }
    const now = Date.now()
    const userSequence = chat.nextSequence
    const assistantSequence = userSequence + 1
    const userMessageId = await ctx.db.insert('chatMessages', {
      chatId: chat._id,
      ownerTokenIdentifier: owner,
      sequence: userSequence,
      role: 'user',
      content,
      status: 'complete',
      createdAt: now,
      updatedAt: now,
    })
    const assistantMessageId = await ctx.db.insert('chatMessages', {
      chatId: chat._id,
      ownerTokenIdentifier: owner,
      sequence: assistantSequence,
      role: 'assistant',
      content: '',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })
    await ctx.db.patch(chat._id, {
      title:
        chat.nextSequence === 0 && chat.title === 'New chat'
          ? defaultChatTitle(content)
          : chat.title,
      status: 'streaming',
      nextSequence: assistantSequence + 1,
      updatedAt: now,
      expiresAt: now + CHAT_RETENTION_MS,
    })
    return { userMessageId, assistantMessageId }
  },
})

export const context = internalQuery({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx)
    const chat = await requireOwnedChat(ctx, args.chatId, owner)
    const chatMessages = await ctx.db
      .query('chatMessages')
      .withIndex('by_chatId_and_sequence', (q) => q.eq('chatId', args.chatId))
      .order('asc')
      .take(MESSAGE_LIMIT)
    return {
      chat,
      messages: chatMessages.filter((message) => message.status === 'complete'),
    }
  },
})

export const dynamicUserContext = internalQuery({
  args: {
    todayDateKey: v.string(),
    localDateTime: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx)
    const sevenDaysAgo = shiftDateKey(args.todayDateKey, -6)
    const fourteenDaysAgo = shiftDateKey(args.todayDateKey, -13)
    const thirtyDaysAgo = shiftDateKey(args.todayDateKey, -29)
    const [profile, targets, today, recentDays, recentMeals, weights, streak] =
      await Promise.all([
        ctx.db
          .query('nutritionProfiles')
          .withIndex('by_ownerTokenIdentifier', (q) =>
            q.eq('ownerTokenIdentifier', owner),
          )
          .unique(),
        ctx.db
          .query('nutritionTargets')
          .withIndex('by_ownerTokenIdentifier_and_metric', (q) =>
            q.eq('ownerTokenIdentifier', owner),
          )
          .take(8),
        ctx.db
          .query('dailyNutritionTotals')
          .withIndex('by_ownerTokenIdentifier_and_dateKey', (q) =>
            q
              .eq('ownerTokenIdentifier', owner)
              .eq('dateKey', args.todayDateKey),
          )
          .unique(),
        ctx.db
          .query('dailyNutritionTotals')
          .withIndex('by_ownerTokenIdentifier_and_dateKey', (q) =>
            q
              .eq('ownerTokenIdentifier', owner)
              .gte('dateKey', sevenDaysAgo)
              .lte('dateKey', args.todayDateKey),
          )
          .take(7),
        ctx.db
          .query('mealEntries')
          .withIndex('by_ownerTokenIdentifier_and_dateKey', (q) =>
            q
              .eq('ownerTokenIdentifier', owner)
              .gte('dateKey', fourteenDaysAgo)
              .lte('dateKey', args.todayDateKey),
          )
          .order('desc')
          .take(20),
        ctx.db
          .query('weightMeasurements')
          .withIndex('by_ownerTokenIdentifier_and_dateKey', (q) =>
            q
              .eq('ownerTokenIdentifier', owner)
              .gte('dateKey', thirtyDaysAgo)
              .lte('dateKey', args.todayDateKey),
          )
          .take(30),
        ctx.db
          .query('loggingStreaks')
          .withIndex('by_ownerTokenIdentifier_and_endDateKey', (q) =>
            q
              .eq('ownerTokenIdentifier', owner)
              .gte('endDateKey', shiftDateKey(args.todayDateKey, -1)),
          )
          .order('desc')
          .first(),
      ])
    return buildDynamicUserContext({
      localDateTime: args.localDateTime,
      timezone: args.timezone,
      profile,
      targets,
      today,
      recentDays,
      recentMeals: recentMeals.reverse(),
      weights,
      currentStreak: getCurrentStreakLength(streak, args.todayDateKey),
    })
  },
})

export const updateStream = internalMutation({
  args: {
    messageId: v.id('chatMessages'),
    content: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx)
    const message = await ctx.db.get(args.messageId)
    if (!message || message.ownerTokenIdentifier !== owner)
      throw new Error('Message not found')
    await ctx.db.patch(message._id, {
      content: args.content,
      status: 'streaming',
      model: args.model,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const finishTurn = internalMutation({
  args: {
    chatId: v.id('chats'),
    messageId: v.id('chatMessages'),
    content: v.string(),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx)
    const chat = await requireOwnedChat(ctx, args.chatId, owner)
    const message = await ctx.db.get(args.messageId)
    if (!message || message.ownerTokenIdentifier !== owner)
      throw new Error('Message not found')
    const now = Date.now()
    await ctx.db.patch(message._id, {
      content: args.content,
      status: 'complete',
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      updatedAt: now,
    })
    await ctx.db.patch(chat._id, {
      status: 'active',
      model: args.model,
      inputTokens: chat.inputTokens + args.inputTokens,
      outputTokens: chat.outputTokens + args.outputTokens,
      updatedAt: now,
      expiresAt: now + CHAT_RETENTION_MS,
    })
    return null
  },
})

export const failTurn = internalMutation({
  args: {
    chatId: v.id('chats'),
    messageId: v.id('chatMessages'),
    content: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx)
    const chat = await requireOwnedChat(ctx, args.chatId, owner)
    const message = await ctx.db.get(args.messageId)
    if (message && message.ownerTokenIdentifier === owner) {
      await ctx.db.patch(message._id, {
        content: args.content,
        status: 'failed',
        error: args.error.slice(0, 1_000),
        updatedAt: Date.now(),
      })
    }
    await ctx.db.patch(chat._id, { status: 'active', updatedAt: Date.now() })
    return null
  },
})

export const saveCompaction = internalMutation({
  args: {
    chatId: v.id('chats'),
    summary: v.string(),
    throughSequence: v.number(),
    compactedTokens: v.number(),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx)
    const chat = await requireOwnedChat(ctx, args.chatId, owner)
    if ((chat.summaryThroughSequence ?? -1) >= args.throughSequence) return null
    await ctx.db.patch(chat._id, {
      summary: args.summary,
      summaryThroughSequence: args.throughSequence,
      compactedTokens: args.compactedTokens,
    })
    return null
  },
})
