import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
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
  VoucherUsage,
  Discount,
  Rating,
  ServiceReview,
  StoreSettings,
  ThemeSettings,
  QrisSettings,
  EmailLog,
  AuditLog,
  ProductView,
  AnalyticsSummary,
  ProductPerformance,
} from '../types/index.js';
import { isPostgresConfigured, initPostgres } from './pg.js';
import {
  pgGetUsers,
  pgFindUserById,
  pgFindUserByEmail,
  pgCreateUser,
  pgUpdateUser,
  pgGetCategories,
  pgGetProducts,
  pgFindProductById,
  pgCreateProduct,
  pgUpdateProduct,
  pgDeleteProduct,
  pgRecordProductView,
  pgGetOrders,
  pgFindOrderById,
  pgFindOrderByOrderNumber,
  pgFindInvoiceByNumber,
  pgCreateOrderCheckout,
  pgUpdateOrderStatus,
  pgCancelOrder,
  pgGetVouchers,
  pgFindVoucherByCode,
  pgValidateVoucher,
  pgCreateVoucher,
  pgUpdateVoucher,
  pgDeleteVoucher,
  pgGetDiscounts,
  pgCreateDiscount,
  pgDeleteDiscount,
  pgGetRatings,
  pgCreateRating,
  pgToggleRatingVisibility,
  pgDeleteRating,
  pgGetServiceReviews,
  pgCreateServiceReview,
  pgGetStoreSettings,
  pgUpdateStoreSettings,
  pgGetThemeSettings,
  pgUpdateThemeSettings,
  pgGetQrisSettings,
  pgUpdateQrisSettings,
  pgLogAudit,
  pgGetAuditLogs,
  pgLogEmail,
  pgGetEmailLogs,
  pgGetAnalyticsSummary,
  pgGetProductPerformance,
} from './pgQueries.js';

interface DatabaseSchema {
  users: User[];
  products: Product[];
  categories: Category[];
  orders: Order[];
  payments: Payment[];
  invoices: Invoice[];
  vouchers: Voucher[];
  voucher_usages: VoucherUsage[];
  discounts: Discount[];
  ratings: Rating[];
  service_reviews: ServiceReview[];
  store_settings: StoreSettings;
  theme_settings: ThemeSettings;
  qris_settings: QrisSettings;
  email_logs: EmailLog[];
  audit_logs: AuditLog[];
  product_views: ProductView[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'vortex_store.json');

class Database {
  private data: DatabaseSchema;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.data = this.getDefaultSchema();
  }

