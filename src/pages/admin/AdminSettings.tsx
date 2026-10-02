import React, { useState } from 'react';
import { Settings, Palette, Shield, Upload, CheckCircle2, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext.js';
import { fetchApi } from '../../lib/api.js';

export const AdminSettings: React.FC = () => {
  const { storeSettings, themeSettings, refreshSettings } = useStore();

  const [activeTab, setActiveTab] = useState<'store' | 'theme' | 'legal'>('store');
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Store Settings Form
  const [storeForm, setStoreForm] = useState({
    store_name: storeSettings.store_name,
    tagline: storeSettings.tagline,
    phone: storeSettings.phone,
    whatsapp_number: storeSettings.whatsapp_number,
    whatsapp_link_number: storeSettings.whatsapp_link_number,
    whatsapp_default_message: storeSettings.whatsapp_default_message,
    logo_url: storeSettings.logo_url || '',
    favicon_url: storeSettings.favicon_url || '',
    terms_conditions: storeSettings.terms_conditions,
    refund_policy: storeSettings.refund_policy,
    cancellation_policy: storeSettings.cancellation_policy,
    gaming_disclaimer: storeSettings.gaming_disclaimer,
  });

  // Theme Settings Form
  const [themeForm, setThemeForm] = useState({
    theme_mode: themeSettings.theme_mode,
    primary_color: themeSettings.primary_color,
    secondary_color: themeSettings.secondary_color,
    background_color: themeSettings.background_color,
    text_color: themeSettings.text_color,
    button_color: themeSettings.button_color,
    accent_color: themeSettings.accent_color,
    banner_image: themeSettings.banner_image,
    banner_title: themeSettings.banner_title,
    banner_subtitle: themeSettings.banner_subtitle,
  });

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; message: string }>('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(storeForm),
      });
      if (res.success) {
        setToastMessage('Pengaturan toko berhasil diperbarui.');
        await refreshSettings();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; message: string }>('/admin/theme', {
        method: 'PUT',
        body: JSON.stringify(themeForm),
      });
      if (res.success) {
        setToastMessage('Tema toko berhasil diperbarui dan diterapkan ke etalase.');
        await refreshSettings();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan tema.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const uploadRes = await fetchApi<{ success: boolean; url: string }>('/admin/upload-image', {
        method: 'POST',
        body: JSON.stringify({ imageData: base64, mimeType: file.type }),
      });
      if (uploadRes.success) {
        setStoreForm((prev) => ({ ...prev, logo_url: uploadRes.url }));
        setToastMessage('Logo berhasil diunggah.');
      }
    };
    reader.readAsDataURL(file);
  };

  const applyThemePreset = (preset: 'dark' | 'light' | 'cyan') => {
    if (preset === 'dark') {
      setThemeForm((prev) => ({
        ...prev,
        theme_mode: 'DARK',
        primary_color: '#00f0ff',
        secondary_color: '#3b82f6',
        background_color: '#080c14',
        text_color: '#f8fafc',
        button_color: '#00f0ff',
        accent_color: '#06b6d4',
      }));
    } else if (preset === 'light') {
      setThemeForm((prev) => ({
        ...prev,
        theme_mode: 'LIGHT',
        primary_color: '#0284c7',
        secondary_color: '#2563eb',
        background_color: '#0f172a',
        text_color: '#ffffff',
        button_color: '#0284c7',
        accent_color: '#0ea5e9',
      }));
    } else {
      setThemeForm((prev) => ({
        ...prev,
        theme_mode: 'CUSTOM',
        primary_color: '#10b981',
        secondary_color: '#059669',
        background_color: '#06130d',
        text_color: '#f8fafc',
        button_color: '#10b981',
        accent_color: '#34d399',
      }));
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
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
          PENGATURAN TOKO & BRANDING
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Ubah nama toko, logo, kontak WhatsApp, tema warna, banner hero, dan syarat ketentuan transaksi.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'store'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> Identitas & WhatsApp
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'theme'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5" /> Kustomisasi Tema & Banner
        </button>
        <button
          onClick={() => setActiveTab('legal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'legal'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> Syarat & Ketentuan Transaksi
        </button>
      </div>

      {/* 1. Store Identity Form */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveStore} className="p-6 sm:p-8 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800">
            <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
              {storeForm.logo_url ? (
                <img src={storeForm.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-3xl font-black text-cyan-400 font-mono">V</span>
              )}
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <h4 className="text-sm font-bold text-white">Logo Resmi Toko</h4>
              <p className="text-slate-400 text-[11px]">Unggah gambar logo dalam format PNG / JPG / WEBP.</p>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <label className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow">
                  Upload Logo Baru
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} />
                </label>
                {storeForm.logo_url && (
                  <button
                    type="button"
                    onClick={() => setStoreForm({ ...storeForm, logo_url: '' })}
                    className="px-3 py-1.5 bg-rose-500/10 text-rose-400 rounded-xl font-bold cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nama Toko Marketplace *</label>
              <input
                type="text"
                required
                value={storeForm.store_name}
                onChange={(e) => setStoreForm({ ...storeForm, store_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Tagline Toko</label>
              <input
                type="text"
                value={storeForm.tagline}
                onChange={(e) => setStoreForm({ ...storeForm, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Nomor WhatsApp Tampilan (Customer)</label>
              <input
                type="text"
                value={storeForm.whatsapp_number}
                onChange={(e) => setStoreForm({ ...storeForm, whatsapp_number: e.target.value })}
                placeholder="085819822250"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Nomor WhatsApp Link Format (62...)</label>
              <input
                type="text"
                value={storeForm.whatsapp_link_number}
                onChange={(e) => setStoreForm({ ...storeForm, whatsapp_link_number: e.target.value })}
                placeholder="6285819822250"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Pesan Otomatis WhatsApp Default</label>
              <input
                type="text"
                value={storeForm.whatsapp_default_message}
                onChange={(e) => setStoreForm({ ...storeForm, whatsapp_default_message: e.target.value })}
                placeholder="Halo Vortex ID, saya ingin bertanya mengenai produk."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              {loading ? 'Menyimpan...' : 'Simpan Identitas Toko'}
            </button>
          </div>
        </form>
      )}

      {/* 2. Theme Customizer */}
      {activeTab === 'theme' && (
        <form onSubmit={handleSaveTheme} className="p-6 sm:p-8 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-6 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white font-mono">Pilihan Mode & Preset Tema</h4>
              <p className="text-slate-400 text-[11px]">Pilih preset tema warna atau sesuaikan sendiri.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => applyThemePreset('dark')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-400 font-bold cursor-pointer"
              >
                Dark Cyber (Default)
              </button>
              <button
                type="button"
                onClick={() => applyThemePreset('light')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-blue-500/40 text-blue-400 font-bold cursor-pointer"
              >
                Blue Cobalt
              </button>
              <button
                type="button"
                onClick={() => applyThemePreset('cyan')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-400 font-bold cursor-pointer"
              >
                Emerald Green
              </button>
            </div>
          </div>

          {/* Color Pickers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Warna Utama (Primary Color)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeForm.primary_color}
                  onChange={(e) => setThemeForm({ ...themeForm, primary_color: e.target.value })}
                  className="w-9 h-9 rounded-lg border-0 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={themeForm.primary_color}
                  onChange={(e) => setThemeForm({ ...themeForm, primary_color: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Warna Sekunder (Secondary)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeForm.secondary_color}
                  onChange={(e) => setThemeForm({ ...themeForm, secondary_color: e.target.value })}
                  className="w-9 h-9 rounded-lg border-0 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={themeForm.secondary_color}
                  onChange={(e) => setThemeForm({ ...themeForm, secondary_color: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Warna Background Toko</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeForm.background_color}
                  onChange={(e) => setThemeForm({ ...themeForm, background_color: e.target.value })}
                  className="w-9 h-9 rounded-lg border-0 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={themeForm.background_color}
                  onChange={(e) => setThemeForm({ ...themeForm, background_color: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs uppercase"
                />
              </div>
            </div>
          </div>

          {/* Banner Settings */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white font-mono">Kustomisasi Hero Banner Homepage</h4>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Headline Utama Banner</label>
              <input
                type="text"
                value={themeForm.banner_title}
                onChange={(e) => setThemeForm({ ...themeForm, banner_title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Subjudul Banner</label>
              <input
                type="text"
                value={themeForm.banner_subtitle}
                onChange={(e) => setThemeForm({ ...themeForm, banner_subtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              {loading ? 'Menerapkan Tema...' : 'Terapkan Tema ke Toko'}
            </button>
          </div>
        </form>
      )}

      {/* 3. Legal & Terms Form */}
      {activeTab === 'legal' && (
        <form onSubmit={handleSaveStore} className="p-6 sm:p-8 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-6 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Syarat & Ketentuan Transaksi</label>
            <textarea
              rows={4}
              value={storeForm.terms_conditions}
              onChange={(e) => setStoreForm({ ...storeForm, terms_conditions: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Kebijakan Garansi & Refund Dana</label>
            <textarea
              rows={4}
              value={storeForm.refund_policy}
              onChange={(e) => setStoreForm({ ...storeForm, refund_policy: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Disclaimer Platform Pengembang Game</label>
            <textarea
              rows={3}
              value={storeForm.gaming_disclaimer}
              onChange={(e) => setStoreForm({ ...storeForm, gaming_disclaimer: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white leading-relaxed"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              {loading ? 'Menyimpan...' : 'Simpan Syarat & Kebijakan'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
