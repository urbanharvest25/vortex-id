import { Router, Request, Response } from 'express';
import { db } from './db.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  requireAuth,
  requireAdmin,
  optionalAuth,
  AuthRequest,
} from './auth.js';
import { isEmailConfigured, sendOrderNotificationEmail, sendTestEmail } from './email.js';

export const apiRouter = Router();

// ==========================================
// 1. PUBLIC STORE SETTINGS & THEME
// ==========================================
apiRouter.get('/store-settings', async (_req: Request, res: Response) => {
  try {
    const settings = await db.getStoreSettings();
    return res.json({ success: true, data: settings });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat pengaturan toko.' });
  }
});

apiRouter.get('/theme-settings', async (_req: Request, res: Response) => {
  try {
    const theme = await db.getThemeSettings();
    return res.json({ success: true, data: theme });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat tema toko.' });
  }
});

apiRouter.get('/qris', async (_req: Request, res: Response) => {
  try {
    const qris = await db.getQrisSettings();
    return res.json({ success: true, data: qris });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat pengaturan QRIS.' });
  }
});

apiRouter.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await db.getCategories();
    return res.json({ success: true, data: categories });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat kategori.' });
  }
});

// ==========================================
// 2. AUTHENTICATION (CUSTOMER & ADMIN)
// ==========================================
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email sudah terdaftar. Silakan login.' });
    }

    const password_hash = hashPassword(password);
    const newUser = await db.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      phone: phone ? phone.trim() : undefined,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });

    const token = generateToken(newUser);
    res.cookie('vortex_token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    const { password_hash: _, ...safeUser } = newUser;
    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil!',
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('[Registration Server Error]:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Maaf, terjadi kesalahan pada server saat registrasi. Silakan coba lagi.',
    });
  }
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    if (user.status === 'BANNED') {
      return res.status(403).json({ error: 'Akun Anda dinonaktifkan oleh Administrator.' });
    }

    const isValid = comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const token = generateToken(user);
    res.cookie('vortex_token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    if (user.role === 'ADMIN') {
      await db.logAudit(user.id, user.name, 'ADMIN_LOGIN', 'AUTH', { email: user.email });
    }

    const { password_hash: _, ...safeUser } = user;
    return res.json({
      success: true,
      message: 'Login berhasil!',
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('[Login Server Error]:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Maaf, terjadi kesalahan saat login. Silakan coba lagi.',
    });
  }
});

apiRouter.post('/auth/logout', async (req: AuthRequest, res: Response) => {
  res.clearCookie('vortex_token');
  if (req.user && req.user.role === 'ADMIN') {
    await db.logAudit(req.user.id, req.user.name, 'ADMIN_LOGOUT', 'AUTH', {});
  }
  return res.json({ success: true, message: 'Berhasil logout.' });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { password_hash: _, ...safeUser } = req.user;
  return res.json({ success: true, user: safeUser });
});

apiRouter.put('/auth/update-profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone } = req.body;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const updated = await db.updateUser(req.user.id, {
      name: name?.trim() || req.user.name,
      phone: phone !== undefined ? phone.trim() : req.user.phone,
    });

    if (!updated) return res.status(400).json({ error: 'Gagal memperbarui profil.' });

    const { password_hash: _, ...safeUser } = updated;
    return res.json({ success: true, message: 'Profil berhasil diperbarui.', user: safeUser });
  } catch (err: any) {
    return res.status(500).json({ error: 'Maaf, terjadi kesalahan. Silakan coba lagi.' });
  }
});

apiRouter.put('/auth/change-password', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    if (!comparePassword(currentPassword, req.user.password_hash)) {
      return res.status(400).json({ error: 'Password saat ini salah.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
    }

    const newHash = hashPassword(newPassword);
    await db.updateUser(req.user.id, { password_hash: newHash });

    return res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Maaf, terjadi kesalahan. Silakan coba lagi.' });
  }
});

// ==========================================
// 3. PRODUCTS (CUSTOMER & PUBLIC)
// ==========================================
apiRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const { search, game, category, minPrice, maxPrice, inStockOnly, sortBy } = req.query;

    const products = await db.getProducts({
      search: search as string,
      game: game as string,
      category: category as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStockOnly: inStockOnly === 'true',
      includeArchived: false,
      sortBy: sortBy as any,
    });

    // Strip sensitive account details from public store views!
    const sanitized = products.map((p) => {
      const { account_details: _, ...rest } = p;
      return rest;
    });

    return res.json({ success: true, data: sanitized });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat produk.' });
  }
});

