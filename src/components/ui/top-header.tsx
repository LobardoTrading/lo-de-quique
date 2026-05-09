'use client'

import { Bell, HelpCircle, ChevronDown } from 'lucide-react'

export function TopHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#111] border-b border-[var(--border)] flex items-center justify-between px-5 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[var(--bg-card)] rounded-lg flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
            <path d="M10 28L16 12L22 22L26 16L32 28H10Z" fill="var(--green)" />
          </svg>
        </div>
        <span className="text-lg font-bold text-[var(--text-primary)]">Lo de Quique</span>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card2)] hover:text-[var(--text-primary)] transition-colors">
          <HelpCircle size={20} />
        </button>
        <button className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card2)] hover:text-[var(--text-primary)] transition-colors relative">
          <Bell size={20} />
        </button>
        <div className="w-px h-7 bg-[var(--border)] mx-1" />
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-card2)] transition-colors">
          <div className="w-7 h-7 rounded-full bg-[var(--green)] flex items-center justify-center text-white text-sm font-bold">
            Q
          </div>
          <span className="text-sm font-medium text-[var(--text-primary)] hidden sm:block">Quique</span>
          <ChevronDown size={16} className="text-[var(--text-muted)]" />
        </button>
      </div>
    </header>
  )
}
