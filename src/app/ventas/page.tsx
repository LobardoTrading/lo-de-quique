'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { getProducts, getCategories, createSale, getSales, getProductByBarcode } from '@/lib/api'
import { formatCurrency, formatDateShort } from '@/lib/helpers'
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, History, X, ScanBarcode } from 'lucide-react'
import { BarcodeScanner } from '@/components/barcode-scanner'
import type { Product, Category, CartItem, Sale } from '@/types/database'

export default function VentasPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [processing, setProcessing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [salesHistory, setSalesHistory] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const { toast } = useToast()

  const loadProducts = useCallback(async () => {
    try {
      const data = await getProducts({ search: search || undefined, category_id: filterCat || undefined })
      setProducts(data)
    } catch {
      toast('Error al cargar productos', 'error')
    }
  }, [search, filterCat, toast])

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

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast('No hay mas stock disponible', 'error')
          return prev
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      if (product.stock <= 0) {
        toast('Producto sin stock', 'error')
        return prev
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  async function handleBarcodeScan(barcode: string) {
    setShowScanner(false)
    try {
      const product = await getProductByBarcode(barcode)
      if (product) {
        addToCart(product)
        toast(`${product.name} agregado`)
      } else {
        toast(`Producto no encontrado (${barcode})`, 'error')
      }
    } catch {
      toast('Error al buscar producto', 'error')
    }
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

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price_sell * item.quantity, 0)

  async function handleCheckout() {
    if (cart.length === 0) {
      toast('Agrega productos al carrito', 'error')
      return
    }

    setProcessing(true)
    try {
      const sale = await createSale(cart, paymentMethod)
      toast(`Venta #${sale.sale_number} registrada - ${formatCurrency(sale.total)}`)
      setCart([])
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

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-xl text-gray-400">Cargando...</p></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="text-lg text-gray-500">Punto de venta</p>
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
                    className="w-full pl-12 pr-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
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

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={`
                  p-4 rounded-xl border-2 text-left transition-all
                  ${product.stock <= 0
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-md active:scale-[0.98]'
                  }
                `}
              >
                <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                <p className="text-lg font-bold text-green-600 mt-1">{formatCurrency(product.price_sell)}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Stock: {product.stock} {product.unit}
                </p>
              </button>
            ))}
          </div>

          {products.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">No se encontraron productos</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cart */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShoppingCart size={22} className="text-blue-600" />
                <h2 className="text-xl font-bold">Carrito</h2>
                {cart.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-sm font-bold px-2 py-1 rounded-lg">
                    {cart.length}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-gray-400 text-center py-6">Selecciona productos para vender</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-gray-900 text-sm flex-1">{item.product.name}</p>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 hover:bg-red-100 rounded-lg text-red-400"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-9 h-9 flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-10 text-center font-bold text-lg">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-9 h-9 flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <p className="font-bold text-green-700">
                          {formatCurrency(item.product.price_sell * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="border-t-2 border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-bold text-gray-900">TOTAL</span>
                      <span className="text-2xl font-bold text-green-600">{formatCurrency(cartTotal)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <button
                        onClick={() => setPaymentMethod('efectivo')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-semibold transition-colors ${
                          paymentMethod === 'efectivo'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-500'
                        }`}
                      >
                        <Banknote size={20} />
                        Efectivo
                      </button>
                      <button
                        onClick={() => setPaymentMethod('tarjeta')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-semibold transition-colors ${
                          paymentMethod === 'tarjeta'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-500'
                        }`}
                      >
                        <CreditCard size={20} />
                        Tarjeta
                      </button>
                    </div>

                    <Button
                      size="xl"
                      variant="success"
                      className="w-full"
                      onClick={handleCheckout}
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

      {/* Sales History Overlay */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowHistory(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Historial de ventas</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {salesHistory.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No hay ventas registradas</p>
              ) : (
                salesHistory.map((sale) => (
                  <div key={sale.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-gray-900">Venta #{sale.sale_number}</span>
                        <span className="ml-3 text-sm text-gray-500">{formatDateShort(sale.created_at)}</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(sale.total)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="capitalize">{sale.payment_method}</span>
                      {sale.items && (
                        <span>{sale.items.length} producto{sale.items.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    {sale.items && sale.items.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        {sale.items.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.product_name} x{item.quantity}</span>
                            <span>{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
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