apiRouter.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await db.findProductById(req.params.id);
    if (!product || product.is_archived) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    // Record view count
    await db.recordProductView(product.id);

    // Calculate rating stats
    const ratings = await db.getRatings(product.id);
    const avgRating =
      ratings.length > 0
        ? Number((ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1))
        : 5.0;

    // Never expose account_details openly!
    const { account_details: _, ...sanitized } = product;

    return res.json({
      success: true,
      data: {
        ...sanitized,
        rating_stats: {
          average: avgRating,
          total_reviews: ratings.length,
          reviews: ratings,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat detail produk.' });
  }
});

// ==========================================
// 4. VOUCHERS & DISCOUNTS
// ==========================================
apiRouter.post('/vouchers/validate', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { code, subtotal, categoryId, game } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Kode voucher wajib diisi.' });
    }

    const userId = req.user?.id || 'guest';
    const result = await db.validateVoucher(code, userId, Number(subtotal) || 0, categoryId, game);

    if (!result.valid) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({
      success: true,
      voucher: {
        code: result.voucher?.code,
        discount_type: result.voucher?.discount_type,
        discount_value: result.voucher?.discount_value,
      },
      discount_amount: result.discountAmount,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memvalidasi voucher.' });
  }
});

// ==========================================
// 5. TRANSACTIONS / ORDERS (CUSTOMER)
// ==========================================
apiRouter.post('/orders/checkout', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Silakan login terlebih dahulu untuk checkout.' });
    }

    const { items, voucherCode, paymentMethod, customerName, customerPhone, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Keranjang belanja kosong.' });
    }

    const allowedPaymentMethods = ['QRIS', 'BANK_TRANSFER', 'EWALLET', 'WHATSAPP_CONFIRMATION'];
    if (!paymentMethod || !allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Metode pembayaran tidak valid.' });
    }

    const result = await db.createOrderCheckout({
      userId: req.user.id,
      customerName: customerName?.trim() || req.user.name,
      customerEmail: req.user.email,
      customerPhone: customerPhone?.trim() || req.user.phone || '085819822250',
      items,
      voucherCode,
      paymentMethod,
      notes,
    });

    if (!result.success || !result.order || !result.invoice) {
      return res.status(400).json({ error: result.error || 'Gagal memproses pesanan.' });
    }

    // Dispatch notification email asynchronously
    sendOrderNotificationEmail(result.order, result.invoice, req.user.email).catch((e) =>
      console.error('Email error:', e)
    );

    // Strip sensitive raw credentials in initial checkout response
    const { delivered_credentials: _, ...safeOrder } = result.order;

    return res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat!',
      order: safeOrder,
      invoice: result.invoice,
    });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: err?.message || 'Maaf, terjadi kesalahan saat checkout. Silakan coba lagi.' });
  }
});

// CEK PESANAN WAJIB LOGIN & OWNERSHIP CHECK
apiRouter.get('/orders/my-orders', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // Customer only gets their own orders!
    const orders = await db.getUserOrders(req.user.id);

    // Mask sensitive credentials on order list page
    const safeOrders = orders.map((o) => {
      const { delivered_credentials: _, ...rest } = o;
      return rest;
    });

    return res.json({ success: true, data: safeOrders });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat daftar pesanan Anda.' });
  }
});

