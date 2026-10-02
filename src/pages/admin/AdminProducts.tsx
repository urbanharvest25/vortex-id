import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Archive,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  MoveUp,
  MoveDown,
  Star,
  Eye,
} from 'lucide-react';
import { Product, ProductImage } from '../../types/index.js';
import { fetchApi, formatRupiah } from '../../lib/api.js';

interface AdminProductsProps {
  navigate: (path: string) => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ navigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    game: 'Mobile Legends',
    category: 'cat-mlbb',
    price: 0,
    discount_price: 0,
    stock: 1,
    description: '',
    account_details: '',
    rank: '',
    level: '',
    skins: '',
    items: '',
    status: 'AVAILABLE' as Product['status'],
  });

  // Images up to 10
  const [images, setImages] = useState<ProductImage[]>([]);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; data: Product[] }>('/admin/products');
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Error loading admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      game: 'Mobile Legends',
      category: 'cat-mlbb',
      price: 100000,
      discount_price: 0,
      stock: 1,
      description: '',
      account_details: '',
      rank: '',
      level: '',
      skins: '',
      items: '',
      status: 'AVAILABLE',
    });
    setImages([]);
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      game: p.game,
      category: p.category,
      price: p.price,
      discount_price: p.discount_price || 0,
      stock: p.stock,
      description: p.description,
      account_details: p.account_details || '',
      rank: p.rank || '',
      level: p.level || '',
      skins: p.skins || '',
      items: p.items || '',
      status: p.status,
    });
    setImages(p.images ? [...p.images] : []);
    setModalError('');
    setIsModalOpen(true);
  };

  // Image Upload handler (with MIME and size validation, max 10 photos)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 10) {
      setModalError('Maksimal foto untuk setiap produk adalah 10 foto.');
      return;
    }

    setImageUploadLoading(true);
    setModalError('');

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const newImages: ProductImage[] = [...images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!allowedMimes.includes(file.type)) {
        setModalError(`File "${file.name}" bukan format gambar valid (hanya JPG, PNG, WEBP).`);
        setImageUploadLoading(false);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setModalError(`File "${file.name}" melebihi batas ukuran 5MB.`);
        setImageUploadLoading(false);
        return;
      }

      try {
        const base64 = await readFileAsDataURL(file);
        // Validate with backend upload validator
        const uploadRes = await fetchApi<{ success: boolean; url: string }>('/admin/upload-image', {
          method: 'POST',
          body: JSON.stringify({ imageData: base64, mimeType: file.type }),
        });

        if (uploadRes.success && uploadRes.url) {
          newImages.push({
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            product_id: editingProduct?.id || '',
            url: uploadRes.url,
            sort_order: newImages.length,
            is_primary: newImages.length === 0, // First photo is primary by default
          });
        }
      } catch (err: any) {
        setModalError(err.message || 'Gagal memproses unggahan foto.');
      }
    }

    setImages(newImages);
    setImageUploadLoading(false);
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      is_primary: idx === index,
    }));
    setImages(updated);
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= images.length) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;

    // update sort orders
    updated.forEach((img, idx) => {
      img.sort_order = idx;
    });

    setImages(updated);
  };

  const handleDeleteImage = (index: number) => {
    const updated = images.filter((_, idx) => idx !== index);
    if (updated.length > 0 && !updated.some((img) => img.is_primary)) {
      updated[0].is_primary = true;
    }
    setImages(updated);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price <= 0) {
      setModalError('Nama produk dan harga wajib diisi.');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : undefined,
        stock: Number(formData.stock),
        images,
      };

      if (editingProduct) {
        const res = await fetchApi<{ success: boolean; message: string }>(
          `/admin/products/${editingProduct.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );
        if (res.success) {
          setToastMessage('Produk berhasil diperbarui.');
          setIsModalOpen(false);
          loadProducts();
        }
      } else {
        const res = await fetchApi<{ success: boolean; message: string }>('/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          setToastMessage('Produk baru berhasil ditambahkan.');
          setIsModalOpen(false);
          loadProducts();
        }
      }
    } catch (err: any) {
      setModalError(err.message || 'Gagal menyimpan produk.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus atau mengarsipkan produk "${name}"?`)) return;

    try {
      const res = await fetchApi<{ success: boolean; message: string }>(`/admin/products/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setToastMessage(res.message);
        loadProducts();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus produk.');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.game.toLowerCase().includes(search.toLowerCase());
    const matchGame = !selectedGame || p.game.toLowerCase() === selectedGame.toLowerCase();
    return matchSearch && matchGame;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="p-1 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white font-mono tracking-wide">
            MANAJEMEN PRODUK AKUN
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tambah, edit, atur stok, dan kelola hingga 10 foto slide per akun gaming.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Produk Baru
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama akun atau game..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="">Semua Game</option>
            <option value="Mobile Legends">Mobile Legends</option>
            <option value="Valorant">Valorant</option>
            <option value="Free Fire">Free Fire</option>
            <option value="Genshin Impact">Genshin Impact</option>
            <option value="PUBG Mobile">PUBG Mobile</option>
            <option value="Roblox">Roblox</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Memuat daftar produk...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Tidak ada produk akun yang ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] bg-slate-900/60">
                  <th className="py-3 px-4">Foto (Slide)</th>
                  <th className="py-3 px-4">Nama Produk & Game</th>
                  <th className="py-3 px-4">Harga / Diskon</th>
                  <th className="py-3 px-4 text-center">Stok</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredProducts.map((p) => {
                  const primaryImg = p.images?.find((img) => img.is_primary)?.url || p.images?.[0]?.url;
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4">
                        <div className="relative w-16 h-12 rounded-lg bg-slate-800 overflow-hidden border border-slate-700">
                          {primaryImg ? (
                            <img src={primaryImg} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                          <span className="absolute bottom-0 right-0 bg-black/80 text-[9px] text-white px-1 font-mono">
                            {p.images?.length || 0}/10
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="text-white font-bold line-clamp-1 max-w-sm">{p.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-cyan-400 font-mono text-[11px] font-semibold">{p.game}</span>
                          {p.rank && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400 text-[10px]">{p.rank}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="text-white font-bold block">{formatRupiah(p.discount_price ?? p.price)}</span>
                        {p.discount_price && (
                          <span className="text-[10px] text-slate-500 line-through">
                            {formatRupiah(p.price)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className={`font-bold ${
                            p.stock > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.is_archived
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : p.stock > 0
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {p.is_archived ? 'ARCHIVED' : p.stock > 0 ? 'AVAILABLE' : 'SOLD OUT'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                            title="Hapus / Archive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal with 10 Photos Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0f172a] border border-slate-700 rounded-3xl max-w-3xl w-full p-6 sm:p-8 text-slate-200 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white font-mono mb-1">
              {editingProduct ? 'EDIT PRODUK AKUN' : 'TAMBAH PRODUK AKUN BARU'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Kelola informasi akun, spesifikasi item, keamanan kredensial, dan foto slide (maks. 10 foto).
            </p>

            {modalError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5 text-xs">
              {/* Product Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Judul / Nama Akun *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Akun MLBB Mythical Glory 85★ Skin Collector Chou"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Game *</label>
                  <select
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Mobile Legends">Mobile Legends</option>
                    <option value="Valorant">Valorant</option>
                    <option value="Free Fire">Free Fire</option>
                    <option value="Genshin Impact">Genshin Impact</option>
                    <option value="PUBG Mobile">PUBG Mobile</option>
                    <option value="Roblox">Roblox</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kategori Slug</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="cat-mlbb"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Harga Normal (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Harga Diskon (Rp, opsional)</label>
                  <input
                    type="number"
                    value={formData.discount_price}
                    onChange={(e) => setFormData({ ...formData, discount_price: Number(e.target.value) })}
                    placeholder="Biarkan 0 jika tidak diskon"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Stok Akun *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status Publikasi</label>
                  <select
                    value={formData.status}
                    onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="AVAILABLE">Tersedia (Ready Stock)</option>
                    <option value="SOLD_OUT">Habis Terjual</option>
                    <option value="INACTIVE">Nonaktifkan / Draft</option>
                  </select>
                </div>
              </div>

              {/* Game Specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Rank Akun</label>
                  <input
                    type="text"
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    placeholder="Contoh: Mythical Glory 85★ / Immortal 3"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Level Akun</label>
                  <input
                    type="text"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    placeholder="Contoh: Level 112 / AR 60"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Highlight Skin Koleksi</label>
                  <input
                    type="text"
                    value={formData.skins}
                    onChange={(e) => setFormData({ ...formData, skins: e.target.value })}
                    placeholder="Contoh: 345 Skins (4 Collector, 12 Epic Limited, KOF Iori)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Item / Emblem / BP / Radianite</label>
                  <input
                    type="text"
                    value={formData.items}
                    onChange={(e) => setFormData({ ...formData, items: e.target.value })}
                    placeholder="Contoh: All Emblem Max Lv 60, BP 250k, Magic Dust 14k"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-slate-300 font-medium mb-1">Deskripsi Lengkap Akun *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Rincian kondisi akun, kelengkapan, histori unbind, dan garansi..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>

              {/* Sensitive Account Details (Protected) */}
              <div className="pt-2 border-t border-slate-800 p-4 rounded-2xl bg-amber-500/5 border-amber-500/20 space-y-2">
                <label className="block text-amber-300 font-bold text-xs flex items-center gap-1.5">
                  <span>Data Sensitif Kredensial Akun (Hanya Diserahkan Saat Pesanan Selesai)</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.account_details}
                  onChange={(e) => setFormData({ ...formData, account_details: e.target.value })}
                  placeholder="Login Email: mlbb@mail.com | Password: ... | 2FA Backup: ... | Status All Unbind Bersih"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/30 text-amber-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-slate-400">
                  Data ini dilindungi oleh otorisasi backend dan tidak pernah ditampilkan secara publik.
                </p>
              </div>

              {/* Image Management (UP TO 10 SLIDES) */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Foto Akun ({images.length} / 10 Foto)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Format valid: JPG, PNG, WEBP. Maks 5MB per foto. Foto pertama otomatis menjadi foto utama.
                    </p>
                  </div>

                  {images.length < 10 && (
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{imageUploadLoading ? 'Mengunggah...' : 'Upload Foto'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleImageFileChange}
                        disabled={imageUploadLoading}
                      />
                    </label>
                  )}
                </div>

                {images.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-900/50 border border-dashed border-slate-700 text-center text-slate-500">
                    Belum ada foto yang diunggah. Klik "Upload Foto" di atas untuk menambahkan gambar slide.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {images.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        className={`group relative rounded-xl overflow-hidden bg-slate-900 border-2 transition ${
                          img.is_primary ? 'border-cyan-400 ring-2 ring-cyan-500/30' : 'border-slate-800'
                        }`}
                      >
                        <img src={img.url} alt="" className="w-full h-24 object-cover" />

                        {img.is_primary && (
                          <span className="absolute top-1 left-1 bg-cyan-500 text-slate-950 font-mono text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                            UTAMA
                          </span>
                        )}

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(idx)}
                              className="p-1 rounded bg-slate-800 hover:bg-cyan-500 text-white hover:text-slate-950 cursor-pointer"
                              title="Jadikan Foto Utama"
                            >
                              <Star className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(idx)}
                              className="p-1 rounded bg-rose-500/80 hover:bg-rose-600 text-white cursor-pointer"
                              title="Hapus Foto"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center justify-center gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, 'up')}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                                title="Geser ke Kiri"
                              >
                                <MoveUp className="w-3 h-3 -rotate-90" />
                              </button>
                            )}
                            {idx < images.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, 'down')}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                                title="Geser ke Kanan"
                              >
                                <MoveDown className="w-3 h-3 -rotate-90" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                >
                  {modalLoading ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
