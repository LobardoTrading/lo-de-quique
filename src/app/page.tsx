'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getDashboardStats, getSales } from '@/lib/api'
import { formatCurrency, formatDateShort } from '@/lib/helpers'
import { Package, ShoppingCart, AlertTriangle, DollarSign, TrendingDown } from 'lucide-react'
import type { Sale, Product } from '@/types/database'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-400">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lo de Quique</h1>
        <p className="text-lg text-gray-500 mt-1">Resumen del dia</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign size={28} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ventas hoy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.salesToday.total || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <ShoppingCart size={28} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ventas realizadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.salesToday.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Package size={28} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Productos activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalProducts || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${(stats?.lowStockCount || 0) > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertTriangle size={28} className={(stats?.lowStockCount || 0) > 0 ? 'text-red-600' : 'text-gray-400'} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Stock bajo</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.lowStockCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock alert */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingDown size={22} className="text-red-500" />
              <h2 className="text-xl font-bold text-gray-900">Productos con stock bajo</h2>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {stats.lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3 px-4 bg-red-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.category?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{p.stock} {p.unit}</p>
                      <p className="text-xs text-gray-400">Min: {p.min_stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Todo el stock esta bien</p>
            )}
          </CardContent>
        </Card>

        {/* Recent sales */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShoppingCart size={22} className="text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900">Ultimas ventas</h2>
            </div>
          </CardHeader>
          <CardContent>
            {recentSales.length > 0 ? (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">Venta #{sale.sale_number}</p>
                      <p className="text-sm text-gray-500">{formatDateShort(sale.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(sale.total)}</p>
                      <p className="text-xs text-gray-400 capitalize">{sale.payment_method}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No hay ventas todavia</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
