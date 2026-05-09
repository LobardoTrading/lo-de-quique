'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatSkeleton, ListSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { getSalesForPeriod, getTopProducts, getSalesByPaymentMethod, getDailySales } from '@/lib/api'
import { formatCurrency } from '@/lib/helpers'
import {
  Calendar, TrendingUp, Award, CreditCard, BarChart3,
  DollarSign, ShoppingCart, ArrowRight, Hash,
} from 'lucide-react'

type Period = 'hoy' | 'semana' | 'mes' | 'custom'

function getDateRange(period: Period): { from: Date; to: Date } {
  const now = new Date()
  const to = new Date(now)
  to.setHours(23, 59, 59, 999)
  const from = new Date(now)

  switch (period) {
    case 'hoy':
      from.setHours(0, 0, 0, 0)
      break
    case 'semana':
      from.setDate(now.getDate() - 7)
      from.setHours(0, 0, 0, 0)
      break
    case 'mes':
      from.setDate(1)
      from.setHours(0, 0, 0, 0)
      break
    default:
      from.setHours(0, 0, 0, 0)
  }

  return { from, to }
}

export default function ReportesPage() {
  const [period, setPeriod] = useState<Period>('hoy')
  const [loading, setLoading] = useState(true)
  const [totalSales, setTotalSales] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [avgTicket, setAvgTicket] = useState(0)
  const [topProducts, setTopProducts] = useState<{ product_name: string; total_quantity: number; total_revenue: number }[]>([])
  const [byPayment, setByPayment] = useState<{ method: string; count: number; total: number }[]>([])
  const [dailyData, setDailyData] = useState<{ date: string; count: number; total: number }[]>([])
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { from, to } = getDateRange(period)
        const [sales, top, payments, daily] = await Promise.all([
          getSalesForPeriod(from, to),
          getTopProducts(from, to, 10),
          getSalesByPaymentMethod(from, to),
          getDailySales(from, to),
        ])

        const revenue = sales.reduce((sum, s) => sum + Number(s.total), 0)
        setTotalSales(sales.length)
        setTotalRevenue(revenue)
        setAvgTicket(sales.length > 0 ? revenue / sales.length : 0)
        setTopProducts(top)
        setByPayment(payments)
        setDailyData(daily)
      } catch (err) {
        toast('Error al cargar reportes', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [period, toast])

  const maxDailyTotal = Math.max(...dailyData.map(d => d.total), 1)
  const paymentTotal = byPayment.reduce((sum, p) => sum + p.total, 0)

  const periods: { id: Period; label: string }[] = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'semana', label: 'Ultima semana' },
    { id: 'mes', label: 'Este mes' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-lg text-gray-500">Analisis de ventas y rendimiento</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                period === p.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <DollarSign size={28} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Facturacion</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <ShoppingCart size={28} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Ventas</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <TrendingUp size={28} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Ticket promedio</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(avgTicket)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ListSkeleton rows={5} />
          <ListSkeleton rows={4} />
        </div>
      ) : (
        <>
          {/* Daily chart */}
          {dailyData.length > 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 size={20} className="text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Ventas por dia</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailyData.map((day) => (
                    <div key={day.date} className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 w-20 shrink-0">{day.date}</span>
                      <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-lg transition-all duration-500 flex items-center justify-end px-2"
                          style={{ width: `${Math.max((day.total / maxDailyTotal) * 100, 8)}%` }}
                        >
                          <span className="text-xs font-bold text-white whitespace-nowrap">
                            {formatCurrency(day.total)}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-400 w-12 text-right">{day.count}v</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top products */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Award size={20} className="text-yellow-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Productos mas vendidos</h2>
                </div>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Sin datos para este periodo</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((product, index) => (
                      <div key={product.product_name} className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-200 text-gray-600' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{product.product_name}</p>
                          <p className="text-sm text-gray-400">{product.total_quantity} vendidos</p>
                        </div>
                        <span className="font-bold text-green-600 shrink-0">{formatCurrency(product.total_revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* By payment method */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CreditCard size={20} className="text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Por medio de pago</h2>
                </div>
              </CardHeader>
              <CardContent>
                {byPayment.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Sin datos para este periodo</p>
                ) : (
                  <div className="space-y-4">
                    {byPayment.map((pm) => {
                      const pct = paymentTotal > 0 ? (pm.total / paymentTotal) * 100 : 0
                      const colorMap: Record<string, string> = {
                        efectivo: 'bg-green-500',
                        tarjeta: 'bg-blue-500',
                        transferencia: 'bg-purple-500',
                        mercadopago: 'bg-cyan-500',
                      }
                      return (
                        <div key={pm.method}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 capitalize">{pm.method}</span>
                              <Badge color="gray">{pm.count} ventas</Badge>
                            </div>
                            <span className="font-bold text-gray-900">{formatCurrency(pm.total)}</span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${colorMap[pm.method] || 'bg-gray-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{pct.toFixed(1)}% del total</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
