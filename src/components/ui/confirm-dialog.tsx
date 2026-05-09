'use client'

import { Button } from './button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'success' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open, title, message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] shadow-2xl w-full max-w-sm p-5 space-y-4 animate-[fadeIn_0.2s_ease-out]">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
          <p className="text-sm text-[var(--text-muted)] mt-2">{message}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="md" className="flex-1 border border-[var(--border)]" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} size="md" className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
