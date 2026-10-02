import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { fetchApi, formatRupiah, formatDate } from '../../lib/api.js';

interface CustomerStat {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: 'ACTIVE' | 'BANNED';
  total_orders: number;
  total_spent: number;
  created_at: string;
}

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; data: CustomerStat[] }>('/admin/customers');
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: 'ACTIVE' | 'BANNED') => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    try {
      const res = await fetchApi<{ success: boolean; message: string }>(`/admin/customers/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.success) {
        setToastMessage(res.message);
        loadCustomers();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status customer.');
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

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
          DATA PELANGGAN & CUSTOMER
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Daftar pengguna terdaftar, histori belanja, dan manajemen status akun.
        </p>
      </div>

      <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau no telepon..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 placeholder-slate-500"
          />
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Memuat data customer...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">Belum ada data customer terdaftar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] bg-slate-900/60">
                  <th className="py-3 px-4">Nama Pelanggan</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4 text-center">Total Pesanan</th>
                  <th className="py-3 px-4">Total Belanja</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4">
                      <p className="text-white font-bold">{c.name}</p>
                      <span className="text-[10px] text-slate-500">Terdaftar: {formatDate(c.created_at)}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{c.email}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400">{c.phone || '-'}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-white">{c.total_orders}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {formatRupiah(c.total_spent)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(c.id, c.status)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          c.status === 'ACTIVE'
                            ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                        }`}
                      >
                        {c.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
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
