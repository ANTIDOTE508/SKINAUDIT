'use client'

import { RadioPill } from './RadioPill'

type Props = {
  value: string
  label: string
  selected: boolean
  onChange: (value: string) => void
  tabIndex?: number
  onKeyDown?: (e: React.KeyboardEvent) => void
}

/**
 * Full-width select row without a subtitle — Screen 08 (mark duration).
 * A simplified RadioPill: the title carries the full content and the
 * vertical padding is a touch larger.
 */
export function DurationPill({ value, label, selected, onChange, tabIndex, onKeyDown }: Props) {
  return (
    <RadioPill
      value={value}
      title={label}
      selected={selected}
      onChange={onChange}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      size="roomy"
    />
  )
}
