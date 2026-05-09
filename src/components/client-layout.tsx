'use client'

import { ReactNode } from 'react'
import { Sidebar } from '@/components/ui/sidebar'
import { ToastProvider } from '@/components/ui/toast'

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 lg:ml-0 min-h-screen">
          <div className="p-4 lg:p-8 pt-20 lg:pt-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
