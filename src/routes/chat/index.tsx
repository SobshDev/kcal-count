import { createFileRoute, redirect } from '@tanstack/react-router'

import { PAGE_CONTAINER, PageShell } from '@/components/layout/page-shell'
import { ChatPanel } from '@/components/chat/chat-panel'
import { ChatPageSkeleton } from '@/components/skeletons/chat-skeleton'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/chat/')({
  beforeLoad: ({ context }) => {
    if (!context.userId) {
      throw redirect({ to: '/sign-in/$', params: { _splat: '' } })
    }
  },
  component: ChatPage,
  pendingComponent: ChatPageSkeleton,
})

function ChatPage() {
  return (
    <PageShell className="flex h-svh flex-col">
      <div
        className={cn(
          PAGE_CONTAINER,
          'flex min-h-0 flex-1 flex-col pt-28 pb-6',
        )}
      >
        <ChatPanel />
      </div>
    </PageShell>
  )
}