apiRouter.get('/orders/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const order = await db.findOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    // Strict ownership validation: customer cannot view other customer's order!
    if (order.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak memiliki izin untuk melihat pesanan ini.' });
    }

    // Only allow sensitive credential access if order is COMPLETED or if admin
    let canViewCredentials = false;
    if (req.user.role === 'ADMIN' || (order.order_status === 'COMPLETED' && order.user_id === req.user.id)) {
      canViewCredentials = true;
    }

    const { delivered_credentials, ...safeOrder } = order;

    return res.json({
      success: true,
      data: {
        ...safeOrder,
        delivered_credentials: canViewCredentials ? delivered_credentials : undefined,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat detail pesanan.' });
  }
});

// INVOICE LOOKUP
apiRouter.get('/invoices/:invoiceNumber', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await db.findInvoiceByNumber(req.params.invoiceNumber);
    if (!invoice) {
      return res.status(404).json({ error: 'Nota invoice tidak ditemukan.' });
    }

    // If customer is logged in, verify ownership unless admin
    if (req.user && req.user.role !== 'ADMIN' && invoice.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Akses invoice ditolak.' });
    }

    const settings = await db.getStoreSettings();

    return res.json({
      success: true,
      invoice,
      store: {
        name: settings.store_name,
        store_name: settings.store_name,
        tagline: settings.tagline,
        phone: settings.phone,
        logo_url: settings.logo_url,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat invoice.' });
  }
});

// ==========================================
// 6. RATINGS & REVIEWS (CUSTOMER)
// ==========================================
apiRouter.get('/ratings', async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;
    const ratings = await db.getRatings(productId as string);
    return res.json({ success: true, data: ratings });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat rating.' });
  }
});

apiRouter.post('/ratings/product', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { productId, orderId, rating, review } = req.body;
    if (!productId || !orderId || !rating || !review) {
      return res.status(400).json({ error: 'Semua field ulasan produk wajib diisi.' });
    }

    const ratingObj = await db.createRating({
      productId,
      userId: req.user.id,
      orderId,
      userName: req.user.name,
      rating: Number(rating),
      review: review.trim(),
    });

    return res.status(201).json({ success: true, message: 'Rating produk berhasil dikirim!', data: ratingObj });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengirim rating.' });
  }
});

apiRouter.get('/service-reviews', async (_req: Request, res: Response) => {
  try {
    const reviews = await db.getServiceReviews(true);
    return res.json({ success: true, data: reviews });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat review layanan.' });
  }
});

apiRouter.post('/service-reviews', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { orderId, rating, comment } = req.body;
    if (!orderId || !rating || !comment) {
      return res.status(400).json({ error: 'Semua field rating layanan wajib diisi.' });
    }

    const review = await db.createServiceReview({
      userId: req.user.id,
      orderId,
      userName: req.user.name,
      rating: Number(rating),
      comment: comment.trim(),
    });

    return res
      .status(201)
      .json({ success: true, message: 'Terima kasih atas ulasan layanan Anda!', data: review });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengirim rating layanan.' });
  }
});

// ==========================================
// 7. ADMIN PROTECTED ROUTES (requireAdmin)
// ==========================================

// --- Admin Product Management ---
apiRouter.get('/admin/products', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const products = await db.getProducts({ includeArchived: true });
    return res.json({ success: true, data: products });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat produk admin.' });
  }
});

apiRouter.post('/admin/products', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      game,
      category,
      price,
      discount_price,
      stock,
      description,
      account_details,
      rank,
      level,
      skins,
      items,
      images,
    } = req.body;

    if (!name || !game || price === undefined || stock === undefined || !description) {
      return res.status(400).json({ error: 'Nama, game, harga, stok, dan deskripsi produk wajib diisi.' });
    }

    // Validate images max 10
    const validatedImages = Array.isArray(images) ? images.slice(0, 10) : [];

    const product = await db.createProduct({
      name: name.trim(),
      game: game.trim(),
      category: category || 'cat-mlbb',
      price: Number(price),
      discount_price: discount_price ? Number(discount_price) : undefined,
      stock: Math.max(0, Number(stock)),
      description: description.trim(),
      account_details: account_details || '',
      rank,
      level,
      skins,
      items,
      status: Number(stock) > 0 ? 'AVAILABLE' : 'SOLD_OUT',
      is_archived: false,
      images: validatedImages.map((img: any, idx: number) => ({
        id: `img-${Date.now()}-${idx}`,
        product_id: '',
        url: img.url,
        sort_order: idx,
        is_primary: idx === 0,
      })),
    });

    await db.logAudit(req.user!.id, req.user!.name, 'ADD_PRODUCT', product.id, {
      name: product.name,
      game: product.game,
    });

    return res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan!', data: product });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menambahkan produk.' });
  }
});

