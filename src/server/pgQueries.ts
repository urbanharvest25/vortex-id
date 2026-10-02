import { pool, isPostgresConfigured, initPostgres } from './pg.js';
import {
  User,
  Product,
  ProductImage,
  Category,
  Order,
  OrderItem,
  Payment,
  Invoice,
  Voucher,
  Discount,
  Rating,
  ServiceReview,
  StoreSettings,
  ThemeSettings,
  QrisSettings,
  EmailLog,
  AuditLog,
  AnalyticsSummary,
  ProductPerformance,
} from '../types/index.js';

function checkPg(): void {
  if (!isPostgresConfigured) {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      throw new Error(
        'Database PostgreSQL belum terkonfigurasi. Tambahkan environment variable DATABASE_URL di Vercel Dashboard (dari Supabase / Neon / Vercel Postgres).'
      );
    }
  }
}

// ==========================================
// 1. USERS & AUTH
// ==========================================

export async function pgGetUsers(): Promise<User[]> {
  checkPg();
  const res = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  return res.rows.map((r) => ({
    ...r,
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
  }));
}

export async function pgFindUserById(id: string): Promise<User | null> {
  checkPg();
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    ...r,
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
  };
}

export async function pgFindUserByEmail(email: string): Promise<User | null> {
  checkPg();
  const norm = email.toLowerCase().trim();
  const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [norm]);
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    ...r,
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
  };
}

export async function pgCreateUser(
  user: Omit<User, 'id' | 'created_at' | 'updated_at'>
): Promise<User> {
  checkPg();
  const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const res = await pool.query(
    `INSERT INTO users (id, name, email, password_hash, phone, role, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      id,
      user.name,
      user.email.toLowerCase().trim(),
      user.password_hash,
      user.phone || null,
      user.role,
      user.status,
      now,
      now,
    ]
  );
  const r = res.rows[0];
  return {
    ...r,
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
  };
}

export async function pgUpdateUser(id: string, updates: Partial<User>): Promise<User | null> {
  checkPg();
  const existing = await pgFindUserById(id);
  if (!existing) return null;

  const name = updates.name !== undefined ? updates.name : existing.name;
  const phone = updates.phone !== undefined ? updates.phone : existing.phone;
  const status = updates.status !== undefined ? updates.status : existing.status;
  const password_hash =
    updates.password_hash !== undefined ? updates.password_hash : existing.password_hash;
  const role = updates.role !== undefined ? updates.role : existing.role;
  const now = new Date().toISOString();

  const res = await pool.query(
    `UPDATE users
     SET name = $1, phone = $2, status = $3, password_hash = $4, role = $5, updated_at = $6
     WHERE id = $7 RETURNING *`,
    [name, phone, status, password_hash, role, now, id]
  );

  const r = res.rows[0];
  return {
    ...r,
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
  };
}

// ==========================================
// 2. CATEGORIES & PRODUCTS
// ==========================================

export async function pgGetCategories(): Promise<Category[]> {
  checkPg();
  const res = await pool.query('SELECT * FROM categories ORDER BY name ASC');
  return res.rows;
}

export async function pgGetProducts(options?: {
  search?: string;
  game?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  includeArchived?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'latest' | 'rating' | 'popular';
}): Promise<Product[]> {
  checkPg();
  let query = `
    SELECT p.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', img.id,
            'product_id', img.product_id,
            'url', img.url,
            'sort_order', img.sort_order,
            'is_primary', img.is_primary
          ) ORDER BY img.sort_order ASC
        ) FILTER (WHERE img.id IS NOT NULL),
        '[]'
      ) as images
    FROM products p
    LEFT JOIN product_images img ON p.id = img.product_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (!options?.includeArchived) {
    query += ` AND p.is_archived = false AND p.status != 'ARCHIVED'`;
  }

  if (options?.inStockOnly) {
    query += ` AND p.stock > 0 AND p.status = 'AVAILABLE'`;
  }

  if (options?.game) {
    params.push(options.game);
    query += ` AND LOWER(p.game) = LOWER($${params.length})`;
  }

  if (options?.category) {
    params.push(options.category);
    query += ` AND p.category = $${params.length}`;
  }

  if (options?.minPrice !== undefined) {
    params.push(options.minPrice);
    query += ` AND COALESCE(p.discount_price, p.price) >= $${params.length}`;
  }

  if (options?.maxPrice !== undefined) {
    params.push(options.maxPrice);
    query += ` AND COALESCE(p.discount_price, p.price) <= $${params.length}`;
  }

  if (options?.search) {
    params.push(`%${options.search.toLowerCase()}%`);
    query += ` AND (
      LOWER(p.name) LIKE $${params.length} OR
      LOWER(p.game) LIKE $${params.length} OR
      LOWER(p.description) LIKE $${params.length} OR
      LOWER(COALESCE(p.rank, '')) LIKE $${params.length}
    )`;
  }

  query += ` GROUP BY p.id`;

  if (options?.sortBy === 'price_asc') {
    query += ` ORDER BY COALESCE(p.discount_price, p.price) ASC`;
  } else if (options?.sortBy === 'price_desc') {
    query += ` ORDER BY COALESCE(p.discount_price, p.price) DESC`;
  } else {
    query += ` ORDER BY p.created_at DESC`;
  }

  const res = await pool.query(query, params);
  return res.rows.map((r) => ({
    ...r,
    price: Number(r.price),
    discount_price: r.discount_price ? Number(r.discount_price) : undefined,
    stock: Number(r.stock),
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
    images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images,
  }));
}

export async function pgFindProductById(id: string): Promise<Product | null> {
  checkPg();
  const query = `
    SELECT p.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', img.id,
            'product_id', img.product_id,
            'url', img.url,
            'sort_order', img.sort_order,
            'is_primary', img.is_primary
          ) ORDER BY img.sort_order ASC
        ) FILTER (WHERE img.id IS NOT NULL),
        '[]'
      ) as images
    FROM products p
    LEFT JOIN product_images img ON p.id = img.product_id
    WHERE p.id = $1
    GROUP BY p.id
  `;
  const res = await pool.query(query, [id]);
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    ...r,
    price: Number(r.price),
    discount_price: r.discount_price ? Number(r.discount_price) : undefined,
    stock: Number(r.stock),
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
    images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images,
  };
}

