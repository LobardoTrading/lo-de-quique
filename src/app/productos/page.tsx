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
import { Plus, Search, Edit2, Trash2, Package, ScanBarcode, AlertTriangle, Filter, LayoutGrid, List } from 'lucide-react'
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

/* ── inline style helpers ── */
const s = {
  page: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  searchWrap: {
    position: 'relative' as const,
    flex: '1 1 220px',
    minWidth: 180,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
    pointerEvents: 'none' as const,
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 40px',
    fontSize: 15,
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    outline: 'none',
    transition: 'border-color .15s',
  },
  filterSelect: {
    padding: '10px 14px',
    fontSize: 14,
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    outline: 'none',
    cursor: 'pointer',
    minWidth: 160,
  },
  viewToggle: {
    display: 'inline-flex',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    border: '1px solid var(--border)',
  },
  viewBtn: (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    background: active ? 'var(--green)' : 'var(--bg-input)',
    color: active ? '#fff' : 'var(--text-secondary)',
    border: 'none',
    cursor: 'pointer',
    transition: 'background .15s, color .15s',
  }),
  newBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 600,
    background: 'var(--green)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'background .15s',
    whiteSpace: 'nowrap' as const,
  },
  scanBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 14px',
    fontSize: 14,
    fontWeight: 500,
    background: 'var(--bg-card2)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'background .15s',
    whiteSpace: 'nowrap' as const,
  },
  pills: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto' as const,
    paddingBottom: 2,
  },
  pill: (active: boolean, color?: string) => ({
    flexShrink: 0,
    padding: '7px 16px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 20,
    border: active ? 'none' : '1px solid var(--border)',
    background: active ? (color || 'var(--green)') : 'var(--bg-card)',
    color: active ? '#fff' : 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'background .15s, color .15s',
    whiteSpace: 'nowrap' as const,
  }),
  header: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  subtitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  count: {
    fontSize: 15,
    color: 'var(--text-secondary)',
  },
  /* ── grid card ── */
  gridWrap: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 14,
  },
  card: (isLow: boolean) => ({
    background: 'var(--bg-card)',
    border: `1px solid ${isLow ? 'var(--red)' : 'var(--border)'}`,
    borderRadius: 'var(--radius)',
    padding: 18,
    transition: 'border-color .15s',
  }),
  cardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  catBadge: (color: string) => ({
    display: 'inline-block',
    padding: '2px 10px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 12,
    background: color + '22',
    color,
  }),
  barcode: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
  },
  actionBtn: (hoverColor: string) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    color: hoverColor,
    cursor: 'pointer',
    transition: 'background .15s',
  }),
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  metricBox: (bg: string, borderColor: string) => ({
    background: bg,
    border: `1px solid ${borderColor}`,
    borderRadius: 'var(--radius)',
    padding: '10px 12px',
  }),
  metricLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 500,
    margin: 0,
  },
  metricValue: (color: string) => ({
    fontSize: 20,
    fontWeight: 700,
    color,
    margin: '2px 0 0',
  }),
  metricUnit: {
    fontSize: 13,
    fontWeight: 400,
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    fontSize: 13,
  },
  costText: {
    color: 'var(--text-muted)',
  },
  marginGood: { color: 'var(--green)', fontWeight: 600, marginLeft: 4 },
  marginOk: { color: 'var(--orange)', fontWeight: 600, marginLeft: 4 },
  marginBad: { color: 'var(--red)', fontWeight: 600, marginLeft: 4 },
  /* ── list view ── */
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    border: '1px solid var(--border)',
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 14px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-card2)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  td: {
    padding: '12px 14px',
    fontSize: 14,
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border)',
  },
  trHover: {
    transition: 'background .1s',
    cursor: 'default',
  },
  /* ── form modal ── */
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
  },
  formCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
  },
  formLabel: {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 6,
  },
  formInput: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 15,
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    outline: 'none',
    transition: 'border-color .15s',
  },
  formActions: {
    display: 'flex',
    gap: 10,
    paddingTop: 14,
  },
  btnCancel: {
    flex: 1,
    padding: '12px 0',
    fontSize: 15,
    fontWeight: 600,
    background: 'var(--bg-card2)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  btnSave: {
    flex: 1,
    padding: '12px 0',
    fontSize: 15,
    fontWeight: 600,
    background: 'var(--green)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  barcodeRow: {
    display: 'flex',
    gap: 8,
  },
  barcodeScanBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 14px',
    background: 'var(--green-dim)',
    color: 'var(--green)',
    border: '1px solid var(--green)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'background .15s',
  },
  lowStockBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 12,
    background: 'rgba(224,80,80,0.15)',
    color: 'var(--red)',
  },
  skeleton: {
    height: 10,
    width: 180,
    background: 'var(--bg-card2)',
    borderRadius: 'var(--radius)',
    animation: 'pulse-bar 1.2s infinite',
  },
  skeletonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 14,
  },
  skeletonCard: {
    height: 180,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    animation: 'pulse-bar 1.2s infinite',
  },
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

  /* ── loading skeleton ── */
  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.skeleton} />
        <div style={s.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={s.skeletonCard} />
          ))}
        </div>
      </div>
    )
  }

  /* ── margin style helper ── */
  function marginStyle(m: number | null) {
    if (m === null) return undefined
    if (m >= 30) return s.marginGood
    if (m >= 15) return s.marginOk
    return s.marginBad
  }

  /* ── render grid card ── */
  function renderGridCard(product: Product) {
    const isLowStock = product.stock <= product.min_stock
    const m = margin(product)
    return (
      <div key={product.id} style={s.card(isLowStock)}>
        <div style={s.cardTop}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={s.cardName}>{product.name}</p>
            <div style={s.cardMeta}>
              {product.category && (
                <span style={s.catBadge(product.category.color)}>{product.category.name}</span>
              )}
              {product.barcode && (
                <span style={s.barcode}>{product.barcode}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2, marginLeft: 8, flexShrink: 0 }}>
            <button
              onClick={() => openEdit(product)}
              style={s.actionBtn('var(--green)')}
              title="Editar"
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--green-dim)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Edit2 size={17} />
            </button>
            <button
              onClick={() => setDeleteTarget(product)}
              style={s.actionBtn('var(--red)')}
              title="Desactivar"
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(224,80,80,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>

        <div style={s.metricsRow}>
          <div style={s.metricBox('var(--green-dim)', 'rgba(62,201,108,0.25)')}>
            <p style={s.metricLabel}>Precio venta</p>
            <p style={s.metricValue('var(--green)')}>{formatCurrency(product.price_sell)}</p>
          </div>
          <div style={s.metricBox(
            isLowStock ? 'rgba(224,80,80,0.12)' : 'rgba(59,158,255,0.1)',
            isLowStock ? 'rgba(224,80,80,0.3)' : 'rgba(59,158,255,0.2)',
          )}>
            <p style={s.metricLabel}>Stock</p>
            <p style={s.metricValue(isLowStock ? 'var(--red)' : 'var(--blue)')}>
              {product.stock} <span style={s.metricUnit}>{product.unit}</span>
            </p>
          </div>
        </div>

        {(product.price_cost > 0 || isLowStock) && (
          <div style={s.cardFooter}>
            {product.price_cost > 0 ? (
              <span style={s.costText}>
                Costo: {formatCurrency(product.price_cost)}
                {m !== null && <span style={marginStyle(m)}>({m}%)</span>}
              </span>
            ) : <span />}
            {isLowStock && (
              <span style={s.lowStockBadge}>
                <AlertTriangle size={12} /> Stock bajo
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  /* ── render list row ── */
  function renderListRow(product: Product) {
    const isLowStock = product.stock <= product.min_stock
    const m = margin(product)
    return (
      <tr
        key={product.id}
        style={s.trHover}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <td style={s.td}>
          <div style={{ fontWeight: 600 }}>{product.name}</div>
          {product.barcode && <div style={{ ...s.barcode, marginTop: 2 }}>{product.barcode}</div>}
        </td>
        <td style={s.td}>
          {product.category ? (
            <span style={s.catBadge(product.category.color)}>{product.category.name}</span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>--</span>
          )}
        </td>
        <td style={{ ...s.td, fontWeight: 700, color: 'var(--green)' }}>
          {formatCurrency(product.price_sell)}
        </td>
        <td style={s.td}>
          {product.price_cost > 0 ? (
            <span style={{ color: 'var(--text-secondary)' }}>
              {formatCurrency(product.price_cost)}
              {m !== null && <span style={marginStyle(m)}> ({m}%)</span>}
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>--</span>
          )}
        </td>
        <td style={{ ...s.td, color: isLowStock ? 'var(--red)' : 'var(--text-primary)', fontWeight: isLowStock ? 700 : 400 }}>
          {product.stock} {product.unit}
          {isLowStock && (
            <span style={{ ...s.lowStockBadge, marginLeft: 6 }}>
              <AlertTriangle size={11} /> Bajo
            </span>
          )}
        </td>
        <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              onClick={() => openEdit(product)}
              style={s.actionBtn('var(--green)')}
              title="Editar"
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--green-dim)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => setDeleteTarget(product)}
              style={s.actionBtn('var(--red)')}
              title="Desactivar"
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(224,80,80,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  /* ── main render ── */
  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Productos</h1>
          <div style={s.subtitle}>
            <span style={s.count}>{products.length} productos</span>
            {lowStockCount > 0 && (
              <span style={s.lowStockBadge}>
                <AlertTriangle size={13} /> {lowStockCount} stock bajo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={s.toolbar}>
        {/* Search */}
        <div style={s.searchWrap}>
          <Search size={18} style={s.searchIcon} />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.searchInput}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={s.filterSelect}
        >
          <option value="">Todas las categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* View toggle */}
        <div style={s.viewToggle}>
          <button
            style={s.viewBtn(viewMode === 'grid')}
            onClick={() => setViewMode('grid')}
            title="Vista grilla"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            style={s.viewBtn(viewMode === 'list')}
            onClick={() => setViewMode('list')}
            title="Vista lista"
          >
            <List size={18} />
          </button>
        </div>

        {/* Scan */}
        <button
          style={s.scanBtn}
          onClick={() => { setScanMode('search'); setShowScanner(true) }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card2)')}
        >
          <ScanBarcode size={18} /> Escanear
        </button>

        {/* New product */}
        <button
          style={s.newBtn}
          onClick={openNew}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--green-dark)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--green)')}
        >
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* Category pills */}
      <div style={s.pills}>
        <button
          onClick={() => setFilterCategory('')}
          style={s.pill(filterCategory === '')}
        >
          Todos ({products.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(filterCategory === cat.id ? '' : cat.id)}
            style={s.pill(filterCategory === cat.id, cat.color)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product list / grid */}
      {products.length === 0 ? (
        <EmptyState
          icon={<Package size={36} style={{ color: 'var(--text-muted)' }} />}
          title="Sin productos"
          description={search ? 'No se encontraron productos con esa busqueda' : 'Agrega tu primer producto para empezar'}
          action={!search ? (
            <button style={s.newBtn} onClick={openNew}>
              <Plus size={18} /> Nuevo Producto
            </button>
          ) : undefined}
        />
      ) : viewMode === 'grid' ? (
        <div style={s.gridWrap}>
          {products.map(renderGridCard)}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius)' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Producto</th>
                <th style={s.th}>Categoria</th>
                <th style={s.th}>Precio venta</th>
                <th style={s.th}>Costo</th>
                <th style={s.th}>Stock</th>
                <th style={{ ...s.th, width: 90 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(renderListRow)}
            </tbody>
          </table>
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
        <div style={s.formCol}>
          {/* Name */}
          <div>
            <label style={s.formLabel}>Nombre del producto</label>
            <input
              style={s.formInput}
              placeholder="Ej: Jamon crudo"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Category + Unit */}
          <div style={s.formGrid}>
            <div>
              <label style={s.formLabel}>Categoria</label>
              <select
                style={{ ...s.formInput, cursor: 'pointer' }}
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">Sin categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={s.formLabel}>Unidad de medida</label>
              <select
                style={{ ...s.formInput, cursor: 'pointer' }}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                {UNITS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cost + Sell */}
          <div style={s.formGrid}>
            <div>
              <label style={s.formLabel}>Precio de costo</label>
              <input
                style={s.formInput}
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.price_cost}
                onChange={(e) => setForm({ ...form, price_cost: e.target.value })}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>
            <div>
              <label style={s.formLabel}>Precio de venta</label>
              <input
                style={s.formInput}
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.price_sell}
                onChange={(e) => setForm({ ...form, price_sell: e.target.value })}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
              {form.price_cost && form.price_sell && Number(form.price_cost) > 0 && (
                <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text-secondary)' }}>
                  Margen: <span style={marginStyle(
                    Math.round((Number(form.price_sell) - Number(form.price_cost)) / Number(form.price_cost) * 100)
                  )}>
                    {Math.round((Number(form.price_sell) - Number(form.price_cost)) / Number(form.price_cost) * 100)}%
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Stock + Min stock */}
          <div style={s.formGrid}>
            <div>
              <label style={s.formLabel}>Stock actual</label>
              <input
                style={s.formInput}
                type="number"
                min="0"
                step="0.001"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>
            <div>
              <label style={s.formLabel}>Stock minimo (alerta)</label>
              <input
                style={s.formInput}
                type="number"
                min="0"
                step="0.001"
                value={form.min_stock}
                onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>
          </div>

          {/* Barcode */}
          <div>
            <label style={s.formLabel}>Codigo de barras (opcional)</label>
            <div style={s.barcodeRow}>
              <input
                style={{ ...s.formInput, flex: 1 }}
                type="text"
                placeholder="7790001234567"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
              <button
                type="button"
                onClick={() => { setScanMode('form'); setShowScanner(true) }}
                style={s.barcodeScanBtn}
                title="Escanear codigo"
              >
                <ScanBarcode size={22} />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={s.formLabel}>Notas (opcional)</label>
            <input
              style={s.formInput}
              placeholder="Observaciones..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Actions */}
          <div style={s.formActions}>
            <button
              style={s.btnCancel}
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              style={{
                ...s.btnSave,
                opacity: saving ? 0.6 : 1,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : editingProduct ? 'Guardar cambios' : 'Crear producto'}
            </button>
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
