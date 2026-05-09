import { supabase } from './supabase'
import type { Product, Sale, SaleItem, StockMovement, Category, CartItem } from '@/types/database'

// ============ CATEGORÍAS ============

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data
}

// ============ PRODUCTOS ============

export async function getProducts(filters?: {
  category_id?: string
  search?: string
  active_only?: boolean
}): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*, category:categories(*)')
    .order('name')

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }
  if (filters?.active_only !== false) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('barcode', barcode)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getProduct(id: string): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createProduct(product: {
  name: string
  category_id: string | null
  barcode?: string
  price_cost: number
  price_sell: number
  stock: number
  min_stock: number
  unit: string
  notes?: string
}): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select('*, category:categories(*)')
    .single()
  if (error) throw error
  return data
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select('*, category:categories(*)')
    .single()
  if (error) throw error
  return data
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)
  if (error) throw error
}

// ============ VENTAS ============

export async function createSale(
  items: CartItem[],
  paymentMethod: string,
  notes?: string
): Promise<Sale> {
  const total = items.reduce((sum, item) => sum + item.product.price_sell * item.quantity, 0)

  // Create sale
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({ total, payment_method: paymentMethod, notes: notes || null })
    .select()
    .single()

  if (saleError) throw saleError

  // Create sale items
  const saleItems = items.map((item) => ({
    sale_id: sale.id,
    product_id: item.product.id,
    product_name: item.product.name,
    quantity: item.quantity,
    price_at_sale: item.product.price_sell,
    subtotal: item.product.price_sell * item.quantity,
  }))

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems)

  if (itemsError) throw itemsError

  // Update stock and create movements
  for (const item of items) {
    const newStock = item.product.stock - item.quantity

    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', item.product.id)

    if (stockError) throw stockError

    const { error: movError } = await supabase
      .from('stock_movements')
      .insert({
        product_id: item.product.id,
        type: 'venta',
        quantity: -item.quantity,
        stock_before: item.product.stock,
        stock_after: newStock,
        notes: `Venta #${sale.sale_number}`,
        reference_id: sale.id,
      })

    if (movError) throw movError
  }

  return sale
}

export async function getSales(limit = 50): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*, items:sale_items(*)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getSalesToday(): Promise<{ count: number; total: number }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('sales')
    .select('total')
    .gte('created_at', today.toISOString())

  if (error) throw error

  return {
    count: data.length,
    total: data.reduce((sum, s) => sum + Number(s.total), 0),
  }
}

// ============ STOCK ============

export async function addStock(
  productId: string,
  quantity: number,
  type: 'ingreso' | 'ajuste',
  notes?: string
): Promise<void> {
  // Get current stock
  const { data: product, error: prodError } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single()

  if (prodError) throw prodError

  const newStock = type === 'ajuste' ? quantity : product.stock + quantity

  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId)

  if (updateError) throw updateError

  const { error: movError } = await supabase
    .from('stock_movements')
    .insert({
      product_id: productId,
      type,
      quantity: type === 'ajuste' ? quantity - product.stock : quantity,
      stock_before: product.stock,
      stock_after: newStock,
      notes: notes || null,
    })

  if (movError) throw movError
}

export async function getStockMovements(productId?: string, limit = 100): Promise<StockMovement[]> {
  let query = supabase
    .from('stock_movements')
    .select('*, product:products(id, name, unit)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (productId) {
    query = query.eq('product_id', productId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getLowStockProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .filter('stock', 'lte', 'min_stock' as never)

  if (error) throw error
  // Filter client-side since Supabase doesn't easily compare two columns
  return (data || []).filter(p => p.stock <= p.min_stock)
}

// ============ DASHBOARD ============

export async function getDashboardStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [salesToday, products, lowStock] = await Promise.all([
    getSalesToday(),
    supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true),
    getLowStockProducts(),
  ])

  return {
    salesToday,
    totalProducts: products.count || 0,
    lowStockCount: lowStock.length,
    lowStockProducts: lowStock.slice(0, 10),
  }
}
