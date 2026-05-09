'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { ListSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useDebounce } from '@/hooks/use-debounce'
import { getProducts, addStock, getStockMovements } from '@/lib/api'
import { formatDateShort } from '@/lib/helpers'
import {
  Search, History, PackagePlus, SlidersHorizontal,
  AlertTriangle, ArrowDownToLine, ArrowUpFromLine,
  X, Package, Filter,
} from 'lucide-react'
import type { Product, StockMovement } from '@/types/database'

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
  ingreso: { label: 'Ingreso', color: 'green', icon: '+' },
  egreso: { label: 'Egreso', color: 'orange', icon: '-' },
  ajuste: { label: 'Ajuste', color: 'blue', icon: '~' },
  venta: { label: 'Venta', color: 'purple', icon: '-' },
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [movType, setMovType] = useState<'ingreso' | 'ajuste'>('ingreso')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showMovements, setShowMovements] = useState(false)
  const [filterLowStock, setFilterLowStock] = useState(false)
  const { toast } = useToast()

  const loadProducts = useCallback(async () => {
    try {
      const data = await getProducts({ search: debouncedSearch || undefined })
      setProducts(data)
    } catch {
      toast('Error al cargar productos', 'error')
    }
  }, [debouncedSearch, toast])

  useEffect(() => {
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) loadProducts()
  }, [loading, loadProducts])

  const filteredProducts = filterLowStock
    ? products.filter(p => p.stock <= p.min_stock)
    : products

  const lowStockCount = products.filter(p => p.stock <= p.min_stock).length

  function openStockModal(product: Product, type: 'ingreso' | 'ajuste') {
    setSelectedProduct(product)
    setMovType(type)
    setQuantity('')
    setNotes('')
    setModalOpen(true)
  }

  async function handleSaveStock() {
    const qty = Number(quantity)
    if (!qty && movType === 'ingreso') {
      toast('Ingresa la cantidad', 'error')
      return
    }
    if (movType === 'ajuste' && quantity === '') {
      toast('Ingresa el stock correcto', 'error')
      return
    }

    setSaving(true)
    try {
      await addStock(selectedProduct!.id, qty, movType, notes || undefined)
      toast(movType === 'ingreso' ? 'Ingreso registrado' : 'Stock ajustado')
      setModalOpen(false)
      loadProducts()
    } catch {
      toast('Error al actualizar stock', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function openMovements() {
    try {
      const data = await getStockMovements(undefined, 100)
      setMovements(data)
      setShowMovements(true)
    } catch {
      toast('Error al cargar movimientos', 'error')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <ListSkeleton rows={6} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-lg text-gray-500">Gestion de inventario</span>
            {lowStockCount > 0 && (
              <Badge color="red">
                <AlertTriangle size={14} />
                {lowStockCount} bajo
              </Badge>
            )}
          </div>
        </div>
        <Button variant="secondary" size="lg" onClick={openMovements}>
          <History size={22} />
          Movimientos
        </Button>
      </div>

      {/* Search + filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <button
              onClick={() => setFilterLowStock(!filterLowStock)}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 font-semibold transition-colors ${
                filterLowStock
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <AlertTriangle size={18} />
              Solo stock bajo
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Product stock list */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package size={36} className="text-gray-400" />}
          title={filterLowStock ? 'Todo bien' : 'Sin productos'}
          description={filterLowStock ? 'No hay productos con stock bajo' : 'No se encontraron productos'}
        />
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const isLow = product.stock <= product.min_stock
            const pct = product.min_stock > 0 ? Math.min((product.stock / (product.min_stock * 3)) * 100, 100) : 100
            return (
              <Card key={product.id} className={isLow ? 'border-red-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{product.name}</h3>
                        {isLow && <AlertTriangle size={18} className="text-red-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {product.category && (
                          <Badge color={product.category.color}>{product.category.name}</Badge>
                        )}
                        <span className="text-sm text-gray-400">Min: {product.min_stock} {product.unit}</span>
                      </div>
                      {/* Stock bar */}
                      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isLow ? 'bg-red-500' : pct > 60 ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`px-5 py-3 rounded-xl text-center min-w-[110px] border-2 ${
                        isLow ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                      }`}>
                        <p className={`text-3xl font-bold ${isLow ? 'text-red-600' : 'text-green-600'}`}>
                          {product.stock}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">{product.unit}</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => openStockModal(product, 'ingreso')}
                        >
                          <PackagePlus size={18} />
                          Ingresar
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openStockModal(product, 'ajuste')}
                        >
                          <SlidersHorizontal size={18} />
                          Ajustar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Stock Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={movType === 'ingreso' ? 'Ingresar stock' : 'Ajustar stock'}
      >
        {selectedProduct && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="font-bold text-lg text-gray-900">{selectedProduct.name}</p>
              <p className="text-gray-500 mt-1">
                Stock actual: <span className="font-bold text-xl">{selectedProduct.stock}</span> {selectedProduct.unit}
              </p>
            </div>

            <Input
              label={movType === 'ingreso' ? 'Cantidad a ingresar' : 'Stock correcto'}
              type="number"
              min="0"
              step="0.001"
              placeholder={movType === 'ingreso' ? 'Ej: 10' : `Ej: ${selectedProduct.stock}`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              autoFocus
            />

            {movType === 'ingreso' && quantity && Number(quantity) > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <p className="text-sm text-gray-600">Stock resultante</p>
                <p className="text-2xl font-bold text-green-600">
                  {selectedProduct.stock + Number(quantity)} {selectedProduct.unit}
                </p>
              </div>
            )}

            {movType === 'ajuste' && quantity !== '' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                <p className="text-sm text-gray-600">
                  {Number(quantity) > selectedProduct.stock ? 'Se agrega' : 'Se resta'}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {Number(quantity) > selectedProduct.stock ? '+' : ''}{Number(quantity) - selectedProduct.stock} {selectedProduct.unit}
                </p>
              </div>
            )}

            <Input
              label="Notas (opcional)"
              placeholder="Ej: Compra a proveedor, conteo fisico..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                size="lg"
                className="flex-1"
                variant={movType === 'ingreso' ? 'success' : 'primary'}
                onClick={handleSaveStock}
                disabled={saving}
              >
                {saving ? 'Guardando...' : movType === 'ingreso' ? 'Registrar ingreso' : 'Ajustar stock'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Movements History */}
      {showMovements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowMovements(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <History size={22} className="text-gray-600" />
                <h2 className="text-xl font-bold">Movimientos de stock</h2>
              </div>
              <button onClick={() => setShowMovements(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-2">
              {movements.length === 0 ? (
                <p className="text-gray-400 text-center py-8 text-lg">No hay movimientos registrados</p>
              ) : (
                movements.map((mov) => {
                  const cfg = typeConfig[mov.type] || { label: mov.type, color: 'gray', icon: '?' }
                  return (
                    <div key={mov.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <Badge color={cfg.color}>{cfg.label}</Badge>
                          <span className="font-semibold text-gray-900">
                            {(mov.product as unknown as Product)?.name || 'Producto'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">{formatDateShort(mov.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <span>
                          Cantidad: <strong className={mov.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                            {mov.quantity > 0 ? '+' : ''}{mov.quantity}
                          </strong>
                        </span>
                        <span className="text-gray-400">{mov.stock_before} → <strong>{mov.stock_after}</strong></span>
                      </div>
                      {mov.notes && <p className="text-sm text-gray-400 mt-1 italic">{mov.notes}</p>}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
