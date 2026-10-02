import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, X, Check, CheckCircle2 } from 'lucide-react';
import { Voucher } from '../../types/index.js';
import { fetchApi, formatRupiah, formatDate } from '../../lib/api.js';

export const AdminVouchers: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'PERCENTAGE' as Voucher['discount_type'],
    discount_value: 10,
    min_purchase: 100000,
    max_discount: 50000,
    usage_limit: 100,
    per_user_limit: 1,
    valid_from: new Date().toISOString().slice(0, 10),
    valid_until: '2030-12-31',
    is_active: true,
  });

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; data: Voucher[] }>('/admin/vouchers');
      if (res.success && res.data) {
        setVouchers(res.data);
      }
    } catch (err) {
      console.error('Error loading vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const openAddModal = () => {
    setEditingVoucher(null);
    setFormData({
      code: '',
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      min_purchase: 100000,
      max_discount: 50000,
      usage_limit: 100,
      per_user_limit: 1,
      valid_from: new Date().toISOString().slice(0, 10),
      valid_until: '2030-12-31',
      is_active: true,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (v: Voucher) => {
    setEditingVoucher(v);
    setFormData({
      code: v.code,
      discount_type: v.discount_type,
      discount_value: v.discount_value,
      min_purchase: v.min_purchase,
      max_discount: v.max_discount || 0,
      usage_limit: v.usage_limit,
      per_user_limit: v.per_user_limit,
      valid_from: v.valid_from.slice(0, 10),
      valid_until: v.valid_until.slice(0, 10),
      is_active: v.is_active,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setModalError('Kode voucher wajib diisi.');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        discount_value: Number(formData.discount_value),
        min_purchase: Number(formData.min_purchase),
        max_discount: formData.max_discount ? Number(formData.max_discount) : undefined,
        usage_limit: Number(formData.usage_limit),
        per_user_limit: Number(formData.per_user_limit),
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
      };

      if (editingVoucher) {
        const res = await fetchApi<{ success: boolean; message: string }>(
          `/admin/vouchers/${editingVoucher.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );
        if (res.success) {
          setToastMessage('Voucher berhasil diperbarui.');
          setIsModalOpen(false);
          loadVouchers();
        }
      } else {
        const res = await fetchApi<{ success: boolean; message: string }>('/admin/vouchers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          setToastMessage('Voucher baru berhasil dibuat.');
          setIsModalOpen(false);
          loadVouchers();
        }
      }
    } catch (err: any) {
      setModalError(err.message || 'Gagal menyimpan voucher.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteVoucher = async (id: string, code: string) => {
    if (!confirm(`Hapus voucher "${code}"?`)) return;
    try {
      const res = await fetchApi<{ success: boolean; message: string }>(`/admin/vouchers/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setToastMessage(res.message);
        loadVouchers();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus voucher.');
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white font-mono tracking-wide">
            MANAJEMEN KODE VOUCHER
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Buat voucher diskon belanja, atur batas kuota, minimal belanja, dan masa aktif.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Voucher Baru
        </button>
      </div>

      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Memuat data voucher...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">Belum ada voucher aktif.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] bg-slate-900/60">
                  <th className="py-3 px-4">Kode Voucher</th>
                  <th className="py-3 px-4">Nilai Diskon</th>
                  <th className="py-3 px-4">Min. Belanja</th>
                  <th className="py-3 px-4">Maks. Diskon</th>
                  <th className="py-3 px-4 text-center">Penggunaan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-black/60 border border-slate-700 font-mono font-bold text-cyan-400 text-xs">
                        {v.code}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {v.discount_type === 'PERCENTAGE'
                        ? `${v.discount_value}% OFF`
                        : formatRupiah(v.discount_value)}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {formatRupiah(v.min_purchase)}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {v.max_discount ? formatRupiah(v.max_discount) : 'Tanpa Batas'}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-slate-300">
                      <span className="text-cyan-400 font-bold">{v.used_count}</span> /{' '}
                      {v.usage_limit > 0 ? v.usage_limit : '∞'}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {v.is_active ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(v)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                          title="Edit Voucher"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteVoucher(v.id, v.code)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                          title="Hapus Voucher"
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

      {/* Add / Edit Voucher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-slate-200 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-white font-mono mb-1">
              {editingVoucher ? 'EDIT VOUCHER' : 'BUAT VOUCHER BARU'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">Atur parameter diskon dan limit pemakaian.</p>

            {modalError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Kode Voucher *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Contoh: VORTEX10"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tipe Diskon</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e: any) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="PERCENTAGE">Persentase (%)</option>
                    <option value="FIXED">Nominal Tetap (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Nilai Diskon ({formData.discount_type === 'PERCENTAGE' ? '%' : 'Rp'}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Min. Pembelian (Rp)</label>
                  <input
                    type="number"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData({ ...formData, min_purchase: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Maks. Diskon (Rp)</label>
                  <input
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: Number(e.target.value) })}
                    placeholder="0 jika tanpa batas"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kuota Pemakaian Total</label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Limit per User</label>
                  <input
                    type="number"
                    value={formData.per_user_limit}
                    onChange={(e) => setFormData({ ...formData, per_user_limit: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Voucher Aktif & Dapat Digunakan</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
                >
                  {modalLoading ? 'Menyimpan...' : 'Simpan Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
