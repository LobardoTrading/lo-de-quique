'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatSkeleton, ListSkeleton } from '@/components/ui/skeleton'
import { getDashboardStats, getSales, getSalesByPaymentMethod } from '@/lib/api'
import { formatCurrency, formatDateShort } from '@/lib/helpers'
import {
  Package, ShoppingCart, AlertTriangle, DollarSign,
  TrendingUp, Clock, ArrowRight, ScanBarcode,
  BarChart3, Hash,
} from 'lucide-react'
import type { Sale, Product } from '@/types/database'
import Link from 'next/link'

interface DashboardData {
  salesToday: { count: number; total: number }
  totalProducts: number
  lowStockCount: number
  lowStockProducts: Product[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardData | null>(null)
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [paymentData, setPaymentData] = useState<{ method: string; count: number; total: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)

        const [dashStats, sales, payments] = await Promise.all([
          getDashboardStats(),
          getSales(8),
          getSalesByPaymentMethod(today, endOfDay),
        ])
        setStats(dashStats)
        setRecentSales(sales)
        setPaymentData(payments)
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const greeting = () => {
    const h = time.getHours()
    if (h < 12) return 'Buenos dias'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const avgTicket = stats?.salesToday.count ? stats.salesToday.total / stats.salesToday.count : 0
  const paymentTotal = paymentData.reduce((s, p) => s + p.total, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--text-muted)] capitalize">
            {time.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-[22px] font-bold text-[var(--text-primary)]">{greeting()}, Nico</h1>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
          <Clock size={14} />
          {time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Ventas hoy */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] p-[18px] pb-0 relative overflow-hidden">
            <p className="text-xs text-[var(--text-secondary)] mb-2">Ventas hoy</p>
            <p className="text-[22px] font-bold">{formatCurrency(stats?.salesToday.total || 0)}</p>
            <p className="text-xs text-[var(--text-muted)] mb-3.5">{stats?.salesToday.count || 0} operaciones</p>
            <div className="h-[3px] -mx-[18px] bg-[var(--green)]" />
          </div>

          {/* Ticket promedio */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] p-[18px] pb-0 relative overflow-hidden">
            <p className="text-xs text-[var(--text-secondary)] mb-2">Ticket promedio</p>
            <p className="text-[22px] font-bold">{formatCurrency(avgTicket)}</p>
            <p className="text-xs text-[var(--text-muted)] mb-3.5">por venta</p>
            <div className="h-[3px] -mx-[18px] bg-[var(--blue)]" />
          </div>

          {/* Productos */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] p-[18px] pb-0 relative overflow-hidden">
            <p className="text-xs text-[var(--text-secondary)] mb-2">Productos activos</p>
            <p className="text-[22px] font-bold">{stats?.totalProducts || 0}</p>
            <p className="text-xs text-[var(--text-muted)] mb-3.5">en catalogo</p>
            <div className="h-[3px] -mx-[18px] bg-[var(--orange)]" />
          </div>

          {/* Stock bajo */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] p-[18px] pb-0 relative overflow-hidden">
            <span className="absolute top-3.5 right-3.5 text-[var(--orange)]">
              {(stats?.lowStockCount || 0) > 0 && <AlertTriangle size={18} />}
            </span>
            <p className="text-xs text-[var(--text-secondary)] mb-2">Stock bajo</p>
            <p className="text-[22px] font-bold">{stats?.lowStockCount || 0}</p>
            <p className="text-xs text-[var(--text-muted)] mb-3.5">productos</p>
            <div className={`h-[3px] -mx-[18px] ${(stats?.lowStockCount || 0) > 0 ? 'bg-[var(--red)]' : 'bg-[var(--green)]'}`} />
          </div>
        </div>
      )}

      {/* Sales chart + payment breakdown */}
      {!loading && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] p-5">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_180px] gap-6 items-center">
            {/* Total */}
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2">Total del dia</p>
              <p className="text-[26px] font-bold">{formatCurrency(stats?.salesToday.total || 0)}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{stats?.salesToday.count || 0} ventas realizadas</p>
            </div>