export async function pgCreateProduct(
  data: Omit<Product, 'id' | 'created_at' | 'updated_at'>
): Promise<Product> {
  checkPg();
  const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  await pool.query(
    `INSERT INTO products (
      id, name, game, category, price, discount_price, stock, description,
      account_details, rank, level, skins, items, status, is_archived, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [
      id,
      data.name,
      data.game,
      data.category,
      data.price,
      data.discount_price || null,
      data.stock,
      data.description,
      data.account_details,
      data.rank || null,
      data.level || null,
      data.skins || null,
      data.items || null,
      data.status,
      data.is_archived || false,
      now,
      now,
    ]
  );

  if (data.images && data.images.length > 0) {
    for (let i = 0; i < data.images.length; i++) {
      const img = data.images[i];
      const imgId = img.id || `img-${Date.now()}-${i}`;
      await pool.query(
        `INSERT INTO product_images (id, product_id, url, sort_order, is_primary)
         VALUES ($1, $2, $3, $4, $5)`,
        [imgId, id, img.url, img.sort_order || i, Boolean(img.is_primary)]
      );
    }
  }

  return (await pgFindProductById(id))!;
}

export async function pgUpdateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  checkPg();
  const existing = await pgFindProductById(id);
  if (!existing) return null;

  const now = new Date().toISOString();

  await pool.query(
    `UPDATE products SET
      name = $1, game = $2, category = $3, price = $4, discount_price = $5,
      stock = $6, description = $7, account_details = $8, rank = $9, level = $10,
      skins = $11, items = $12, status = $13, is_archived = $14, updated_at = $15
     WHERE id = $16`,
    [
      updates.name !== undefined ? updates.name : existing.name,
      updates.game !== undefined ? updates.game : existing.game,
      updates.category !== undefined ? updates.category : existing.category,
      updates.price !== undefined ? updates.price : existing.price,
      updates.discount_price !== undefined ? updates.discount_price : existing.discount_price,
      updates.stock !== undefined ? updates.stock : existing.stock,
      updates.description !== undefined ? updates.description : existing.description,
      updates.account_details !== undefined ? updates.account_details : existing.account_details,
      updates.rank !== undefined ? updates.rank : existing.rank,
      updates.level !== undefined ? updates.level : existing.level,
      updates.skins !== undefined ? updates.skins : existing.skins,
      updates.items !== undefined ? updates.items : existing.items,
      updates.status !== undefined ? updates.status : existing.status,
      updates.is_archived !== undefined ? updates.is_archived : existing.is_archived,
      now,
      id,
    ]
  );

  if (updates.images) {
    await pool.query('DELETE FROM product_images WHERE product_id = $1', [id]);
    for (let i = 0; i < updates.images.length; i++) {
      const img = updates.images[i];
      const imgId = img.id || `img-${Date.now()}-${i}`;
      await pool.query(
        `INSERT INTO product_images (id, product_id, url, sort_order, is_primary)
         VALUES ($1, $2, $3, $4, $5)`,
        [imgId, id, img.url, img.sort_order || i, Boolean(img.is_primary)]
      );
    }
  }

  return await pgFindProductById(id);
}

export async function pgDeleteProduct(
  id: string
): Promise<{ success: boolean; message: string }> {
  checkPg();
  const orderCheck = await pool.query(
    'SELECT COUNT(*) FROM order_items WHERE product_id = $1',
    [id]
  );
  const count = parseInt(orderCheck.rows[0].count, 10);

  if (count > 0) {
    await pool.query(
      `UPDATE products SET is_archived = true, status = 'ARCHIVED', updated_at = NOW() WHERE id = $1`,
      [id]
    );
    return {
      success: true,
      message: 'Produk diarsipkan karena memiliki riwayat pesanan pelanggan.',
    };
  } else {
    await pool.query('DELETE FROM product_images WHERE product_id = $1', [id]);
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return { success: true, message: 'Produk berhasil dihapus permanen.' };
  }
}

export async function pgRecordProductView(productId: string): Promise<void> {
  checkPg();
  const id = `pv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  await pool.query(
    'INSERT INTO product_views (id, product_id, viewed_at) VALUES ($1, $2, NOW())',
    [id, productId]
  );
}

// ==========================================
// 3. ORDERS & CHECKOUT
// ==========================================

export async function pgGetOrders(userId?: string): Promise<Order[]> {
  checkPg();
  let query = `
    SELECT o.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', i.id,
            'order_id', i.order_id,
            'product_id', i.product_id,
            'product_name', i.product_name,
            'product_game', i.product_game,
            'price', i.price,
            'quantity', i.quantity,
            'product_image', i.product_image
          )
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'
      ) as items
    FROM orders o
    LEFT JOIN order_items i ON o.id = i.order_id
  `;
  const params: any[] = [];
  if (userId) {
    params.push(userId);
    query += ` WHERE o.user_id = $1`;
  }
  query += ` GROUP BY o.id ORDER BY o.created_at DESC`;

  const res = await pool.query(query, params);
  return res.rows.map((r) => ({
    ...r,
    subtotal: Number(r.subtotal),
    discount_amount: Number(r.discount_amount),
    voucher_amount: Number(r.voucher_amount),
    total: Number(r.total),
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
    cancelled_at: r.cancelled_at ? new Date(r.cancelled_at).toISOString() : undefined,
    items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
  }));
}

export async function pgFindOrderById(id: string): Promise<Order | null> {
  checkPg();
  const query = `
    SELECT o.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', i.id,
            'order_id', i.order_id,
            'product_id', i.product_id,
            'product_name', i.product_name,
            'product_game', i.product_game,
            'price', i.price,
            'quantity', i.quantity,
            'product_image', i.product_image
          )
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'
      ) as items
    FROM orders o
    LEFT JOIN order_items i ON o.id = i.order_id
    WHERE o.id = $1
    GROUP BY o.id
  `;
  const res = await pool.query(query, [id]);
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    ...r,
    subtotal: Number(r.subtotal),
    discount_amount: Number(r.discount_amount),
    voucher_amount: Number(r.voucher_amount),
    total: Number(r.total),
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
    cancelled_at: r.cancelled_at ? new Date(r.cancelled_at).toISOString() : undefined,
    items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
  };
}

