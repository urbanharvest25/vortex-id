import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Tag,
  ShoppingCart,
  MessageCircle,
  Star,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react';
import { Product, Rating } from '../types/index.js';
import { fetchApi, formatRupiah, formatDate } from '../lib/api.js';
import { useStore } from '../context/StoreContext.js';
import { ImageGallery } from '../components/ImageGallery.js';
import { WhatsAppButton } from '../components/WhatsAppButton.js';

interface ProductDetailPageProps {
  productId: string;
  navigate: (path: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId, navigate }) => {
  const { storeSettings, addToCart } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      try {
        const res = await fetchApi<{ success: boolean; data: any }>(`/products/${productId}`);
        if (res.success && res.data) {
          setProduct(res.data);
          if (res.data.rating_stats?.reviews) {
            setRatings(res.data.rating_stats.reviews);
          }
        } else {
          setError('Produk tidak ditemukan.');
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat detail produk.');
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [productId]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono">Memuat rincian akun game...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Produk Tidak Ditemukan</h2>
        <p className="text-xs text-slate-400">{error || 'Akun yang Anda cari tidak tersedia.'}</p>
        <button
          onClick={() => navigate('/produk')}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
        >
          Kembali ke Katalog
        </button>
      </div>
    );
  }

  const isDiscounted = product.discount_price !== undefined && product.discount_price < product.price;
  const activePrice = isDiscounted ? product.discount_price! : product.price;
  const isOutOfStock = product.stock <= 0 || product.status === 'SOLD_OUT';

  const discountPercent = isDiscounted
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;

  const avgRating =
    ratings.length > 0
      ? Number((ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1))
      : 5.0;

  const waAskMessage = `Halo Vortex ID, saya tertarik dengan produk:\n- Nama: ${product.name}\n- Game: ${product.game}\n- Harga: ${formatRupiah(activePrice)}\nApakah akun ini masih tersedia?`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <button onClick={() => navigate('/')} className="hover:text-cyan-400 transition cursor-pointer">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <button onClick={() => navigate('/produk')} className="hover:text-cyan-400 transition cursor-pointer">
          Produk
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-slate-200 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Col: Up to 10 Images Gallery */}
        <div className="lg:col-span-7">
          <ImageGallery images={product.images} productName={product.name} />
        </div>

        {/* Right Col: Product Info & Purchase Box */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Top Game & Stock Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-bold uppercase tracking-wider font-mono">
                {product.game}
              </span>

              {isOutOfStock ? (
                <span className="px-3 py-1 rounded-lg bg-rose-600/90 text-white text-xs font-bold tracking-wider uppercase shadow-md">
                  Stok Habis
                </span>
              ) : (
                <span className="px-3 py-1 rounded-lg bg-emerald-500/90 text-slate-950 text-xs font-black tracking-wider uppercase shadow-md">
                  Tersedia ({product.stock} Akun)
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">{product.name}</h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="font-bold text-white">{avgRating}</span>
              </div>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{ratings.length} Ulasan Pembeli</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Garansi Resmi
              </span>
            </div>

            {/* Pricing Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Harga Akun</span>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {formatRupiah(activePrice)}
                </span>
                {isDiscounted && (
                  <>
                    <span className="text-sm text-slate-500 line-through font-mono">
                      {formatRupiah(product.price)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-xs font-bold uppercase">
                      Hemat {discountPercent}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Key Specs Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Rank Akun</span>
                <strong className="text-white text-xs sm:text-sm font-semibold">{product.rank || 'N/A'}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Level Akun</span>
                <strong className="text-white text-xs sm:text-sm font-semibold">{product.level || 'N/A'}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2">
                <span className="text-slate-400 block text-[11px]">Koleksi Skin & Item</span>
                <strong className="text-white text-xs font-semibold">{product.skins || 'Lengkap sesuai foto'}</strong>
              </div>
            </div>

            {/* Guarantee Callout */}
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                <Lock className="w-4 h-4" />
                <span>Jaminan Transaksi Aman Vortex ID</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Akun bersih, all unbind bebas ganti data, dan bergaransi anti hack-back 100%.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              disabled={isOutOfStock}
              onClick={() => {
                addToCart(product, 1);
                navigate('/checkout');
              }}
              className={`w-full py-3.5 px-6 rounded-xl font-black text-sm tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25 active:scale-98'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              {isOutOfStock ? 'Akun Telah Terjual' : 'Beli Sekarang'}
            </button>

            <WhatsAppButton
              customMessage={waAskMessage}
              className="w-full justify-center py-3 text-xs"
              showNumber
            />
          </div>
        </div>
      </div>

      {/* Description & Account Specifications */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0b101b] border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" /> Deskripsi Lengkap Akun
        </h2>
        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {product.description}
        </div>
        {product.items && (
          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
            <strong className="text-slate-200">Item Tambahan: </strong> {product.items}
          </div>
        )}
      </div>

      {/* Customer Reviews & Ratings List */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0b101b] border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              Ulasan Pembeli ({ratings.length})
            </h2>
            <p className="text-xs text-slate-400">Rating asli dari customer terverifikasi</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-amber-400 font-mono">{avgRating}</span>
            <span className="text-xs text-slate-500"> / 5.0</span>
          </div>
        </div>

        {ratings.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Belum ada ulasan untuk produk ini. Ulasan dapat diberikan setelah Anda membeli dan menyelesaikan pesanan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ratings.map((r) => (
              <div key={r.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">
                      {r.user_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-white">{r.user_name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{formatDate(r.created_at)}</span>
                </div>

                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs text-slate-300 italic">"{r.review}"</p>
                <div className="pt-1">
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Pembeli Terverifikasi
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
