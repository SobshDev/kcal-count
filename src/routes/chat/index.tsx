import { createFileRoute } from '@tanstack/react-router'

import { FloatingNavbar } from '@/components/dashboard/floating-navbar'
import { ChatPanel } from '@/components/chat/chat-panel'

export const Route = createFileRoute('/chat/')({ component: ChatPage })

function ChatPage() {
  return (
    <main className="dark relative flex h-svh flex-col overflow-hidden bg-[oklch(0.19_0_0)] text-white">
      {/* Lava-lamp blobs — same treatment as the dashboard and sign-up page. */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="animate-lava absolute top-1/4 -left-24 size-[30rem] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, oklch(0.62 0 0 / 0.5), oklch(0.35 0 0 / 0.16) 55%, transparent 72%)',
          }}
        />
        <div
          className="animate-lava-2 absolute -right-20 bottom-4 size-[24rem] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle at 60% 40%, oklch(0.5 0 0 / 0.42), oklch(0.3 0 0 / 0.12) 55%, transparent 72%)',
          }}
        />
      </div>
      {/* Masked grid overlay. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(to right, oklch(1 0 0 / 0.02) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.02) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage:
            'radial-gradient(130% 100% at 50% 0%, #000 55%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(130% 100% at 50% 0%, #000 55%, transparent 100%)',
        }}
      />
      <FloatingNavbar />
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-6 pt-28 pb-6">
        <ChatPanel />
      </div>
    </main>
  )
}
