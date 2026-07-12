import { defineApp } from 'convex/server'
import { v } from 'convex/values'

export default defineApp({
  env: {
    OPENROUTER_API_KEY: v.optional(v.string()),
    OPENROUTER_MODEL: v.optional(v.string()),
    OPENROUTER_APP_URL: v.optional(v.string()),
    OPENROUTER_APP_TITLE: v.optional(v.string()),
  },
})
