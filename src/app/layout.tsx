import type { Metadata } from 'next'
import './globals.css'
import { ClientLayout } from '@/components/client-layout'

export const metadata: Metadata = {
  title: 'Lo de Quique - Sistema de Gestion',
  description: 'Sistema de stock y ventas para Lo de Quique',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full bg-[var(--bg-main)]">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
