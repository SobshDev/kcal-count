import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { ConvexReactClient } from 'convex/react'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL

  if (!convexUrl) {
    throw new Error('Missing VITE_CONVEX_URL in your environment')
  }

  const convexClient = new ConvexReactClient(convexUrl, {
    unsavedChangesWarning: false,
  })
  const convexQueryClient = new ConvexQueryClient(convexClient)
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  })

  convexQueryClient.connect(queryClient)

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient, convexClient, convexQueryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    // Surface each route's pendingComponent skeleton quickly during navigation
    // (the default is 1s, which rarely fires), while defaultPendingMinMs keeps
    // it on screen long enough to avoid a flash on fast loads.
    defaultPendingMs: 150,
    defaultPendingMinMs: 400,
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
