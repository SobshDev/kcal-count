import { createFileRoute } from '@tanstack/react-router'

import { FloatingNavbar } from '@/components/dashboard/floating-navbar'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="dark relative min-h-screen bg-background text-foreground">
      <FloatingNavbar />
    </main>
  )
}