            {/* Bar chart placeholder - last sales */}
            <div className="flex items-end gap-2 h-16">
              {recentSales.slice(0, 8).reverse().map((sale, i) => {
                const maxTotal = Math.max(...recentSales.map(s => s.total), 1)
                const height = Math.max((sale.total / maxTotal) * 100, 10)
                return (
                  <div key={sale.id} className="flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className="w-full bg-[var(--green)] rounded-t"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[11px] text-[var(--text-muted)]">#{sale.sale_number}</span>
                  </div>
                )
              })}
              {recentSales.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] w-full text-center">Sin ventas hoy</p>
              )}
            </div>

            {/* Payment donut info */}
            <div className="space-y-2">
              {paymentData.length > 0 ? paymentData.map((pm) => {
                const colors: Record<string, string> = {
                  efectivo: 'bg-[var(--green)]',
                  tarjeta: 'bg-[var(--blue)]',
                  transferencia: 'bg-[var(--purple)]',
                  mercadopago: 'bg-[var(--cyan)]',
                }
                const pct = paymentTotal > 0 ? Math.round((pm.total / paymentTotal) * 100) : 0
                return (
                  <div key={pm.method} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${colors[pm.method] || 'bg-gray-500'}`} />
                    <span className="capitalize flex-1">{pm.method}</span>
                    <span className="font-semibold text-[var(--text-secondary)]">{pct}%</span>
                  </div>
                )
              }) : (
                <p className="text-xs text-[var(--text-muted)]">Sin datos</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Link
          href="/ventas"
          className="flex flex-col items-center gap-2 p-4 bg-[var(--green)] text-white rounded-[var(--radius)] hover:bg-[var(--green-dark)] transition-colors font-semibold text-[13px]"
        >
          <ShoppingCart size={22} />
          Nueva Venta
        </Link>
        <Link
          href="/productos"
          className="flex flex-col items-center gap-2 p-4 bg-[var(--bg-card2)] border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius)] hover:border-[var(--green)] hover:text-[var(--green)] transition-colors text-[13px]"
        >
          <Package size={22} />
          Productos
        </Link>
        <Link
          href="/stock"
          className="flex flex-col items-center gap-2 p-4 bg-[var(--bg-card2)] border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius)] hover:border-[var(--green)] hover:text-[var(--green)] transition-colors text-[13px]"
        >
          <TrendingUp size={22} />
          Ingresar Stock
        </Link>
        <Link
          href="/reportes"
          className="flex flex-col items-center gap-2 p-4 bg-[var(--bg-card2)] border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius)] hover:border-[var(--green)] hover:text-[var(--green)] transition-colors text-[13px]"
        >
          <BarChart3 size={22} />
          Reportes
        </Link>
      </div>

      {/* Grid: low stock + recent sales */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ListSkeleton rows={4} />
          <ListSkeleton rows={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Low stock */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold">Stock bajo</span>
                  {(stats?.lowStockCount || 0) > 0 && (
                    <span className="bg-[var(--green)] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {stats!.lowStockCount}
                    </span>
                  )}
                </div>
                <Link href="/stock" className="text-xs text-[var(--text-muted)] hover:text-[var(--green)]">Ver todo</Link>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                <div className="space-y-2">
                  {stats.lowStockProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2.5 px-3 bg-[var(--bg-card2)] rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{p.category?.name || ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[var(--red)]">{p.stock} {p.unit}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">min: {p.min_stock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[var(--bg-card2)] rounded-lg p-3 text-[13px] text-[var(--text-muted)] flex items-center gap-2.5">
                  <TrendingUp size={16} className="text-[var(--green)]" />
                  Todo el stock esta bien, no hay alertas
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent sales */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold">Ultimas ventas</span>
                <Link href="/reportes" className="text-xs text-[var(--text-muted)] hover:text-[var(--green)]">Ver todo</Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentSales.length > 0 ? (
                <div className="space-y-2">
                  {recentSales.slice(0, 5).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between py-2.5 px-3 bg-[var(--bg-card2)] rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{sale.sale_number}</span>
                          <Badge color={
                            sale.payment_method === 'efectivo' ? 'green' :
                            sale.payment_method === 'tarjeta' ? 'blue' :
                            sale.payment_method === 'transferencia' ? 'purple' : 'cyan'
                          }>
                            {sale.payment_method}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatDateShort(sale.created_at)}</p>
                      </div>
                      <p className="text-sm font-bold text-[var(--green)]">{formatCurrency(sale.total)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[var(--bg-card2)] rounded-lg p-3 text-[13px] text-[var(--text-muted)] flex items-center gap-2.5">
                  <ShoppingCart size={16} />
                  Las ventas del dia van a aparecer aca
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
