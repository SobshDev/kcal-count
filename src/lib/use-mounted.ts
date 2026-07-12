import { useEffect, useState } from 'react'

/**
 * Returns `true` only after the component has mounted on the client. Recharts'
 * ResponsiveContainer measures its parent with a ResizeObserver, which doesn't
 * exist during SSR — gating charts on this avoids width(0) warnings and
 * hydration mismatches by rendering a placeholder until the client takes over.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}
