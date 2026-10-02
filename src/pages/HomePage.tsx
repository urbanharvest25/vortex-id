import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldCheck,
  Zap,
  Tag,
  Star,
  Gamepad2,
  Flame,
  Crosshair,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Award,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.js';
import { Product, Voucher, ServiceReview } from '../types/index.js';
import { fetchApi, formatRupiah } from '../lib/api.js';
import { ProductCard } from '../components/ProductCard.js';
import { WhatsAppButton } from '../components/WhatsAppButton.js';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { storeSettings, themeSettings, categories, addToCart } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [serviceReviews, setServiceReviews] = useState<ServiceReview[]>([]);
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [prodRes, srvRes] = await Promise.all([
          fetchApi<{ success: boolean; data: Product[] }>('/products'),
          fetchApi<{ success: boolean; data: ServiceReview[] }>('/service-reviews'),
        ]);

        if (prodRes.success && prodRes.data) {
          setProducts(prodRes.data);
        }
        if (srvRes.success && srvRes.data) {
          setServiceReviews(srvRes.data);
        }
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/produk?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/produk');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedVoucher(code);
    setTimeout(() => setCopiedVoucher(null), 2000);
  };

  const discountedProducts = products.filter(
    (p) => p.discount_price && p.discount_price < p.price && p.stock > 0
  );
  const latestProducts = [...products].slice(0, 6);

  // Fallback demo vouchers if none fetched
  const displayVouchers = [
    {
      code: 'VORTEX10',
      title: 'Diskon 10% Spesial',
      desc: 'Min. belanja Rp100.000 (Maks Rp50.000)',
    },
    {
      code: 'VORTEXNEW',
      title: 'Potongan Rp25.000',
      desc: 'Min. belanja Rp150.000 untuk semua akun game',
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0e1626] to-[#080c14] border-b border-slate-800/80 pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wider uppercase font-mono shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>{storeSettings.tagline || 'Beli Aman, Main Nyaman.'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase font-mono">
              {themeSettings.banner_title || 'MARKETPLACE AKUN GAMING TERPERCAYA'}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
              {themeSettings.banner_subtitle ||
                'Beli Aman, Main Nyaman. Transaksi Instan, Garansi Penuh, & Verifikasi Data 100% Bebas Hack-Back.'}
            </p>

            {/* Hero Search Bar */}
            <form onSubmit={handleSearchSubmit} className="pt-2 max-w-xl mx-auto">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari akun MLBB, Valorant, Free Fire, Genshin..."
                  className="w-full pl-12 pr-28 py-3.5 sm:py-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 shadow-xl transition"
                />
                <button
                  type="submit"
                  className="absolute right-2 sm:right-2.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
                >
                  Cari
                </button>
              </div>
            </form>

            {/* Quick Game Tags */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <span className="text-slate-500 font-semibold">Populer:</span>
              {['Mobile Legends', 'Valorant', 'Free Fire', 'Genshin Impact'].map((g) => (
                <button
                  key={g}
                  onClick={() => navigate(`/produk?game=${encodeURIComponent(g)}`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition cursor-pointer"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. GAME CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide font-mono flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-cyan-400" />
              Kategori Game Populer
            </h2>
            <p className="text-xs text-slate-400">Pilih game favorit untuk melihat stok akun tersedia</p>
          </div>
          <button
            onClick={() => navigate('/produk')}
            className="text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { name: 'Mobile Legends', count: 'Tersedia', icon: Gamepad2, color: 'from-blue-600 to-indigo-800' },
            { name: 'Valorant', count: 'Tersedia', icon: Crosshair, color: 'from-rose-600 to-red-800' },
            { name: 'Free Fire', count: 'Tersedia', icon: Flame, color: 'from-amber-600 to-orange-800' },
            { name: 'Genshin Impact', count: 'Tersedia', icon: Sparkles, color: 'from-teal-600 to-emerald-800' },
            { name: 'PUBG Mobile', count: 'Tersedia', icon: ShieldCheck, color: 'from-yellow-600 to-amber-800' },
            { name: 'Roblox', count: 'Tersedia', icon: Zap, color: 'from-cyan-600 to-blue-800' },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.name}
                onClick={() => navigate(`/produk?game=${encodeURIComponent(cat.name)}`)}
                className="group p-4 rounded-2xl bg-[#0f172a] hover:bg-[#152238] border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer text-center flex flex-col items-center justify-center gap-2.5 shadow-md hover:shadow-cyan-500/10 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {cat.name}
                </h4>
                <span className="text-[10px] text-cyan-400/80 font-mono font-medium">Beli Akun</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. ACTIVE VOUCHER SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 border border-cyan-500/30 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase mb-2 font-mono">
                <Tag className="w-3.5 h-3.5" /> Voucher Diskon Spesial
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-mono">
                HEMAT TRANSAKSI DENGAN KODE VOUCHER
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Salin kode voucher di bawah ini dan masukkan pada halaman checkout untuk klaim potongan harga instan.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {displayVouchers.map((v) => (
                <div
                  key={v.code}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/50 border border-slate-700/80 shadow-inner"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{v.title}</span>
                    <span className="text-[10px] text-slate-400">{v.desc}</span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(v.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold font-mono transition cursor-pointer"
                  >
                    {copiedVoucher === v.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-slate-950" />
                        Disalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        {v.code}
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. FLASH SALE / DISCOUNTED PRODUCTS */}
      {discountedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/30">
                <Flame className="w-5 h-5 fill-rose-500" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide font-mono">
                  FLASH SALE AKUN SULTAN
                </h2>
                <p className="text-xs text-slate-400">Harga promo terbatas dengan jaminan keamanan 100%</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/produk')}
              className="text-xs sm:text-sm font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
            >
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {discountedProducts.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={(id) => navigate(`/produk/${id}`)}
                onBuy={(p) => {
                  addToCart(p, 1);
                  navigate('/checkout');
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. LATEST PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide font-mono flex items-center gap-2">
              <Zap className="w-6 h-6 text-cyan-400" />
              Katalog Akun Terbaru
            </h2>
            <p className="text-xs text-slate-400">Stok akun fresh siap pakai dan all unbind</p>
          </div>
          <button
            onClick={() => navigate('/produk')}
            className="text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua Akun <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Memuat katalog akun...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-sm">Belum ada akun yang diunggah.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={(id) => navigate(`/produk/${id}`)}
                onBuy={(p) => {
                  addToCart(p, 1);
                  navigate('/checkout');
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* 6. HOW TO BUY GUIDE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0b101b] border border-slate-800 text-center">
          <div className="max-w-2xl mx-auto space-y-3 mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
              CARA MEMBELI AKUN DI VORTEX ID
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Proses transaksi aman, mudah, dan transparan hanya dalam 3 langkah singkat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 relative">
              <span className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 font-black text-base flex items-center justify-center mb-4">
                1
              </span>
              <h4 className="text-base font-bold text-white mb-2">Pilih & Periksa Spesifikasi</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pilih akun game impian Anda. Cek foto detail (hingga 10 slide), rank, skin, status all unbind, dan
                deskripsi akun secara lengkap.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 relative">
              <span className="w-9 h-9 rounded-xl bg-blue-500 text-white font-black text-base flex items-center justify-center mb-4">
                2
              </span>
              <h4 className="text-base font-bold text-white mb-2">Checkout & Bayar Mudah</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Masukkan voucher diskon, pilih metode pembayaran otomatis via QRIS / Bank Transfer, lalu selesaikan
                pembayaran.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 relative">
              <span className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 font-black text-base flex items-center justify-center mb-4">
                3
              </span>
              <h4 className="text-base font-bold text-white mb-2">Terima Akun & Garansi Penuh</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Setelah pembayaran terkonfirmasi, data akun diserahkan dan dipandu untuk ganti email & password dengan
                garansi aman 100%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CUSTOMER SERVICE TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide font-mono flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" />
              Ulasan & Kepuasan Pelanggan
            </h2>
            <p className="text-xs text-slate-400">Testimoni nyata dari pembeli yang telah bertransaksi di Vortex ID</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(serviceReviews.length > 0
            ? serviceReviews.slice(0, 3)
            : [
                {
                  id: 'rev-1',
                  user_name: 'Dwi Prasetyo',
                  rating: 5,
                  comment: 'Proses cepat banget, ga sampai 10 menit akun MLBB Mythic Glory udah serah terima. All unbind beneran aman!',
                },
                {
                  id: 'rev-2',
                  user_name: 'Kevin Jonathan',
                  rating: 5,
                  comment: 'Beli akun Valorant Immortal, skin Kuronami & Prime sesuai deskripsi. Pelayanan admin ramah & terpercaya.',
                },
                {
                  id: 'rev-3',
                  user_name: 'Agus Setiawan',
                  rating: 5,
                  comment: 'Awalnya ragu beli akun online, tapi Vortex ID beneran aman dan bergaransi. Recommended JB gaming!',
                },
              ]
          ).map((rev) => (
            <div key={rev.id} className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-300 italic mb-4 leading-relaxed">"{rev.comment}"</p>
              </div>
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white">{rev.user_name}</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Pembeli Terverifikasi
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. WHATSAPP CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white font-mono">PUNYA PERTANYAAN SEPUTAR AKUN?</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Tim support Vortex ID siap membantu konsultasi akun, cek spesifikasi, dan panduan keamanan 24 jam via
              WhatsApp resmi.
            </p>
          </div>
          <WhatsAppButton
            customMessage="Halo Vortex ID, saya ingin bertanya mengenai produk akun gaming."
            showNumber
          />
        </div>
      </section>
    </div>
  );
};