export async function pgFindOrderByOrderNumber(orderNumber: string): Promise<Order | null> {
  checkPg();
  const query = `
    SELECT o.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', i.id,
            'order_id', i.order_id,
            'product_id', i.product_id,
            'product_name', i.product_name,
            'product_game', i.product_game,
            'price', i.price,
            'quantity', i.quantity,
            'product_image', i.product_image
          )
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'
      ) as items
    FROM orders o
    LEFT JOIN order_items i ON o.id = i.order_id
    WHERE o.order_number = $1
    GROUP BY o.id
  `;
  const res = await pool.query(query, [orderNumber]);
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    ...r,
    subtotal: Number(r.subtotal),
    discount_amount: Number(r.discount_amount),
    voucher_amount: Number(r.voucher_amount),
    total: Number(r.total),
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
    cancelled_at: r.cancelled_at ? new Date(r.cancelled_at).toISOString() : undefined,
    items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
  };
}

export async function pgFindInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
  checkPg();
  const query = `
    SELECT inv.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', i.id,
            'order_id', i.order_id,
            'product_id', i.product_id,
            'product_name', i.product_name,
            'product_game', i.product_game,
            'price', i.price,
            'quantity', i.quantity,
            'product_image', i.product_image
          )
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'
      ) as items
    FROM invoices inv
    LEFT JOIN order_items i ON inv.order_id = i.order_id
    WHERE inv.invoice_number = $1
    GROUP BY inv.id
  `;
  const res = await pool.query(query, [invoiceNumber]);
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    ...r,
    subtotal: Number(r.subtotal),
    discount_amount: Number(r.discount_amount),
    voucher_amount: Number(r.voucher_amount),
    total: Number(r.total),
    created_at: new Date(r.created_at).toISOString(),
    items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
  };
}

export async function pgCreateOrderCheckout(params: {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: { productId: string; quantity: number }[];
  paymentMethod: Order['payment_method'];
  voucherCode?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  order?: Order;
  invoice?: Invoice;
  payment?: Payment;
  error?: string;
}> {
  checkPg();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate products and check stock
    let subtotal = 0;
    const orderItems: OrderItem[] = [];
    const productsToUpdate: { product: Product; qty: number }[] = [];

    for (const it of params.items) {
      const prodRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [
        it.productId,
      ]);
      if (prodRes.rows.length === 0) {
        throw new Error(`Produk dengan ID ${it.productId} tidak ditemukan.`);
      }
      const prod = prodRes.rows[0];
      if (prod.is_archived || prod.status === 'ARCHIVED') {
        throw new Error(`Produk "${prod.name}" sudah tidak tersedia.`);
      }
      if (prod.stock < it.quantity) {
        throw new Error(`Stok akun "${prod.name}" tidak mencukupi (Tersisa: ${prod.stock}).`);
      }

      const activePrice = prod.discount_price ? Number(prod.discount_price) : Number(prod.price);
      subtotal += activePrice * it.quantity;

      // Primary image
      const imgRes = await client.query(
        'SELECT url FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, sort_order ASC LIMIT 1',
        [prod.id]
      );
      const imgUrl = imgRes.rows.length > 0 ? imgRes.rows[0].url : undefined;

      orderItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        order_id: '',
        product_id: prod.id,
        product_name: prod.name,
        product_game: prod.game,
        price: activePrice,
        quantity: it.quantity,
        product_image: imgUrl,
      });

      productsToUpdate.push({ product: prod, qty: it.quantity });
    }

    // Voucher validation
    let voucherAmount = 0;
    let validVoucher: Voucher | null = null;
    if (params.voucherCode) {
      const vRes = await client.query(
        'SELECT * FROM vouchers WHERE UPPER(code) = UPPER($1) FOR UPDATE',
        [params.voucherCode.trim()]
      );
      if (vRes.rows.length > 0) {
        const v = vRes.rows[0];
        if (v.is_active && subtotal >= Number(v.min_purchase)) {
          validVoucher = v;
          if (v.discount_type === 'PERCENTAGE') {
            const disc = (subtotal * Number(v.discount_value)) / 100;
            voucherAmount = v.max_discount ? Math.min(disc, Number(v.max_discount)) : disc;
          } else {
            voucherAmount = Math.min(Number(v.discount_value), subtotal);
          }
        }
      }
    }

    const discountAmount = 0;
    const total = Math.max(0, subtotal - discountAmount - voucherAmount);

    const now = new Date().toISOString();
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `VTX-${Date.now().toString().slice(-6)}${randomSuffix}`;
    const invoiceNumber = `INV/VTX/${Date.now().toString().slice(-6)}/${randomSuffix}`;

    // Insert Order
    await client.query(
      `INSERT INTO orders (
        id, order_number, invoice_number, user_id, customer_name, customer_email,
        customer_phone, subtotal, discount_amount, voucher_amount, total,
        voucher_code, payment_method, payment_status, order_status, notes,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        orderId,
        orderNumber,
        invoiceNumber,
        params.userId,
        params.customerName,
        params.customerEmail,
        params.customerPhone,
        subtotal,
        discountAmount,
        voucherAmount,
        total,
        validVoucher ? validVoucher.code : null,
        params.paymentMethod,
        'UNPAID',
        'PENDING',
        params.notes || null,
        now,
        now,
      ]
    );

    // Insert Order Items and decrement stock
    for (const item of orderItems) {
      item.order_id = orderId;
      await client.query(
        `INSERT INTO order_items (id, order_id, product_id, product_name, product_game, price, quantity, product_image)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          item.id,
          orderId,
          item.product_id,
          item.product_name,
          item.product_game,
          item.price,
          item.quantity,
          item.product_image || null,
        ]
      );
    }

    for (const { product, qty } of productsToUpdate) {
      const newStock = Math.max(0, product.stock - qty);
      const newStatus = newStock === 0 ? 'SOLD_OUT' : product.status;
      await client.query(
        'UPDATE products SET stock = $1, status = $2, updated_at = NOW() WHERE id = $3',
        [newStock, newStatus, product.id]
      );
    }

    // Insert Payment
    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const qrisRes = await client.query('SELECT image_url FROM qris_settings LIMIT 1');
    const qrisUrl = qrisRes.rows.length > 0 ? qrisRes.rows[0].image_url : '';

    await client.query(
      `INSERT INTO payments (id, order_id, method, amount, status, qris_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [paymentId, orderId, params.paymentMethod, total, 'UNPAID', qrisUrl, now]
    );

    // Insert Invoice
    const invoiceId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await client.query(
      `INSERT INTO invoices (
        id, invoice_number, order_id, user_id, customer_name, customer_email,
        customer_phone, subtotal, discount_amount, voucher_amount, total,
        payment_method, order_status, payment_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        invoiceId,
        invoiceNumber,
        orderId,
        params.userId,
        params.customerName,
        params.customerEmail,
        params.customerPhone,
        subtotal,
        discountAmount,
        voucherAmount,
        total,
        params.paymentMethod,
        'PENDING',
        'UNPAID',
        now,
      ]
    );

    // Voucher usage
    if (validVoucher) {
      await client.query(
        'UPDATE vouchers SET used_count = used_count + 1 WHERE id = $1',
        [validVoucher.id]
      );
      await client.query(
        `INSERT INTO voucher_usages (id, voucher_id, user_id, order_id, used_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          `vu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          validVoucher.id,
          params.userId,
          orderId,
          now,
        ]
      );
    }

    await client.query('COMMIT');

    const createdOrder = (await pgFindOrderById(orderId))!;
    const createdInvoice = (await pgFindInvoiceByNumber(invoiceNumber))!;
    const createdPayment: Payment = {
      id: paymentId,
      order_id: orderId,
      method: params.paymentMethod,
      amount: total,
      status: 'UNPAID',
      qris_url: qrisUrl,
      created_at: now,
    };

    return {
      success: true,
      order: createdOrder,
      invoice: createdInvoice,
      payment: createdPayment,
    };
  } catch (err: any) {
    await client.query('ROLLBACK');
    return { success: false, error: err.message || 'Gagal memproses pesanan.' };
  } finally {
    client.release();
  }
}

