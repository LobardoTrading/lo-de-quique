'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { StatSkeleton, ListSkeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { getDashboardStats, getSales } from '@/lib/api'
import { formatCurrency, formatDateShort } from '@/lib/helpers'
import {
  Package, ShoppingCart, AlertTriangle, DollarSign,
  TrendingDown, TrendingUp, Clock, Wallet,
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
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const [dashStats, sales] = await Promise.all([
          getDashboardStats(),
          getSales(10),
        ])
        setStats(dashStats)
        setRecentSales(sales)
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Lo de Quique</h1>
          <p className="text-lg text-gray-500 mt-1">{greeting()}, Nico</p>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Clock size={18} />
          <span className="text-lg font-medium">
            {time.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' - '}
            {time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Stats cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl shrink-0">
                  <DollarSign size={28} className="text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 font-medium">Ventas hoy</p>
                  <p className="text-2xl font-bold text-gray-900 truncate">
                    {formatCurrency(stats?.salesToday.total || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl shrink-0">
                  <ShoppingCart size={28} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Operaciones hoy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.salesToday.count || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl shrink-0">
                  <Package size={28} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Productos activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalProducts || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${(stats?.lowStockCount || 0) > 0 ? 'border-l-red-500' : 'border-l-gray-300'}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${(stats?.lowStockCount || 0) > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <AlertTriangle size={28} className={(stats?.lowStockCount || 0) > 0 ? 'text-red-600' : 'text-gray-400'} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Stock bajo</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.lowStockCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/ventas"
          className="flex flex-col items-center gap-3 p-5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <ShoppingCart size={32} />
          <span className="font-bold text-lg">Nueva Venta</span>
        </Link>
        <Link
          href="/productos"
          className="flex flex-col items-center gap-3 p-5 bg-white text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors border-2 border-gray-200"
        >
          <Package size={32} />
          <span className="font-bold text-lg">Productos</span>
        </Link>
        <Link
          href="/stock"
          className="flex flex-col items-center gap-3 p-5 bg-white text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors border-2 border-gray-200"
        >
          <TrendingUp size={32} />
          <span className="font-bold text-lg">Ingresar Stock</span>
        </Link>
        <Link
          href="/reportes"
          className="flex flex-col items-center gap-3 p-5 bg-white text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors border-2 border-gray-200"
        >
          <Wallet size={32} />
          <span className="font-bold text-lg">Reportes</span>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ListSkeleton rows={4} />
          <ListSkeleton rows={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low stock alert */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown size={20} className="text-red-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Stock bajo</h2>
                </div>
                {(stats?.lowStockCount || 0) > 0 && (
                  <Badge color="red">{stats!.lowStockCount} productos</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                <div className="space-y-2">
                  {stats.lowStockProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3 px-4 bg-red-50 rounded-xl border border-red-100">
                      <div>
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-sm text-gray-500">{p.category?.name || 'Sin categoria'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">{p.stock} {p.unit}</p>
                        <p className="text-xs text-gray-400">Min: {p.min_stock}</p>
                      </div>
                    </div>
                  ))}
                  {(stats.lowStockCount || 0) > 10 && (
                    <Link href="/stock" className="block text-center text-blue-600 font-semibold py-2 hover:underline">
                      Ver todos los {stats.lowStockCount} productos
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 mb-3">
                    <TrendingUp size={24} className="text-green-500" />
                  </div>
                  <p className="text-gray-400 text-lg">Todo el stock esta bien</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent sales */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingCart size={20} className="text-blue-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Ultimas ventas</h2>
                </div>
                <Link href="/reportes" className="text-sm text-blue-600 font-semibold hover:underline">
                  Ver todo
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentSales.length > 0 ? (
                <div className="space-y-2">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-gray-900">Venta #{sale.sale_number}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm text-gray-500">{formatDateShort(sale.created_at)}</span>
                          <Badge color={sale.payment_method === 'efectivo' ? 'green' : sale.payment_method === 'tarjeta' ? 'blue' : 'purple'}>
                            {sale.payment_method}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(sale.total)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<ShoppingCart size={32} className="text-gray-400" />}
                  title="Sin ventas"
                  description="Las ventas del dia van a aparecer aca"
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
