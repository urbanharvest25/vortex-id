import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import { Product } from '../types/index.js';
import { fetchApi } from '../lib/api.js';
import { useStore } from '../context/StoreContext.js';
import { ProductCard } from '../components/ProductCard.js';

interface ProductsPageProps {
  navigate: (path: string) => void;
  initialSearch?: string;
  initialGame?: string;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  navigate,
  initialSearch = '',
  initialGame = '',
}) => {
  const { addToCart } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [selectedGame, setSelectedGame] = useState(initialGame);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'price_asc' | 'price_desc' | 'popular'>('latest');

  const games = [
    'Semua Game',
    'Mobile Legends',
    'Valorant',
    'Free Fire',
    'Genshin Impact',
    'PUBG Mobile',
    'Roblox',
  ];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedGame && selectedGame !== 'Semua Game') params.append('game', selectedGame);
      if (inStockOnly) params.append('inStockOnly', 'true');
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      params.append('sortBy', sortBy);

      const res = await fetchApi<{ success: boolean; data: Product[] }>(`/products?${params.toString()}`);
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedGame, inStockOnly, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedGame('Semua Game');
    setInStockOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('latest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wide">
            KATALOG AKUN GAMING
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Temukan akun sultan bergaransi resmi Vortex ID. Seluruh akun telah diverifikasi.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 w-fit">
          Menampilkan <strong className="text-cyan-400">{products.length}</strong> akun game
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0f172a] p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
        {/* Top search & Sort */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama akun, rank, skin (contoh: Chou Collector, Radiant)..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400 placeholder-slate-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
            >
              Cari
            </button>
          </form>

          {/* Sort By Dropdown */}
          <div className="relative flex items-center">
            <ArrowUpDown className="absolute left-3 w-4 h-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="latest">Urutkan: Terbaru</option>
              <option value="price_asc">Harga: Terendah ke Tertinggi</option>
              <option value="price_desc">Harga: Tertinggi ke Terendah</option>
              <option value="popular">Paling Banyak Dilihat</option>
            </select>
          </div>
        </div>

        {/* Game Filters Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {games.map((g) => {
            const isSelected = selectedGame === g || (g === 'Semua Game' && (!selectedGame || selectedGame === 'Semua Game'));
            return (
              <button
                key={g}
                onClick={() => setSelectedGame(g === 'Semua Game' ? '' : g)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>

        {/* Extra Filters (Stock & Price Range) */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <span>Hanya Akun Tersedia (Ready Stock)</span>
            </label>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Harga:</span>
              <input
                type="number"
                placeholder="Min Rp"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-24 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Maks Rp"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-24 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
              />
              <button
                type="button"
                onClick={fetchProducts}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer"
              >
                Terapkan
              </button>
            </div>
          </div>

          {(search || selectedGame || inStockOnly || minPrice || maxPrice) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Product List Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono">Memuat produk akun game...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 bg-slate-900/40 rounded-3xl border border-slate-800 text-center max-w-lg mx-auto p-8 space-y-4">
          <p className="text-slate-300 font-bold">Tidak ada akun yang sesuai dengan filter pencarian.</p>
          <p className="text-xs text-slate-500">
            Coba ubah kata kunci pencarian atau reset filter untuk melihat seluruh katalog.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
          >
            Tampilkan Semua Akun
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
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
    </div>
  );
};
