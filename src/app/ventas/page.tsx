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
  { id: 'efectivo', label: 'Efectivo', icon: Banknote, color: 'border-green-500 bg-green-50 text-green-700' },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard, color: 'border-blue-500 bg-blue-50 text-blue-700' },
  { id: 'transferencia', label: 'Transferencia', icon: ArrowRightLeft, color: 'border-purple-500 bg-purple-50 text-purple-700' },
  { id: 'mercadopago', label: 'MercadoPago', icon: Smartphone, color: 'border-cyan-500 bg-cyan-50 text-cyan-700' },
]

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
        // Vibration feedback
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
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Punto de Venta</h1>
          <p className="text-lg text-gray-500">Registrar ventas</p>
        </div>
        <div className="flex gap-3">
          <Button size="lg" onClick={() => setShowScanner(true)}>
            <ScanBarcode size={22} />
            Escanear
          </Button>
          <Button variant="secondary" size="lg" onClick={openHistory}>
            <History size={22} />
            Historial
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product selection */}
        <div className="lg:col-span-2 space-y-4">
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
                    autoFocus
                  />
                </div>
                <Select
                  options={[
                    { value: '', label: 'Todas' },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  value={filterCat}
                  onChange={(e) => setFilterCat(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFilterCat('')}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                filterCat === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCat(filterCat === cat.id ? '' : cat.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  filterCat === cat.id
                    ? 'text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
                style={filterCat === cat.id ? { backgroundColor: cat.color } : undefined}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {products.length === 0 ? (
            <EmptyState
              icon={<Search size={36} className="text-gray-400" />}
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
                    className={`
                      relative p-4 rounded-xl border-2 text-left transition-all
                      ${product.stock <= 0
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : inCart
                          ? 'border-blue-400 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md active:scale-[0.97]'
                      }
                    `}
                  >
                    {inCart && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center shadow">
                        {inCart.quantity}
                      </span>
                    )}
                    <p className="font-semibold text-gray-900 truncate text-base">{product.name}</p>
                    {product.category && (
                      <Badge color={product.category.color} className="mt-1 text-xs">
                        {product.category.name}
                      </Badge>
                    )}
                    <p className="text-xl font-bold text-green-600 mt-2">{formatCurrency(product.price_sell)}</p>
                    <p className={`text-sm mt-1 ${product.stock <= product.min_stock ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
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
          <Card className="sticky top-4 border-2 border-gray-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingCart size={20} className="text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold">Carrito</h2>
                </div>
                {cart.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge color="blue">{cartItems} items</Badge>
                    <button
                      onClick={() => setCart([])}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                      title="Vaciar carrito"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart size={40} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 text-lg">Selecciona productos</p>
                  <p className="text-gray-300 text-sm mt-1">Toca un producto o escanea un codigo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-gray-900 text-sm flex-1 leading-tight">{item.product.name}</p>
                        <button
                          onClick={() => setCart(prev => prev.filter(i => i.product.id !== item.product.id))}
                          className="p-1 hover:bg-red-100 rounded-lg text-red-400 shrink-0 ml-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-9 h-9 flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg hover:border-red-300 active:bg-red-50 transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => setItemQuantity(item.product.id, Number(e.target.value))}
                            className="w-14 text-center font-bold text-lg border-2 border-gray-200 rounded-lg py-1 focus:border-blue-500 focus:outline-none"
                            min={0}
                            max={item.product.stock}
                          />
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-9 h-9 flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg hover:border-green-300 active:bg-green-50 transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-700">
                            {formatCurrency(item.product.price_sell * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-400">{formatCurrency(item.product.price_sell)} c/u</p>
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
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none"
                  />

                  <div className="border-t-2 border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-bold text-gray-900">TOTAL</span>
                      <span className="text-3xl font-bold text-green-600">{formatCurrency(cartTotal)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {PAYMENT_METHODS.map((pm) => {
                        const Icon = pm.icon
                        return (
                          <button
                            key={pm.id}
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-semibold transition-all text-sm ${
                              paymentMethod === pm.id ? pm.color : 'border-gray-200 text-gray-400 hover:border-gray-300'
                            }`}
                          >
                            <Icon size={18} />
                            {pm.label}
                          </button>
                        )
                      })}
                    </div>

                    <Button
                      size="xl"
                      variant="success"
                      className="w-full"
                      onClick={() => setShowConfirm(true)}
                      disabled={processing}
                    >
                      {processing ? 'Procesando...' : `Cobrar ${formatCurrency(cartTotal)}`}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowTicket(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Success header */}
            <div className="bg-green-600 text-white p-6 text-center">
              <CheckCircle size={48} className="mx-auto mb-3" />
              <h2 className="text-2xl font-bold">Venta registrada</h2>
              <p className="text-green-100 mt-1">#{lastSale.sale_number}</p>
            </div>

            {/* Ticket body */}
            <div className="p-6">
              <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
                <div className="text-center mb-3">
                  <p className="font-bold text-lg">Lo de Quique</p>
                  <p className="text-sm text-gray-500">{formatDateShort(lastSale.created_at)}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {lastSale.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">{item.product_name}</span>
                      <span className="text-gray-400 ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-300 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">TOTAL</span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(lastSale.total)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1 capitalize">
                  Pago: {lastSale.payment_method}
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-6"
                onClick={() => setShowTicket(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom quantity dialog */}
      {customQtyProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setCustomQtyProduct(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">{customQtyProduct.name}</h3>
            <p className="text-sm text-gray-500">Stock: {customQtyProduct.stock} {customQtyProduct.unit}</p>
            <div>
              <label className="text-sm font-medium text-gray-600">Cantidad</label>
              <input
                type="number"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="Ej: 2.5"
                min={0}
                max={customQtyProduct.stock}
                step="0.001"
                autoFocus
                className="w-full px-4 py-3 text-2xl font-bold text-center rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none mt-2"
                onKeyDown={(e) => e.key === 'Enter' && handleCustomQty()}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => setCustomQtyProduct(null)}>
                Cancelar
              </Button>
              <Button size="lg" className="flex-1" onClick={handleCustomQty}>
                Agregar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sales History */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowHistory(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Receipt size={22} className="text-gray-600" />
                <h2 className="text-xl font-bold">Historial de ventas</h2>
              </div>
              <button onClick={() => setShowHistory(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {salesHistory.length === 0 ? (
                <p className="text-gray-400 text-center py-8 text-lg">No hay ventas registradas</p>
              ) : (
                salesHistory.map((sale) => (
                  <div key={sale.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Hash size={14} />
                          <span className="font-bold text-gray-900">{sale.sale_number}</span>
                        </div>
                        <Badge color={
                          sale.payment_method === 'efectivo' ? 'green' :
                          sale.payment_method === 'tarjeta' ? 'blue' :
                          sale.payment_method === 'transferencia' ? 'purple' : 'cyan'
                        }>
                          {sale.payment_method}
                        </Badge>
                      </div>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(sale.total)}</span>
                    </div>
                    <p className="text-sm text-gray-500">{formatDateShort(sale.created_at)}</p>
                    {sale.items && sale.items.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 text-sm text-gray-600 space-y-1">
                        {sale.items.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.product_name} <span className="text-gray-400">x{item.quantity}</span></span>
                            <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {sale.notes && <p className="text-sm text-gray-400 mt-2 italic">{sale.notes}</p>}
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