apiRouter.put('/admin/products/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.stock !== undefined) {
      updates.stock = Math.max(0, Number(updates.stock));
      if (updates.stock === 0) updates.status = 'SOLD_OUT';
      else if (updates.status === 'SOLD_OUT' && updates.stock > 0) updates.status = 'AVAILABLE';
    }

    if (updates.images && Array.isArray(updates.images)) {
      updates.images = updates.images.slice(0, 10);
    }

    const updated = await db.updateProduct(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    await db.logAudit(req.user!.id, req.user!.name, 'EDIT_PRODUCT', id, { name: updated.name });

    return res.json({ success: true, message: 'Produk berhasil diperbarui!', data: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memperbarui produk.' });
  }
});

apiRouter.delete('/admin/products/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const prod = await db.findProductById(id);
    const result = await db.deleteProduct(id);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    await db.logAudit(req.user!.id, req.user!.name, 'DELETE_OR_ARCHIVE_PRODUCT', id, { name: prod?.name });

    return res.json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menghapus produk.' });
  }
});

// Image Upload Endpoint with validation (MIME, max 10 photos, size limit)
apiRouter.post('/admin/upload-image', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { imageData, mimeType } = req.body;
    if (!imageData) {
      return res.status(400).json({ error: 'Data gambar tidak boleh kosong.' });
    }

    // Validate mime type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const detectedMime = mimeType || (imageData.match(/data:(image\/[a-zA-Z+]+);base64,/) || [])[1];

    if (detectedMime && !validMimes.includes(detectedMime)) {
      return res.status(400).json({ error: 'Format file tidak didukung. Harap upload format JPG, PNG, atau WEBP.' });
    }

    // Size limit check (approx 5MB base64)
    if (imageData.length > 7 * 1024 * 1024) {
      return res.status(400).json({ error: 'Ukuran foto melebihi batas maksimal 5MB.' });
    }

    return res.json({
      success: true,
      url: imageData,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memproses gambar.' });
  }
});

// --- Admin Orders ---
apiRouter.get('/admin/orders', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await db.getOrders();
    return res.json({ success: true, data: orders });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat pesanan admin.' });
  }
});

apiRouter.put('/admin/orders/:id/status', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { order_status, payment_status } = req.body;

    const updated = await db.updateOrderStatus(id, order_status, payment_status);
    if (!updated) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    await db.logAudit(req.user!.id, req.user!.name, 'UPDATE_ORDER_STATUS', id, { order_status, payment_status });

    return res.json({ success: true, message: 'Status transaksi berhasil diubah.', data: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memperbarui status pesanan.' });
  }
});

apiRouter.post('/admin/orders/:id/cancel', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Alasan pembatalan wajib disertakan.' });
    }

    const result = await db.cancelOrder(id, reason.trim(), req.user!.name);
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Gagal membatalkan pesanan.' });
    }

    await db.logAudit(req.user!.id, req.user!.name, 'CANCEL_TRANSACTION', id, { reason, restoredStock: true });

    return res.json({ success: true, message: 'Pesanan berhasil dibatalkan.', order: result.order });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal membatalkan transaksi.' });
  }
});

// --- Admin Customers ---
apiRouter.get('/admin/customers', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const allUsers = await db.getUsers();
    const customers = allUsers.filter((u) => u.role === 'CUSTOMER');
    const orders = await db.getOrders();

    const customerStats = customers.map((c) => {
      const userOrders = orders.filter((o) => o.user_id === c.id);
      const totalSpent = userOrders
        .filter((o) => o.order_status === 'COMPLETED' || o.payment_status === 'PAID')
        .reduce((acc, o) => acc + o.total, 0);

      const { password_hash: _, ...safeUser } = c;
      return {
        ...safeUser,
        total_orders: userOrders.length,
        total_spent: totalSpent,
      };
    });

    return res.json({ success: true, data: customerStats });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat data pelanggan.' });
  }
});

apiRouter.put('/admin/customers/:id/status', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await db.findUserById(id);
    if (!user || user.role === 'ADMIN') {
      return res.status(400).json({ error: 'Customer tidak ditemukan atau tidak dapat diubah.' });
    }

    const updated = await db.updateUser(id, { status });
    await db.logAudit(req.user!.id, req.user!.name, 'UPDATE_CUSTOMER_STATUS', id, { status });

    return res.json({ success: true, message: `Status customer diubah menjadi ${status}.`, data: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memperbarui status customer.' });
  }
});