  private getDefaultSchema(): DatabaseSchema {
    const now = new Date().toISOString();
    return {
      users: [],
      products: [],
      categories: [
        { id: 'cat-mlbb', name: 'Mobile Legends', slug: 'mobile-legends', game: 'Mobile Legends', icon: 'Gamepad2' },
        { id: 'cat-ff', name: 'Free Fire', slug: 'free-fire', game: 'Free Fire', icon: 'Flame' },
        { id: 'cat-val', name: 'Valorant', slug: 'valorant', game: 'Valorant', icon: 'Crosshair' },
        { id: 'cat-genshin', name: 'Genshin Impact', slug: 'genshin-impact', game: 'Genshin Impact', icon: 'Sparkles' },
        { id: 'cat-pubg', name: 'PUBG Mobile', slug: 'pubg-mobile', game: 'PUBG Mobile', icon: 'Shield' },
        { id: 'cat-roblox', name: 'Roblox', slug: 'roblox', game: 'Roblox', icon: 'Box' },
      ],
      orders: [],
      payments: [],
      invoices: [],
      vouchers: [
        {
          id: 'vouch-1',
          code: 'VORTEX10',
          discount_type: 'PERCENTAGE',
          discount_value: 10,
          min_purchase: 100000,
          max_discount: 50000,
          usage_limit: 100,
          used_count: 0,
          per_user_limit: 1,
          valid_from: '2025-01-01T00:00:00.000Z',
          valid_until: '2030-12-31T23:59:59.000Z',
          is_active: true,
          created_at: now,
        },
        {
          id: 'vouch-2',
          code: 'VORTEXNEW',
          discount_type: 'FIXED',
          discount_value: 25000,
          min_purchase: 150000,
          max_discount: 25000,
          usage_limit: 200,
          used_count: 0,
          per_user_limit: 1,
          valid_from: '2025-01-01T00:00:00.000Z',
          valid_until: '2030-12-31T23:59:59.000Z',
          is_active: true,
          created_at: now,
        },
      ],
      voucher_usages: [],
      discounts: [
        {
          id: 'disc-1',
          name: 'Promo Grand Opening 5%',
          discount_type: 'PERCENTAGE',
          discount_value: 5,
          min_purchase: 50000,
          max_discount: 30000,
          target_type: 'ALL',
          start_date: '2025-01-01T00:00:00.000Z',
          end_date: '2030-12-31T23:59:59.000Z',
          is_active: true,
        },
      ],
      ratings: [],
      service_reviews: [],
      store_settings: {
        id: 'store-settings-1',
        store_name: 'Vortex ID',
        tagline: 'Beli Aman, Main Nyaman.',
        phone: '085819822250',
        whatsapp_number: '085819822250',
        whatsapp_link_number: '6285819822250',
        whatsapp_default_message: 'Halo Vortex ID, saya ingin bertanya mengenai produk.',
        logo_url: '',
        favicon_url: '',
        terms_conditions: `1. Seluruh transaksi jual beli akun gaming di Vortex ID tunduk pada ketentuan hukum yang berlaku serta persetujuan kedua belah pihak.
2. Vortex ID menjamin keabsahan dan keaslian data akun sesuai dengan deskripsi spesifikasi produk.
3. Pembeli wajib melakukan pengecekan dan penggantian data keamanan akun (email, password, 2FA) maksimal 1x24 jam setelah data akun diserahkan.
4. Garansi anti-hackback berlaku sesuai masa garansi toko (30 hari garansi penuh atau uang kembali sesuai kebijakan garansi).
5. Pembeli setuju untuk tidak menyalahgunakan akun yang dibeli untuk aktivitas ilegal, cheat, atau modifikasi ilegal.`,
        refund_policy: `1. Refund dana 100% diproses jika akun tidak sesuai dengan deskripsi dan belum diubah datanya oleh pembeli.
2. Pengajuan refund wajib menyertakan bukti screenshot/video unboxing akun tanpa jeda.
3. Proses klaim garansi atau refund diproses maksimal 1x24 jam oleh tim admin Vortex ID.`,
        cancellation_policy: `1. Pesanan yang berstatus PENDING dapat dibatalkan sewaktu-waktu sebelum pembayaran diverifikasi.
2. Pesanan yang sudah berstatus PAID atau COMPLETED hanya dapat dibatalkan melalui persetujuan admin setelah evaluasi teknis.`,
        gaming_disclaimer: `PEMBERITAHUAN PENTING:
Setiap game dan platform memiliki Syarat & Ketentuan (Terms of Service) tersendiri terkait kepemilikan dan pengalihan akun. Vortex ID bertindak sebagai fasilitator perantara verifikasi data demi keamanan kedua belah pihak. Pengguna disarankan membaca dan memahami kebijakan pengembang game masing-masing sebelum bertransaksi.`,
        updated_at: now,
      },
      theme_settings: {
        id: 'theme-settings-1',
        theme_mode: 'DARK',
        primary_color: '#00f0ff',
        secondary_color: '#3b82f6',
        background_color: '#080c14',
        text_color: '#f8fafc',
        button_color: '#00f0ff',
        accent_color: '#06b6d4',
        banner_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
        banner_title: 'MARKETPLACE AKUN GAMING TERPERCAYA',
        banner_subtitle: 'Beli Aman, Main Nyaman. Transaksi Instan, Garansi Penuh, & Verifikasi Data 100%.',
        updated_at: now,
      },
      qris_settings: {
        id: 'qris-settings-1',
        is_active: true,
        image_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126590013ID.VORTEX.WWW0118936009110858198222505204581253033605802ID5909VORTEX%20ID6007JAKARTA61051294062070703A016304E1F8',
        account_name: 'VORTEX ID - OFFICIAL STORE',
        nmid: 'ID10202619822250',
        updated_at: now,
      },
      email_logs: [],
      audit_logs: [],
      product_views: [],
    };
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const isProduction = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || process.env.NODE_ENV === 'production';

      // Production must use the shared PostgreSQL database. Never fall back to
      // the local JSON filesystem database in Vercel/production.
      if (isProduction && !isPostgresConfigured) {
        throw new Error(
          '[Database] DATABASE_URL is required in production. Local JSON storage is disabled in production.'
        );
      }

      if (isPostgresConfigured) {
        try {
          await initPostgres();
          this.isInitialized = true;
          return;
        } catch (err) {
          console.error('[PostgreSQL] Connection failed:', err);
          // Never silently fall back to local storage when PostgreSQL is configured.
          throw err;
        }
      }

      if (this.isInitialized) return;

      // Local development fallback only (never used in production)
      if (fs.existsSync(DB_FILE)) {
        try {
          const raw = fs.readFileSync(DB_FILE, 'utf-8');
          const parsed = JSON.parse(raw);
          this.data = {
            ...this.getDefaultSchema(),
            ...parsed,
            store_settings: {
              ...this.getDefaultSchema().store_settings,
              ...(parsed.store_settings || {}),
            },
            theme_settings: {
              ...this.getDefaultSchema().theme_settings,
              ...(parsed.theme_settings || {}),
            },
            qris_settings: {
              ...this.getDefaultSchema().qris_settings,
              ...(parsed.qris_settings || {}),
            },
          };
        } catch (err) {
          console.error('Error reading local file database:', err);
        }
      }

      // Optional local-development admin seed. Keep the password outside source code.
      const adminExists = this.data.users.some((u) => u.role === 'ADMIN');
      const localAdminPassword = process.env.LOCAL_ADMIN_PASSWORD?.trim();

      if (!adminExists && localAdminPassword) {
        const adminPassHash = bcrypt.hashSync(localAdminPassword, 10);
        this.data.users.push({
          id: 'usr-admin-01',
          name: 'Super Admin Vortex',
          email: 'admin@vortex.id',
          password_hash: adminPassHash,
          phone: '085819822250',
          role: 'ADMIN',
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else if (!adminExists) {
        console.warn(
          '[Database] LOCAL_ADMIN_PASSWORD is not set; skipping local development admin seed.'
        );
      }

      this.isInitialized = true;
    })();

    try {
      await this.initPromise;
    } catch (err) {
      this.initPromise = null;
      throw err;
    }
  }

  // --- Audit Logging ---
  public async logAudit(
    adminId: string,
    adminName: string,
    action: string,
    target: string,
    metadata?: Record<string, any>
  ): Promise<AuditLog> {
    if (isPostgresConfigured) {
      return await pgLogAudit(adminId, adminName, action, target, metadata);
    }
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      admin_id: adminId,
      admin_name: adminName,
      action,
      target,
      metadata,
      created_at: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(log);
    return log;
  }

  // --- User Operations ---
  public async getUsers(): Promise<User[]> {
    if (isPostgresConfigured) return await pgGetUsers();
    return this.data.users;
  }

  public async findUserById(id: string): Promise<User | null> {
    if (isPostgresConfigured) return await pgFindUserById(id);
    return this.data.users.find((u) => u.id === id) || null;
  }

  public async findUserByEmail(email: string): Promise<User | null> {
    if (isPostgresConfigured) return await pgFindUserByEmail(email);
    const norm = email.toLowerCase().trim();
    return (
      this.data.users.find(
        (u) =>
          u.email.toLowerCase() === norm ||
          (u.role === 'ADMIN' &&
            (norm === 'admin@vortex.id' ||
              norm === 'nocturnalengine08@gmail.com' ||
              norm === 'urbanharvest25@gmail.com'))
      ) || null
    );
  }

  public async getAdminEmail(): Promise<string> {
    if (isPostgresConfigured) {
      const users = await pgGetUsers();
      const admin = users.find((u) => u.role === 'ADMIN');
      return admin?.email || process.env.ADMIN_EMAIL || 'nocturnalengine08@gmail.com';
    }
    const admin = this.data.users.find((u) => u.role === 'ADMIN');
    return admin?.email || process.env.ADMIN_EMAIL || 'nocturnalengine08@gmail.com';
  }

  public async createUser(
    user: Omit<User, 'id' | 'created_at' | 'updated_at'>
  ): Promise<User> {
    if (isPostgresConfigured) return await pgCreateUser(user);
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    return newUser;
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (isPostgresConfigured) return await pgUpdateUser(id, updates);
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.data.users[idx];
  }

  // --- Category Operations ---
  public async getCategories(): Promise<Category[]> {
    if (isPostgresConfigured) return await pgGetCategories();
    return this.data.categories;
  }

  // --- Product Operations ---
  public async getProducts(options?: {
    search?: string;
    game?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    includeArchived?: boolean;
    sortBy?: 'price_asc' | 'price_desc' | 'latest' | 'rating' | 'popular';
  }): Promise<Product[]> {
    if (isPostgresConfigured) return await pgGetProducts(options);
    let list = [...this.data.products];
    if (!options?.includeArchived) {
      list = list.filter((p) => !p.is_archived && p.status !== 'ARCHIVED');
    }
    if (options?.inStockOnly) {
      list = list.filter((p) => p.stock > 0 && p.status === 'AVAILABLE');
    }
    if (options?.game) {
      list = list.filter((p) => p.game.toLowerCase() === options.game!.toLowerCase());
    }
    if (options?.category) {
      list = list.filter((p) => p.category === options.category);
    }
    if (options?.minPrice !== undefined) {
      list = list.filter((p) => (p.discount_price ?? p.price) >= options.minPrice!);
    }
    if (options?.maxPrice !== undefined) {
      list = list.filter((p) => (p.discount_price ?? p.price) <= options.maxPrice!);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.game.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.rank && p.rank.toLowerCase().includes(q))
      );
    }
    if (options?.sortBy === 'price_asc') {
      list.sort((a, b) => (a.discount_price ?? a.price) - (b.discount_price ?? b.price));
    } else if (options?.sortBy === 'price_desc') {
      list.sort((a, b) => (b.discount_price ?? b.price) - (a.discount_price ?? a.price));
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }

  public async findProductById(id: string): Promise<Product | null> {
    if (isPostgresConfigured) return await pgFindProductById(id);
    return this.data.products.find((p) => p.id === id) || null;
  }

  public async recordProductView(productId: string): Promise<void> {
    if (isPostgresConfigured) return await pgRecordProductView(productId);
    this.data.product_views.push({
      id: `pv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      product_id: productId,
      viewed_at: new Date().toISOString(),
    });
  }

  public async createProduct(
    data: Omit<Product, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Product> {
    if (isPostgresConfigured) return await pgCreateProduct(data);
    const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    };
    this.data.products.unshift(newProduct);
    return newProduct;
  }

  public async updateProduct(
    id: string,
    updates: Partial<Product>
  ): Promise<Product | null> {
    if (isPostgresConfigured) return await pgUpdateProduct(id, updates);
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.data.products[idx];
  }

  public async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    if (isPostgresConfigured) return await pgDeleteProduct(id);
    const prod = this.data.products.find((p) => p.id === id);
    if (!prod) return { success: false, message: 'Produk tidak ditemukan.' };
    prod.is_archived = true;
    prod.status = 'ARCHIVED';
    return { success: true, message: 'Produk berhasil diarsipkan.' };
  }

  // --- Voucher Operations ---
  public async getVouchers(): Promise<Voucher[]> {
    if (isPostgresConfigured) return await pgGetVouchers();
    return this.data.vouchers;
  }

  public async findVoucherByCode(code: string): Promise<Voucher | null> {
    if (isPostgresConfigured) return await pgFindVoucherByCode(code);
    const norm = code.toUpperCase().trim();
    return this.data.vouchers.find((v) => v.code.toUpperCase() === norm) || null;
  }

  public async validateVoucher(
    code: string,
    userId?: string,
    subtotal: number = 0,
    categoryId?: string,
    game?: string
  ) {
    if (isPostgresConfigured) {
      return await pgValidateVoucher(code, userId, subtotal, categoryId, game);
    }
    const v = await this.findVoucherByCode(code);
    if (!v) return { valid: false, message: 'Kode voucher tidak valid atau tidak ditemukan.' };
    if (!v.is_active) return { valid: false, message: 'Voucher sudah tidak aktif.' };
    const now = new Date().getTime();
    if (now < new Date(v.valid_from).getTime() || now > new Date(v.valid_until).getTime()) {
      return { valid: false, message: 'Voucher telah kedaluwarsa atau belum berlaku.' };
    }
    if (v.used_count >= v.usage_limit) {
      return { valid: false, message: 'Batas kuota penggunaan voucher telah habis.' };
    }
    if (subtotal < v.min_purchase) {
      return { valid: false, message: `Minimal belanja Rp${v.min_purchase.toLocaleString('id-ID')}.` };
    }
    let discountAmount = 0;
    if (v.discount_type === 'PERCENTAGE') {
      const rawDisc = (subtotal * v.discount_value) / 100;
      discountAmount = v.max_discount ? Math.min(rawDisc, v.max_discount) : rawDisc;
    } else {
      discountAmount = Math.min(v.discount_value, subtotal);
    }
    return {
      valid: true,
      message: 'Voucher berhasil diterapkan!',
      voucher: v,
      discountAmount,
      finalTotal: Math.max(0, subtotal - discountAmount),
    };
  }

  public async createVoucher(data: Omit<Voucher, 'id' | 'used_count' | 'created_at'>): Promise<Voucher> {
    if (isPostgresConfigured) return await pgCreateVoucher(data);
    const id = `vouch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newV: Voucher = { ...data, id, used_count: 0, created_at: new Date().toISOString() };
    this.data.vouchers.push(newV);
    return newV;
  }

  public async updateVoucher(id: string, updates: Partial<Voucher>): Promise<Voucher | null> {
    if (isPostgresConfigured) return await pgUpdateVoucher(id, updates);
    const idx = this.data.vouchers.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    this.data.vouchers[idx] = { ...this.data.vouchers[idx], ...updates };
    return this.data.vouchers[idx];
  }

  public async deleteVoucher(id: string): Promise<boolean> {
    if (isPostgresConfigured) return await pgDeleteVoucher(id);
    const idx = this.data.vouchers.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    this.data.vouchers.splice(idx, 1);
    return true;
  }

  // --- Discount Operations ---
  public async getDiscounts(): Promise<Discount[]> {
    if (isPostgresConfigured) return await pgGetDiscounts();
    return this.data.discounts;
  }

  public async createDiscount(data: Omit<Discount, 'id'>): Promise<Discount> {
    if (isPostgresConfigured) return await pgCreateDiscount(data);
    const id = `disc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const d: Discount = { ...data, id };
    this.data.discounts.push(d);
    return d;
  }

  public async updateDiscount(id: string, updates: Partial<Discount>): Promise<Discount | null> {
    const idx = this.data.discounts.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    this.data.discounts[idx] = { ...this.data.discounts[idx], ...updates };
    return this.data.discounts[idx];
  }

  public async deleteDiscount(id: string): Promise<boolean> {
    if (isPostgresConfigured) return await pgDeleteDiscount(id);
    const idx = this.data.discounts.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    this.data.discounts.splice(idx, 1);
    return true;
  }

  // --- Order Operations ---
  public async getOrders(userId?: string): Promise<Order[]> {
    if (isPostgresConfigured) return await pgGetOrders(userId);
    if (userId) return this.data.orders.filter((o) => o.user_id === userId);
    return this.data.orders;
  }

  public async getUserOrders(userId: string): Promise<Order[]> {
    return await this.getOrders(userId);
  }

  public async findOrderById(id: string): Promise<Order | null> {
    if (isPostgresConfigured) return await pgFindOrderById(id);
    return this.data.orders.find((o) => o.id === id) || null;
  }

  public async findOrderByOrderNumber(orderNumber: string): Promise<Order | null> {
    if (isPostgresConfigured) return await pgFindOrderByOrderNumber(orderNumber);
    return this.data.orders.find((o) => o.order_number === orderNumber) || null;
  }

  public async findInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    if (isPostgresConfigured) return await pgFindInvoiceByNumber(invoiceNumber);
    return this.data.invoices.find((inv) => inv.invoice_number === invoiceNumber) || null;
  }

  public async createOrderCheckout(params: {
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
    if (isPostgresConfigured) {
      return await pgCreateOrderCheckout(params);
    }
    // Local dev fallback
    let subtotal = 0;
    const orderItems: OrderItem[] = [];
    for (const it of params.items) {
      const prod = this.data.products.find((p) => p.id === it.productId);
      if (!prod) return { success: false, error: `Produk dengan ID ${it.productId} tidak ditemukan.` };
      const price = prod.discount_price ?? prod.price;
      subtotal += price * it.quantity;
      orderItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        order_id: '',
        product_id: prod.id,
        product_name: prod.name,
        product_game: prod.game,
        price,
        quantity: it.quantity,
        product_image: prod.images?.[0]?.url,
      });
    }
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `VTX-${Date.now().toString().slice(-6)}${randomSuffix}`;
    const invoiceNumber = `INV/VTX/${Date.now().toString().slice(-6)}/${randomSuffix}`;
    const now = new Date().toISOString();

    const order: Order = {
      id: orderId,
      order_number: orderNumber,
      invoice_number: invoiceNumber,
      user_id: params.userId,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      subtotal,
      discount_amount: 0,
      voucher_amount: 0,
      total: subtotal,
      payment_method: params.paymentMethod,
      payment_status: 'UNPAID',
      order_status: 'PENDING',
      notes: params.notes,
      created_at: now,
      updated_at: now,
      items: orderItems,
    };
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoice_number: invoiceNumber,
      order_id: orderId,
      user_id: params.userId,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      subtotal,
      discount_amount: 0,
      voucher_amount: 0,
      total: subtotal,
      payment_method: params.paymentMethod,
      order_status: 'PENDING',
      payment_status: 'UNPAID',
      items: orderItems,
      created_at: now,
    };
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      order_id: orderId,
      method: params.paymentMethod,
      amount: subtotal,
      status: 'UNPAID',
      created_at: now,
    };
    this.data.orders.unshift(order);
    this.data.invoices.unshift(invoice);
    this.data.payments.unshift(payment);
    return { success: true, order, invoice, payment };
  }

  public async updateOrderStatus(
    orderId: string,
    orderStatus: Order['order_status'],
    paymentStatus?: Order['payment_status']
  ): Promise<Order | null> {
    if (isPostgresConfigured) {
      return await pgUpdateOrderStatus(orderId, orderStatus, paymentStatus);
    }
    const idx = this.data.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return null;
    this.data.orders[idx].order_status = orderStatus;
    if (paymentStatus) this.data.orders[idx].payment_status = paymentStatus;
    return this.data.orders[idx];
  }

  public async cancelOrder(
    orderId: string,
    reason: string,
    cancelledBy: string
  ): Promise<{ success: boolean; error?: string; order?: Order }> {
    if (isPostgresConfigured) {
      return await pgCancelOrder(orderId, reason, cancelledBy);
    }
    const o = this.data.orders.find((ord) => ord.id === orderId);
    if (!o) return { success: false, error: 'Pesanan tidak ditemukan.' };
    o.order_status = 'CANCELLED';
    o.payment_status = 'FAILED';
    o.cancellation_reason = reason;
    o.cancelled_by = cancelledBy;
    return { success: true, order: o };
  }

  // --- Ratings & Reviews ---
  public async getRatings(productId?: string): Promise<Rating[]> {
    if (isPostgresConfigured) return await pgGetRatings(productId);
    if (productId) return this.data.ratings.filter((r) => r.product_id === productId);
    return this.data.ratings;
  }

  public async getAllRatingsAdmin(): Promise<Rating[]> {
    return await this.getRatings();
  }

  public async createRating(params: {
    productId: string;
    userId: string;
    orderId: string;
    userName: string;
    rating: number;
    review: string;
  }): Promise<Rating> {
    if (isPostgresConfigured) return await pgCreateRating(params);
    const r: Rating = {
      id: `rat-${Date.now()}`,
      product_id: params.productId,
      user_id: params.userId,
      order_id: params.orderId,
      user_name: params.userName,
      rating: params.rating,
      review: params.review,
      is_hidden: false,
      created_at: new Date().toISOString(),
    };
    this.data.ratings.unshift(r);
    return r;
  }

  public async toggleRatingVisibility(ratingId: string, isHidden: boolean): Promise<boolean> {
    if (isPostgresConfigured) return await pgToggleRatingVisibility(ratingId, isHidden);
    const r = this.data.ratings.find((rat) => rat.id === ratingId);
    if (!r) return false;
    r.is_hidden = isHidden;
    return true;
  }

  public async deleteRating(ratingId: string): Promise<boolean> {
    if (isPostgresConfigured) return await pgDeleteRating(ratingId);
    const idx = this.data.ratings.findIndex((r) => r.id === ratingId);
    if (idx === -1) return false;
    this.data.ratings.splice(idx, 1);
    return true;
  }

  public async getServiceReviews(publicOnly = true): Promise<ServiceReview[]> {
    if (isPostgresConfigured) return await pgGetServiceReviews(publicOnly);
    if (publicOnly) return this.data.service_reviews.filter((sr) => !sr.is_hidden);
    return this.data.service_reviews;
  }

  public async createServiceReview(params: {
    userId: string;
    orderId: string;
    userName: string;
    rating: number;
    comment: string;
  }): Promise<ServiceReview> {
    if (isPostgresConfigured) return await pgCreateServiceReview(params);
    const sr: ServiceReview = {
      id: `sr-${Date.now()}`,
      user_id: params.userId,
      order_id: params.orderId,
      user_name: params.userName,
      rating: params.rating,
      comment: params.comment,
      is_hidden: false,
      created_at: new Date().toISOString(),
    };
    this.data.service_reviews.unshift(sr);
    return sr;
  }

  // --- Settings ---
  public async getStoreSettings(): Promise<StoreSettings> {
    if (isPostgresConfigured) return await pgGetStoreSettings();
    return this.data.store_settings;
  }

  public async updateStoreSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    if (isPostgresConfigured) return await pgUpdateStoreSettings(updates);
    this.data.store_settings = {
      ...this.data.store_settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.data.store_settings;
  }

  public async getThemeSettings(): Promise<ThemeSettings> {
    if (isPostgresConfigured) return await pgGetThemeSettings();
    return this.data.theme_settings;
  }

  public async updateThemeSettings(updates: Partial<ThemeSettings>): Promise<ThemeSettings> {
    if (isPostgresConfigured) return await pgUpdateThemeSettings(updates);
    this.data.theme_settings = {
      ...this.data.theme_settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.data.theme_settings;
  }

  public async getQrisSettings(): Promise<QrisSettings> {
    if (isPostgresConfigured) return await pgGetQrisSettings();
    return this.data.qris_settings;
  }

  public async updateQrisSettings(updates: Partial<QrisSettings>): Promise<QrisSettings> {
    if (isPostgresConfigured) return await pgUpdateQrisSettings(updates);
    this.data.qris_settings = {
      ...this.data.qris_settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.data.qris_settings;
  }

  // --- Logs & Analytics ---
  public async getEmailLogs(): Promise<EmailLog[]> {
    if (isPostgresConfigured) return await pgGetEmailLogs();
    return this.data.email_logs;
  }

  public async logEmail(
    recipient: string,
    subject: string,
    status: EmailLog['status'],
    errorMessage?: string,
    orderId?: string
  ): Promise<EmailLog> {
    if (isPostgresConfigured) {
      return await pgLogEmail(recipient, subject, status, errorMessage, orderId);
    }
    const log: EmailLog = {
      id: `eml-${Date.now()}`,
      recipient,
      subject,
      status,
      error_message: errorMessage,
      order_id: orderId,
      created_at: new Date().toISOString(),
    };
    this.data.email_logs.unshift(log);
    return log;
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    if (isPostgresConfigured) return await pgGetAuditLogs();
    return this.data.audit_logs;
  }

  public async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    if (isPostgresConfigured) return await pgGetAnalyticsSummary();
    const total_revenue = this.data.orders
      .filter((o) => o.payment_status === 'PAID' || o.order_status === 'COMPLETED')
      .reduce((sum, o) => sum + o.total, 0);
    return {
      total_products: this.data.products.length,
      active_products: this.data.products.filter((p) => p.status === 'AVAILABLE' && !p.is_archived).length,
      out_of_stock_products: this.data.products.filter((p) => p.stock <= 0).length,
      total_customers: this.data.users.filter((u) => u.role === 'CUSTOMER').length,
      total_transactions: this.data.orders.length,
      completed_transactions: this.data.orders.filter((o) => o.order_status === 'COMPLETED').length,
      pending_transactions: this.data.orders.filter((o) => o.order_status === 'PENDING').length,
      cancelled_transactions: this.data.orders.filter((o) => o.order_status === 'CANCELLED').length,
      total_revenue,
      revenue_today: 0,
      revenue_this_month: total_revenue,
      total_vouchers_used: this.data.voucher_usages.length,
      total_discount_given: 0,
      total_ratings: this.data.ratings.length,
      average_store_rating: 5,
      average_service_rating: 5,
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

  public async getProductPerformance(
    filter: 'today' | '7days' | '30days' | 'month' | 'all' = 'all'
  ): Promise<ProductPerformance[]> {
    if (isPostgresConfigured) return await pgGetProductPerformance(filter);
    return [];
  }

  public async resetCategory(
    category: string,
    adminUser: { id: string; name: string }
  ) {
    if (isPostgresConfigured) {
      const { pool } = await import('./pg.js');
      await pool.query('DELETE FROM products WHERE category = $1', [category]);
      await pgLogAudit(adminUser.id, adminUser.name, 'RESET_CATEGORY', category);
      return { success: true, message: `Kategori ${category} berhasil di-reset.` };
    }
    this.data.products = this.data.products.filter((p) => p.category !== category);
    return { success: true, message: `Kategori ${category} berhasil di-reset.` };
  }

  public async resetAllData(adminUser: { id: string; name: string }) {
    if (isPostgresConfigured) {
      const { pool } = await import('./pg.js');
      await pool.query('DELETE FROM orders');
      await pool.query('DELETE FROM order_items');
      await pool.query('DELETE FROM payments');
      await pool.query('DELETE FROM invoices');
      await pool.query('DELETE FROM voucher_usages');
      await pool.query('DELETE FROM product_views');
      await pool.query('DELETE FROM ratings');
      await pool.query('DELETE FROM service_reviews');
      await pgLogAudit(adminUser.id, adminUser.name, 'RESET_ALL_DATA', 'STORE');
      return { success: true, message: 'Seluruh data transaksi berhasil di-reset.' };
    }
    this.data.orders = [];
    this.data.invoices = [];
    this.data.payments = [];
    this.data.voucher_usages = [];
    this.data.product_views = [];
    this.data.ratings = [];
    this.data.service_reviews = [];
    return { success: true, message: 'Seluruh data transaksi berhasil di-reset.' };
  }
}

export const db = new Database();
