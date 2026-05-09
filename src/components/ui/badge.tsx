import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  color?: string
  className?: string
}

const presetColors: Record<string, string> = {
  red: 'bg-red-100 text-red-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  gray: 'bg-gray-100 text-gray-700',
}

export function Badge({ children, color, className = '' }: BadgeProps) {
  const preset = color && presetColors[color]

  if (preset) {
    return (
      <span className={`inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full ${preset} ${className}`}>
        {children}
      </span>
    )
  }

  // Custom hex color
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full ${className}`}
      style={color ? { backgroundColor: color + '18', color } : undefined}
    >
      {children}
    </span>
  )
}
