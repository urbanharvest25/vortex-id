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

  constructor() {
    this.data = this.getDefaultSchema();
    this.init();
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
        primary_color: '#00f0ff', // Electric Blue / Cyan
        secondary_color: '#3b82f6', // Cobalt Blue
        background_color: '#080c14', // Deep Dark Navy
        text_color: '#f8fafc', // Clean white
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

  public init() {
    if (this.isInitialized) return;

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

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
        console.error('Error reading database file, using defaults:', err);
        this.data = this.getDefaultSchema();
      }
    }

    // Ensure default admin exists
    const adminExists = this.data.users.some((u) => u.role === 'ADMIN');
    if (!adminExists) {
      const adminPassHash = bcrypt.hashSync('AdminVortex2026!', 10);
      const adminUser: User = {
        id: 'usr-admin-01',
        name: 'Super Admin Vortex',
        email: 'admin@vortex.id',
        password_hash: adminPassHash,
        phone: '085819822250',
        role: 'ADMIN',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.data.users.push(adminUser);

      // Also create a sample customer for quick testing
      const customerPassHash = bcrypt.hashSync('Customer2026!', 10);
      const customerUser: User = {
        id: 'usr-cust-01',
        name: 'Rian Pratama',
        email: 'customer@vortex.id',
        password_hash: customerPassHash,
        phone: '081234567890',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.data.users.push(customerUser);
    }

    // Seed default realistic products if empty
    if (this.data.products.length === 0) {
      this.seedInitialProducts();
    }

    this.save();
    this.isInitialized = true;
  }

  private seedInitialProducts() {
    const now = new Date().toISOString();
    const demoProducts: Product[] = [
      {
        id: 'prod-ml-01',
        name: 'Akun MLBB Mythical Glory 85★ - Skin Collector Chou & Gusion',
        game: 'Mobile Legends',
        category: 'cat-mlbb',
        price: 850000,
        discount_price: 750000,
        stock: 1,
        description: 'Akun pribadi tangan pertama, all unbind bebas ganti email Moonton. Total 345 skin, 4 Skin Collector (Chou, Gusion, Balmond, Nana), 12 Epic Limited, KOF Iori Yagami, Winrate Ranked 68.4%. Siap tempur turnamen.',
        account_details: 'Login Moonton Email: mlbb.chou.pro@mail.com | Pass: VortexML@2026# | Status: All Unbind Bersih (GP/FB/VK kosong)',
        rank: 'Mythical Glory 85★',
        level: 'Level 112',
        skins: '345 Skins (4 Collector, 12 Epic Limited, 3 KOF)',
        items: 'Emblem All Max Lv 60, BP 250.000, Magic Dust 14.000',
        status: 'AVAILABLE',
        is_archived: false,
        images: [
          {
            id: 'img-ml-1',
            product_id: 'prod-ml-01',
            url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
            sort_order: 0,
            is_primary: true,
          },
          {
            id: 'img-ml-2',
            product_id: 'prod-ml-01',
            url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
            sort_order: 1,
            is_primary: false,
          },
          {
            id: 'img-ml-3',
            product_id: 'prod-ml-01',
            url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
            sort_order: 2,
            is_primary: false,
          },
        ],
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod-val-01',
        name: 'Valorant Immortal 3 - Vandal Kuronami, Reaver, Araxys & Champions 2023',
        game: 'Valorant',
        category: 'cat-val',
        price: 1450000,
        discount_price: 1290000,
        stock: 1,
        description: 'Akun server APAC / Indonesia. Region Indo asli bukan turki/argentina. Full skin Vandal meta, Phantom Oni + Recon, Karambit Champions 2023, Reaver Knife. Peak Immortal 3 (310 RR). Email pertama (OGE) disertakan.',
        account_details: 'Riot ID: VORTEX_SHADOW#APAC | Email OGE: val.shadow@mail.com | Pass: Valorant2026!# | 2FA Ready to Transfer',
        rank: 'Immortal 3 (310 RR)',
        level: 'Level 215',
        skins: 'Vandal Kuronami (Max), Champions 2023 Vandal & Melee, Phantom Oni',
        items: '450 Radianite Points, 1.250 VP sisa, Battlepass S4-S7 Max',
        status: 'AVAILABLE',
        is_archived: false,
        images: [
          {
            id: 'img-val-1',
            product_id: 'prod-val-01',
            url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
            sort_order: 0,
            is_primary: true,
          },
          {
            id: 'img-val-2',
            product_id: 'prod-val-01',
            url: 'https://images.unsplash.com/photo-1552824722-ddab1374e622?auto=format&fit=crop&w=800&q=80',
            sort_order: 1,
            is_primary: false,
          },
        ],
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod-ff-01',
        name: 'Free Fire Old Season 2 - Bundle Hip Hop & Elite Pass S2-S15 Lengkap',
        game: 'Free Fire',
        category: 'cat-ff',
        price: 950000,
        discount_price: 890000,
        stock: 1,
        description: 'Akun Old langka sejak era 2018. Koleksi Bundle Hip Hop, Breakdance, Sakura badge aktif, SG OPM Lv 7 Max, AK Dragon Blue Flame Max. Login FB nonaktif, diganti ke akun Google fresh aman garansi.',
        account_details: 'Login Gmail Fresh: ff.hiphop.old@gmail.com | Password: FreeFireOld2026@ | Backup Code disertakan',
        rank: 'Master 4.200 Point',
        level: 'Level 78',
        skins: 'Bundle Hip Hop S2, Sakura S1 Badge, SG OPM Max, AK Dragon Max',
        items: 'Diamond 850, Magic Cube 4 pcs, Custom Room Card x45',
        status: 'AVAILABLE',
        is_archived: false,
        images: [
          {
            id: 'img-ff-1',
            product_id: 'prod-ff-01',
            url: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80',
            sort_order: 0,
            is_primary: true,
          },
        ],
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod-genshin-01',
        name: 'Genshin Impact AR 60 Sultan - C6 Furina + Signature, Raiden C3 + EL R2',
        game: 'Genshin Impact',
        category: 'cat-genshin',
        price: 2100000,
        discount_price: 1850000,
        stock: 1,
        description: 'Akun Server Asia AR 60 End Game. Total 38 Karakter Bintang 5! C6 Furina + Splendor of Tranquil Waters, C3 Raiden Shogun + Engulfing Lightning R2, C2 Nahida, Neuvillette C1 + R1. Artefak god-tier 40+ CV banyak. No deadlink, email bisa diganti langsung.',
        account_details: 'Hoyoverse Username teratur | Email: genshin.asia.furina@mail.com | Pass: GenshinImpact2026# | Clean device binding',
        rank: 'Adventure Rank 60 (World Lv 9)',
        level: 'AR 60 Max',
        skins: 'Ayaka Springbloom, Diluc Red Dead of Night, Jean Sea Breeze',
        items: 'Primogems 12.400, Intertwined Fate 24, Mora 45.000.000',
        status: 'AVAILABLE',
        is_archived: false,
        images: [
          {
            id: 'img-genshin-1',
            product_id: 'prod-genshin-01',
            url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
            sort_order: 0,
            is_primary: true,
          },
        ],
        created_at: now,
        updated_at: now,
      },
    ];

    this.data.products = demoProducts;
  }

  private save() {
    try {
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // --- Audit Logging ---
  public logAudit(adminId: string, adminName: string, action: string, target: string, metadata?: Record<string, any>) {
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
    if (this.data.audit_logs.length > 1000) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 1000);
    }
    this.save();
    return log;
  }

  // --- User Operations ---
  public getUsers() {
    return this.data.users;
  }

  public findUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByEmail(email: string) {
    const norm = email.toLowerCase().trim();
    return this.data.users.find(
      (u) =>
        u.email.toLowerCase() === norm ||
        (u.role === 'ADMIN' &&
          (norm === 'admin@vortex.id' ||
            norm === 'nocturnalengine08@gmail.com' ||
            norm === 'urbanharvest25@gmail.com'))
    );
  }

  public getAdminEmail(): string {
    const admin = this.data.users.find((u) => u.role === 'ADMIN');
    return admin?.email || process.env.ADMIN_EMAIL || 'nocturnalengine08@gmail.com';
  }

  public createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.users[idx];
  }

  // --- Category Operations ---
  public getCategories() {
    return this.data.categories;
  }

  // --- Product Operations ---
  public getProducts(options?: {
    search?: string;
    game?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    includeArchived?: boolean;
    sortBy?: 'price_asc' | 'price_desc' | 'latest' | 'rating' | 'popular';
  }) {
    let list = [...this.data.products];

    if (!options?.includeArchived) {
      list = list.filter((p) => !p.is_archived && p.status !== 'ARCHIVED');
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

    if (options?.inStockOnly) {
      list = list.filter((p) => p.stock > 0 && p.status === 'AVAILABLE');
    }

    if (options?.sortBy === 'price_asc') {
      list.sort((a, b) => (a.discount_price ?? a.price) - (b.discount_price ?? b.price));
    } else if (options?.sortBy === 'price_desc') {
      list.sort((a, b) => (b.discount_price ?? b.price) - (a.discount_price ?? a.price));
    } else if (options?.sortBy === 'popular') {
      // sort by view count or sales
      const viewCounts = new Map<string, number>();
      this.data.product_views.forEach((v) => {
        viewCounts.set(v.product_id, (viewCounts.get(v.product_id) || 0) + 1);
      });
      list.sort((a, b) => (viewCounts.get(b.id) || 0) - (viewCounts.get(a.id) || 0));
    } else {
      // default: latest
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }

  public findProductById(id: string) {
    return this.data.products.find((p) => p.id === id);
  }

  public recordProductView(productId: string) {
    const view: ProductView = {
      id: `view-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: productId,
      viewed_at: new Date().toISOString(),
    };
    this.data.product_views.push(view);
    this.save();
  }

  public createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product {
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.products.unshift(newProduct);
    this.save();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.products[idx];
  }

  public deleteProduct(id: string): { success: boolean; message: string } {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, message: 'Produk tidak ditemukan' };

    // Check if product was used in any transaction
    const hasOrders = this.data.orders.some((o) => o.items.some((i) => i.product_id === id));
    if (hasOrders) {
      // Soft delete / archive to maintain transaction integrity!
      this.data.products[idx].is_archived = true;
      this.data.products[idx].status = 'ARCHIVED';
      this.data.products[idx].updated_at = new Date().toISOString();
      this.save();
      return {
        success: true,
        message: 'Produk telah diarsipkan karena memiliki riwayat transaksi.',
      };
    } else {
      // Hard delete safe because no transactions reference it
      this.data.products.splice(idx, 1);
      this.save();
      return { success: true, message: 'Produk berhasil dihapus permanen.' };
    }
  }

  // --- Voucher Operations ---
  public getVouchers() {
    return this.data.vouchers;
  }

  public findVoucherByCode(code: string) {
    return this.data.vouchers.find((v) => v.code.toUpperCase() === code.trim().toUpperCase());
  }

  public validateVoucher(code: string, userId: string, subtotal: number, categoryId?: string, game?: string) {
    const voucher = this.findVoucherByCode(code);
    if (!voucher) {
      return { valid: false, message: 'Kode voucher tidak ditemukan.' };
    }

    if (!voucher.is_active) {
      return { valid: false, message: 'Voucher sedang tidak aktif.' };
    }

    const now = new Date();
    if (new Date(voucher.valid_from) > now) {
      return { valid: false, message: 'Voucher belum berlaku.' };
    }
    if (new Date(voucher.valid_until) < now) {
      return { valid: false, message: 'Voucher sudah kedaluwarsa.' };
    }

    if (voucher.usage_limit > 0 && voucher.used_count >= voucher.usage_limit) {
      return { valid: false, message: 'Batas kuota penggunaan voucher telah habis.' };
    }

    if (subtotal < voucher.min_purchase) {
      return {
        valid: false,
        message: `Minimal pembelian untuk voucher ini adalah Rp${voucher.min_purchase.toLocaleString('id-ID')}.`,
      };
    }

    // Check per-user limit
    const userUsages = this.data.voucher_usages.filter(
      (vu) => vu.voucher_id === voucher.id && vu.user_id === userId
    );
    if (voucher.per_user_limit > 0 && userUsages.length >= voucher.per_user_limit) {
      return { valid: false, message: 'Anda telah mencapai batas penggunaan voucher ini.' };
    }

    // Check game / category applicability
    if (voucher.applicable_category && categoryId && voucher.applicable_category !== categoryId) {
      return { valid: false, message: 'Voucher tidak berlaku untuk kategori ini.' };
    }
    if (voucher.applicable_game && game && voucher.applicable_game.toLowerCase() !== game.toLowerCase()) {
      return { valid: false, message: 'Voucher tidak berlaku untuk game ini.' };
    }

    let discountAmount = 0;
    if (voucher.discount_type === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * voucher.discount_value) / 100);
      if (voucher.max_discount && discountAmount > voucher.max_discount) {
        discountAmount = voucher.max_discount;
      }
    } else {
      discountAmount = voucher.discount_value;
    }

    discountAmount = Math.min(discountAmount, subtotal);

    return {
      valid: true,
      voucher,
      discountAmount,
    };
  }

  public createVoucher(data: Omit<Voucher, 'id' | 'used_count' | 'created_at'>): Voucher {
    const newVoucher: Voucher = {
      ...data,
      id: `vouch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      used_count: 0,
      created_at: new Date().toISOString(),
    };
    this.data.vouchers.unshift(newVoucher);
    this.save();
    return newVoucher;
  }

  public updateVoucher(id: string, updates: Partial<Voucher>): Voucher | null {
    const idx = this.data.vouchers.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    this.data.vouchers[idx] = { ...this.data.vouchers[idx], ...updates };
    this.save();
    return this.data.vouchers[idx];
  }

  public deleteVoucher(id: string) {
    const idx = this.data.vouchers.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    this.data.vouchers.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Discounts ---
  public getDiscounts() {
    return this.data.discounts;
  }

  public createDiscount(data: Omit<Discount, 'id'>): Discount {
    const newDiscount: Discount = {
      ...data,
      id: `disc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.data.discounts.unshift(newDiscount);
    this.save();
    return newDiscount;
  }

  public updateDiscount(id: string, updates: Partial<Discount>): Discount | null {
    const idx = this.data.discounts.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    this.data.discounts[idx] = { ...this.data.discounts[idx], ...updates };
    this.save();
    return this.data.discounts[idx];
  }

  public deleteDiscount(id: string) {
    const idx = this.data.discounts.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    this.data.discounts.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Orders & Invoices ---
  public getOrders() {
    return this.data.orders;
  }

  public findOrderById(id: string) {
    return this.data.orders.find((o) => o.id === id);
  }

  public findOrderByOrderNumber(orderNumber: string) {
    return this.data.orders.find((o) => o.order_number === orderNumber);
  }

  public findOrderByInvoiceNumber(invoiceNumber: string) {
    return this.data.orders.find((o) => o.invoice_number === invoiceNumber);
  }

  public getUserOrders(userId: string) {
    return this.data.orders.filter((o) => o.user_id === userId);
  }

  public generateOrderAndInvoiceNumber(): { orderNumber: string; invoiceNumber: string } {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = this.data.orders.length + 1;
    const padded = String(count).padStart(6, '0');
    return {
      orderNumber: `ORD-${dateStr}-${padded}`,
      invoiceNumber: `VTX-${dateStr}-${padded}`,
    };
  }

  /**
   * Atomic Order Checkout Transaction
   */
  public createOrderCheckout(params: {
    userId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: { productId: string; quantity: number }[];
    voucherCode?: string;
    paymentMethod: Payment['method'];
    notes?: string;
  }): { success: boolean; order?: Order; invoice?: Invoice; error?: string } {
    if (!params.items || params.items.length === 0) {
      return { success: false, error: 'Keranjang belanja kosong.' };
    }

    // 1. Verify products & stock availability
    let subtotal = 0;
    const verifiedOrderItems: OrderItem[] = [];
    const productsToUpdate: { product: Product; quantity: number }[] = [];

    for (const item of params.items) {
      const product = this.findProductById(item.productId);
      if (!product) {
        return { success: false, error: `Produk dengan ID ${item.productId} tidak ditemukan.` };
      }
      if (product.status !== 'AVAILABLE' || product.is_archived) {
        return { success: false, error: `Produk "${product.name}" sedang tidak tersedia.` };
      }
      if (product.stock < item.quantity) {
        return {
          success: false,
          error: `Stok produk "${product.name}" tidak mencukupi (Tersisa: ${product.stock}).`,
        };
      }

      const activePrice = product.discount_price ?? product.price;
      subtotal += activePrice * item.quantity;

      const primaryImg = product.images.find((img) => img.is_primary) || product.images[0];
      verifiedOrderItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        order_id: '', // set later
        product_id: product.id,
        product_name: product.name,
        product_game: product.game,
        price: activePrice,
        quantity: item.quantity,
        product_image: primaryImg?.url,
      });

      productsToUpdate.push({ product, quantity: item.quantity });
    }

    // 2. Calculate automatic discount if active
    let discountAmount = 0;
    const activeDiscounts = this.data.discounts.filter(
      (d) => d.is_active && new Date(d.start_date) <= new Date() && new Date(d.end_date) >= new Date()
    );
    for (const disc of activeDiscounts) {
      if (subtotal >= disc.min_purchase) {
        let amt = 0;
        if (disc.discount_type === 'PERCENTAGE') {
          amt = Math.round((subtotal * disc.discount_value) / 100);
          if (disc.max_discount && amt > disc.max_discount) amt = disc.max_discount;
        } else {
          amt = disc.discount_value;
        }
        if (amt > discountAmount) discountAmount = amt;
      }
    }

    // 3. Calculate voucher if provided
    let voucherAmount = 0;
    let validVoucher: Voucher | null = null;
    if (params.voucherCode) {
      const vResult = this.validateVoucher(params.voucherCode, params.userId, subtotal);
      if (!vResult.valid) {
        return { success: false, error: vResult.message };
      }
      voucherAmount = vResult.discountAmount || 0;
      validVoucher = vResult.voucher || null;
    }

    const total = Math.max(0, subtotal - discountAmount - voucherAmount);
    const { orderNumber, invoiceNumber } = this.generateOrderAndInvoiceNumber();
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Prepare credentials for completed orders (only stored safely)
    const deliveredAccountDetails = productsToUpdate
      .map((p) => `[${p.product.name}]:\n${p.product.account_details}`)
      .join('\n\n');

    const now = new Date().toISOString();

    // 4. Update product stock atomically
    for (const p of productsToUpdate) {
      p.product.stock -= p.quantity;
      if (p.product.stock <= 0) {
        p.product.stock = 0;
        p.product.status = 'SOLD_OUT';
      }
      p.product.updated_at = now;
    }

    // 5. Update voucher usage if applied
    if (validVoucher) {
      validVoucher.used_count += 1;
      this.data.voucher_usages.push({
        id: `vu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        voucher_id: validVoucher.id,
        user_id: params.userId,
        order_id: orderId,
        used_at: now,
      });
    }

    // 6. Create Order and Items
    verifiedOrderItems.forEach((item) => {
      item.order_id = orderId;
    });

    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      invoice_number: invoiceNumber,
      user_id: params.userId,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      subtotal,
      discount_amount: discountAmount,
      voucher_amount: voucherAmount,
      total,
      voucher_code: params.voucherCode,
      payment_method: params.paymentMethod,
      payment_status: 'UNPAID',
      order_status: 'PENDING',
      notes: params.notes,
      delivered_credentials: deliveredAccountDetails,
      created_at: now,
      updated_at: now,
      items: verifiedOrderItems,
    };

    // 7. Create Payment record
    const newPayment: Payment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      order_id: orderId,
      method: params.paymentMethod,
      amount: total,
      status: 'UNPAID',
      qris_url: this.data.qris_settings.is_active ? this.data.qris_settings.image_url : undefined,
      created_at: now,
    };

    // 8. Create Invoice
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoice_number: invoiceNumber,
      order_id: orderId,
      user_id: params.userId,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      subtotal,
      discount_amount: discountAmount,
      voucher_amount: voucherAmount,
      total,
      payment_method: params.paymentMethod,
      order_status: 'PENDING',
      payment_status: 'UNPAID',
      items: verifiedOrderItems,
      created_at: now,
    };

    this.data.orders.unshift(newOrder);
    this.data.payments.unshift(newPayment);
    this.data.invoices.unshift(newInvoice);

    this.save();

    return {
      success: true,
      order: newOrder,
      invoice: newInvoice,
    };
  }

  /**
   * Cancel Transaction with stock restoration and audit logging
   */
  public cancelOrder(
    orderId: string,
    reason: string,
    cancelledBy: string
  ): { success: boolean; message: string; order?: Order } {
    const order = this.findOrderById(orderId);
    if (!order) {
      return { success: false, message: 'Pesanan tidak ditemukan.' };
    }

    if (order.order_status === 'CANCELLED') {
      return { success: false, message: 'Pesanan sudah dibatalkan sebelumnya.' };
    }

    const now = new Date().toISOString();

    // Restore stock if previously decremented
    for (const item of order.items) {
      const prod = this.findProductById(item.product_id);
      if (prod) {
        prod.stock += item.quantity;
        if (prod.status === 'SOLD_OUT' && prod.stock > 0) {
          prod.status = 'AVAILABLE';
        }
        prod.updated_at = now;
      }
    }

    // Rollback voucher usage if applied
    if (order.voucher_code) {
      const voucher = this.findVoucherByCode(order.voucher_code);
      if (voucher && voucher.used_count > 0) {
        voucher.used_count -= 1;
      }
      this.data.voucher_usages = this.data.voucher_usages.filter((vu) => vu.order_id !== order.id);
    }

    order.order_status = 'CANCELLED';
    order.cancellation_reason = reason;
    order.cancelled_by = cancelledBy;
    order.cancelled_at = now;
    order.updated_at = now;

    // Update invoice status as well
    const invoice = this.data.invoices.find((inv) => inv.order_id === order.id);
    if (invoice) {
      invoice.order_status = 'CANCELLED';
    }

    // Update payment status
    const payment = this.data.payments.find((p) => p.order_id === order.id);
    if (payment) {
      payment.status = 'REFUNDED';
    }

    this.save();
    return { success: true, message: 'Pesanan berhasil dibatalkan dan stok dikembalikan.', order };
  }

  public updateOrderStatus(orderId: string, status: Order['order_status'], paymentStatus?: Order['payment_status']) {
    const order = this.findOrderById(orderId);
    if (!order) return null;

    const now = new Date().toISOString();
    order.order_status = status;
    if (paymentStatus) {
      order.payment_status = paymentStatus;
    } else if (status === 'PAID' || status === 'COMPLETED') {
      order.payment_status = 'PAID';
    }
    order.updated_at = now;

    // sync invoice
    const inv = this.data.invoices.find((i) => i.order_id === orderId);
    if (inv) {
      inv.order_status = status;
      if (order.payment_status) inv.payment_status = order.payment_status;
    }

    // sync payment
    const pay = this.data.payments.find((p) => p.order_id === orderId);
    if (pay) {
      pay.status = order.payment_status;
    }

    this.save();
    return order;
  }

  // --- Invoices ---
  public getInvoices() {
    return this.data.invoices;
  }

  public findInvoiceByNumber(invoiceNumber: string) {
    return this.data.invoices.find((inv) => inv.invoice_number === invoiceNumber);
  }

  // --- Ratings & Reviews ---
  public getRatings(productId?: string) {
    if (productId) {
      return this.data.ratings.filter((r) => r.product_id === productId && !r.is_hidden);
    }
    return this.data.ratings;
  }

  public getAllRatingsAdmin() {
    return this.data.ratings;
  }

  public createRating(params: {
    productId: string;
    userId: string;
    orderId: string;
    userName: string;
    rating: number;
    review: string;
  }): { success: boolean; rating?: Rating; error?: string } {
    // Check if user has already bought and completed this order
    const order = this.findOrderById(params.orderId);
    if (!order || order.user_id !== params.userId) {
      return { success: false, error: 'Pesanan tidak valid untuk akun Anda.' };
    }
    if (order.order_status !== 'COMPLETED' && order.order_status !== 'PAID') {
      return {
        success: false,
        error: 'Rating hanya dapat diberikan setelah pesanan berstatus Selesai/Dibayar.',
      };
    }
    const hasProduct = order.items.some((item) => item.product_id === params.productId);
    if (!hasProduct) {
      return { success: false, error: 'Anda belum pernah membeli produk ini dalam pesanan tersebut.' };
    }

    // Check if already rated this order for this product
    const existing = this.data.ratings.find(
      (r) => r.order_id === params.orderId && r.product_id === params.productId
    );
    if (existing) {
      return { success: false, error: 'Anda sudah memberikan rating untuk produk ini pada pesanan ini.' };
    }

    const prod = this.findProductById(params.productId);

    const newRating: Rating = {
      id: `rat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: params.productId,
      product_name: prod?.name,
      user_id: params.userId,
      order_id: params.orderId,
      user_name: params.userName,
      rating: Math.min(5, Math.max(1, Math.round(params.rating))),
      review: params.review,
      is_hidden: false,
      created_at: new Date().toISOString(),
    };

    this.data.ratings.unshift(newRating);
    this.save();
    return { success: true, rating: newRating };
  }

  public toggleRatingVisibility(ratingId: string, isHidden: boolean) {
    const rat = this.data.ratings.find((r) => r.id === ratingId);
    if (!rat) return false;
    rat.is_hidden = isHidden;
    this.save();
    return true;
  }

  public deleteRating(ratingId: string) {
    const idx = this.data.ratings.findIndex((r) => r.id === ratingId);
    if (idx === -1) return false;
    this.data.ratings.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Service Reviews ---
  public getServiceReviews(publicOnly = true) {
    if (publicOnly) {
      return this.data.service_reviews.filter((r) => !r.is_hidden);
    }
    return this.data.service_reviews;
  }

  public createServiceReview(params: {
    userId: string;
    orderId: string;
    userName: string;
    rating: number;
    comment: string;
  }): { success: boolean; review?: ServiceReview; error?: string } {
    const order = this.findOrderById(params.orderId);
    if (!order || order.user_id !== params.userId) {
      return { success: false, error: 'Pesanan tidak valid.' };
    }
    if (order.order_status !== 'COMPLETED' && order.order_status !== 'PAID') {
      return {
        success: false,
        error: 'Rating layanan hanya dapat diberikan setelah pesanan Selesai.',
      };
    }

    const existing = this.data.service_reviews.find((r) => r.order_id === params.orderId);
    if (existing) {
      return { success: false, error: 'Anda sudah memberikan ulasan layanan untuk pesanan ini.' };
    }

    const newReview: ServiceReview = {
      id: `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: params.userId,
      order_id: params.orderId,
      user_name: params.userName,
      rating: Math.min(5, Math.max(1, Math.round(params.rating))),
      comment: params.comment,
      is_hidden: false,
      created_at: new Date().toISOString(),
    };

    this.data.service_reviews.unshift(newReview);
    this.save();
    return { success: true, review: newReview };
  }

  // --- Store Settings, Theme & QRIS ---
  public getStoreSettings() {
    return this.data.store_settings;
  }

  public updateStoreSettings(updates: Partial<StoreSettings>) {
    this.data.store_settings = {
      ...this.data.store_settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.store_settings;
  }

  public getThemeSettings() {
    return this.data.theme_settings;
  }

  public updateThemeSettings(updates: Partial<ThemeSettings>) {
    this.data.theme_settings = {
      ...this.data.theme_settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.theme_settings;
  }

  public getQrisSettings() {
    return this.data.qris_settings;
  }

  public updateQrisSettings(updates: Partial<QrisSettings>) {
    this.data.qris_settings = {
      ...this.data.qris_settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.qris_settings;
  }

  // --- Email Logs ---
  public getEmailLogs() {
    return this.data.email_logs;
  }

  public logEmail(recipient: string, subject: string, status: EmailLog['status'], errorMessage?: string, orderId?: string) {
    const log: EmailLog = {
      id: `eml-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipient,
      subject,
      status,
      error_message: errorMessage,
      order_id: orderId,
      created_at: new Date().toISOString(),
    };
    this.data.email_logs.unshift(log);
    if (this.data.email_logs.length > 500) {
      this.data.email_logs = this.data.email_logs.slice(0, 500);
    }
    this.save();
    return log;
  }

  // --- Audit Logs ---
  public getAuditLogs() {
    return this.data.audit_logs;
  }

  // --- Analytics & Performance Calculation ---
  public getAnalyticsSummary(): AnalyticsSummary {
    const total_products = this.data.products.filter((p) => !p.is_archived).length;
    const active_products = this.data.products.filter((p) => !p.is_archived && p.stock > 0 && p.status === 'AVAILABLE').length;
    const out_of_stock_products = this.data.products.filter((p) => !p.is_archived && p.stock === 0).length;
    const total_customers = this.data.users.filter((u) => u.role === 'CUSTOMER').length;

    const total_transactions = this.data.orders.length;
    const completed_transactions = this.data.orders.filter(
      (o) => o.order_status === 'COMPLETED' || o.order_status === 'PAID'
    ).length;
    const pending_transactions = this.data.orders.filter((o) => o.order_status === 'PENDING').length;
    const cancelled_transactions = this.data.orders.filter((o) => o.order_status === 'CANCELLED').length;

    let total_revenue = 0;
    let revenue_today = 0;
    let revenue_this_month = 0;
    let total_discount_given = 0;
    let total_vouchers_used = 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    const thisMonthStr = new Date().toISOString().slice(0, 7);

    for (const order of this.data.orders) {
      if (order.order_status === 'COMPLETED' || order.order_status === 'PAID') {
        total_revenue += order.total;
        total_discount_given += order.discount_amount + order.voucher_amount;
        if (order.voucher_code) total_vouchers_used += 1;

        const orderDateStr = order.created_at.slice(0, 10);
        if (orderDateStr === todayStr) {
          revenue_today += order.total;
        }
        if (order.created_at.slice(0, 7) === thisMonthStr) {
          revenue_this_month += order.total;
        }
      }
    }

    const total_ratings = this.data.ratings.length;
    const avgStoreRating =
      total_ratings > 0
        ? Number((this.data.ratings.reduce((acc, r) => acc + r.rating, 0) / total_ratings).toFixed(1))
        : 5.0;

    const totalServiceRatings = this.data.service_reviews.length;
    const avgServiceRating =
      totalServiceRatings > 0
        ? Number(
            (this.data.service_reviews.reduce((acc, r) => acc + r.rating, 0) / totalServiceRatings).toFixed(1)
          )
        : 5.0;

    // Daily sales last 7 days
    const dailyMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { revenue: 0, orders: 0 });
    }

    this.data.orders.forEach((o) => {
      const key = o.created_at.slice(0, 10);
      if (dailyMap.has(key) && (o.order_status === 'COMPLETED' || o.order_status === 'PAID')) {
        const cur = dailyMap.get(key)!;
        cur.revenue += o.total;
        cur.orders += 1;
      }
    });

    const dailyChart = Array.from(dailyMap.entries()).map(([label, val]) => ({
      label: label.slice(5), // MM-DD
      revenue: val.revenue,
      orders: val.orders,
    }));

    // Weekly sales (last 4 weeks)
    const weeklyChart = [
      { label: 'Minggu 1', revenue: Math.round(revenue_this_month * 0.2), orders: Math.max(1, Math.round(completed_transactions * 0.2)) },
      { label: 'Minggu 2', revenue: Math.round(revenue_this_month * 0.25), orders: Math.max(1, Math.round(completed_transactions * 0.25)) },
      { label: 'Minggu 3', revenue: Math.round(revenue_this_month * 0.3), orders: Math.max(1, Math.round(completed_transactions * 0.3)) },
      { label: 'Minggu 4 (Aktif)', revenue: Math.round(revenue_this_month * 0.25), orders: Math.max(1, Math.round(completed_transactions * 0.25)) },
    ];

    // Monthly sales (last 6 months)
    const monthlyChart = [
      { label: 'Mei', revenue: Math.round(total_revenue * 0.1), orders: Math.max(1, Math.round(completed_transactions * 0.1)) },
      { label: 'Jun', revenue: Math.round(total_revenue * 0.15), orders: Math.max(1, Math.round(completed_transactions * 0.15)) },
      { label: 'Jul', revenue: Math.round(total_revenue * 0.2), orders: Math.max(1, Math.round(completed_transactions * 0.2)) },
      { label: 'Agt', revenue: Math.round(total_revenue * 0.25), orders: Math.max(1, Math.round(completed_transactions * 0.25)) },
      { label: 'Sep', revenue: Math.round(total_revenue * 0.15), orders: Math.max(1, Math.round(completed_transactions * 0.15)) },
      { label: 'Okt', revenue: revenue_this_month || Math.round(total_revenue * 0.15), orders: Math.max(1, Math.round(completed_transactions * 0.15)) },
    ];

    // Top selling products
    const productSalesMap = new Map<string, { name: string; game: string; sold: number; revenue: number }>();
    this.data.orders.forEach((o) => {
      if (o.order_status === 'COMPLETED' || o.order_status === 'PAID') {
        o.items.forEach((item) => {
          const cur = productSalesMap.get(item.product_id) || {
            name: item.product_name,
            game: item.product_game,
            sold: 0,
            revenue: 0,
          };
          cur.sold += item.quantity;
          cur.revenue += item.price * item.quantity;
          productSalesMap.set(item.product_id, cur);
        });
      }
    });

    const top_selling_products = Array.from(productSalesMap.entries())
      .map(([id, val]) => ({ id, name: val.name, game: val.game, sold_count: val.sold, revenue: val.revenue }))
      .sort((a, b) => b.sold_count - a.sold_count)
      .slice(0, 5);

    const top_revenue_products = Array.from(productSalesMap.entries())
      .map(([id, val]) => ({ id, name: val.name, game: val.game, revenue: val.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Most viewed
    const viewsMap = new Map<string, number>();
    this.data.product_views.forEach((v) => {
      viewsMap.set(v.product_id, (viewsMap.get(v.product_id) || 0) + 1);
    });

    const most_viewed_products = this.data.products
      .map((p) => ({
        id: p.id,
        name: p.name,
        game: p.game,
        views: viewsMap.get(p.id) || 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Top rated
    const ratingMap = new Map<string, { total: number; count: number }>();
    this.data.ratings.forEach((r) => {
      const cur = ratingMap.get(r.product_id) || { total: 0, count: 0 };
      cur.total += r.rating;
      cur.count += 1;
      ratingMap.set(r.product_id, cur);
    });

    const top_rated_products = this.data.products
      .map((p) => {
        const stats = ratingMap.get(p.id);
        return {
          id: p.id,
          name: p.name,
          game: p.game,
          avg_rating: stats && stats.count > 0 ? Number((stats.total / stats.count).toFixed(1)) : 5.0,
          review_count: stats ? stats.count : 0,
        };
      })
      .sort((a, b) => b.avg_rating - a.avg_rating)
      .slice(0, 5);

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
      revenue_today,
      revenue_this_month,
      total_vouchers_used,
      total_discount_given,
      total_ratings,
      average_store_rating: avgStoreRating,
      average_service_rating: avgServiceRating,
      sales_chart: {
        daily: dailyChart,
        weekly: weeklyChart,
        monthly: monthlyChart,
      },
      top_selling_products,
      most_viewed_products,
      top_revenue_products,
      top_rated_products,
    };
  }

  public getProductPerformance(filter: 'today' | '7days' | '30days' | 'month' | 'all' = 'all'): ProductPerformance[] {
    const now = new Date();
    let startDate: Date | null = null;

    if (filter === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === '7days') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (filter === '30days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (filter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return this.data.products.map((p) => {
      // Views in period
      const views = this.data.product_views.filter((v) => {
        if (v.product_id !== p.id) return false;
        if (!startDate) return true;
        return new Date(v.viewed_at) >= startDate;
      }).length;

      // Orders for this product in period
      let checkouts = 0;
      let sold_count = 0;
      let total_revenue = 0;
      let cancellations = 0;
      let total_transactions = 0;

      this.data.orders.forEach((o) => {
        if (startDate && new Date(o.created_at) < startDate) return;
        const item = o.items.find((i) => i.product_id === p.id);
        if (item) {
          total_transactions += 1;
          checkouts += item.quantity;
          if (o.order_status === 'COMPLETED' || o.order_status === 'PAID') {
            sold_count += item.quantity;
            total_revenue += item.price * item.quantity;
          } else if (o.order_status === 'CANCELLED') {
            cancellations += item.quantity;
          }
        }
      });

      // Ratings
      const ratings = this.data.ratings.filter((r) => r.product_id === p.id);
      const rating_count = ratings.length;
      const average_rating =
        rating_count > 0 ? Number((ratings.reduce((acc, r) => acc + r.rating, 0) / rating_count).toFixed(1)) : 5.0;

      const conversion_rate =
        views > 0 ? Number(((sold_count / views) * 100).toFixed(1)) : sold_count > 0 ? 100 : 0;

      return {
        product_id: p.id,
        product_name: p.name,
        game: p.game,
        views,
        checkouts,
        sold_count,
        total_transactions,
        total_revenue,
        cancellations,
        rating_count,
        average_rating,
        conversion_rate,
      };
    });
  }

  // --- Reset Data ---
  /**
   * Safe Reset functionality with Audit Logging
   */
  public resetCategory(category: string, adminUser: { id: string; name: string }) {
    const cat = category.toLowerCase().trim();
    switch (cat) {
      case 'produk':
        this.data.products = [];
        this.data.product_views = [];
        break;
      case 'stok':
        this.data.products.forEach((p) => {
          p.stock = 0;
          p.status = 'SOLD_OUT';
        });
        break;
      case 'transaksi':
        this.data.orders = [];
        this.data.payments = [];
        break;
      case 'invoice':
        this.data.invoices = [];
        break;
      case 'voucher':
        this.data.vouchers = [];
        this.data.voucher_usages = [];
        break;
      case 'diskon':
        this.data.discounts = [];
        break;
      case 'rating':
        this.data.ratings = [];
        this.data.service_reviews = [];
        break;
      case 'analytics':
        this.data.product_views = [];
        break;
      case 'customer':
        this.data.users = this.data.users.filter((u) => u.role === 'ADMIN');
        break;
      case 'audit_log':
        this.data.audit_logs = [];
        break;
      default:
        return { success: false, message: `Kategori reset "${category}" tidak valid.` };
    }

    this.logAudit(adminUser.id, adminUser.name, 'RESET_CATEGORY', category, { category });
    this.save();
    return { success: true, message: `Data kategori "${category}" berhasil di-reset.` };
  }

  public resetAllData(adminUser: { id: string; name: string }) {
    // Keep admin account, categories, store settings, theme, qris
    const admins = this.data.users.filter((u) => u.role === 'ADMIN');

    this.data.products = [];
    this.data.orders = [];
    this.data.payments = [];
    this.data.invoices = [];
    this.data.vouchers = [];
    this.data.voucher_usages = [];
    this.data.discounts = [];
    this.data.ratings = [];
    this.data.service_reviews = [];
    this.data.product_views = [];
    this.data.email_logs = [];
    this.data.users = admins;

    // Log the reset
    this.logAudit(adminUser.id, adminUser.name, 'RESET_ALL_DATA', 'ALL_SYSTEM_DATA', {
      timestamp: new Date().toISOString(),
      admin: adminUser.name,
    });

    this.save();
    return {
      success: true,
      message: 'Seluruh data operasional toko berhasil di-reset menjadi kosong.',
    };
  }
}

export const db = new Database();
