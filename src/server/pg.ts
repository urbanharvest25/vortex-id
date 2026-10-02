import pg from 'pg';
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

const { Pool } = pg;

// Get connection string from environment variables
const connectionString = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim();

export const isPostgresConfigured = Boolean(connectionString && connectionString.length > 0);

// Configure connection pool optimized for serverless environments (Neon, Supabase, AWS RDS, Vercel Postgres)
export const pool = new Pool({
  connectionString: isPostgresConfigured ? connectionString : undefined,
  ssl:
    isPostgresConfigured && !connectionString.includes('localhost')
      ? { rejectUnauthorized: false }
      : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

let isMigrated = false;
let initPromise: Promise<void> | null = null;

/**
 * Initializes the PostgreSQL schema and seeds initial data if tables are empty.
 */
export async function initPostgres(): Promise<void> {
  if (!isPostgresConfigured) {
    const isProduction =
      process.env.VERCEL === '1' ||
      process.env.VERCEL === 'true' ||
      process.env.NODE_ENV === 'production';

    if (isProduction) {
      throw new Error(
        '[PostgreSQL Error] DATABASE_URL is required in production. Add DATABASE_URL to the Vercel Project Environment Variables.'
      );
    }

    console.warn(
      '[PostgreSQL] DATABASE_URL is not configured. PostgreSQL initialization is skipped in local development.'
    );
    return;
  }

  if (isMigrated) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // 1. Fast-path check: If users table already exists, the schema is already initialized.
    try {
      const quickCheck = await pool.query("SELECT to_regclass('public.users') AS exists;");
      if (quickCheck.rows[0]?.exists) {
        try {
          await seedDefaultPostgresData();
        } catch (seedErr) {
          console.warn('[PostgreSQL] Seed check warning (non-fatal):', seedErr);
        }
        isMigrated = true;
        console.log('[PostgreSQL] Database schemas verified and ready.');
        return;
      }
    } catch {
      // Proceed to full migration flow
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Acquire transaction-level advisory lock to serialize migrations across all concurrent instances
      await client.query('SELECT pg_advisory_xact_lock(74839210)');

      // Double-check after acquiring the lock in case another instance just finished
      const doubleCheck = await client.query("SELECT to_regclass('public.users') AS exists;");
      if (!doubleCheck.rows[0]?.exists) {
        // 1. Users Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
        `);

        // 2. Categories Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS categories (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            icon VARCHAR(100),
            game VARCHAR(255) NOT NULL
          );
        `);

        // 3. Products Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            game VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            price NUMERIC(15, 2) NOT NULL,
            discount_price NUMERIC(15, 2),
            stock INT NOT NULL DEFAULT 1,
            description TEXT NOT NULL,
            account_details TEXT NOT NULL,
            rank VARCHAR(100),
            level VARCHAR(100),
            skins TEXT,
            items TEXT,
            status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
            is_archived BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
          CREATE INDEX IF NOT EXISTS idx_products_game ON products(LOWER(game));
        `);

        // 4. Product Images Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS product_images (
            id VARCHAR(100) PRIMARY KEY,
            product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            url TEXT NOT NULL,
            sort_order INT NOT NULL DEFAULT 0,
            is_primary BOOLEAN NOT NULL DEFAULT FALSE
          );
          CREATE INDEX IF NOT EXISTS idx_product_images_prod ON product_images(product_id);
        `);

        // 5. Orders Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(100) PRIMARY KEY,
            order_number VARCHAR(100) UNIQUE NOT NULL,
            invoice_number VARCHAR(100) UNIQUE NOT NULL,
            user_id VARCHAR(100) NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(50) NOT NULL,
            subtotal NUMERIC(15, 2) NOT NULL,
            discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
            voucher_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
            total NUMERIC(15, 2) NOT NULL,
            voucher_code VARCHAR(50),
            payment_method VARCHAR(50) NOT NULL,
            payment_status VARCHAR(50) NOT NULL DEFAULT 'UNPAID',
            order_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
            notes TEXT,
            cancellation_reason TEXT,
            cancelled_by VARCHAR(255),
            cancelled_at TIMESTAMPTZ,
            delivered_credentials TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
          CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
        `);

        // 6. Order Items Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS order_items (
            id VARCHAR(100) PRIMARY KEY,
            order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id VARCHAR(100) NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            product_game VARCHAR(255) NOT NULL,
            price NUMERIC(15, 2) NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            product_image TEXT
          );
          CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
        `);

        // 7. Payments Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS payments (
            id VARCHAR(100) PRIMARY KEY,
            order_id VARCHAR(100) NOT NULL,
            method VARCHAR(50) NOT NULL,
            amount NUMERIC(15, 2) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'UNPAID',
            qris_url TEXT,
            proof_image TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
        `);

        // 8. Invoices Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS invoices (
            id VARCHAR(100) PRIMARY KEY,
            invoice_number VARCHAR(100) UNIQUE NOT NULL,
            order_id VARCHAR(100) NOT NULL,
            user_id VARCHAR(100) NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(50) NOT NULL,
            subtotal NUMERIC(15, 2) NOT NULL,
            discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
            voucher_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
            total NUMERIC(15, 2) NOT NULL,
            payment_method VARCHAR(50) NOT NULL,
            order_status VARCHAR(50) NOT NULL,
            payment_status VARCHAR(50) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
        `);

        // 9. Vouchers Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS vouchers (
            id VARCHAR(100) PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            discount_type VARCHAR(20) NOT NULL,
            discount_value NUMERIC(15, 2) NOT NULL,
            min_purchase NUMERIC(15, 2) NOT NULL DEFAULT 0,
            max_discount NUMERIC(15, 2),
            usage_limit INT NOT NULL DEFAULT 100,
            used_count INT NOT NULL DEFAULT 0,
            per_user_limit INT NOT NULL DEFAULT 1,
            valid_from TIMESTAMPTZ NOT NULL,
            valid_until TIMESTAMPTZ NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            applicable_category VARCHAR(100),
            applicable_game VARCHAR(100),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(UPPER(code));
        `);

        // 10. Voucher Usages Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS voucher_usages (
            id VARCHAR(100) PRIMARY KEY,
            voucher_id VARCHAR(100) NOT NULL,
            user_id VARCHAR(100) NOT NULL,
            order_id VARCHAR(100) NOT NULL,
            used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_voucher_usages_user ON voucher_usages(user_id, voucher_id);
        `);

        // 11. Discounts Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS discounts (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            discount_type VARCHAR(20) NOT NULL,
            discount_value NUMERIC(15, 2) NOT NULL,
            min_purchase NUMERIC(15, 2) NOT NULL DEFAULT 0,
            max_discount NUMERIC(15, 2),
            target_type VARCHAR(50) NOT NULL,
            target_id VARCHAR(100),
            start_date TIMESTAMPTZ NOT NULL,
            end_date TIMESTAMPTZ NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE
          );
        `);

        // 12. Ratings Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS ratings (
            id VARCHAR(100) PRIMARY KEY,
            product_id VARCHAR(100) NOT NULL,
            product_name VARCHAR(255),
            user_id VARCHAR(100) NOT NULL,
            order_id VARCHAR(100) NOT NULL,
            user_name VARCHAR(255) NOT NULL,
            rating INT NOT NULL,
            review TEXT NOT NULL,
            is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_ratings_prod ON ratings(product_id);
        `);

        // 13. Service Reviews Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS service_reviews (
            id VARCHAR(100) PRIMARY KEY,
            user_id VARCHAR(100) NOT NULL,
            order_id VARCHAR(100) NOT NULL,
            user_name VARCHAR(255) NOT NULL,
            rating INT NOT NULL,
            comment TEXT NOT NULL,
            is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);

        // 14. Store Settings Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS store_settings (
            id VARCHAR(100) PRIMARY KEY,
            store_name VARCHAR(255) NOT NULL,
            tagline VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            whatsapp_number VARCHAR(50) NOT NULL,
            whatsapp_link_number VARCHAR(50) NOT NULL,
            whatsapp_default_message TEXT NOT NULL,
            logo_url TEXT,
            favicon_url TEXT,
            terms_conditions TEXT NOT NULL,
            refund_policy TEXT NOT NULL,
            cancellation_policy TEXT NOT NULL,
            gaming_disclaimer TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);

        // 15. Theme Settings Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS theme_settings (
            id VARCHAR(100) PRIMARY KEY,
            theme_mode VARCHAR(20) NOT NULL DEFAULT 'DARK',
            primary_color VARCHAR(50) NOT NULL,
            secondary_color VARCHAR(50) NOT NULL,
            background_color VARCHAR(50) NOT NULL,
            text_color VARCHAR(50) NOT NULL,
            button_color VARCHAR(50) NOT NULL,
            accent_color VARCHAR(50) NOT NULL,
            banner_image TEXT NOT NULL,
            banner_title VARCHAR(255) NOT NULL,
            banner_subtitle TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);

        // 16. Qris Settings Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS qris_settings (
            id VARCHAR(100) PRIMARY KEY,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            image_url TEXT NOT NULL,
            account_name VARCHAR(255) NOT NULL,
            nmid VARCHAR(100) NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);

        // 17. Email Logs Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS email_logs (
            id VARCHAR(100) PRIMARY KEY,
            recipient VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            provider VARCHAR(50) NOT NULL,
            status VARCHAR(20) NOT NULL,
            error TEXT,
            message_id VARCHAR(255),
            sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);

        // 18. Audit Logs Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR(100) PRIMARY KEY,
            admin_id VARCHAR(100) NOT NULL,
            admin_name VARCHAR(255) NOT NULL,
            action VARCHAR(100) NOT NULL,
            target VARCHAR(100) NOT NULL,
            metadata JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);

        // 19. Product Views Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS product_views (
            id VARCHAR(100) PRIMARY KEY,
            product_id VARCHAR(100) NOT NULL,
            viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);
      }

      // Commit DDL
      await client.query('COMMIT');

      // Seed default records if empty
      await seedDefaultPostgresData();

      isMigrated = true;
      console.log('[PostgreSQL] Database schemas initialized and verified.');
    } catch (err: any) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // ignore rollback error
      }

      // If error is duplicate key on pg_type (concurrent table/type creation race condition)
      if (
        err?.code === '23505' ||
        err?.message?.includes('pg_type_typname_nsp_index') ||
        err?.message?.includes('already exists')
      ) {
        console.warn('[PostgreSQL Warning] Concurrent schema initialization detected, verifying existing tables...');
        try {
          const verifyCheck = await pool.query("SELECT to_regclass('public.users') AS exists;");
          if (verifyCheck.rows[0]?.exists) {
            isMigrated = true;
            console.log('[PostgreSQL] Database schemas verified after concurrent initialization.');
            return;
          }
        } catch {
          // continue to throw
        }
      }

      console.error('[PostgreSQL Initialization Error]:', err);
      throw err;
    } finally {
      client.release();
    }
  })();

  try {
    await initPromise;
  } catch (err) {
    initPromise = null;
    throw err;
  }
}