// --- Admin Vouchers ---
apiRouter.get('/admin/vouchers', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const vouchers = await db.getVouchers();
    return res.json({ success: true, data: vouchers });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat voucher.' });
  }
});

apiRouter.post('/admin/vouchers', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const voucher = await db.createVoucher(req.body);
    await db.logAudit(req.user!.id, req.user!.name, 'CREATE_VOUCHER', voucher.id, { code: voucher.code });
    return res.status(201).json({ success: true, message: 'Voucher berhasil dibuat!', data: voucher });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal membuat voucher.' });
  }
});

apiRouter.put('/admin/vouchers/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await db.updateVoucher(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Voucher tidak ditemukan.' });
    await db.logAudit(req.user!.id, req.user!.name, 'UPDATE_VOUCHER', req.params.id, { code: updated.code });
    return res.json({ success: true, message: 'Voucher berhasil diperbarui!', data: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memperbarui voucher.' });
  }
});

apiRouter.delete('/admin/vouchers/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const ok = await db.deleteVoucher(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Voucher tidak ditemukan.' });
    await db.logAudit(req.user!.id, req.user!.name, 'DELETE_VOUCHER', req.params.id, {});
    return res.json({ success: true, message: 'Voucher berhasil dihapus.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menghapus voucher.' });
  }
});

// --- Admin Discounts ---
apiRouter.get('/admin/discounts', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const discounts = await db.getDiscounts();
    return res.json({ success: true, data: discounts });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat diskon.' });
  }
});

apiRouter.post('/admin/discounts', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const discount = await db.createDiscount(req.body);
    await db.logAudit(req.user!.id, req.user!.name, 'CREATE_DISCOUNT', discount.id, { name: discount.name });
    return res.status(201).json({ success: true, message: 'Diskon berhasil dibuat!', data: discount });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal membuat diskon.' });
  }
});

apiRouter.put('/admin/discounts/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await db.updateDiscount(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Diskon tidak ditemukan.' });
    await db.logAudit(req.user!.id, req.user!.name, 'UPDATE_DISCOUNT', req.params.id, { name: updated.name });
    return res.json({ success: true, message: 'Diskon berhasil diperbarui!', data: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memperbarui diskon.' });
  }
});

apiRouter.delete('/admin/discounts/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const ok = await db.deleteDiscount(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Diskon tidak ditemukan.' });
    await db.logAudit(req.user!.id, req.user!.name, 'DELETE_DISCOUNT', req.params.id, {});
    return res.json({ success: true, message: 'Diskon berhasil dihapus.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menghapus diskon.' });
  }
});

// --- Admin QRIS ---
apiRouter.get('/admin/qris', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const qris = await db.getQrisSettings();
    return res.json({ success: true, data: qris });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat QRIS.' });
  }
});

apiRouter.put('/admin/qris', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await db.updateQrisSettings(req.body);
    await db.logAudit(req.user!.id, req.user!.name, 'UPDATE_QRIS', updated.id, { is_active: updated.is_active });
    return res.json({ success: true, message: 'Pengaturan QRIS berhasil diperbarui!', data: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memperbarui QRIS.' });
  }
});

// --- Admin Theme ---
apiRouter.get('/admin/theme', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const theme = await db.getThemeSettings();
    return res.json({ success: true, data: theme });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat tema.' });
  }
});

apiRouter.put('/admin/theme', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await db.updateThemeSettings(req.body);
    await db.logAudit(req.user!.id, req.user!.name, 'UPDATE_THEME', updated.id, { mode: updated.theme_mode });
    return res.json({ success: true, message: 'Tema berhasil diperbarui!', data: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memperbarui tema.' });
  }
});

// --- Admin Store Settings & Branding ---
apiRouter.get('/admin/settings', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await db.getStoreSettings();
    return res.json({ success: true, data: settings });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat pengaturan toko.' });
  }
});

apiRouter.put('/admin/settings', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await db.updateStoreSettings(req.body);
    await db.logAudit(req.user!.id, req.user!.name, 'UPDATE_STORE_SETTINGS', updated.id, {
      store_name: updated.store_name,
    });
    return res.json({ success: true, message: 'Pengaturan toko berhasil diperbarui!', data: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memperbarui pengaturan toko.' });
  }
});

