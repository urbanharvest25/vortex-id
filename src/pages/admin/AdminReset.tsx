import React, { useState } from 'react';
import { AlertTriangle, Trash2, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { fetchApi } from '../../lib/api.js';

export const AdminReset: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const categories = [
    { id: 'ALL', name: 'RESET SEMUA DATA OPERASIONAL (Total Kosong)', desc: 'Produk=0, Stok=0, Transaksi=0, Invoice=0, Voucher=0, Omzet=Rp0' },
    { id: 'produk', name: 'Reset Produk Saja', desc: 'Menghapus seluruh katalog akun game dan statistik view' },
    { id: 'stok', name: 'Reset Stok Menjadi 0', desc: 'Mengubah stok semua produk menjadi 0 (Habis)' },
    { id: 'transaksi', name: 'Reset Riwayat Transaksi & Pembayaran', desc: 'Menghapus histori pesanan customer' },
    { id: 'invoice', name: 'Reset Nota Invoice', desc: 'Mengosongkan seluruh arsip invoice' },
    { id: 'voucher', name: 'Reset Kode Voucher', desc: 'Menghapus seluruh kupon diskon' },
    { id: 'diskon', name: 'Reset Promo Diskon', desc: 'Menghapus potongan otomatis' },
    { id: 'rating', name: 'Reset Ulasan & Rating', desc: 'Menghapus ulasan produk dan review layanan' },
    { id: 'analytics', name: 'Reset Statistik View & Analytics', desc: 'Mengosongkan counter pengunjung produk' },
    { id: 'customer', name: 'Reset Akun Pelanggan (Kecuali Admin)', desc: 'Menghapus customer biasa' },
    { id: 'audit_log', name: 'Reset Catatan Audit Log', desc: 'Membersihkan riwayat log aktivitas admin' },
  ];

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.trim() !== 'RESET VORTEX') {
      setError('Teks konfirmasi wajib diketik "RESET VORTEX" secara tepat.');
      return;
    }

    if (!password) {
      setError('Masukkan kata sandi Administrator Anda untuk verifikasi keamanan.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetchApi<{ success: boolean; message: string }>('/admin/reset', {
        method: 'POST',
        body: JSON.stringify({
          confirmationText: confirmText.trim(),
          password,
          category: selectedCategory,
        }),
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setConfirmText('');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan reset data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-black text-rose-500 font-mono tracking-wide flex items-center gap-2">
          <AlertTriangle className="w-7 h-7" /> RESET DATA OPERASIONAL TOKO
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Fitur ini digunakan untuk mengosongkan data toko agar siap digunakan dari nol (fresh store).
        </p>
      </div>

      {/* Red Warning Banner */}
      <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/40 text-rose-300 space-y-2 shadow-xl">
        <div className="flex items-center gap-2 text-rose-400 font-bold font-mono">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>PERINGATAN TINGKAT TINGGI</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-200">
          PERINGATAN: Data yang dipilih akan dihapus/reset secara permanen dan tindakan ini tidak dapat dibatalkan.
          Akun Admin utama, pengaturan tema, logo, dan struktur database akan tetap aman dipertahankan.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reset Form */}
      <form onSubmit={handleResetSubmit} className="p-6 sm:p-8 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-6 text-xs shadow-xl">
        <div>
          <label className="block text-slate-300 font-medium mb-1.5">Pilih Kategori Data yang Ingin Di-Reset:</label>
          <div className="space-y-2">
            {categories.map((c) => (
              <label
                key={c.id}
                className={`p-3 rounded-xl border flex items-start gap-3 transition cursor-pointer ${
                  selectedCategory === c.id
                    ? c.id === 'ALL'
                      ? 'bg-rose-950/40 border-rose-500/60 shadow-md shadow-rose-500/10'
                      : 'bg-cyan-950/40 border-cyan-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="resetCategory"
                  value={c.id}
                  checked={selectedCategory === c.id}
                  onChange={() => setSelectedCategory(c.id)}
                  className="mt-0.5 text-cyan-500 focus:ring-0"
                />
                <div>
                  <h4 className={`font-bold ${selectedCategory === c.id && c.id === 'ALL' ? 'text-rose-400' : 'text-white'}`}>
                    {c.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{c.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Ketik <span className="font-mono text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/10">RESET VORTEX</span> untuk konfirmasi:
            </label>
            <input
              type="text"
              required
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Ketik RESET VORTEX"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-rose-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Kata Sandi Akun Administrator:
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={loading || confirmText !== 'RESET VORTEX'}
            className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-wider text-xs shadow-lg shadow-rose-600/30 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {loading ? 'Memproses Reset...' : 'Eksekusi Reset Sekarang'}
          </button>
        </div>
      </form>
    </div>
  );
};
