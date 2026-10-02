import React from 'react';
import { ShieldCheck, Tag, ShoppingCart, Eye } from 'lucide-react';
import { Product } from '../types/index.js';
import { formatRupiah } from '../lib/api.js';

interface ProductCardProps {
  product: Product;
  onView: (id: string) => void;
  onBuy: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onView, onBuy }) => {
  const primaryImage =
    product.images.find((img) => img.is_primary)?.url ||
    product.images[0]?.url ||
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';

  const isDiscounted = product.discount_price !== undefined && product.discount_price < product.price;
  const activePrice = isDiscounted ? product.discount_price! : product.price;
  const isOutOfStock = product.stock <= 0 || product.status === 'SOLD_OUT';

  const discountPercent = isDiscounted
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;

  return (
    <div className="group relative bg-[#0f172a]/90 hover:bg-[#131d33] border border-slate-800 hover:border-cyan-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 flex flex-col">
      {/* Top Image & Badges */}
      <div
        onClick={() => onView(product.id)}
        className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900 cursor-pointer"
      >
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-slate-700/60 text-cyan-300 text-[11px] font-bold tracking-wider uppercase font-mono">
            {product.game}
          </span>
          {isDiscounted && (
            <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-black uppercase flex items-center gap-1 shadow-md shadow-rose-500/30">
              <Tag className="w-3 h-3" />
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Stock Badge */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 rounded-md bg-rose-600/90 text-white text-[11px] font-bold tracking-wider uppercase shadow-md">
              Habis
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/90 text-slate-950 text-[11px] font-black tracking-wider uppercase shadow-md">
              Tersedia
            </span>
          )}
        </div>

        {/* Quick View Hover Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold shadow-lg">
            <Eye className="w-4 h-4" />
            Detail Akun
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rank & Spec Pills */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            {product.rank && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/60">
                {product.rank}
              </span>
            )}
            {product.level && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/60">
                {product.level}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-cyan-950/50 text-cyan-400 text-[11px] font-medium border border-cyan-800/40 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> All Unbind
            </span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onView(product.id)}
            className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 cursor-pointer leading-snug mb-2"
          >
            {product.name}
          </h3>

          {/* Skin / Item Highlights */}
          {product.skins && (
            <p className="text-xs text-slate-400 line-clamp-1 mb-3">
              <strong className="text-slate-300">Skins:</strong> {product.skins}
            </p>
          )}
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-slate-800/80 mt-2">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
              {formatRupiah(activePrice)}
            </span>
            {isDiscounted && (
              <span className="text-xs text-slate-500 line-through font-mono">
                {formatRupiah(product.price)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onView(product.id)}
              className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition text-center border border-slate-700/60 cursor-pointer"
            >
              Lihat Detail
            </button>
            <button
              disabled={isOutOfStock}
              onClick={() => onBuy(product)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {isOutOfStock ? 'Habis' : 'Beli'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
