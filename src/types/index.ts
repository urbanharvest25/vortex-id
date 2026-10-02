export type UserRole = 'ADMIN' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone?: string;
  role: UserRole;
  status: 'ACTIVE' | 'BANNED';
  created_at: string;
  updated_at: string;
}

export type ProductStatus = 'AVAILABLE' | 'SOLD_OUT' | 'ARCHIVED' | 'INACTIVE';

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  name: string;
  game: string;
  category: string;
  price: number;
  discount_price?: number;
  stock: number;
  description: string;
  account_details: string; // Sensitive credential information (protected)
  rank?: string;
  level?: string;
  skins?: string;
  items?: string;
  status: ProductStatus;
  is_archived: boolean;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  game: string;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'QRIS' | 'BANK_TRANSFER' | 'EWALLET' | 'WHATSAPP_CONFIRMATION';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_game: string;
  price: number;
  quantity: number;
  product_image?: string;
}

export interface Order {
  id: string;
  order_number: string;
  invoice_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subtotal: number;
  discount_amount: number;
  voucher_amount: number;
  total: number;
  voucher_code?: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  notes?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  delivered_credentials?: string; // Revealed only when order is COMPLETED and accessed securely
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  qris_url?: string;
  proof_image?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subtotal: number;
  discount_amount: number;
  voucher_amount: number;
  total: number;
  payment_method: PaymentMethod;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  items: OrderItem[];
  created_at: string;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface Voucher {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number; // e.g. 10 for 10% or 50000 for Rp50.000
  min_purchase: number;
  max_discount?: number;
  usage_limit: number;
  used_count: number;
  per_user_limit: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  applicable_category?: string;
  applicable_game?: string;
  created_at: string;
}

export interface VoucherUsage {
  id: string;
  voucher_id: string;
  user_id: string;
  order_id: string;
  used_at: string;
}

export interface Discount {
  id: string;
  name: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase: number;
  max_discount?: number;
  target_type: 'ALL' | 'CATEGORY' | 'GAME' | 'PRODUCT';
  target_id?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface Rating {
  id: string;
  product_id: string;
  product_name?: string;
  user_id: string;
  order_id: string;
  user_name: string;
  rating: number; // 1-5
  review: string;
  is_hidden: boolean;
  created_at: string;
}

export interface ServiceReview {
  id: string;
  user_id: string;
  order_id: string;
  user_name: string;
  rating: number; // 1-5
  comment: string;
  is_hidden: boolean;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  tagline: string;
  phone: string;
  whatsapp_number: string;
  whatsapp_link_number: string;
  whatsapp_default_message: string;
  logo_url: string;
  favicon_url: string;
  terms_conditions: string;
  refund_policy: string;
  cancellation_policy: string;
  gaming_disclaimer: string;
  updated_at: string;
}

export type ThemeMode = 'DARK' | 'LIGHT' | 'CUSTOM';

export interface ThemeSettings {
  id: string;
  theme_mode: ThemeMode;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  button_color: string;
  accent_color: string;
  banner_image: string;
  banner_title: string;
  banner_subtitle: string;
  updated_at: string;
}

export interface QrisSettings {
  id: string;
  is_active: boolean;
  image_url: string;
  account_name: string;
  nmid?: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error_message?: string;
  order_id?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ProductView {
  id: string;
  product_id: string;
  viewed_at: string;
}

export interface AnalyticsSummary {
  total_products: number;
  active_products: number;
  out_of_stock_products: number;
  total_customers: number;
  total_transactions: number;
  completed_transactions: number;
  pending_transactions: number;
  cancelled_transactions: number;
  total_revenue: number;
  revenue_today: number;
  revenue_this_month: number;
  total_vouchers_used: number;
  total_discount_given: number;
  total_ratings: number;
  average_store_rating: number;
  average_service_rating: number;
  sales_chart: {
    daily: { label: string; revenue: number; orders: number }[];
    weekly: { label: string; revenue: number; orders: number }[];
    monthly: { label: string; revenue: number; orders: number }[];
  };
  top_selling_products: { id: string; name: string; game: string; sold_count: number; revenue: number }[];
  most_viewed_products: { id: string; name: string; game: string; views: number }[];
  top_revenue_products: { id: string; name: string; game: string; revenue: number }[];
  top_rated_products: { id: string; name: string; game: string; avg_rating: number; review_count: number }[];
}

export interface ProductPerformance {
  product_id: string;
  product_name: string;
  game: string;
  views: number;
  checkouts: number;
  sold_count: number;
  total_transactions: number;
  total_revenue: number;
  cancellations: number;
  rating_count: number;
  average_rating: number;
  conversion_rate: number;
}
