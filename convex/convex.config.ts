import { defineApp } from 'convex/server'
import { v } from 'convex/values'
import migrations from '@convex-dev/migrations/convex.config.js'

const app = defineApp({
  env: {
    CLERK_JWT_ISSUER_DOMAIN: v.optional(v.string()),
    OPENROUTER_API_KEY: v.optional(v.string()),
    OPENROUTER_MODEL: v.optional(v.string()),
    OPENROUTER_APP_URL: v.optional(v.string()),
    OPENROUTER_APP_TITLE: v.optional(v.string()),
  },
})

app.use(migrations)

export default app
