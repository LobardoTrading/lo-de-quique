import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-[13px] font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3.5 py-2.5 text-sm rounded-lg
            bg-[var(--bg-input)] border border-[var(--border)]
            text-[var(--text-primary)] transition-colors duration-150
            placeholder:text-[var(--text-muted)]
            focus:outline-none focus:border-[var(--green)]
            ${error ? 'border-[var(--red)]' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-[var(--red)]">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[13px] font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-3.5 py-2.5 text-sm rounded-lg
          bg-[var(--bg-input)] border border-[var(--border)]
          text-[var(--text-primary)] transition-colors duration-150
          focus:outline-none focus:border-[var(--green)]
          appearance-none cursor-pointer
          bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")]
          bg-no-repeat bg-[right_12px_center]
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
