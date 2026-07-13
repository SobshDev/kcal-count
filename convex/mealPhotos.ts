import { ConvexError, v } from 'convex/values'

import { internalMutation, internalQuery, mutation } from './_generated/server'

const MAX_MEAL_PHOTO_BYTES = 8 * 1024 * 1024

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError({
        code: 'UNAUTHENTICATED',
        message: 'You must be signed in to upload a meal photo',
      })
    }
    return await ctx.storage.generateUploadUrl()
  },
})

export const getUploadForValidation = internalQuery({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError({
        code: 'UNAUTHENTICATED',
        message: 'You must be signed in to upload a meal photo',
      })
    }

    const metadata = await ctx.db.system.get('_storage', args.storageId)
    if (
      !metadata ||
      (metadata.contentType && !metadata.contentType.startsWith('image/'))
    ) {
      throw new ConvexError({
        code: 'INVALID_MEAL_PHOTO',
        message: 'Choose a valid image file',
      })
    }
    if (metadata.size > MAX_MEAL_PHOTO_BYTES) {
      throw new ConvexError({
        code: 'MEAL_PHOTO_TOO_LARGE',
        message: 'Meal photos must be 8 MB or smaller',
      })
    }

    const url = await ctx.storage.getUrl(args.storageId)
    if (!url) {
      throw new ConvexError({
        code: 'INVALID_MEAL_PHOTO',
        message: 'Meal photo was not found',
      })
    }

    return url
  },
})

export const registerValidated = internalMutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError({
        code: 'UNAUTHENTICATED',
        message: 'You must be signed in to upload a meal photo',
      })
    }

    const existing = await ctx.db
      .query('mealPhotos')
      .withIndex('by_storageId', (q) => q.eq('storageId', args.storageId))
      .unique()
    if (existing) {
      if (existing.ownerTokenIdentifier !== identity.tokenIdentifier) {
        throw new ConvexError({
          code: 'FORBIDDEN',
          message: 'This photo belongs to another account',
        })
      }
      return existing._id
    }

    return await ctx.db.insert('mealPhotos', {
      ownerTokenIdentifier: identity.tokenIdentifier,
      storageId: args.storageId,
      createdAt: Date.now(),
    })
  },
})

export const getForAnalysis = internalQuery({
  args: { photoId: v.id('mealPhotos') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError({
        code: 'UNAUTHENTICATED',
        message: 'You must be signed in to analyze a meal photo',
      })
    }
    const photo = await ctx.db.get(args.photoId)
    if (!photo || photo.ownerTokenIdentifier !== identity.tokenIdentifier) {
      throw new ConvexError({
        code: 'MEAL_PHOTO_NOT_FOUND',
        message: 'Meal photo was not found',
      })
    }
    const url = await ctx.storage.getUrl(photo.storageId)
    if (!url) {
      throw new ConvexError({
        code: 'MEAL_PHOTO_NOT_FOUND',
        message: 'Meal photo was not found',
      })
    }
    return { storageId: photo.storageId, url }
  },
})
