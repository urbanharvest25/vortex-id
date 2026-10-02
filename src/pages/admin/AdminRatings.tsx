import React, { useState, useEffect } from 'react';
import { Star, Eye, EyeOff, Trash2, CheckCircle2, X } from 'lucide-react';
import { Rating, ServiceReview } from '../../types/index.js';
import { fetchApi, formatDate } from '../../lib/api.js';

export const AdminRatings: React.FC = () => {
  const [productRatings, setProductRatings] = useState<Rating[]>([]);
  const [serviceReviews, setServiceReviews] = useState<ServiceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'product' | 'service'>('product');
  const [toastMessage, setToastMessage] = useState('');

  const loadRatings = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{
        success: boolean;
        data: { product_ratings: Rating[]; service_reviews: ServiceReview[] };
      }>('/admin/ratings');
      if (res.success && res.data) {
        setProductRatings(res.data.product_ratings || []);
        setServiceReviews(res.data.service_reviews || []);
      }
    } catch (err) {
      console.error('Error loading ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRatings();
  }, []);

  const handleToggleVisibility = async (id: string, currentlyHidden: boolean) => {
    try {
      const res = await fetchApi<{ success: boolean; message: string }>(
        `/admin/ratings/${id}/visibility`,
        {
          method: 'PUT',
          body: JSON.stringify({ is_hidden: !currentlyHidden }),
        }
      );
      if (res.success) {
        setToastMessage(res.message);
        loadRatings();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah visibilitas rating.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus ulasan ini secara permanen?')) return;
    try {
      const res = await fetchApi<{ success: boolean; message: string }>(`/admin/ratings/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setToastMessage(res.message);
        loadRatings();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus rating.');
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="p-1 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-black text-white font-mono tracking-wide">
          MODERASI RATING & REVIEW
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Tinjau ulasan produk akun dan penilaian pelayanan toko dari pembeli terverifikasi.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setTab('product')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            tab === 'product'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Ulasan Akun Game ({productRatings.length})
        </button>
        <button
          onClick={() => setTab('service')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            tab === 'service'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Ulasan Layanan Toko ({serviceReviews.length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Memuat ulasan...</p>
          </div>
        ) : (tab === 'product' ? productRatings : serviceReviews).length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">Belum ada ulasan untuk kategori ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] bg-slate-900/60">
                  <th className="py-3 px-4">Pengguna & Tanggal</th>
                  {tab === 'product' && <th className="py-3 px-4">Produk</th>}
                  <th className="py-3 px-4">Bintang</th>
                  <th className="py-3 px-4">Ulasan / Komentar</th>
                  <th className="py-3 px-4">Visibilitas</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {tab === 'product'
                  ? productRatings.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4">
                          <p className="text-white font-bold">{r.user_name}</p>
                          <span className="text-[10px] text-slate-500">{formatDate(r.created_at)}</span>
                        </td>
                        <td className="py-3 px-4 text-cyan-400 font-bold max-w-xs truncate">
                          {r.product_name || r.product_id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < r.rating ? 'fill-amber-400' : 'text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 italic max-w-sm">"{r.review}"</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              !r.is_hidden
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {!r.is_hidden ? 'TAMPIL' : 'TERSEMBUNYI'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleVisibility(r.id, r.is_hidden)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                              title={r.is_hidden ? 'Tampilkan' : 'Sembunyikan'}
                            >
                              {r.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : serviceReviews.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4">
                          <p className="text-white font-bold">{s.user_name}</p>
                          <span className="text-[10px] text-slate-500">{formatDate(s.created_at)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < s.rating ? 'fill-amber-400' : 'text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 italic max-w-sm">"{s.comment}"</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              !s.is_hidden
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {!s.is_hidden ? 'TAMPIL' : 'TERSEMBUNYI'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleVisibility(s.id, s.is_hidden)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                            >
                              {s.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