export async function pgUpdateOrderStatus(
  orderId: string,
  orderStatus: Order['order_status'],
  paymentStatus?: Order['payment_status']
): Promise<Order | null> {
  checkPg();
  const existing = await pgFindOrderById(orderId);
  if (!existing) return null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let deliveredCredentials = existing.delivered_credentials;
    if (orderStatus === 'COMPLETED' && !deliveredCredentials) {
      // Gather account details from products in order
      const detailsList: string[] = [];
      for (const it of existing.items) {
        const pRes = await client.query('SELECT name, account_details FROM products WHERE id = $1', [
          it.product_id,
        ]);
        if (pRes.rows.length > 0) {
          detailsList.push(`[${pRes.rows[0].name}]\n${pRes.rows[0].account_details}`);
        }
      }
      deliveredCredentials = detailsList.join('\n\n');
    }

    const payStatus = paymentStatus || (orderStatus === 'COMPLETED' ? 'PAID' : existing.payment_status);

    await client.query(
      `UPDATE orders SET
        order_status = $1, payment_status = $2, delivered_credentials = $3, updated_at = NOW()
       WHERE id = $4`,
      [orderStatus, payStatus, deliveredCredentials || null, orderId]
    );

    await client.query(
      `UPDATE invoices SET order_status = $1, payment_status = $2 WHERE order_id = $3`,
      [orderStatus, payStatus, orderId]
    );

    await client.query(
      `UPDATE payments SET status = $1 WHERE order_id = $2`,
      [payStatus, orderId]
    );

    await client.query('COMMIT');
    return await pgFindOrderById(orderId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function pgCancelOrder(
  orderId: string,
  reason: string,
  cancelledBy: string
): Promise<{ success: boolean; error?: string; order?: Order }> {
  checkPg();
  const existing = await pgFindOrderById(orderId);
  if (!existing) return { success: false, error: 'Pesanan tidak ditemukan.' };

  if (existing.order_status === 'CANCELLED') {
    return { success: false, error: 'Pesanan sudah dibatalkan sebelumnya.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE orders SET
        order_status = 'CANCELLED', payment_status = 'FAILED', cancellation_reason = $1,
        cancelled_by = $2, cancelled_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [reason, cancelledBy, orderId]
    );

    // Restore stock
    for (const it of existing.items) {
      await client.query(
        `UPDATE products SET stock = stock + $1, status = 'AVAILABLE', updated_at = NOW()
         WHERE id = $2`,
        [it.quantity, it.product_id]
      );
    }

    await client.query(
      `UPDATE invoices SET order_status = 'CANCELLED', payment_status = 'FAILED' WHERE order_id = $1`,
      [orderId]
    );

    await client.query(
      `UPDATE payments SET status = 'FAILED' WHERE order_id = $1`,
      [orderId]
    );

    await client.query('COMMIT');
    const updated = await pgFindOrderById(orderId);
    return { success: true, order: updated! };
  } catch (err: any) {
    await client.query('ROLLBACK');
    return { success: false, error: err.message || 'Gagal membatalkan pesanan.' };
  } finally {
    client.release();
  }
}

// ==========================================
// 4. VOUCHERS & DISCOUNTS
// ==========================================

export async function pgGetVouchers(): Promise<Voucher[]> {
  checkPg();
  const res = await pool.query('SELECT * FROM vouchers ORDER BY created_at DESC');
  return res.rows.map((r) => ({
    ...r,
    discount_value: Number(r.discount_value),
    min_purchase: Number(r.min_purchase),
    max_discount: r.max_discount ? Number(r.max_discount) : undefined,
    usage_limit: Number(r.usage_limit),
    used_count: Number(r.used_count),
    per_user_limit: Number(r.per_user_limit),
    valid_from: new Date(r.valid_from).toISOString(),
    valid_until: new Date(r.valid_until).toISOString(),
    created_at: new Date(r.created_at).toISOString(),
  }));
}

export async function pgFindVoucherByCode(code: string): Promise<Voucher | null> {
  checkPg();
  const res = await pool.query('SELECT * FROM vouchers WHERE UPPER(code) = UPPER($1)', [code.trim()]);
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    ...r,
    discount_value: Number(r.discount_value),
    min_purchase: Number(r.min_purchase),
    max_discount: r.max_discount ? Number(r.max_discount) : undefined,
    usage_limit: Number(r.usage_limit),
    used_count: Number(r.used_count),
    per_user_limit: Number(r.per_user_limit),
    valid_from: new Date(r.valid_from).toISOString(),
    valid_until: new Date(r.valid_until).toISOString(),
    created_at: new Date(r.created_at).toISOString(),
  };
}

export async function pgValidateVoucher(
  code: string,
  userId?: string,
  subtotal: number = 0,
  categoryId?: string,
  game?: string
): Promise<{
  valid: boolean;
  message: string;
  voucher?: Voucher;
  discountAmount?: number;
  finalTotal?: number;
}> {
  checkPg();
  const v = await pgFindVoucherByCode(code);
  if (!v) {
    return { valid: false, message: 'Kode voucher tidak valid atau tidak ditemukan.' };
  }

  if (!v.is_active) {
    return { valid: false, message: 'Voucher sudah tidak aktif.' };
  }

  const now = new Date().getTime();
  const from = new Date(v.valid_from).getTime();
  const until = new Date(v.valid_until).getTime();

  if (now < from) {
    return { valid: false, message: 'Voucher belum dapat digunakan.' };
  }

  if (now > until) {
    return { valid: false, message: 'Voucher telah kedaluwarsa.' };
  }

  if (v.used_count >= v.usage_limit) {
    return { valid: false, message: 'Batas kuota penggunaan voucher telah habis.' };
  }

  if (subtotal < v.min_purchase) {
    return {
      valid: false,
      message: `Minimal belanja untuk menggunakan voucher ini adalah Rp${v.min_purchase.toLocaleString('id-ID')}.`,
    };
  }

  if (v.applicable_category && categoryId && v.applicable_category !== categoryId) {
    return { valid: false, message: 'Voucher tidak berlaku untuk kategori game yang dipilih.' };
  }

  if (v.applicable_game && game && v.applicable_game.toLowerCase() !== game.toLowerCase()) {
    return { valid: false, message: 'Voucher tidak berlaku untuk game yang dipilih.' };
  }

  if (userId) {
    const usageCheck = await pool.query(
      'SELECT COUNT(*) FROM voucher_usages WHERE voucher_id = $1 AND user_id = $2',
      [v.id, userId]
    );
    const usedByUser = parseInt(usageCheck.rows[0].count, 10);
    if (usedByUser >= v.per_user_limit) {
      return { valid: false, message: 'Anda telah mencapai batas maksimal penggunaan voucher ini.' };
    }
  }

  let discountAmount = 0;
  if (v.discount_type === 'PERCENTAGE') {
    const rawDisc = (subtotal * v.discount_value) / 100;
    discountAmount = v.max_discount ? Math.min(rawDisc, v.max_discount) : rawDisc;
  } else {
    discountAmount = Math.min(v.discount_value, subtotal);
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);

  return {
    valid: true,
    message: 'Voucher berhasil diterapkan!',
    voucher: v,
    discountAmount,
    finalTotal,
  };
}

export async function pgCreateVoucher(
  data: Omit<Voucher, 'id' | 'used_count' | 'created_at'>
): Promise<Voucher> {
  checkPg();
  const id = `vouch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  await pool.query(
    `INSERT INTO vouchers (
      id, code, discount_type, discount_value, min_purchase, max_discount,
      usage_limit, used_count, per_user_limit, valid_from, valid_until, is_active,
      applicable_category, applicable_game, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11, $12, $13, $14)`,
    [
      id,
      data.code.toUpperCase().trim(),
      data.discount_type,
      data.discount_value,
      data.min_purchase,
      data.max_discount || null,
      data.usage_limit,
      data.per_user_limit,
      data.valid_from,
      data.valid_until,
      data.is_active,
      data.applicable_category || null,
      data.applicable_game || null,
      now,
    ]
  );
  return (await pgFindVoucherByCode(data.code))!;
}

export async function pgUpdateVoucher(
  id: string,
  updates: Partial<Voucher>
): Promise<Voucher | null> {
  checkPg();
  const vRes = await pool.query('SELECT * FROM vouchers WHERE id = $1', [id]);
  if (vRes.rows.length === 0) return null;
  const v = vRes.rows[0];

  await pool.query(
    `UPDATE vouchers SET
      code = $1, discount_type = $2, discount_value = $3, min_purchase = $4,
      max_discount = $5, usage_limit = $6, per_user_limit = $7, valid_from = $8,
      valid_until = $9, is_active = $10
     WHERE id = $11`,
    [
      updates.code !== undefined ? updates.code.toUpperCase().trim() : v.code,
      updates.discount_type !== undefined ? updates.discount_type : v.discount_type,
      updates.discount_value !== undefined ? updates.discount_value : v.discount_value,
      updates.min_purchase !== undefined ? updates.min_purchase : v.min_purchase,
      updates.max_discount !== undefined ? updates.max_discount : v.max_discount,
      updates.usage_limit !== undefined ? updates.usage_limit : v.usage_limit,
      updates.per_user_limit !== undefined ? updates.per_user_limit : v.per_user_limit,
      updates.valid_from !== undefined ? updates.valid_from : v.valid_from,
      updates.valid_until !== undefined ? updates.valid_until : v.valid_until,
      updates.is_active !== undefined ? updates.is_active : v.is_active,
      id,
    ]
  );

  return (await pgFindVoucherByCode(updates.code || v.code))!;
}

export async function pgDeleteVoucher(id: string): Promise<boolean> {
  checkPg();
  const res = await pool.query('DELETE FROM vouchers WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function pgGetDiscounts(): Promise<Discount[]> {
  checkPg();
  const res = await pool.query('SELECT * FROM discounts ORDER BY start_date DESC');
  return res.rows.map((r) => ({
    ...r,
    discount_value: Number(r.discount_value),
    min_purchase: Number(r.min_purchase),
    max_discount: r.max_discount ? Number(r.max_discount) : undefined,
    start_date: new Date(r.start_date).toISOString(),
    end_date: new Date(r.end_date).toISOString(),
  }));
}

export async function pgCreateDiscount(data: Omit<Discount, 'id'>): Promise<Discount> {
  checkPg();
  const id = `disc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  await pool.query(
    `INSERT INTO discounts (
      id, name, discount_type, discount_value, min_purchase, max_discount, target_type, target_id, start_date, end_date, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      data.name,
      data.discount_type,
      data.discount_value,
      data.min_purchase,
      data.max_discount || null,
      data.target_type,
      data.target_id || null,
      data.start_date,
      data.end_date,
      data.is_active,
    ]
  );
  const res = await pool.query('SELECT * FROM discounts WHERE id = $1', [id]);
  const r = res.rows[0];
  return {
    ...r,
    discount_value: Number(r.discount_value),
    min_purchase: Number(r.min_purchase),
    max_discount: r.max_discount ? Number(r.max_discount) : undefined,
    start_date: new Date(r.start_date).toISOString(),
    end_date: new Date(r.end_date).toISOString(),
  };
}

export async function pgDeleteDiscount(id: string): Promise<boolean> {
  checkPg();
  const res = await pool.query('DELETE FROM discounts WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

// ==========================================
// 5. RATINGS & REVIEWS
// ==========================================

export async function pgGetRatings(productId?: string): Promise<Rating[]> {
  checkPg();
  let query = 'SELECT * FROM ratings WHERE 1=1';
  const params: any[] = [];
  if (productId) {
    params.push(productId);
    query += ` AND product_id = $1`;
  }
  query += ' ORDER BY created_at DESC';
  const res = await pool.query(query, params);
  return res.rows.map((r) => ({
    ...r,
    rating: Number(r.rating),
    created_at: new Date(r.created_at).toISOString(),
  }));
}

export async function pgCreateRating(params: {
  productId: string;
  userId: string;
  orderId: string;
  userName: string;
  rating: number;
  review: string;
}): Promise<Rating> {
  checkPg();
  const id = `rat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const prodRes = await pool.query('SELECT name FROM products WHERE id = $1', [params.productId]);
  const prodName = prodRes.rows.length > 0 ? prodRes.rows[0].name : '';

  await pool.query(
    `INSERT INTO ratings (id, product_id, product_name, user_id, order_id, user_name, rating, review, is_hidden, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9)`,
    [
      id,
      params.productId,
      prodName,
      params.userId,
      params.orderId,
      params.userName,
      params.rating,
      params.review,
      now,
    ]
  );

  return {
    id,
    product_id: params.productId,
    product_name: prodName,
    user_id: params.userId,
    order_id: params.orderId,
    user_name: params.userName,
    rating: params.rating,
    review: params.review,
    is_hidden: false,
    created_at: now,
  };
}

export async function pgToggleRatingVisibility(
  ratingId: string,
  isHidden: boolean
): Promise<boolean> {
  checkPg();
  const res = await pool.query('UPDATE ratings SET is_hidden = $1 WHERE id = $2', [
    isHidden,
    ratingId,
  ]);
  return (res.rowCount ?? 0) > 0;
}

export async function pgDeleteRating(ratingId: string): Promise<boolean> {
  checkPg();
  const res = await pool.query('DELETE FROM ratings WHERE id = $1', [ratingId]);
  return (res.rowCount ?? 0) > 0;
}

export async function pgGetServiceReviews(publicOnly = true): Promise<ServiceReview[]> {
  checkPg();
  let query = 'SELECT * FROM service_reviews';
  if (publicOnly) {
    query += ' WHERE is_hidden = false';
  }
  query += ' ORDER BY created_at DESC';
  const res = await pool.query(query);
  return res.rows.map((r) => ({
    ...r,
    rating: Number(r.rating),
    created_at: new Date(r.created_at).toISOString(),
  }));
}

export async function pgCreateServiceReview(params: {
  userId: string;
  orderId: string;
  userName: string;
  rating: number;
  comment: string;
}): Promise<ServiceReview> {
  checkPg();
  const id = `sr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  await pool.query(
    `INSERT INTO service_reviews (id, user_id, order_id, user_name, rating, comment, is_hidden, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, false, $7)`,
    [id, params.userId, params.orderId, params.userName, params.rating, params.comment, now]
  );
  return {
    id,
    user_id: params.userId,
    order_id: params.orderId,
    user_name: params.userName,
    rating: params.rating,
    comment: params.comment,
    is_hidden: false,
    created_at: now,
  };
}

// ==========================================
// 6. STORE, THEME & QRIS SETTINGS
// ==========================================

export async function pgGetStoreSettings(): Promise<StoreSettings> {
  checkPg();
  const res = await pool.query('SELECT * FROM store_settings LIMIT 1');
  if (res.rows.length === 0) {
    throw new Error('Store settings not initialized.');
  }
  const r = res.rows[0];
  return {
    ...r,
    updated_at: new Date(r.updated_at).toISOString(),
  };
}

export async function pgUpdateStoreSettings(
  updates: Partial<StoreSettings>
): Promise<StoreSettings> {
  checkPg();
  const existing = await pgGetStoreSettings();
  const now = new Date().toISOString();

  await pool.query(
    `UPDATE store_settings SET
      store_name = $1, tagline = $2, phone = $3, whatsapp_number = $4,
      whatsapp_link_number = $5, whatsapp_default_message = $6, logo_url = $7,
      favicon_url = $8, terms_conditions = $9, refund_policy = $10,
      cancellation_policy = $11, gaming_disclaimer = $12, updated_at = $13
     WHERE id = $14`,
    [
      updates.store_name !== undefined ? updates.store_name : existing.store_name,
      updates.tagline !== undefined ? updates.tagline : existing.tagline,
      updates.phone !== undefined ? updates.phone : existing.phone,
      updates.whatsapp_number !== undefined ? updates.whatsapp_number : existing.whatsapp_number,
      updates.whatsapp_link_number !== undefined
        ? updates.whatsapp_link_number
        : existing.whatsapp_link_number,
      updates.whatsapp_default_message !== undefined
        ? updates.whatsapp_default_message
        : existing.whatsapp_default_message,
      updates.logo_url !== undefined ? updates.logo_url : existing.logo_url,
      updates.favicon_url !== undefined ? updates.favicon_url : existing.favicon_url,
      updates.terms_conditions !== undefined ? updates.terms_conditions : existing.terms_conditions,
      updates.refund_policy !== undefined ? updates.refund_policy : existing.refund_policy,
      updates.cancellation_policy !== undefined
        ? updates.cancellation_policy
        : existing.cancellation_policy,
      updates.gaming_disclaimer !== undefined
        ? updates.gaming_disclaimer
        : existing.gaming_disclaimer,
      now,
      existing.id,
    ]
  );

  return await pgGetStoreSettings();
}

export async function pgGetThemeSettings(): Promise<ThemeSettings> {
  checkPg();
  const res = await pool.query('SELECT * FROM theme_settings LIMIT 1');
  if (res.rows.length === 0) {
    throw new Error('Theme settings not initialized.');
  }
  const r = res.rows[0];
  return {
    ...r,
    updated_at: new Date(r.updated_at).toISOString(),
  };
}

export async function pgUpdateThemeSettings(
  updates: Partial<ThemeSettings>
): Promise<ThemeSettings> {
  checkPg();
  const existing = await pgGetThemeSettings();
  const now = new Date().toISOString();

  await pool.query(
    `UPDATE theme_settings SET
      theme_mode = $1, primary_color = $2, secondary_color = $3, background_color = $4,
      text_color = $5, button_color = $6, accent_color = $7, banner_image = $8,
      banner_title = $9, banner_subtitle = $10, updated_at = $11
     WHERE id = $12`,
    [
      updates.theme_mode !== undefined ? updates.theme_mode : existing.theme_mode,
      updates.primary_color !== undefined ? updates.primary_color : existing.primary_color,
      updates.secondary_color !== undefined ? updates.secondary_color : existing.secondary_color,
      updates.background_color !== undefined ? updates.background_color : existing.background_color,
      updates.text_color !== undefined ? updates.text_color : existing.text_color,
      updates.button_color !== undefined ? updates.button_color : existing.button_color,
      updates.accent_color !== undefined ? updates.accent_color : existing.accent_color,
      updates.banner_image !== undefined ? updates.banner_image : existing.banner_image,
      updates.banner_title !== undefined ? updates.banner_title : existing.banner_title,
      updates.banner_subtitle !== undefined ? updates.banner_subtitle : existing.banner_subtitle,
      now,
      existing.id,
    ]
  );

  return await pgGetThemeSettings();
}

export async function pgGetQrisSettings(): Promise<QrisSettings> {
  checkPg();
  const res = await pool.query('SELECT * FROM qris_settings LIMIT 1');
  if (res.rows.length === 0) {
    throw new Error('QRIS settings not initialized.');
  }
  const r = res.rows[0];
  return {
    ...r,
    updated_at: new Date(r.updated_at).toISOString(),
  };
}

export async function pgUpdateQrisSettings(updates: Partial<QrisSettings>): Promise<QrisSettings> {
  checkPg();
  const existing = await pgGetQrisSettings();
  const now = new Date().toISOString();

  await pool.query(
    `UPDATE qris_settings SET
      is_active = $1, image_url = $2, account_name = $3, nmid = $4, updated_at = $5
     WHERE id = $6`,
    [
      updates.is_active !== undefined ? updates.is_active : existing.is_active,
      updates.image_url !== undefined ? updates.image_url : existing.image_url,
      updates.account_name !== undefined ? updates.account_name : existing.account_name,
      updates.nmid !== undefined ? updates.nmid : existing.nmid,
      now,
      existing.id,
    ]
  );

  return await pgGetQrisSettings();
}

// ==========================================
// 7. AUDIT & EMAIL LOGS
// ==========================================

export async function pgLogAudit(
  adminId: string,
  adminName: string,
  action: string,
  target: string,
  metadata?: Record<string, any>
): Promise<AuditLog> {
  checkPg();
  const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  await pool.query(
    `INSERT INTO audit_logs (id, admin_id, admin_name, action, target, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, adminId, adminName, action, target, metadata ? JSON.stringify(metadata) : null, now]
  );

  return {
    id,
    admin_id: adminId,
    admin_name: adminName,
    action,
    target,
    metadata,
    created_at: now,
  };
}

export async function pgGetAuditLogs(): Promise<AuditLog[]> {
  checkPg();
  const res = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500');
  return res.rows.map((r) => ({
    ...r,
    metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
    created_at: new Date(r.created_at).toISOString(),
  }));
}

export async function pgLogEmail(
  recipient: string,
  subject: string,
  status: EmailLog['status'],
  errorMessage?: string,
  orderId?: string
): Promise<EmailLog> {
  checkPg();
  const id = `eml-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const provider = (process.env.EMAIL_PROVIDER || 'resend').trim().toLowerCase();

  await pool.query(
    `INSERT INTO email_logs (id, recipient, subject, provider, status, error, message_id, sent_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, recipient, subject, provider, status, errorMessage || null, orderId || null, now]
  );

  return {
    id,
    recipient,
    subject,
    status,
    error_message: errorMessage,
    order_id: orderId,
    created_at: now,
  };
}

