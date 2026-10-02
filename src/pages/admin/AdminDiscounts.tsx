import React, { useState, useEffect } from 'react';
import { Percent, Plus, Edit2, Trash2, X } from 'lucide-react';
import { Discount } from '../../types/index.js';
import { fetchApi, formatRupiah, formatDate } from '../../lib/api.js';

export const AdminDiscounts: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    discount_type: 'PERCENTAGE' as Discount['discount_type'],
    discount_value: 5,
    min_purchase: 50000,
    max_discount: 30000,
    target_type: 'ALL' as Discount['target_type'],
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '2030-12-31',
    is_active: true,
  });

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; data: Discount[] }>('/admin/discounts');
      if (res.success && res.data) {
        setDiscounts(res.data);
      }
    } catch (err) {
      console.error('Error loading discounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const openAddModal = () => {
    setEditingDiscount(null);
    setFormData({
      name: '',
      discount_type: 'PERCENTAGE',
      discount_value: 5,
      min_purchase: 50000,
      max_discount: 30000,
      target_type: 'ALL',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: '2030-12-31',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (d: Discount) => {
    setEditingDiscount(d);
    setFormData({
      name: d.name,
      discount_type: d.discount_type,
      discount_value: d.discount_value,
      min_purchase: d.min_purchase,
      max_discount: d.max_discount || 0,
      target_type: d.target_type,
      start_date: d.start_date.slice(0, 10),
      end_date: d.end_date.slice(0, 10),
      is_active: d.is_active,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      const payload = {
        ...formData,
        discount_value: Number(formData.discount_value),
        min_purchase: Number(formData.min_purchase),
        max_discount: formData.max_discount ? Number(formData.max_discount) : undefined,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };

      if (editingDiscount) {
        const res = await fetchApi<{ success: boolean; message: string }>(
          `/admin/discounts/${editingDiscount.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );
        if (res.success) {
          setToastMessage('Diskon berhasil diperbarui.');
          setIsModalOpen(false);
          loadDiscounts();
        }
      } else {
        const res = await fetchApi<{ success: boolean; message: string }>('/admin/discounts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          setToastMessage('Diskon baru berhasil dibuat.');
          setIsModalOpen(false);
          loadDiscounts();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan diskon.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus diskon "${name}"?`)) return;
    try {
      const res = await fetchApi<{ success: boolean; message: string }>(`/admin/discounts/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setToastMessage(res.message);
        loadDiscounts();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus diskon.');
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
            MANAJEMEN DISKON OTOMATIS
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Atur potongan promo flash sale atau diskon otomatis saat checkout belanja.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Buat Diskon Baru
        </button>
      </div>

      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Memuat diskon...</p>
          </div>
        ) : discounts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">Belum ada promo diskon otomatis.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] bg-slate-900/60">
                  <th className="py-3 px-4">Nama Diskon</th>
                  <th className="py-3 px-4">Besaran Diskon</th>
                  <th className="py-3 px-4">Min. Belanja</th>
                  <th className="py-3 px-4">Maks. Potongan</th>
                  <th className="py-3 px-4">Target Produk</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 font-bold text-white">{d.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {d.discount_type === 'PERCENTAGE'
                        ? `${d.discount_value}% OFF`
                        : formatRupiah(d.discount_value)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{formatRupiah(d.min_purchase)}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {d.max_discount ? formatRupiah(d.max_discount) : 'Tanpa Batas'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{d.target_type}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {d.is_active ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(d)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.name)}
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
              {editingDiscount ? 'EDIT DISKON' : 'BUAT DISKON BARU'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">Atur nama diskon, jenis, dan batas belanja.</p>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nama Diskon *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Flash Sale Akhir Pekan 5%"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
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
                  <label className="block text-slate-300 font-medium mb-1">Nilai Diskon *</label>
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
                  <label className="block text-slate-300 font-medium mb-1">Min. Belanja (Rp)</label>
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
                  <span>Diskon Aktif</span>
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
                  {modalLoading ? 'Menyimpan...' : 'Simpan Diskon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
