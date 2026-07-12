import { useId } from 'react'

import { cn } from '@/lib/utils'

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

/** Build an SVG polyline path from a series, normalised to the viewBox. */
function buildLinePath(
  data: Array<number>,
  width: number,
  height: number,
  pad = 3,
) {
  if (data.length === 0) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = data.length > 1 ? width / (data.length - 1) : 0
  return data
    .map((point, index) => {
      const x = index * step
      const y = height - pad - ((point - min) / range) * (height - pad * 2)
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

/** Circular progress ring with centered content. */
export function Ring({
  value,
  max,
  size = 128,
  stroke = 10,
  trackClassName = 'stroke-white/10',
  progressClassName = 'stroke-white',
  children,
}: {
  value: number
  max: number
  size?: number
  stroke?: number
  trackClassName?: string
  progressClassName?: string
  children?: React.ReactNode
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamp(value / max))

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={trackClassName}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={progressClassName}
        />
      </svg>
      {children ? (
        <div className="absolute flex flex-col items-center">{children}</div>
      ) : null}
    </div>
  )
}

/** Horizontal marker bar showing a value within a recommended [lo, hi] band. */
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

/** Tiny inline line chart. */
export function Sparkline({
  data,
  className,
  width = 96,
  height = 28,
}: {
  data: Array<number>
  className?: string
  width?: number
  height?: number
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      className={cn('overflow-visible', className)}
    >
      <path
        d={buildLinePath(data, width, height)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** Vertical bar chart with labels underneath. */
export function BarChart({
  data,
  className,
  height = 128,
}: {
  data: Array<{ label: string; value: number; caption?: string }>
  className?: string
  height?: number
}) {
  const max = Math.max(...data.map((item) => item.value)) || 1

  return (
    <div className={className}>
      <div className="flex items-end gap-3" style={{ height }}>
        {data.map((item) => (
          <div
            key={item.label}
            className="flex flex-1 items-end justify-center"
            style={{ height: '100%' }}
          >
            <div
              className="w-full max-w-14 rounded-t-lg bg-white/80"
              style={{ height: `${clamp(item.value / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {data.map((item) => (
          <div key={item.label} className="flex-1 text-center">
            <div className="text-sm font-medium text-white tabular-nums">
              {item.caption ?? item.value}
            </div>
            <div className="text-xs text-white/45">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Area line chart that stretches to fill its container width. */
export function AreaTrend({
  data,
  className,
  height = 140,
}: {
  data: Array<number>
  className?: string
  height?: number
}) {
  const rawId = useId()
  const gradientId = `area-${rawId.replace(/:/g, '')}`
  const width = 320
  const line = buildLinePath(data, width, height, 10)
  const area = `${line} L ${width.toFixed(2)} ${height} L 0 ${height} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('w-full', className)}
      style={{ height }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.18" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke="white"
        strokeOpacity="0.9"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** Two overlaid trend lines on independent scales (e.g. intake vs weight). */
export function DualTrend({
  primary,
  secondary,
  className,
  height = 140,
}: {
  primary: Array<number>
  secondary: Array<number>
  className?: string
  height?: number
}) {
  const width = 320
  const primaryLine = buildLinePath(primary, width, height, 12)
  const secondaryLine = buildLinePath(secondary, width, height, 12)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('w-full', className)}
      style={{ height }}
    >
      <path
        d={secondaryLine}
        fill="none"
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth={2}
        strokeDasharray="5 5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={primaryLine}
        fill="none"
        stroke="white"
        strokeOpacity="0.9"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
