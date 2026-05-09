'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, getProductByBarcode } from '@/lib/api'
import { formatCurrency } from '@/lib/helpers'
import { Plus, Search, Edit2, Trash2, Package, ScanBarcode } from 'lucide-react'
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
  const [filterCategory, setFilterCategory] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scanMode, setScanMode] = useState<'search' | 'form'>('search')
  const { toast } = useToast()

  const loadProducts = useCallback(async () => {
    try {
      const data = await getProducts({
        search: search || undefined,
        category_id: filterCategory || undefined,
      })
      setProducts(data)
    } catch (err) {
      toast('Error al cargar productos', 'error')
    }
  }, [search, filterCategory, toast])

  useEffect(() => {
    async function init() {
      try {
        const cats = await getCategories()
        setCategories(cats)
      } catch (err) {
        console.error(err)
      }
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
      // Search mode: find product by barcode
      try {
        const product = await getProductByBarcode(barcode)
        if (product) {
          openEdit(product)
          toast(`Producto encontrado: ${product.name}`)
        } else {
          // Not found: open new product form with barcode pre-filled
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
    } catch (err) {
      toast('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Desactivar "${product.name}"?`)) return
    try {
      await deleteProduct(product.id)
      toast('Producto desactivado')
      loadProducts()
    } catch (err) {
      toast('Error al desactivar', 'error')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-xl text-gray-400">Cargando...</p></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-lg text-gray-500">{products.length} productos activos</p>
        </div>
        <div className="flex gap-3">
          <Button size="lg" variant="secondary" onClick={() => { setScanMode('search'); setShowScanner(true) }}>
            <ScanBarcode size={22} />
            Escanear
          </Button>
          <Button size="lg" onClick={openNew}>
            <Plus size={22} />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
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

      {/* Product list */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-400">No hay productos</p>
            <p className="text-gray-400 mt-2">Agrega tu primer producto con el boton de arriba</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{product.name}</h3>
                    {product.category && (
                      <span
                        className="inline-block text-sm px-3 py-1 rounded-full mt-1 font-medium"
                        style={{ backgroundColor: product.category.color + '20', color: product.category.color }}
                      >
                        {product.category.name}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => openEdit(product)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      title="Desactivar"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Precio venta</p>
                    <p className="text-lg font-bold text-green-700">{formatCurrency(product.price_sell)}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${product.stock <= product.min_stock ? 'bg-red-50' : 'bg-blue-50'}`}>
                    <p className="text-xs text-gray-500">Stock</p>
                    <p className={`text-lg font-bold ${product.stock <= product.min_stock ? 'text-red-600' : 'text-blue-700'}`}>
                      {product.stock} {product.unit}
                    </p>
                  </div>
                </div>

                {product.price_cost > 0 && (
                  <p className="text-sm text-gray-400 mt-3">
                    Costo: {formatCurrency(product.price_cost)} | Margen: {Math.round(((product.price_sell - product.price_cost) / product.price_cost) * 100)}%
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
            <Input
              label="Precio de venta"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={form.price_sell}
              onChange={(e) => setForm({ ...form, price_sell: e.target.value })}
            />
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
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
