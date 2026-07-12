/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'

import { api, internal } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

describe('meal photos', () => {
  it('returns a signed image URL to its authenticated owner', async () => {
    const t = convexTest(schema, modules)
    const storageId = await t.run(async (ctx) =>
      ctx.storage.store(new Blob(['image'], { type: 'image/jpeg' })),
    )
    const photoId = await t.run(async (ctx) =>
      ctx.db.insert('mealPhotos', {
        ownerTokenIdentifier: 'https://clerk.test|photo-owner',
        storageId,
        createdAt: Date.now(),
      }),
    )
    const owner = t.withIdentity({
      tokenIdentifier: 'https://clerk.test|photo-owner',
    })

    await expect(
      owner.query(internal.mealPhotos.getForAnalysis, { photoId }),
    ).resolves.toMatchObject({ storageId, url: expect.any(String) })
  })

  it('does not expose a photo to another account', async () => {
    const t = convexTest(schema, modules)
    const storageId = await t.run(async (ctx) =>
      ctx.storage.store(new Blob(['image'], { type: 'image/png' })),
    )
    const photoId = await t.run(async (ctx) =>
      ctx.db.insert('mealPhotos', {
        ownerTokenIdentifier: 'https://clerk.test|photo-owner',
        storageId,
        createdAt: Date.now(),
      }),
    )
    const otherAccount = t.withIdentity({
      tokenIdentifier: 'https://clerk.test|other-photo-account',
    })

    await expect(
      otherAccount.query(internal.mealPhotos.getForAnalysis, { photoId }),
    ).rejects.toMatchObject({ data: { code: 'MEAL_PHOTO_NOT_FOUND' } })
  })

  it('requires authentication before generating an upload URL', async () => {
    const t = convexTest(schema, modules)

    await expect(
      t.mutation(api.mealPhotos.generateUploadUrl, {}),
    ).rejects.toMatchObject({ data: { code: 'UNAUTHENTICATED' } })
  })
})
