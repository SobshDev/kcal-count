import * as React from 'react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

type SegmentedOption = {
  value: string
  label: React.ReactNode
}

type SegmentedControlProps = Omit<
  React.ComponentProps<typeof RadioGroupPrimitive.Root>,
  'children'
> & {
  options: Array<SegmentedOption>
}

function SegmentedControl({
  className,
  options,
  ...props
}: SegmentedControlProps) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="segmented-control"
      className={cn(
        'inline-flex w-full gap-1 rounded-2xl bg-input/50 p-1',
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          data-slot="segmented-control-item"
          className="flex-1 rounded-xl px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none select-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-sm"
        >
          {option.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  )
}

export { SegmentedControl }
export type { SegmentedOption }