export async function pgGetEmailLogs(): Promise<EmailLog[]> {
  checkPg();
  const res = await pool.query('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 500');
  return res.rows.map((r) => ({
    id: r.id,
    recipient: r.recipient,
    subject: r.subject,
    status: r.status,
    error_message: r.error,
    order_id: r.message_id,
    created_at: new Date(r.sent_at).toISOString(),
  }));
}

// ==========================================
// 8. ANALYTICS & SUMMARY
// ==========================================

export async function pgGetAnalyticsSummary(): Promise<AnalyticsSummary> {
  checkPg();
  const revRes = await pool.query(`
    SELECT COALESCE(SUM(total), 0) as rev
    FROM orders
    WHERE payment_status = 'PAID' OR order_status = 'COMPLETED'
  `);
  const total_revenue = Number(revRes.rows[0].rev);

  const ordRes = await pool.query('SELECT COUNT(*) as total FROM orders');
  const total_transactions = parseInt(ordRes.rows[0].total, 10);

  const compRes = await pool.query(
    "SELECT COUNT(*) as comp FROM orders WHERE order_status = 'COMPLETED'"
  );
  const completed_transactions = parseInt(compRes.rows[0].comp, 10);

  const pendRes = await pool.query(
    "SELECT COUNT(*) as pend FROM orders WHERE order_status = 'PENDING'"
  );
  const pending_transactions = parseInt(pendRes.rows[0].pend, 10);

  const cancRes = await pool.query(
    "SELECT COUNT(*) as canc FROM orders WHERE order_status = 'CANCELLED'"
  );
  const cancelled_transactions = parseInt(cancRes.rows[0].canc, 10);

  const prodRes = await pool.query('SELECT COUNT(*) as count FROM products WHERE is_archived = false');
  const total_products = parseInt(prodRes.rows[0].count, 10);

  const actProdRes = await pool.query(
    "SELECT COUNT(*) as active FROM products WHERE status = 'AVAILABLE' AND is_archived = false AND stock > 0"
  );
  const active_products = parseInt(actProdRes.rows[0].active, 10);
  const out_of_stock_products = Math.max(0, total_products - active_products);

  const custRes = await pool.query("SELECT COUNT(*) as cust FROM users WHERE role = 'CUSTOMER'");
  const total_customers = parseInt(custRes.rows[0].cust, 10);

  const ratRes = await pool.query('SELECT COUNT(*) as count, COALESCE(AVG(rating), 5) as avg FROM ratings');
  const total_ratings = parseInt(ratRes.rows[0].count, 10);
  const average_store_rating = Number(Number(ratRes.rows[0].avg).toFixed(1));

  const srvRes = await pool.query('SELECT COALESCE(AVG(rating), 5) as avg FROM service_reviews');
  const average_service_rating = Number(Number(srvRes.rows[0].avg).toFixed(1));

  const vouchRes = await pool.query('SELECT COUNT(*) as count FROM voucher_usages');
  const total_vouchers_used = parseInt(vouchRes.rows[0].count, 10);

  const discRes = await pool.query('SELECT COALESCE(SUM(voucher_amount + discount_amount), 0) as disc FROM orders');
  const total_discount_given = Number(discRes.rows[0].disc);

  return {
    total_products,
    active_products,
    out_of_stock_products,
    total_customers,
    total_transactions,
    completed_transactions,
    pending_transactions,
    cancelled_transactions,
    total_revenue,
    revenue_today: 0,
    revenue_this_month: total_revenue,
    total_vouchers_used,
    total_discount_given,
    total_ratings,
    average_store_rating,
    average_service_rating,
    sales_chart: {
      daily: [],
      weekly: [],
      monthly: [],
    },
    top_selling_products: [],
    most_viewed_products: [],
    top_revenue_products: [],
    top_rated_products: [],
  };
}