/**
 * Seeds initial store settings, admin accounts, and catalog if database is fresh.
 */
async function seedDefaultPostgresData(): Promise<void> {
  // Check users count
  const userCheck = await pool.query('SELECT COUNT(*) FROM users');
  const userCount = parseInt(userCheck.rows[0].count, 10);

  if (userCount === 0) {
    // Never hardcode initial account passwords in source code.
    // Set these as server-side environment variables before first production seed.
    const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
    const customerPassword = process.env.SEED_CUSTOMER_PASSWORD?.trim();

    if (!adminPassword || !customerPassword) {
      throw new Error(
        '[PostgreSQL Seed] SEED_ADMIN_PASSWORD and SEED_CUSTOMER_PASSWORD are required when the users table is empty.'
      );
    }

    const adminPassHash = bcrypt.hashSync(adminPassword, 10);
    const customerPassHash = bcrypt.hashSync(customerPassword, 10);

    // Super Admin
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, phone, role, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [
        'usr-admin-01',
        'Super Admin Vortex',
        'admin@vortex.id',
        adminPassHash,
        '085819822250',
        'ADMIN',
        'ACTIVE',
      ]
    );

    // Test Customer
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, phone, role, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [
        'usr-cust-01',
        'Rian Pratama',
        'customer@vortex.id',
        customerPassHash,
        '081234567890',
        'CUSTOMER',
        'ACTIVE',
      ]
    );
  }

  // Check Categories
  const catCheck = await pool.query('SELECT COUNT(*) FROM categories');
  if (parseInt(catCheck.rows[0].count, 10) === 0) {
    const categories: Category[] = [
      { id: 'cat-mlbb', name: 'Mobile Legends', slug: 'mobile-legends', game: 'Mobile Legends', icon: 'Gamepad2' },
      { id: 'cat-ff', name: 'Free Fire', slug: 'free-fire', game: 'Free Fire', icon: 'Flame' },
      { id: 'cat-val', name: 'Valorant', slug: 'valorant', game: 'Valorant', icon: 'Crosshair' },
      { id: 'cat-genshin', name: 'Genshin Impact', slug: 'genshin-impact', game: 'Genshin Impact', icon: 'Sparkles' },
      { id: 'cat-pubg', name: 'PUBG Mobile', slug: 'pubg-mobile', game: 'PUBG Mobile', icon: 'Shield' },
      { id: 'cat-roblox', name: 'Roblox', slug: 'roblox', game: 'Roblox', icon: 'Box' },
    ];
    for (const c of categories) {
      await pool.query(
        'INSERT INTO categories (id, name, slug, icon, game) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
        [c.id, c.name, c.slug, c.icon, c.game]
      );
    }
  }

  // Check Store Settings
  const storeCheck = await pool.query('SELECT COUNT(*) FROM store_settings');
  if (parseInt(storeCheck.rows[0].count, 10) === 0) {
    await pool.query(
      `INSERT INTO store_settings (
        id, store_name, tagline, phone, whatsapp_number, whatsapp_link_number,
        whatsapp_default_message, logo_url, favicon_url, terms_conditions,
        refund_policy, cancellation_policy, gaming_disclaimer, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      ON CONFLICT (id) DO NOTHING`,
      [
        'store-settings-1',
        'Vortex ID',
        'Beli Aman, Main Nyaman.',
        '085819822250',
        '085819822250',
        '6285819822250',
        'Halo Vortex ID, saya ingin bertanya mengenai produk.',
        '',
        '',
        `1. Seluruh transaksi jual beli akun gaming di Vortex ID tunduk pada ketentuan hukum yang berlaku serta persetujuan kedua belah pihak.
2. Vortex ID menjamin keabsahan dan keaslian data akun sesuai dengan deskripsi spesifikasi produk.
3. Pembeli wajib melakukan pengecekan dan penggantian data keamanan akun (email, password, 2FA) maksimal 1x24 jam setelah data akun diserahkan.
4. Garansi anti-hackback berlaku sesuai masa garansi toko (30 hari garansi penuh atau uang kembali sesuai kebijakan garansi).
5. Pembeli setuju untuk tidak menyalahgunakan akun yang dibeli untuk aktivitas ilegal, cheat, atau modifikasi ilegal.`,
        `1. Refund dana 100% diproses jika akun tidak sesuai dengan deskripsi dan belum diubah datanya oleh pembeli.
2. Pengajuan refund wajib menyertakan bukti screenshot/video unboxing akun tanpa jeda.
3. Proses klaim garansi atau refund diproses maksimal 1x24 jam oleh tim admin Vortex ID.`,
        `1. Pesanan yang berstatus PENDING dapat dibatalkan sewaktu-waktu sebelum pembayaran diverifikasi.
2. Pesanan yang sudah berstatus PAID atau COMPLETED hanya dapat dibatalkan melalui persetujuan admin setelah evaluasi teknis.`,
        `PEMBERITAHUAN PENTING:
Setiap game dan platform memiliki Syarat & Ketentuan (Terms of Service) tersendiri terkait kepemilikan dan pengalihan akun. Vortex ID bertindak sebagai fasilitator perantara verifikasi data demi keamanan kedua belah pihak. Pengguna disarankan membaca dan memahami kebijakan pengembang game masing-masing sebelum bertransaksi.`,
      ]
    );
  }

  // Check Theme Settings
  const themeCheck = await pool.query('SELECT COUNT(*) FROM theme_settings');
  if (parseInt(themeCheck.rows[0].count, 10) === 0) {
    await pool.query(
      `INSERT INTO theme_settings (
        id, theme_mode, primary_color, secondary_color, background_color,
        text_color, button_color, accent_color, banner_image, banner_title,
        banner_subtitle, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (id) DO NOTHING`,
      [
        'theme-settings-1',
        'DARK',
        '#00f0ff',
        '#3b82f6',
        '#080c14',
        '#f8fafc',
        '#00f0ff',
        '#06b6d4',
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
        'MARKETPLACE AKUN GAMING TERPERCAYA',
        'Beli Aman, Main Nyaman. Transaksi Instan, Garansi Penuh, & Verifikasi Data 100%.',
      ]
    );
  }

  // Check QRIS Settings
  const qrisCheck = await pool.query('SELECT COUNT(*) FROM qris_settings');
  if (parseInt(qrisCheck.rows[0].count, 10) === 0) {
    await pool.query(
      `INSERT INTO qris_settings (id, is_active, image_url, account_name, nmid, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [
        'qris-settings-1',
        true,
        'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126590013ID.VORTEX.WWW0118936009110858198222505204581253033605802ID5909VORTEX%20ID6007JAKARTA61051294062070703A016304E1F8',
        'VORTEX ID - OFFICIAL STORE',
        'ID10202619822250',
      ]
    );
  }

  // Check Vouchers
  const voucherCheck = await pool.query('SELECT COUNT(*) FROM vouchers');
  if (parseInt(voucherCheck.rows[0].count, 10) === 0) {
    await pool.query(
      `INSERT INTO vouchers (
        id, code, discount_type, discount_value, min_purchase, max_discount,
        usage_limit, used_count, per_user_limit, valid_from, valid_until, is_active, created_at
      ) VALUES
      ('vouch-1', 'VORTEX10', 'PERCENTAGE', 10, 100000, 50000, 100, 0, 1, '2025-01-01', '2030-12-31', true, NOW()),
      ('vouch-2', 'VORTEXNEW', 'FIXED', 25000, 150000, 25000, 200, 0, 1, '2025-01-01', '2030-12-31', true, NOW())
      ON CONFLICT (code) DO NOTHING`
    );
  }

  // Check Discounts
  const discCheck = await pool.query('SELECT COUNT(*) FROM discounts');
  if (parseInt(discCheck.rows[0].count, 10) === 0) {
    await pool.query(
      `INSERT INTO discounts (
        id, name, discount_type, discount_value, min_purchase, max_discount, target_type, start_date, end_date, is_active
      ) VALUES
      ('disc-1', 'Promo Grand Opening 5%', 'PERCENTAGE', 5, 50000, 30000, 'ALL', '2025-01-01', '2030-12-31', true)
      ON CONFLICT (id) DO NOTHING`
    );
  }

  // Check Products
  const prodCheck = await pool.query('SELECT COUNT(*) FROM products');
  if (parseInt(prodCheck.rows[0].count, 10) === 0) {
    const p1: Product = {
      id: 'prod-ml-01',
      name: 'Akun MLBB Mythical Glory 85★ - Skin Collector Chou & Gusion',
      game: 'Mobile Legends',
      category: 'cat-mlbb',
      price: 850000,
      discount_price: 750000,
      stock: 1,
      description:
        'Akun pribadi tangan pertama, all unbind bebas ganti email Moonton. Total 345 skin, 4 Skin Collector (Chou, Gusion, Balmond, Nana), 12 Epic Limited, KOF Iori Yagami, Winrate Ranked 68.4%. Siap tempur turnamen.',
      account_details:
        'Login Moonton Email: mlbb.chou.pro@mail.com | Pass: VortexML@2026# | Status: All Unbind Bersih (GP/FB/VK kosong)',
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const p2: Product = {
      id: 'prod-val-01',
      name: 'Valorant Immortal 3 - Vandal Kuronami, Reaver, Araxys & Champions 2023',
      game: 'Valorant',
      category: 'cat-val',
      price: 1450000,
      discount_price: 1290000,
      stock: 1,
      description:
        'Akun server APAC / Indonesia. Region Indo asli bukan turki/argentina. Full skin Vandal meta, Phantom Oni + Recon, Karambit Champions 2023, Reaver Knife. Peak Immortal 3 (310 RR). Email pertama (OGE) disertakan.',
      account_details:
        'Riot ID: VORTEX_SHADOW#APAC | Email OGE: val.shadow@mail.com | Pass: Valorant2026!# | 2FA Ready to Transfer',
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
          url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
          sort_order: 1,
          is_primary: false,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    for (const p of [p1, p2]) {
      await pool.query(
        `INSERT INTO products (
          id, name, game, category, price, discount_price, stock, description,
          account_details, rank, level, skins, items, status, is_archived, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING`,
        [
          p.id,
          p.name,
          p.game,
          p.category,
          p.price,
          p.discount_price,
          p.stock,
          p.description,
          p.account_details,
          p.rank,
          p.level,
          p.skins,
          p.items,
          p.status,
          p.is_archived,
        ]
      );
      for (const img of p.images) {
        await pool.query(
          `INSERT INTO product_images (id, product_id, url, sort_order, is_primary)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [img.id, img.product_id, img.url, img.sort_order, img.is_primary]
        );
      }
    }
  }
}
