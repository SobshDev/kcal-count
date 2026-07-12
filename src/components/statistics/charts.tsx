function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Horizontal marker bar showing a value within a recommended [lo, hi] band.
 * Kept as a small custom primitive — Recharts has no equivalent "in-range"
 * indicator, and this stays coherent with the other shadcn Progress bars.
 */
export function RangeBar({
  value,
  lo,
  hi,
  max,
}: {
  value: number
  lo: number
  hi: number
  max: number
}) {
  return (
    <div className="relative h-2.5 w-full rounded-full bg-white/10">
      <div
        className="absolute inset-y-0 rounded-full bg-white/25"
        style={{
          left: `${clamp(lo / max) * 100}%`,
          right: `${(1 - clamp(hi / max)) * 100}%`,
        }}
      />
      <div
        className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-black/30"
        style={{ left: `${clamp(value / max) * 100}%` }}
      />
    </div>
  )
}