// --- Admin Email Management ---
apiRouter.get('/admin/email', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const status = isEmailConfigured();
    const logs = await db.getEmailLogs();
    return res.json({
      success: true,
      data: {
        is_configured: status.configured,
        provider: status.provider || 'Belum diisi',
        from_email: status.from,
        logs,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat log email.' });
  }
});

apiRouter.post('/admin/email/test', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { testEmail } = req.body;
    const adminEmail = await db.getAdminEmail();
    const recipient = testEmail?.trim() || req.user?.email || adminEmail;
    const status = isEmailConfigured();

    if (!status.configured) {
      await db.logEmail(
        recipient,
        'Test Email Vortex ID',
        'FAILED',
        'Email provider belum dikonfigurasi di environment variables.'
      );
      return res.status(400).json({
        success: false,
        error: 'Email belum dikonfigurasi. Harap isi EMAIL_PROVIDER dan EMAIL_API_KEY di file environment.',
      });
    }

    // Attempt test email sending via Resend API
    const sendRes = await sendTestEmail(recipient);
    return res.json({
      success: sendRes.success,
      status: sendRes.status,
      messageId: sendRes.messageId,
      recipient,
      error: sendRes.error,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal mengirim email tes.' });
  }
});

// --- Admin Analytics & Product Performance ---
apiRouter.get('/admin/analytics', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const summary = await db.getAnalyticsSummary();
    return res.json({ success: true, data: summary });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat analitik.' });
  }
});

apiRouter.get('/admin/performance', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const filter = (req.query.filter as any) || 'all';
    const performance = await db.getProductPerformance(filter);
    return res.json({ success: true, data: performance });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat performa produk.' });
  }
});

// --- Admin Ratings Moderation ---
apiRouter.get('/admin/ratings', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const productRatings = await db.getAllRatingsAdmin();
    const serviceRatings = await db.getServiceReviews(false);
    return res.json({
      success: true,
      data: {
        product_ratings: productRatings,
        service_reviews: serviceRatings,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat ulasan pelanggan.' });
  }
});

apiRouter.put('/admin/ratings/:id/visibility', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { is_hidden } = req.body;
    const ok = await db.toggleRatingVisibility(req.params.id, Boolean(is_hidden));
    if (!ok) return res.status(404).json({ error: 'Rating tidak ditemukan.' });
    await db.logAudit(req.user!.id, req.user!.name, 'MODERATE_RATING', req.params.id, { is_hidden });
    return res.json({ success: true, message: 'Status visibilitas rating berhasil diperbarui.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memperbarui rating.' });
  }
});

apiRouter.delete('/admin/ratings/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const ok = await db.deleteRating(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Rating tidak ditemukan.' });
    await db.logAudit(req.user!.id, req.user!.name, 'DELETE_RATING', req.params.id, {});
    return res.json({ success: true, message: 'Rating berhasil dihapus.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menghapus rating.' });
  }
});

// --- Admin Audit Log ---
apiRouter.get('/admin/audit-logs', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const logs = await db.getAuditLogs();
    return res.json({ success: true, data: logs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat log audit.' });
  }
});

// --- Admin Reset Data (High Security with Password + "RESET VORTEX" confirmation) ---
apiRouter.post('/admin/reset', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { confirmationText, password, category } = req.body;

    if (!confirmationText || confirmationText.trim() !== 'RESET VORTEX') {
      return res.status(400).json({
        error: 'Teks konfirmasi salah. Anda wajib mengetik "RESET VORTEX" untuk melanjutkan.',
      });
    }

    if (!password || !comparePassword(password, req.user!.password_hash)) {
      return res.status(401).json({
        error: 'Password Admin salah. Otentikasi gagal untuk tindakan reset data.',
      });
    }

    const adminUser = { id: req.user!.id, name: req.user!.name };

    if (category && category !== 'ALL') {
      const result = await db.resetCategory(category, adminUser);
      if (!result.success) return res.status(400).json({ error: result.message });
      return res.json({ success: true, message: result.message });
    } else {
      const result = await db.resetAllData(adminUser);
      return res.json({ success: true, message: result.message });
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Terjadi kesalahan sistem saat melakukan reset data.' });
  }
});
