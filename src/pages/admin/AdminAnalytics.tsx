import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Eye,
  ShoppingCart,
  Star,
  Calendar,
  XCircle,
  Percent,
} from 'lucide-react';
import { AnalyticsSummary, ProductPerformance } from '../../types/index.js';
import { fetchApi, formatRupiah } from '../../lib/api.js';

export const AdminAnalytics: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [performance, setPerformance] = useState<ProductPerformance[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<'today' | '7days' | '30days' | 'month' | 'all'>('7days');
  const [chartType, setChartType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, perfRes] = await Promise.all([
        fetchApi<{ success: boolean; data: AnalyticsSummary }>('/admin/analytics'),
        fetchApi<{ success: boolean; data: ProductPerformance[] }>(`/admin/performance?filter=${filterPeriod}`),
      ]);

      if (sumRes.success && sumRes.data) setSummary(sumRes.data);
      if (perfRes.success && perfRes.data) setPerformance(perfRes.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterPeriod]);

  if (loading && !summary) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono">Menghitung analitik dan performa akun...</p>
      </div>
    );
  }

  const activeChartData =
    summary?.sales_chart?.[chartType] || [];
  const maxRevenueInChart = Math.max(...activeChartData.map((d) => d.revenue), 1000000);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white font-mono tracking-wide">
            ANALYTICS & PERFORMA AKUN
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Metrik penjualan toko, konversi checkout, dan analisis performa per akun game.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Total Omzet Keseluruhan</span>
          <h3 className="text-xl sm:text-2xl font-black text-white font-mono">
            {formatRupiah(summary?.total_revenue || 0)}
          </h3>
          <span className="text-[10px] text-cyan-400 font-mono mt-1 block">
            Bulan Ini: {formatRupiah(summary?.revenue_this_month || 0)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Transaksi Selesai</span>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {summary?.completed_transactions || 0}
          </h3>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            Pending: {summary?.pending_transactions || 0} • Batal: {summary?.cancelled_transactions || 0}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Total Diskon & Voucher</span>
          <h3 className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
            {formatRupiah(summary?.total_discount_given || 0)}
          </h3>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            {summary?.total_vouchers_used || 0} voucher digunakan
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Rata-rata Rating Toko</span>
          <h3 className="text-xl sm:text-2xl font-black text-amber-400 font-mono flex items-center gap-1">
            <Star className="w-5 h-5 fill-amber-400" />
            {summary?.average_store_rating || 5.0}★
          </h3>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            Dari {summary?.total_ratings || 0} ulasan produk
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Grafik Tren Penjualan
            </h3>
            <p className="text-xs text-slate-400">Visualisasi omzet pendapatan dan pesanan masuk</p>
          </div>

          <div className="flex gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setChartType('daily')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                chartType === 'daily' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400'
              }`}
            >
              Harian (7 Hari)
            </button>
            <button
              onClick={() => setChartType('weekly')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                chartType === 'weekly' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400'
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setChartType('monthly')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                chartType === 'monthly' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400'
              }`}
            >
              Bulanan
            </button>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-56 flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-slate-800">
          {activeChartData.map((bar, idx) => {
            const heightPercent = Math.max(10, Math.round((bar.revenue / maxRevenueInChart) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] text-cyan-300 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatRupiah(bar.revenue)}
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[48px] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-lg transition-all group-hover:brightness-125 shadow-md shadow-cyan-500/20"
                />
                <span className="text-[10px] font-mono text-slate-400">{bar.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 4 Performance Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Selling */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-400" /> Produk Paling Banyak Terjual
          </h4>
          <div className="divide-y divide-slate-800 text-xs">
            {summary?.top_selling_products?.map((p, i) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-white line-clamp-1 max-w-xs">{p.name}</p>
                    <span className="text-[10px] text-cyan-400 font-mono">{p.game}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-400 block">{p.sold_count} Terjual</span>
                  <span className="text-[10px] text-slate-500 font-mono">{formatRupiah(p.revenue)}</span>
                </div>
              </div>
            ))}
            {(!summary?.top_selling_products || summary.top_selling_products.length === 0) && (
              <div className="py-4 text-center text-slate-500 text-xs">Belum ada data penjualan.</div>
            )}
          </div>
        </div>

        {/* Most Viewed */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" /> Produk Paling Banyak Dilihat
          </h4>
          <div className="divide-y divide-slate-800 text-xs">
            {summary?.most_viewed_products?.map((p, i) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-white line-clamp-1 max-w-xs">{p.name}</p>
                    <span className="text-[10px] text-cyan-400 font-mono">{p.game}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-cyan-400">{p.views} Views</span>
              </div>
            ))}
            {(!summary?.most_viewed_products || summary.most_viewed_products.length === 0) && (
              <div className="py-4 text-center text-slate-500 text-xs">Belum ada data view.</div>
            )}
          </div>
        </div>
      </div>

      {/* Performa Akun Table with Date Filter */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Tabel Performa Akun Detail
            </h3>
            <p className="text-xs text-slate-400">
              Analisis konversi dari view, checkout, hingga omzet dan pembatalan
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={filterPeriod}
              onChange={(e: any) => setFilterPeriod(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
            >
              <option value="today">Hari Ini</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="30days">30 Hari Terakhir</option>
              <option value="month">Bulan Ini</option>
              <option value="all">Semua Waktu</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] bg-slate-900/60">
                <th className="py-3 px-4">Nama Akun & Game</th>
                <th className="py-3 px-4 text-center">Dilihat</th>
                <th className="py-3 px-4 text-center">Checkout</th>
                <th className="py-3 px-4 text-center">Terjual</th>
                <th className="py-3 px-4">Total Omzet</th>
                <th className="py-3 px-4 text-center">Batal</th>
                <th className="py-3 px-4 text-center">Rating</th>
                <th className="py-3 px-4 text-right">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {performance.map((p) => (
                <tr key={p.product_id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4">
                    <p className="text-white font-bold max-w-xs truncate">{p.product_name}</p>
                    <span className="text-[10px] text-cyan-400 font-mono">{p.game}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">{p.views}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">{p.checkouts}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                    {p.sold_count}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {formatRupiah(p.total_revenue)}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-rose-400">{p.cancellations}</td>
                  <td className="py-3 px-4 text-center font-mono text-amber-400">
                    {p.average_rating}★ ({p.rating_count})
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400">
                    {p.conversion_rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
