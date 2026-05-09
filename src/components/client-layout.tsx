'use client'

import { ReactNode } from 'react'
import { TopHeader } from '@/components/ui/top-header'
import { Sidebar } from '@/components/ui/sidebar'
import { ToastProvider } from '@/components/ui/toast'

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <TopHeader />
      <Sidebar />
      <main className="mt-14 lg:ml-[210px] min-h-[calc(100vh-56px)] overflow-y-auto">
        <div className="p-5 lg:p-8 pt-16 lg:pt-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </ToastProvider>
  )
}
