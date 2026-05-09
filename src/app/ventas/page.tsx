'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { CardSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useDebounce } from '@/hooks/use-debounce'
import { getProducts, getCategories, createSale, getSales, getProductByBarcode } from '@/lib/api'
import { formatCurrency, formatDateShort } from '@/lib/helpers'
import {
  Search, Plus, Minus, ShoppingCart, CreditCard, Banknote,
  History, X, ScanBarcode, Trash2, CheckCircle, Smartphone,
  ArrowRightLeft, Receipt, Hash,
} from 'lucide-react'
import { BarcodeScanner } from '@/components/barcode-scanner'
import type { Product, Category, CartItem, Sale } from '@/types/database'

const PAYMENT_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote, activeColor: 'var(--green)', activeBg: 'var(--green-dim)' },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard, activeColor: 'var(--blue)', activeBg: 'rgba(59,158,255,0.15)' },
  { id: 'transferencia', label: 'Transferencia', icon: ArrowRightLeft, activeColor: 'var(--purple)', activeBg: 'rgba(168,85,247,0.15)' },
  { id: 'mercadopago', label: 'MercadoPago', icon: Smartphone, activeColor: 'var(--cyan)', activeBg: 'rgba(34,211,238,0.15)' },
]

const cssVars = {
  '--bg-main': '#121212',
  '--bg-card': '#1e1e1e',
  '--bg-card2': '#252525',
  '--bg-input': '#2a2a2a',
  '--border': '#333',
  '--text-primary': '#f0f0f0',
  '--text-secondary': '#999',
  '--text-muted': '#666',
  '--green': '#3ec96c',
  '--green-dark': '#2eaa57',
  '--green-dim': 'rgba(62,201,108,0.15)',
  '--red': '#e05050',
  '--blue': '#3b9eff',
  '--purple': '#a855f7',
  '--cyan': '#22d3ee',
  '--orange': '#f5a623',
  '--radius': '10px',
} as React.CSSProperties

