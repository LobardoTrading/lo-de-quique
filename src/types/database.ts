export interface Category {
  id: string
  name: string
  color: string
  icon: string
  sort_order: number
  created_at: string
}

export interface Product {
  id: string
  name: string
  category_id: string | null
  barcode: string | null
  price_cost: number
  price_sell: number
  stock: number
  min_stock: number
  unit: string
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
  category?: Category
}

export interface Sale {
  id: string
  sale_number: number
  total: number
  payment_method: string
  notes: string | null
  created_at: string
  items?: SaleItem[]
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  product_name: string
  quantity: number
  price_at_sale: number
  subtotal: number
  created_at: string
}

export interface StockMovement {
  id: string
  product_id: string
  type: 'ingreso' | 'egreso' | 'ajuste' | 'venta'
  quantity: number
  stock_before: number
  stock_after: number
  notes: string | null
  reference_id: string | null
  created_at: string
  product?: Product
}

export interface CartItem {
  product: Product
  quantity: number
}

// Supabase generated types placeholder
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
      }
      sales: {
        Row: Sale
        Insert: Omit<Sale, 'id' | 'sale_number' | 'created_at'>
        Update: Partial<Omit<Sale, 'id' | 'sale_number' | 'created_at'>>
      }
      sale_items: {
        Row: SaleItem
        Insert: Omit<SaleItem, 'id' | 'created_at'>
        Update: Partial<Omit<SaleItem, 'id' | 'created_at'>>
      }
      stock_movements: {
        Row: StockMovement
        Insert: Omit<StockMovement, 'id' | 'created_at'>
        Update: Partial<Omit<StockMovement, 'id' | 'created_at'>>
      }
    }
  }
}
