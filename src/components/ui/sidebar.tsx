'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Inicio', icon: LayoutDashboard },
  { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/stock', label: 'Stock', icon: TrendingUp },
  { href: '/reportes', label: 'Reportes', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-lg rounded-xl p-3 border border-gray-200"
        aria-label="Menu"
      >
        {open ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-72 bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Lo de Quique</h1>
          <p className="text-sm text-gray-500 mt-1">Sistema de Gestion</p>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-4 px-5 py-4 rounded-xl text-lg font-medium
                  transition-colors duration-150
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-2 border-transparent'
                  }
                `}
              >
                <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400">Lo de Quique v1.0</p>
          </div>
        </div>
      </aside>
    </>
  )
}