export default function VentasPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [filterCat, setFilterCat] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [saleNotes, setSaleNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [salesHistory, setSalesHistory] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [showTicket, setShowTicket] = useState(false)
  const [customQtyProduct, setCustomQtyProduct] = useState<Product | null>(null)
  const [customQty, setCustomQty] = useState('')
  const { toast } = useToast()

  const loadProducts = useCallback(async () => {
    try {
      const data = await getProducts({ search: debouncedSearch || undefined, category_id: filterCat || undefined })
      setProducts(data)
    } catch {
      toast('Error al cargar productos', 'error')
    }
  }, [debouncedSearch, filterCat, toast])

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

  function addToCart(product: Product, qty = 1) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        const newQty = existing.quantity + qty
        if (newQty > product.stock) {
          toast('No hay mas stock disponible', 'error')
          return prev
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        )
      }
      if (product.stock < qty) {
        toast('Producto sin stock suficiente', 'error')
        return prev
      }
      return [...prev, { product, quantity: qty }]
    })
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item
          const newQty = item.quantity + delta
          if (newQty > item.product.stock) {
            toast('No hay mas stock', 'error')
            return item
          }
          return { ...item, quantity: newQty }
        })
        .filter((item) => item.quantity > 0)
    )
  }

  function setItemQuantity(productId: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId))
      return
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item
        if (qty > item.product.stock) {
          toast('No hay mas stock', 'error')
          return item
        }
        return { ...item, quantity: qty }
      })
    )
  }

  async function handleBarcodeScan(barcode: string) {
    setShowScanner(false)
    try {
      const product = await getProductByBarcode(barcode)
      if (product) {
        addToCart(product)
        toast(`${product.name} agregado`)
        if (navigator.vibrate) navigator.vibrate(100)
      } else {
        toast(`Producto no encontrado (${barcode})`, 'error')
        if (navigator.vibrate) navigator.vibrate([100, 50, 100])
      }
    } catch {
      toast('Error al buscar producto', 'error')
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price_sell * item.quantity, 0)
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  async function handleCheckout() {
    setShowConfirm(false)
    setProcessing(true)
    try {
      const sale = await createSale(cart, paymentMethod, saleNotes || undefined)
      setLastSale({ ...sale, items: cart.map((item, i) => ({
        id: String(i),
        sale_id: sale.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price_at_sale: item.product.price_sell,
        subtotal: item.product.price_sell * item.quantity,
        created_at: new Date().toISOString(),
      }))})
      setShowTicket(true)
      if (navigator.vibrate) navigator.vibrate([100, 50, 200])
      setCart([])
      setSaleNotes('')
      loadProducts()
    } catch (err) {
      toast('Error al registrar la venta', 'error')
    } finally {
      setProcessing(false)
    }
  }

  async function openHistory() {
    try {
      const sales = await getSales(50)
      setSalesHistory(sales)
      setShowHistory(true)
    } catch {
      toast('Error al cargar historial', 'error')
    }
  }

  function handleCustomQty() {
    if (!customQtyProduct || !customQty) return
    const qty = Number(customQty)
    if (qty <= 0) return
    addToCart(customQtyProduct, qty)
    setCustomQtyProduct(null)
    setCustomQty('')
  }

  if (loading) {
    return (
      <div style={{ ...cssVars, color: 'var(--text-primary)' }} className="space-y-6">
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)' }} className="h-10 w-48 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div style={cssVars} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-3xl font-bold">Punto de Venta</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-lg">Registrar ventas</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowScanner(true)}
            style={{
              background: 'var(--green)',
              color: '#fff',
              borderRadius: 'var(--radius)',
            }}
            className="flex items-center gap-2 px-5 py-3 text-base font-semibold hover:opacity-90 transition-opacity"
          >
            <ScanBarcode size={22} />
            Escanear
          </button>
          <button
            onClick={openHistory}
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}
            className="flex items-center gap-2 px-5 py-3 text-base font-semibold hover:opacity-80 transition-opacity"
          >
            <History size={22} />
            Historial
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '16px',
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  style={{
                    background: 'var(--bg-input)',
                    border: '2px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--text-primary)',
                  }}
                  className="w-full pl-12 pr-4 py-3 text-lg focus:outline-none transition-colors"
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--green)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                />
              </div>
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                }}
                className="focus:outline-none"
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--green)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFilterCat('')}
              style={{
                background: filterCat === '' ? 'var(--green)' : 'var(--bg-card)',
                color: filterCat === '' ? '#fff' : 'var(--text-secondary)',
                border: filterCat === '' ? 'none' : '1px solid var(--border)',
                borderRadius: '9999px',
              }}
              className="shrink-0 px-4 py-2 text-sm font-semibold transition-colors"
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCat(filterCat === cat.id ? '' : cat.id)}
                style={{
                  background: filterCat === cat.id ? cat.color : 'var(--bg-card)',
                  color: filterCat === cat.id ? '#fff' : 'var(--text-secondary)',
                  border: filterCat === cat.id ? 'none' : '1px solid var(--border)',
                  borderRadius: '9999px',
                }}
                className="shrink-0 px-4 py-2 text-sm font-semibold transition-colors"
              >
                {cat.name}
              </button>
            ))}
          </div>

          {products.length === 0 ? (
            <EmptyState
              icon={<Search size={36} style={{ color: 'var(--text-muted)' }} />}
              title="Sin resultados"
              description="No se encontraron productos con esa busqueda"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id)
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setCustomQtyProduct(product)
                      setCustomQty('')
                    }}
                    disabled={product.stock <= 0}
                    style={{
                      background: 'var(--bg-card)',
                      border: inCart
                        ? '2px solid var(--green)'
                        : '2px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      opacity: product.stock <= 0 ? 0.4 : 1,
                      cursor: product.stock <= 0 ? 'not-allowed' : 'pointer',
                    }}
                    className="relative p-4 text-left transition-all hover:shadow-lg active:scale-[0.97]"
                    onMouseEnter={(e) => {
                      if (product.stock > 0 && !inCart) e.currentTarget.style.borderColor = 'var(--green)'
                    }}
                    onMouseLeave={(e) => {
                      if (product.stock > 0 && !inCart) e.currentTarget.style.borderColor = 'var(--border)'
                    }}
                  >
                    {inCart && (
                      <span
                        style={{
                          background: 'var(--green)',
                          color: '#fff',
                        }}
                        className="absolute -top-2 -right-2 text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center shadow"
                      >
                        {inCart.quantity}
                      </span>
                    )}
                    <p style={{ color: 'var(--text-primary)' }} className="font-semibold truncate text-base">{product.name}</p>
                    {product.category && (
                      <Badge color={product.category.color} className="mt-1 text-xs">
                        {product.category.name}
                      </Badge>
                    )}
                    <p style={{ color: 'var(--green)' }} className="text-xl font-bold mt-2">{formatCurrency(product.price_sell)}</p>
                    <p
                      style={{
                        color: product.stock <= product.min_stock ? 'var(--red)' : 'var(--text-muted)',
                      }}
                      className={`text-sm mt-1 ${product.stock <= product.min_stock ? 'font-semibold' : ''}`}
                    >
                      Stock: {product.stock} {product.unit}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="space-y-4">
          <div
            style={{
              background: 'var(--bg-card)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}
            className="sticky top-4"
          >
            {/* Cart header */}
            <div style={{ borderBottom: '1px solid var(--border)', padding: '16px' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{ background: 'var(--green-dim)', borderRadius: '8px', padding: '8px' }}>
                    <ShoppingCart size={20} style={{ color: 'var(--green)' }} />
                  </div>
                  <h2 style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">Carrito</h2>
                </div>
                {cart.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        background: 'var(--green-dim)',
                        color: 'var(--green)',
                        borderRadius: '9999px',
                        padding: '2px 10px',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      {cartItems} items
                    </span>
                    <button
                      onClick={() => setCart([])}
                      style={{ color: 'var(--red)' }}
                      className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                      title="Vaciar carrito"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cart content */}
            <div style={{ padding: '16px' }}>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p style={{ color: 'var(--text-muted)' }} className="text-lg">Selecciona productos</p>
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">Toca un producto o escanea un codigo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      style={{
                        background: 'var(--bg-card2)',
                        borderRadius: 'var(--radius)',
                        padding: '12px',
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <p style={{ color: 'var(--text-primary)' }} className="font-semibold text-sm flex-1 leading-tight">{item.product.name}</p>
                        <button
                          onClick={() => setCart(prev => prev.filter(i => i.product.id !== item.product.id))}
                          style={{ color: 'var(--red)' }}
                          className="p-1 rounded-lg hover:opacity-70 shrink-0 ml-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            style={{
                              background: 'var(--bg-input)',
                              border: '2px solid var(--border)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                            }}
                            className="w-9 h-9 flex items-center justify-center transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => setItemQuantity(item.product.id, Number(e.target.value))}
                            min={0}
                            max={item.product.stock}
                            style={{
                              background: 'var(--bg-input)',
                              border: '2px solid var(--border)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                            }}
                            className="w-14 text-center font-bold text-lg py-1 focus:outline-none"
                            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--green)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                          />
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            style={{
                              background: 'var(--bg-input)',
                              border: '2px solid var(--border)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                            }}
                            className="w-9 h-9 flex items-center justify-center transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="text-right">
                          <p style={{ color: 'var(--green)' }} className="font-bold">
                            {formatCurrency(item.product.price_sell * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p style={{ color: 'var(--text-muted)' }} className="text-xs">{formatCurrency(item.product.price_sell)} c/u</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Notes */}
                  <input
                    type="text"
                    placeholder="Notas de la venta (opcional)"
                    value={saleNotes}
                    onChange={(e) => setSaleNotes(e.target.value)}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                    className="w-full px-3 py-2 text-sm focus:outline-none"
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--green)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  />

                  <div style={{ borderTop: '2px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                    <div className="flex justify-between items-center mb-4">
                      <span style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">TOTAL</span>
                      <span style={{ color: 'var(--green)', fontSize: '1.875rem' }} className="font-bold">{formatCurrency(cartTotal)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {PAYMENT_METHODS.map((pm) => {
                        const Icon = pm.icon
                        const isActive = paymentMethod === pm.id
                        return (
                          <button
                            key={pm.id}
                            onClick={() => setPaymentMethod(pm.id)}
                            style={{
                              background: isActive ? pm.activeBg : 'transparent',
                              border: `2px solid ${isActive ? pm.activeColor : 'var(--border)'}`,
                              borderRadius: 'var(--radius)',
                              color: isActive ? pm.activeColor : 'var(--text-muted)',
                            }}
                            className="flex items-center justify-center gap-2 p-3 font-semibold transition-all text-sm"
                          >
                            <Icon size={18} />
                            {pm.label}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => setShowConfirm(true)}
                      disabled={processing}
                      style={{
                        background: 'var(--green)',
                        color: '#fff',
                        borderRadius: 'var(--radius)',
                        opacity: processing ? 0.6 : 1,
                      }}
                      className="w-full py-4 text-lg font-bold hover:opacity-90 transition-opacity"
                    >
                      {processing ? 'Procesando...' : `Cobrar ${formatCurrency(cartTotal)}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm checkout */}
      <ConfirmDialog
        open={showConfirm}
        title="Confirmar venta"
        message={`Total: ${formatCurrency(cartTotal)} - ${PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}. ${cartItems} producto${cartItems !== 1 ? 's' : ''}.`}
        confirmLabel={`Cobrar ${formatCurrency(cartTotal)}`}
        variant="success"
        onConfirm={handleCheckout}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Sale Ticket */}
      {showTicket && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowTicket(false)} />
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
            }}
            className="relative shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Success header */}
            <div
              style={{
                background: 'var(--green)',
                color: '#fff',
              }}
              className="p-6 text-center"
            >
              <CheckCircle size={48} className="mx-auto mb-3" />
              <h2 className="text-2xl font-bold">Venta registrada</h2>
              <p style={{ opacity: 0.8 }} className="mt-1">#{lastSale.sale_number}</p>
            </div>

            {/* Ticket body */}
            <div className="p-6">
              <div style={{ borderBottom: '1px dashed var(--border)' }} className="pb-4 mb-4">
                <div className="text-center mb-3">
                  <p style={{ color: 'var(--text-primary)' }} className="font-bold text-lg">Lo de Quique</p>
                  <p style={{ color: 'var(--text-secondary)' }} className="text-sm">{formatDateShort(lastSale.created_at)}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {lastSale.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span style={{ color: 'var(--text-primary)' }} className="font-medium">{item.product_name}</span>
                      <span style={{ color: 'var(--text-muted)' }} className="ml-2">x{item.quantity}</span>
                    </div>
                    <span style={{ color: 'var(--text-primary)' }} className="font-semibold">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px dashed var(--border)' }} className="pt-3">
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">TOTAL</span>
                  <span style={{ color: 'var(--green)' }} className="text-2xl font-bold">{formatCurrency(lastSale.total)}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1 capitalize">
                  Pago: {lastSale.payment_method}
                </p>
              </div>

              <button
                onClick={() => setShowTicket(false)}
                style={{
                  background: 'var(--green)',
                  color: '#fff',
                  borderRadius: 'var(--radius)',
                }}
                className="w-full py-3 text-base font-semibold mt-6 hover:opacity-90 transition-opacity"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom quantity dialog */}
      {customQtyProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setCustomQtyProduct(null)} />
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
            }}
            className="relative shadow-xl w-full max-w-xs p-6 space-y-4"
          >
            <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-bold">{customQtyProduct.name}</h3>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Stock: {customQtyProduct.stock} {customQtyProduct.unit}</p>
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">Cantidad</label>
              <input
                type="number"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="Ej: 2.5"
                min={0}
                max={customQtyProduct.stock}
                step="0.001"
                autoFocus
                style={{
                  background: 'var(--bg-input)',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-primary)',
                }}
                className="w-full px-4 py-3 text-2xl font-bold text-center mt-2 focus:outline-none"
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--green)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomQty()}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCustomQtyProduct(null)}
                style={{
                  background: 'var(--bg-card2)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                }}
                className="flex-1 py-3 font-semibold hover:opacity-80 transition-opacity"
              >
                Cancelar
              </button>
              <button
                onClick={handleCustomQty}
                style={{
                  background: 'var(--green)',
                  color: '#fff',
                  borderRadius: 'var(--radius)',
                }}
                className="flex-1 py-3 font-semibold hover:opacity-90 transition-opacity"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales History */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowHistory(false)} />
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
            }}
            className="relative shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
          >
            <div
              style={{
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border)',
                borderRadius: '16px 16px 0 0',
              }}
              className="sticky top-0 px-6 py-4 flex items-center justify-between z-10"
            >
              <div className="flex items-center gap-3">
                <Receipt size={22} style={{ color: 'var(--text-secondary)' }} />
                <h2 style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">Historial de ventas</h2>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                style={{ color: 'var(--text-secondary)' }}
                className="p-2 rounded-xl hover:opacity-70"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {salesHistory.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }} className="text-center py-8 text-lg">No hay ventas registradas</p>
              ) : (
                salesHistory.map((sale) => (
                  <div
                    key={sale.id}
                    style={{
                      background: 'var(--bg-card2)',
                      borderRadius: 'var(--radius)',
                    }}
                    className="p-4 hover:opacity-90 transition-opacity"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Hash size={14} />
                          <span style={{ color: 'var(--text-primary)' }} className="font-bold">{sale.sale_number}</span>
                        </div>
                        <span
                          style={{
                            background:
                              sale.payment_method === 'efectivo' ? 'var(--green-dim)' :
                              sale.payment_method === 'tarjeta' ? 'rgba(59,158,255,0.15)' :
                              sale.payment_method === 'transferencia' ? 'rgba(168,85,247,0.15)' : 'rgba(34,211,238,0.15)',
                            color:
                              sale.payment_method === 'efectivo' ? 'var(--green)' :
                              sale.payment_method === 'tarjeta' ? 'var(--blue)' :
                              sale.payment_method === 'transferencia' ? 'var(--purple)' : 'var(--cyan)',
                            borderRadius: '9999px',
                            padding: '2px 10px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {sale.payment_method}
                        </span>
                      </div>
                      <span style={{ color: 'var(--green)' }} className="text-lg font-bold">{formatCurrency(sale.total)}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-sm">{formatDateShort(sale.created_at)}</p>
                    {sale.items && sale.items.length > 0 && (
                      <div
                        style={{ borderTop: '1px solid var(--border)' }}
                        className="mt-2 pt-2 text-sm space-y-1"
                      >
                        {sale.items.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {item.product_name} <span style={{ color: 'var(--text-muted)' }}>x{item.quantity}</span>
                            </span>
                            <span style={{ color: 'var(--text-primary)' }} className="font-medium">{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {sale.notes && <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-2 italic">{sale.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  )
}
