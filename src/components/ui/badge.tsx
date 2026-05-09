import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  color?: string
  className?: string
}

const presetColors: Record<string, string> = {
  green: 'bg-[var(--green-dim)] text-[var(--green)]',
  red: 'bg-red-500/15 text-[var(--red)]',
  blue: 'bg-blue-500/15 text-[var(--blue)]',
  orange: 'bg-orange-500/15 text-[var(--orange)]',
  purple: 'bg-purple-500/15 text-[var(--purple)]',
  cyan: 'bg-cyan-500/15 text-[var(--cyan)]',
  gray: 'bg-[var(--bg-card2)] text-[var(--text-muted)]',
}

export function Badge({ children, color = 'gray', className = '' }: BadgeProps) {
  const preset = presetColors[color]

  if (preset) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${preset} ${className}`}>
        {children}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${className}`}
      style={{ backgroundColor: color + '18', color }}
    >
      {children}
    </span>
  )
}
