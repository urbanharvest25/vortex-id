import React, { useState, useEffect } from 'react';
import { QrCode, Upload, CheckCircle2, AlertCircle, Trash2, X } from 'lucide-react';
import { QrisSettings } from '../../types/index.js';
import { fetchApi } from '../../lib/api.js';

export const AdminQris: React.FC = () => {
  const [qris, setQris] = useState<QrisSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountName, setAccountName] = useState('');
  const [nmid, setNmid] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');

  const loadQris = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; data: QrisSettings }>('/admin/qris');
      if (res.success && res.data) {
        setQris(res.data);
        setAccountName(res.data.account_name);
        setNmid(res.data.nmid || '');
        setIsActive(res.data.is_active);
        setImageUrl(res.data.image_url);
      }
    } catch (err) {
      console.error('Error loading QRIS:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQris();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Hanya format JPG, PNG, atau WEBP yang diperbolehkan.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB.');
      return;
    }

    setUploadLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const uploadRes = await fetchApi<{ success: boolean; url: string }>('/admin/upload-image', {
          method: 'POST',
          body: JSON.stringify({ imageData: base64, mimeType: file.type }),
        });

        if (uploadRes.success && uploadRes.url) {
          setImageUrl(uploadRes.url);
          setToastMessage('Foto QRIS berhasil diunggah.');
        }
        setUploadLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah QRIS.');
      setUploadLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean; message: string; data: QrisSettings }>(
        '/admin/qris',
        {
          method: 'PUT',
          body: JSON.stringify({
            account_name: accountName.trim(),
            nmid: nmid.trim(),
            is_active: isActive,
            image_url: imageUrl,
          }),
        }
      );
      if (res.success) {
        setToastMessage('Pengaturan QRIS berhasil disimpan.');
        loadQris();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan QRIS.');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="p-1 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-black text-white font-mono tracking-wide">
          PENGATURAN QRIS TOKO
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Unggah QRIS statis / dinamis toko Anda untuk menerima pembayaran otomatis dari seluruh bank & e-wallet.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-6">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-48 h-48 rounded-2xl bg-white p-3 border-2 border-slate-700 flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
              {imageUrl ? (
                <img src={imageUrl} alt="QRIS Preview" className="w-full h-full object-contain" />
              ) : (
                <div className="text-slate-400 text-center space-y-1">
                  <QrCode className="w-12 h-12 mx-auto text-slate-300" />
                  <span className="text-[10px] block">Belum ada QRIS</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3 text-center sm:text-left">
              <h4 className="text-sm font-bold text-white">Unggah Gambar QRIS</h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Pastikan gambar QRIS jelas dan dapat dipindai oleh aplikasi BCA, Mandiri, Dana, GoPay, dan OVO.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadLoading ? 'Mengunggah...' : 'Upload File QRIS'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>

                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nama Akun QRIS (Merchant Name) *</label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Contoh: VORTEX ID - OFFICIAL STORE"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Nomor NMID (Opsional)</label>
              <input
                type="text"
                value={nmid}
                onChange={(e) => setNmid(e.target.value)}
                placeholder="ID10202619822250"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Aktifkan QRIS di Pilihan Checkout Customer</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              Simpan Pengaturan QRIS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
