import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
}

const variants = {
  primary: 'bg-[var(--green)] text-white hover:bg-[var(--green-dark)] active:bg-[#259948]',
  secondary: 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--green)] hover:text-[var(--text-primary)]',
  danger: 'bg-[var(--red)] text-white hover:bg-[#c04040] active:bg-[#a03030]',
  ghost: 'text-[var(--text-secondary)] hover:bg-[var(--bg-card2)] hover:text-[var(--text-primary)]',
  success: 'bg-[var(--green)] text-white hover:bg-[var(--green-dark)] active:bg-[#259948]',
}

const sizes = {
  sm: 'px-3 py-2 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-lg',
  lg: 'px-5 py-3 text-base rounded-lg',
  xl: 'px-6 py-3.5 text-lg rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
