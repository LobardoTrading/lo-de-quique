'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart, TrendingUp,
  BarChart3, ScanBarcode, Settings, Tag, Menu, X,
} from 'lucide-react'
import { useState } from 'react'

const navGroups = [
  {
    label: 'General',
    items: [
      { href: '/', label: 'Inicio', icon: LayoutDashboard },
      { href: '/productos', label: 'Productos', icon: Package },
      { href: '/categorias', label: 'Categorias', icon: Tag },
      { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
    ],
  },
  {
    label: 'Herramientas',
    items: [
      { href: '/stock', label: 'Stock', icon: TrendingUp },
      { href: '/reportes', label: 'Reportes', icon: BarChart3 },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-3.5 left-16 z-[60] lg:hidden p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)]"
        aria-label="Menu"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-14 left-0 bottom-0 z-40 w-[210px] bg-[#111] border-r border-[var(--border)]
          flex flex-col py-5 px-3 overflow-y-auto
          transform transition-transform duration-200
          lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase px-2.5 mb-1.5 mt-4 first:mt-0">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`
                    flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-150 mb-0.5
                    ${isActive
                      ? 'bg-[var(--green-dim)] text-[var(--green)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card2)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}

        <div className="mt-auto pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div className="w-8 h-8 rounded-full bg-[var(--blue)] flex items-center justify-center text-white text-xs font-bold shrink-0">
              LQ
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate">Lo de Quique</p>
              <p className="text-[11px] text-[var(--text-muted)]">Almacen</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