export async function pgGetProductPerformance(
  filter: 'today' | '7days' | '30days' | 'month' | 'all' = 'all'
): Promise<ProductPerformance[]> {
  checkPg();
  const products = await pgGetProducts({ includeArchived: true });
  const orders = await pgGetOrders();

  let cutoff = 0;
  const now = Date.now();
  if (filter === 'today') {
    cutoff = now - 24 * 60 * 60 * 1000;
  } else if (filter === '7days') {
    cutoff = now - 7 * 24 * 60 * 60 * 1000;
  } else if (filter === '30days' || filter === 'month') {
    cutoff = now - 30 * 24 * 60 * 60 * 1000;
  }

  const perf: ProductPerformance[] = [];

  for (const p of products) {
    let sold = 0;
    let rev = 0;

    for (const o of orders) {
      const orderTime = new Date(o.created_at).getTime();
      if (cutoff > 0 && orderTime < cutoff) continue;
      if (o.order_status === 'CANCELLED') continue;

      for (const it of o.items) {
        if (it.product_id === p.id) {
          sold += it.quantity;
          rev += it.price * it.quantity;
        }
      }
    }

    const pvRes = await pool.query(
      'SELECT COUNT(*) FROM product_views WHERE product_id = $1',
      [p.id]
    );
    const views = parseInt(pvRes.rows[0].count, 10);

    perf.push({
      product_id: p.id,
      product_name: p.name,
      game: p.game,
      views,
      checkouts: 0,
      sold_count: sold,
      total_transactions: sold,
      total_revenue: rev,
      cancellations: 0,
      rating_count: 0,
      average_rating: 5,
      conversion_rate: views > 0 ? (sold / views) * 100 : 0,
    });
  }

  return perf.sort((a, b) => b.total_revenue - a.total_revenue);
}
