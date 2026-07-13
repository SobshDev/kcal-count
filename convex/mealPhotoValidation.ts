'use node'

import { imageSize } from 'image-size'
import { ConvexError, v } from 'convex/values'

import type { Id } from './_generated/dataModel'
import { internal } from './_generated/api'
import { action } from './_generated/server'

const MAX_IMAGE_EDGE = 1024

export const validateAndRegister = action({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args): Promise<Id<'mealPhotos'>> => {
    const url: string = await ctx.runQuery(
      internal.mealPhotos.getUploadForValidation,
      { storageId: args.storageId },
    )
    const response = await fetch(url)
    if (!response.ok) {
      throw new ConvexError({
        code: 'INVALID_MEAL_PHOTO',
        message: 'Meal photo was not found',
      })
    }

    try {
      validateImageDimensions(new Uint8Array(await response.arrayBuffer()))
    } catch (error) {
      await ctx.storage.delete(args.storageId)
      if (error instanceof ConvexError) throw error
      throw new ConvexError({
        code: 'INVALID_MEAL_PHOTO',
        message: 'Choose a valid image file',
      })
    }

    return await ctx.runMutation(internal.mealPhotos.registerValidated, {
      storageId: args.storageId,
    })
  },
})

export function validateImageDimensions(bytes: Uint8Array) {
  const dimensions = imageSize(bytes)
  if (
    !dimensions.width ||
    !dimensions.height ||
    dimensions.width > MAX_IMAGE_EDGE ||
    dimensions.height > MAX_IMAGE_EDGE
  ) {
    throw new ConvexError({
      code: 'MEAL_PHOTO_DIMENSIONS_TOO_LARGE',
      message: 'Meal photos must be 1024 pixels or smaller on each side',
    })
  }
}
