'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { CardSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useDebounce } from '@/hooks/use-debounce'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, getProductByBarcode } from '@/lib/api'
import { formatCurrency } from '@/lib/helpers'
import { Plus, Search, Edit2, Trash2, Package, ScanBarcode, AlertTriangle, Filter } from 'lucide-react'
import { BarcodeScanner } from '@/components/barcode-scanner'
import type { Product, Category } from '@/types/database'

const UNITS = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'kg', label: 'Kilogramo' },
  { value: 'g', label: 'Gramo' },
  { value: 'lt', label: 'Litro' },
  { value: 'ml', label: 'Mililitro' },
  { value: 'porcion', label: 'Porcion' },
]

interface ProductForm {
  name: string
  category_id: string
  barcode: string
  price_cost: string
  price_sell: string
  stock: string
  min_stock: string
  unit: string
  notes: string
}

const emptyForm: ProductForm = {
  name: '',
  category_id: '',
  barcode: '',
  price_cost: '',
  price_sell: '',
  stock: '0',
  min_stock: '0',
  unit: 'unidad',
  notes: '',
}

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [filterCategory, setFilterCategory] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scanMode, setScanMode] = useState<'search' | 'form'>('search')
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { toast } = useToast()

  const loadProducts = useCallback(async () => {
    try {
      const data = await getProducts({
        search: debouncedSearch || undefined,
        category_id: filterCategory || undefined,
      })
      setProducts(data)
    } catch {
      toast('Error al cargar productos', 'error')
    }
  }, [debouncedSearch, filterCategory, toast])

  useEffect(() => {
    async function init() {
      try {
        const cats = await getCategories()
        setCategories(cats)
      } catch {}
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!loading) loadProducts()
  }, [loading, loadProducts])

  function openNew() {
    setEditingProduct(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(product: Product) {
    setEditingProduct(product)
    setForm({
      name: product.name,
      category_id: product.category_id || '',
      barcode: product.barcode || '',
      price_cost: String(product.price_cost),
      price_sell: String(product.price_sell),
      stock: String(product.stock),
      min_stock: String(product.min_stock),
      unit: product.unit,
      notes: product.notes || '',
    })
    setModalOpen(true)
  }

  async function handleBarcodeScan(barcode: string) {
    setShowScanner(false)
    if (scanMode === 'form') {
      setForm((prev) => ({ ...prev, barcode }))
      toast(`Codigo escaneado: ${barcode}`)
    } else {
      try {
        const product = await getProductByBarcode(barcode)
        if (product) {
          openEdit(product)
          toast(`Producto encontrado: ${product.name}`)
        } else {
          setEditingProduct(null)
          setForm({ ...emptyForm, barcode })
          setModalOpen(true)
          toast(`Codigo ${barcode} no encontrado. Carga el producto nuevo.`)
        }
      } catch {
        toast('Error al buscar producto', 'error')
      }
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast('Ingresa el nombre del producto', 'error')
      return
    }
    if (!form.price_sell || Number(form.price_sell) <= 0) {
      toast('Ingresa el precio de venta', 'error')
      return
    }

    setSaving(true)
    try {
      const productData = {
        name: form.name.trim(),
        category_id: form.category_id || null,
        barcode: form.barcode.trim() || undefined,
        price_cost: Number(form.price_cost) || 0,
        price_sell: Number(form.price_sell),
        stock: Number(form.stock) || 0,
        min_stock: Number(form.min_stock) || 0,
        unit: form.unit,
        notes: form.notes.trim() || undefined,
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData)
        toast('Producto actualizado')
      } else {
        await createProduct(productData)
        toast('Producto creado')
      }

      setModalOpen(false)
      loadProducts()
    } catch {
      toast('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteProduct(deleteTarget.id)
      toast('Producto desactivado')
      setDeleteTarget(null)
      loadProducts()
    } catch {
      toast('Error al desactivar', 'error')
    }
  }

  const lowStockCount = products.filter(p => p.stock <= p.min_stock).length
  const margin = (p: Product) => p.price_cost > 0 ? Math.round(((p.price_sell - p.price_cost) / p.price_cost) * 100) : null

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-lg text-gray-500">{products.length} productos</span>
            {lowStockCount > 0 && (
              <Badge color="red">
                <AlertTriangle size={14} />
                {lowStockCount} stock bajo
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button size="lg" variant="secondary" onClick={() => { setScanMode('search'); setShowScanner(true) }}>
            <ScanBarcode size={22} />
            Escanear
          </Button>
          <Button size="lg" onClick={openNew}>
            <Plus size={22} />
            Nuevo
          </Button>
        </div>
      </div>

      {/* Filters */}
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
            <Select
              options={[
                { value: '', label: 'Todas las categorias' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCategory('')}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            filterCategory === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Todos ({products.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(filterCategory === cat.id ? '' : cat.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filterCategory === cat.id
                ? 'text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
            style={filterCategory === cat.id ? { backgroundColor: cat.color } : undefined}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product list */}
      {products.length === 0 ? (
        <EmptyState
          icon={<Package size={36} className="text-gray-400" />}
          title="Sin productos"
          description={search ? 'No se encontraron productos con esa busqueda' : 'Agrega tu primer producto para empezar'}
          action={!search ? <Button onClick={openNew}><Plus size={20} /> Nuevo Producto</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((product) => {
            const isLowStock = product.stock <= product.min_stock
            const m = margin(product)
            return (
              <Card key={product.id} className={`hover:shadow-md transition-all ${isLowStock ? 'border-red-200' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        {product.category && (
                          <Badge color={product.category.color}>{product.category.name}</Badge>
                        )}
                        {product.barcode && (
                          <span className="text-xs text-gray-400 font-mono">{product.barcode}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <button
                        onClick={() => openEdit(product)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                        title="Desactivar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                      <p className="text-xs text-gray-500 font-medium">Precio venta</p>
                      <p className="text-xl font-bold text-green-700">{formatCurrency(product.price_sell)}</p>
                    </div>
                    <div className={`rounded-xl p-3 border ${isLowStock ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
                      <p className="text-xs text-gray-500 font-medium">Stock</p>
                      <p className={`text-xl font-bold ${isLowStock ? 'text-red-600' : 'text-blue-700'}`}>
                        {product.stock} <span className="text-sm font-normal">{product.unit}</span>
                      </p>
                    </div>
                  </div>

                  {(product.price_cost > 0 || isLowStock) && (
                    <div className="flex items-center justify-between mt-3 text-sm">
                      {product.price_cost > 0 ? (
                        <span className="text-gray-400">
                          Costo: {formatCurrency(product.price_cost)}
                          {m !== null && <span className={`ml-1 font-semibold ${m >= 30 ? 'text-green-600' : m >= 15 ? 'text-yellow-600' : 'text-red-500'}`}>({m}%)</span>}
                        </span>
                      ) : <span />}
                      {isLowStock && (
                        <Badge color="red">
                          <AlertTriangle size={12} />
                          Stock bajo
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Desactivar producto"
        message={`Se va a desactivar "${deleteTarget?.name}". No se va a eliminar, solo se oculta de las ventas.`}
        confirmLabel="Desactivar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Product Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <div className="space-y-5">
          <Input
            label="Nombre del producto"
            placeholder="Ej: Jamon crudo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Categoria"
              options={[
                { value: '', label: 'Sin categoria' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            />
            <Select
              label="Unidad de medida"
              options={UNITS}
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Precio de costo"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={form.price_cost}
              onChange={(e) => setForm({ ...form, price_cost: e.target.value })}
            />
            <div>
              <Input
                label="Precio de venta"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.price_sell}
                onChange={(e) => setForm({ ...form, price_sell: e.target.value })}
              />
              {form.price_cost && form.price_sell && Number(form.price_cost) > 0 && (
                <p className="text-sm mt-1">
                  Margen: <span className={`font-semibold ${
                    ((Number(form.price_sell) - Number(form.price_cost)) / Number(form.price_cost) * 100) >= 30 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {Math.round((Number(form.price_sell) - Number(form.price_cost)) / Number(form.price_cost) * 100)}%
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Stock actual"
              type="number"
              min="0"
              step="0.001"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
            <Input
              label="Stock minimo (alerta)"
              type="number"
              min="0"
              step="0.001"
              value={form.min_stock}
              onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Codigo de barras (opcional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="7790001234567"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                className="flex-1 px-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => { setScanMode('form'); setShowScanner(true) }}
                className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl border-2 border-blue-200 hover:bg-blue-100 transition-colors"
                title="Escanear codigo"
              >
                <ScanBarcode size={24} />
              </button>
            </div>
          </div>

          <Input
            label="Notas (opcional)"
            placeholder="Observaciones..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : editingProduct ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  )
}
