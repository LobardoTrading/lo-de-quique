-- ============================================
-- LO DE QUIQUE - Datos de ejemplo
-- Correr DESPUES del schema principal
-- ============================================

-- Obtener IDs de categorias
DO $$
DECLARE
  cat_fiambreria UUID;
  cat_sanguches UUID;
  cat_picadas UUID;
  cat_bebidas UUID;
  cat_lacteos UUID;
  cat_almacen UUID;
  cat_limpieza UUID;
  cat_otros UUID;
BEGIN
  SELECT id INTO cat_fiambreria FROM categories WHERE name = 'Fiambrería';
  SELECT id INTO cat_sanguches FROM categories WHERE name = 'Sanguches';
  SELECT id INTO cat_picadas FROM categories WHERE name = 'Picadas';
  SELECT id INTO cat_bebidas FROM categories WHERE name = 'Bebidas';
  SELECT id INTO cat_lacteos FROM categories WHERE name = 'Lácteos';
  SELECT id INTO cat_almacen FROM categories WHERE name = 'Almacén';
  SELECT id INTO cat_limpieza FROM categories WHERE name = 'Limpieza';
  SELECT id INTO cat_otros FROM categories WHERE name = 'Otros';

  -- ============ FIAMBRERÍA ============
  INSERT INTO products (name, category_id, price_cost, price_sell, stock, min_stock, unit, barcode) VALUES
    ('Jamon crudo', cat_fiambreria, 8500, 12000, 3.5, 1, 'kg', '7790001000101'),
    ('Jamon cocido', cat_fiambreria, 6500, 9500, 4.2, 1.5, 'kg', '7790001000102'),
    ('Salame milan', cat_fiambreria, 7000, 10500, 2.8, 1, 'kg', '7790001000103'),
    ('Mortadela', cat_fiambreria, 4500, 7000, 3.0, 1, 'kg', '7790001000104'),
    ('Bondiola', cat_fiambreria, 9000, 13500, 1.5, 0.5, 'kg', '7790001000105'),
    ('Queso cremoso', cat_fiambreria, 5500, 8500, 5.0, 2, 'kg', '7790001000106'),
    ('Queso sardo', cat_fiambreria, 7500, 11000, 2.0, 1, 'kg', '7790001000107'),
    ('Queso provolone', cat_fiambreria, 8000, 12500, 1.8, 0.5, 'kg', '7790001000108'),
    ('Queso roquefort', cat_fiambreria, 10000, 15000, 0.8, 0.5, 'kg', '7790001000109'),
    ('Lomito ahumado', cat_fiambreria, 12000, 18000, 1.2, 0.5, 'kg', '7790001000110'),
    ('Paleta', cat_fiambreria, 5000, 7500, 3.5, 1, 'kg', '7790001000111'),
    ('Matambre arrollado', cat_fiambreria, 9500, 14000, 2.0, 0.5, 'kg', '7790001000112');

  -- ============ SANGUCHES ============
  INSERT INTO products (name, category_id, price_cost, price_sell, stock, min_stock, unit) VALUES
    ('Sanguche de milanesa', cat_sanguches, 1800, 3500, 15, 5, 'unidad'),
    ('Sanguche de jamon y queso', cat_sanguches, 1200, 2500, 20, 5, 'unidad'),
    ('Sanguche de lomito', cat_sanguches, 2200, 4500, 10, 3, 'unidad'),
    ('Sanguche de bondiola', cat_sanguches, 2000, 4000, 8, 3, 'unidad'),
    ('Sanguche triple', cat_sanguches, 1500, 3000, 12, 5, 'unidad'),
    ('Tostado jamon y queso', cat_sanguches, 800, 2000, 25, 8, 'unidad'),
    ('Carlitos', cat_sanguches, 600, 1500, 30, 10, 'unidad'),
    ('Sanguche de atun', cat_sanguches, 1000, 2200, 10, 3, 'unidad');

  -- ============ PICADAS ============
  INSERT INTO products (name, category_id, price_cost, price_sell, stock, min_stock, unit) VALUES
    ('Picada para 2', cat_picadas, 4500, 8500, 6, 2, 'unidad'),
    ('Picada para 4', cat_picadas, 8000, 15000, 4, 2, 'unidad'),
    ('Picada premium', cat_picadas, 12000, 22000, 3, 1, 'unidad'),
    ('Tabla de quesos', cat_picadas, 5000, 9500, 5, 2, 'unidad'),
    ('Tabla de fiambres', cat_picadas, 6000, 11000, 4, 2, 'unidad'),
    ('Picada mixta individual', cat_picadas, 2500, 5000, 8, 3, 'unidad');

  -- ============ BEBIDAS ============
  INSERT INTO products (name, category_id, price_cost, price_sell, stock, min_stock, unit, barcode) VALUES
    ('Coca Cola 500ml', cat_bebidas, 800, 1500, 48, 12, 'unidad', '7790895001253'),
    ('Coca Cola 1.5lt', cat_bebidas, 1500, 2800, 24, 6, 'unidad', '7790895001260'),
    ('Coca Cola 2.25lt', cat_bebidas, 2000, 3500, 18, 6, 'unidad', '7790895001277'),
    ('Sprite 500ml', cat_bebidas, 800, 1500, 36, 12, 'unidad', '7790895002253'),
    ('Fanta 500ml', cat_bebidas, 800, 1500, 24, 12, 'unidad', '7790895003253'),
    ('Agua mineral 500ml', cat_bebidas, 400, 900, 60, 24, 'unidad', '7790895004253'),
    ('Agua mineral 1.5lt', cat_bebidas, 600, 1200, 24, 12, 'unidad', '7790895004260'),
    ('Cerveza Quilmes 1lt', cat_bebidas, 1200, 2200, 36, 12, 'unidad', '7790895010253'),
    ('Cerveza Brahma 1lt', cat_bebidas, 1100, 2000, 24, 12, 'unidad', '7790895010260'),
    ('Cerveza Patagonia 730ml', cat_bebidas, 1800, 3200, 12, 6, 'unidad', '7790895010270'),
    ('Vino tinto Don Valentin 750ml', cat_bebidas, 2500, 4500, 8, 3, 'unidad', '7790895020253'),
    ('Vino blanco Trumpeter 750ml', cat_bebidas, 3500, 6000, 6, 2, 'unidad', '7790895020260'),
    ('Fernet Branca 750ml', cat_bebidas, 6000, 9500, 5, 2, 'unidad', '7790895030253'),
    ('Soda Ivess 1lt', cat_bebidas, 500, 1000, 30, 12, 'unidad', '7790895040253');

  -- ============ LÁCTEOS ============
  INSERT INTO products (name, category_id, price_cost, price_sell, stock, min_stock, unit, barcode) VALUES
    ('Leche entera 1lt', cat_lacteos, 600, 1100, 20, 6, 'unidad', '7790895050253'),
    ('Leche descremada 1lt', cat_lacteos, 650, 1200, 12, 6, 'unidad', '7790895050260'),
    ('Yogur natural 200g', cat_lacteos, 400, 800, 15, 5, 'unidad', '7790895060253'),
    ('Manteca 200g', cat_lacteos, 800, 1500, 10, 4, 'unidad', '7790895070253'),
    ('Crema de leche 200ml', cat_lacteos, 700, 1300, 8, 3, 'unidad', '7790895080253'),
    ('Dulce de leche 400g', cat_lacteos, 1200, 2200, 12, 4, 'unidad', '7790895090253');

  -- ============ ALMACÉN ============
  INSERT INTO products (name, category_id, price_cost, price_sell, stock, min_stock, unit, barcode) VALUES
    ('Pan lactal', cat_almacen, 600, 1200, 15, 5, 'unidad', '7790895100253'),
    ('Pan hamburguesa x4', cat_almacen, 500, 1000, 10, 4, 'unidad', '7790895100260'),
    ('Galletitas surtidas', cat_almacen, 800, 1500, 20, 8, 'unidad', '7790895110253'),
    ('Arroz 1kg', cat_almacen, 700, 1300, 25, 10, 'unidad', '7790895120253'),
    ('Fideos 500g', cat_almacen, 500, 950, 30, 10, 'unidad', '7790895130253'),
    ('Aceite girasol 1lt', cat_almacen, 1000, 1800, 15, 5, 'unidad', '7790895140253'),
    ('Azucar 1kg', cat_almacen, 600, 1100, 20, 8, 'unidad', '7790895150253'),
    ('Yerba 1kg', cat_almacen, 2000, 3500, 12, 4, 'unidad', '7790895160253'),
    ('Cafe molido 250g', cat_almacen, 1500, 2800, 8, 3, 'unidad', '7790895170253'),
    ('Sal fina 500g', cat_almacen, 300, 600, 18, 8, 'unidad', '7790895180253'),
    ('Mayonesa 500g', cat_almacen, 900, 1700, 10, 4, 'unidad', '7790895190253'),
    ('Ketchup 400g', cat_almacen, 700, 1300, 8, 3, 'unidad', '7790895190260'),
    ('Mostaza 250g', cat_almacen, 500, 950, 8, 3, 'unidad', '7790895190270'),
    ('Huevos x12', cat_almacen, 1800, 3200, 10, 3, 'unidad', '7790895200253'),
    ('Atun en lata', cat_almacen, 800, 1500, 20, 8, 'unidad', '7790895210253'),
    ('Mermelada 500g', cat_almacen, 900, 1700, 6, 2, 'unidad', '7790895220253');

  -- ============ LIMPIEZA ============
  INSERT INTO products (name, category_id, price_cost, price_sell, stock, min_stock, unit, barcode) VALUES
    ('Detergente 750ml', cat_limpieza, 600, 1200, 12, 4, 'unidad', '7790895300253'),
    ('Lavandina 1lt', cat_limpieza, 400, 800, 15, 6, 'unidad', '7790895310253'),
    ('Jabon en polvo 800g', cat_limpieza, 1200, 2200, 8, 3, 'unidad', '7790895320253'),
    ('Papel higienico x4', cat_limpieza, 900, 1800, 20, 8, 'unidad', '7790895330253'),
    ('Servilletas x100', cat_limpieza, 500, 1000, 15, 5, 'unidad', '7790895340253'),
    ('Esponja cocina', cat_limpieza, 200, 500, 25, 10, 'unidad', '7790895350253'),
    ('Bolsas residuo x10', cat_limpieza, 400, 800, 12, 4, 'unidad', '7790895360253');

  -- ============ VENTAS DE EJEMPLO (hoy) ============
  -- Venta 1
  INSERT INTO sales (total, payment_method, notes) VALUES (7000, 'efectivo', 'Cliente habitual');
  INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price_at_sale, subtotal)
  SELECT s.id, p.id, p.name, 2, p.price_sell, p.price_sell * 2
  FROM sales s, products p
  WHERE s.notes = 'Cliente habitual' AND p.name = 'Sanguche de milanesa'
  LIMIT 1;

  -- Venta 2
  INSERT INTO sales (total, payment_method) VALUES (15000, 'tarjeta');
  INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price_at_sale, subtotal)
  SELECT s.id, p.id, p.name, 1, 15000, 15000
  FROM sales s, products p
  WHERE s.total = 15000 AND p.name = 'Picada para 4'
  LIMIT 1;

  -- Venta 3
  INSERT INTO sales (total, payment_method) VALUES (5500, 'transferencia');
  INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price_at_sale, subtotal)
  SELECT s.id, p.id, p.name, 2, 1500, 3000
  FROM sales s, products p
  WHERE s.total = 5500 AND p.name = 'Coca Cola 500ml'
  LIMIT 1;

  -- Venta 4
  INSERT INTO sales (total, payment_method) VALUES (8500, 'efectivo');
  INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price_at_sale, subtotal)
  SELECT s.id, p.id, p.name, 1, 8500, 8500
  FROM sales s, products p
  WHERE s.total = 8500 AND p.name = 'Picada para 2'
  LIMIT 1;

  -- Venta 5
  INSERT INTO sales (total, payment_method) VALUES (4400, 'mercadopago');

END $$;
