'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { getProducts, addStock, getStockMovements } from '@/lib/api'
import { formatDateShort } from '@/lib/helpers'
import { Search, Plus, ArrowDownToLine, ArrowUpFromLine, History, PackagePlus, SlidersHorizontal } from 'lucide-react'
import type { Product, StockMovement } from '@/types/database'

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [movType, setMovType] = useState<'ingreso' | 'ajuste'>('ingreso')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showMovements, setShowMovements] = useState(false)
  const { toast } = useToast()

  const loadProducts = useCallback(async () => {
    try {
      const data = await getProducts({ search: search || undefined })
      setProducts(data)
    } catch {
      toast('Error al cargar productos', 'error')
    }
  }, [search, toast])

  useEffect(() => {
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) loadProducts()
  }, [loading, loadProducts])

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
    } catch (err) {
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

  const typeLabels: Record<string, { label: string; color: string }> = {
    ingreso: { label: 'Ingreso', color: 'text-green-600 bg-green-50' },
    egreso: { label: 'Egreso', color: 'text-orange-600 bg-orange-50' },
    ajuste: { label: 'Ajuste', color: 'text-blue-600 bg-blue-50' },
    venta: { label: 'Venta', color: 'text-purple-600 bg-purple-50' },
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-xl text-gray-400">Cargando...</p></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock</h1>
          <p className="text-lg text-gray-500">Gestion de inventario</p>
        </div>
        <Button variant="secondary" size="lg" onClick={openMovements}>
          <History size={22} />
          Movimientos
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Product stock list */}
      <div className="space-y-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    {product.category && (
                      <span className="text-sm text-gray-500">{product.category.name}</span>
                    )}
                    <span className="text-sm text-gray-400">Min: {product.min_stock} {product.unit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-xl text-center min-w-[100px] ${
                    product.stock <= product.min_stock
                      ? 'bg-red-50 border-2 border-red-200'
                      : 'bg-green-50 border-2 border-green-200'
                  }`}>
                    <p className={`text-2xl font-bold ${
                      product.stock <= product.min_stock ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {product.stock}
                    </p>
                    <p className="text-xs text-gray-500">{product.unit}</p>
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
        ))}

        {products.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">No se encontraron productos</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stock Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={movType === 'ingreso' ? 'Ingresar stock' : 'Ajustar stock'}
      >
        {selectedProduct && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-bold text-lg text-gray-900">{selectedProduct.name}</p>
              <p className="text-gray-500">
                Stock actual: <span className="font-bold">{selectedProduct.stock} {selectedProduct.unit}</span>
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

            {movType === 'ingreso' && quantity && (
              <p className="text-sm text-gray-500">
                Stock resultante: <span className="font-bold text-green-600">
                  {selectedProduct.stock + Number(quantity)} {selectedProduct.unit}
                </span>
              </p>
            )}

            <Input
              label="Notas (opcional)"
              placeholder="Ej: Compra a proveedor"
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
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Movimientos de stock</h2>
              <button onClick={() => setShowMovements(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="p-6 space-y-3">
              {movements.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No hay movimientos registrados</p>
              ) : (
                movements.map((mov) => {
                  const typeInfo = typeLabels[mov.type] || { label: mov.type, color: 'text-gray-600 bg-gray-50' }
                  return (
                    <div key={mov.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-semibold px-2 py-1 rounded-lg ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {(mov.product as unknown as Product)?.name || 'Producto'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{formatDateShort(mov.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <span>Cantidad: <strong>{mov.quantity > 0 ? '+' : ''}{mov.quantity}</strong></span>
                        <span>{mov.stock_before} → {mov.stock_after}</span>
                      </div>
                      {mov.notes && <p className="text-sm text-gray-400 mt-1">{mov.notes}</p>}
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
