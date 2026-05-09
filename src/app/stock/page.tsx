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
        <div className="h-10 w-48 rounded-[10px] animate-pulse" style={{ background: '#252525' }} />
        <ListSkeleton rows={6} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#f0f0f0' }}>Stock</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-lg" style={{ color: '#999' }}>Gestion de inventario</span>
            {lowStockCount > 0 && (
              <Badge color="red">
                <AlertTriangle size={14} />
                {lowStockCount} bajo
              </Badge>
            )}
          </div>
        </div>
        <button
          onClick={openMovements}
          className="flex items-center gap-2 px-5 py-3 rounded-[10px] font-semibold text-base transition-colors"
          style={{
            background: '#1e1e1e',
            border: '1px solid #333',
            color: '#f0f0f0',
          }}
        >
          <History size={22} />
          Movimientos
        </button>
      </div>

      {/* Search + filters */}
      <div className="rounded-[10px] p-4" style={{ background: '#1e1e1e', border: '1px solid #333' }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#666' }} />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-lg rounded-[10px] transition-colors outline-none"
              style={{
                background: '#2a2a2a',
                border: '2px solid #333',
                color: '#f0f0f0',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#3ec96c')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#333')}
            />
          </div>
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] font-semibold transition-colors"
            style={{
              border: filterLowStock ? '2px solid #e05050' : '2px solid #333',
              background: filterLowStock ? 'rgba(224,80,80,0.15)' : 'transparent',
              color: filterLowStock ? '#e05050' : '#999',
            }}
          >
            <AlertTriangle size={18} />
            Solo stock bajo
          </button>
        </div>
      </div>

      {/* Product stock list */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package size={36} style={{ color: '#666' }} />}
          title={filterLowStock ? 'Todo bien' : 'Sin productos'}
          description={filterLowStock ? 'No hay productos con stock bajo' : 'No se encontraron productos'}
        />
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const isLow = product.stock <= product.min_stock
            const pct = product.min_stock > 0 ? Math.min((product.stock / (product.min_stock * 3)) * 100, 100) : 100
            return (
              <div
                key={product.id}
                className="rounded-[10px] p-4"
                style={{
                  background: '#1e1e1e',
                  border: isLow ? '1px solid #e05050' : '1px solid #333',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold truncate" style={{ color: '#f0f0f0' }}>{product.name}</h3>
                      {isLow && <AlertTriangle size={18} className="shrink-0" style={{ color: '#e05050' }} />}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {product.category && (
                        <Badge color={product.category.color}>{product.category.name}</Badge>
                      )}
                      <span className="text-sm" style={{ color: '#666' }}>Min: {product.min_stock} {product.unit}</span>
                    </div>
                    {/* Stock bar */}
                    <div className="mt-3 h-2 rounded-full overflow-hidden max-w-xs" style={{ background: '#252525' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: isLow ? '#e05050' : pct > 60 ? '#3ec96c' : '#e0a030',
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className="px-5 py-3 rounded-[10px] text-center min-w-[110px]"
                      style={{
                        background: isLow ? 'rgba(224,80,80,0.15)' : 'rgba(62,201,108,0.15)',
                        border: isLow ? '2px solid rgba(224,80,80,0.3)' : '2px solid rgba(62,201,108,0.3)',
                      }}
                    >
                      <p className="text-3xl font-bold" style={{ color: isLow ? '#e05050' : '#3ec96c' }}>
                        {product.stock}
                      </p>
                      <p className="text-xs font-medium" style={{ color: '#999' }}>{product.unit}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold transition-colors"
                        style={{
                          background: 'rgba(62,201,108,0.15)',
                          color: '#3ec96c',
                          border: '1px solid rgba(62,201,108,0.3)',
                        }}
                        onClick={() => openStockModal(product, 'ingreso')}
                      >
                        <PackagePlus size={18} />
                        Ingresar
                      </button>
                      <button
                        className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold transition-colors"
                        style={{
                          background: '#252525',
                          color: '#999',
                          border: '1px solid #333',
                        }}
                        onClick={() => openStockModal(product, 'ajuste')}
                      >
                        <SlidersHorizontal size={18} />
                        Ajustar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
            <div className="rounded-[10px] p-4" style={{ background: '#252525', border: '1px solid #333' }}>
              <p className="font-bold text-lg" style={{ color: '#f0f0f0' }}>{selectedProduct.name}</p>
              <p className="mt-1" style={{ color: '#999' }}>
                Stock actual: <span className="font-bold text-xl" style={{ color: '#f0f0f0' }}>{selectedProduct.stock}</span> {selectedProduct.unit}
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
              <div className="rounded-[10px] p-3 text-center" style={{ background: 'rgba(62,201,108,0.15)', border: '1px solid rgba(62,201,108,0.3)' }}>
                <p className="text-sm" style={{ color: '#999' }}>Stock resultante</p>
                <p className="text-2xl font-bold" style={{ color: '#3ec96c' }}>
                  {selectedProduct.stock + Number(quantity)} {selectedProduct.unit}
                </p>
              </div>
            )}

            {movType === 'ajuste' && quantity !== '' && (
              <div className="rounded-[10px] p-3 text-center" style={{ background: 'rgba(80,130,224,0.15)', border: '1px solid rgba(80,130,224,0.3)' }}>
                <p className="text-sm" style={{ color: '#999' }}>
                  {Number(quantity) > selectedProduct.stock ? 'Se agrega' : 'Se resta'}
                </p>
                <p className="text-2xl font-bold" style={{ color: '#5082e0' }}>
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
              <button
                className="flex-1 px-5 py-3 rounded-[10px] font-semibold text-base transition-colors"
                style={{ background: '#252525', border: '1px solid #333', color: '#999' }}
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 px-5 py-3 rounded-[10px] font-semibold text-base transition-colors disabled:opacity-50"
                style={{
                  background: movType === 'ingreso' ? '#3ec96c' : '#5082e0',
                  border: 'none',
                  color: '#121212',
                }}
                onClick={handleSaveStock}
                disabled={saving}
              >
                {saving ? 'Guardando...' : movType === 'ingreso' ? 'Registrar ingreso' : 'Ajustar stock'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Movements History */}
      {showMovements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowMovements(false)} />
          <div className="relative rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" style={{ background: '#1e1e1e' }}>
            <div className="sticky top-0 rounded-t-2xl px-6 py-4 flex items-center justify-between z-10" style={{ background: '#1e1e1e', borderBottom: '1px solid #333' }}>
              <div className="flex items-center gap-3">
                <History size={22} style={{ color: '#999' }} />
                <h2 className="text-xl font-bold" style={{ color: '#f0f0f0' }}>Movimientos de stock</h2>
              </div>
              <button
                onClick={() => setShowMovements(false)}
                className="p-2 rounded-[10px] transition-colors"
                style={{ color: '#999' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#252525')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-2">
              {movements.length === 0 ? (
                <p className="text-center py-8 text-lg" style={{ color: '#666' }}>No hay movimientos registrados</p>
              ) : (
                movements.map((mov) => {
                  const cfg = typeConfig[mov.type] || { label: mov.type, color: 'gray', icon: '?' }
                  return (
                    <div
                      key={mov.id}
                      className="rounded-[10px] p-4 transition-colors"
                      style={{ background: '#252525' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#252525')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <Badge color={cfg.color}>{cfg.label}</Badge>
                          <span className="font-semibold" style={{ color: '#f0f0f0' }}>
                            {(mov.product as unknown as Product)?.name || 'Producto'}
                          </span>
                        </div>
                        <span className="text-sm" style={{ color: '#666' }}>{formatDateShort(mov.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm mt-2" style={{ color: '#999' }}>
                        <span>
                          Cantidad: <strong style={{ color: mov.quantity > 0 ? '#3ec96c' : '#e05050' }}>
                            {mov.quantity > 0 ? '+' : ''}{mov.quantity}
                          </strong>
                        </span>
                        <span style={{ color: '#666' }}>{mov.stock_before} → <strong style={{ color: '#f0f0f0' }}>{mov.stock_after}</strong></span>
                      </div>
                      {mov.notes && <p className="text-sm mt-1 italic" style={{ color: '#666' }}>{mov.notes}</p>}
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
