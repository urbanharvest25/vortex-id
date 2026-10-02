import React, { useState, useEffect } from 'react';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Users,
  Star,
  Plus,
  ArrowUpRight,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { AnalyticsSummary, Order } from '../../types/index.js';
import { fetchApi, formatRupiah, formatDate } from '../../lib/api.js';

interface AdminDashboardProps {
  navigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate }) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [sumRes, ordRes] = await Promise.all([
          fetchApi<{ success: boolean; data: AnalyticsSummary }>('/admin/analytics'),
          fetchApi<{ success: boolean; data: Order[] }>('/admin/orders'),
        ]);

        if (sumRes.success && sumRes.data) {
          setSummary(sumRes.data);
        }
        if (ordRes.success && ordRes.data) {
          setRecentOrders(ordRes.data.slice(0, 5));
        }
      } catch (err) {
        console.error('Error loading admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono">Memuat data konsol admin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white font-mono tracking-wide">DASHBOARD UTAMA</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ringkasan performa operasional toko dan aktivitas transaksi terkini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Produk
          </button>
          <button
            onClick={() => navigate('/admin/orders')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition cursor-pointer"
          >
            Semua Transaksi
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omzet */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Omzet Masuk</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white font-mono">
              {formatRupiah(summary?.total_revenue || 0)}
            </h3>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> Hari ini: {formatRupiah(summary?.revenue_today || 0)}
            </span>
          </div>
        </div>

        {/* Transaksi Selesai */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Transaksi Selesai</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white font-mono">
              {summary?.completed_transactions || 0}
            </h3>
            <span className="text-[11px] text-slate-400 font-mono mt-1 block">
              Dari total {summary?.total_transactions || 0} pesanan
            </span>
          </div>
        </div>

        {/* Total Produk */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Katalog Akun Game</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white font-mono">{summary?.total_products || 0}</h3>
            <span className="text-[11px] text-cyan-400 font-medium mt-1 block">
              {summary?.active_products || 0} Ready Stock • {summary?.out_of_stock_products || 0} Terjual
            </span>
          </div>
        </div>

        {/* Total Customer & Rating */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Customer & Rating</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white font-mono">
              {summary?.average_store_rating || 5.0}★
            </h3>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {summary?.total_customers || 0} Customer terdaftar
            </span>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Pesanan Terbaru Masuk
            </h3>
            <p className="text-xs text-slate-400">Daftar transaksi akun yang perlu dipantau</p>
          </div>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
          >
            Lihat Semua →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">Belum ada transaksi pesanan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-mono uppercase">
                  <th className="py-2.5">Invoice</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Item Akun</th>
                  <th className="py-2.5">Total</th>
                  <th className="py-2.5">Status Pesanan</th>
                  <th className="py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 font-mono font-bold text-cyan-400">{o.invoice_number}</td>
                    <td className="py-3">
                      <p className="text-white font-bold">{o.customer_name}</p>
                      <span className="text-[10px] text-slate-500">{o.customer_email}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-slate-300 line-clamp-1">{o.items[0]?.product_name}</span>
                      <span className="text-[10px] text-cyan-400 font-mono">
                        {o.items[0]?.product_game} {o.items.length > 1 && `(+${o.items.length - 1} item)`}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-white">{formatRupiah(o.total)}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.order_status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : o.order_status === 'PAID'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : o.order_status === 'CANCELLED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {o.order_status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => navigate('/admin/orders')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                      >
                        Kelola
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Alerts */}
      {summary && summary.out_of_stock_products > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>
              Perhatian: Terdapat <strong>{summary.out_of_stock_products} produk akun</strong> dengan stok habis
              (0). Tambahkan stok baru atau edit produk.
            </span>
          </div>
          <button
            onClick={() => navigate('/admin/products')}
            className="px-3 py-1 bg-amber-400 text-slate-950 font-bold rounded-lg hover:bg-amber-300 cursor-pointer"
          >
            Lihat Produk
          </button>
        </div>
      )}
    </div>
  );
};
