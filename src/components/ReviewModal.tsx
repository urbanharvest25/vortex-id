import React, { useState } from 'react';
import { Star, X, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '../lib/api.js';

interface ReviewModalProps {
  type: 'product' | 'service';
  orderId: string;
  productId?: string;
  productName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  type,
  orderId,
  productId,
  productName,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Ulasan atau komentar tidak boleh kosong.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (type === 'product') {
        const res = await fetchApi('/ratings/product', {
          method: 'POST',
          body: JSON.stringify({
            productId,
            orderId,
            rating,
            review: comment.trim(),
          }),
        });
        if (res.success) {
          setSuccessMsg('Terima kasih! Ulasan produk Anda berhasil dikirim.');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }
      } else {
        const res = await fetchApi('/service-reviews', {
          method: 'POST',
          body: JSON.stringify({
            orderId,
            rating,
            comment: comment.trim(),
          }),
        });
        if (res.success) {
          setSuccessMsg('Terima kasih atas ulasan layanan toko kami!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim ulasan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl max-w-md w-full p-6 text-slate-200 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1">
          {type === 'product' ? 'Beri Ulasan Akun Game' : 'Beri Ulasan Layanan Toko'}
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          {type === 'product' ? productName || 'Produk Akun' : 'Bagaimana pengalaman transaksi Anda di Vortex ID?'}
        </p>

        {successMsg ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3 animate-bounce" />
            <p className="text-emerald-300 font-bold text-sm">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            {/* Star Rating Input */}
            <div className="flex flex-col items-center justify-center py-2">
              <span className="text-xs text-slate-400 mb-2">Pilih Rating Bintang:</span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(rating)}
                    className="p-1 cursor-pointer transition transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= (hoverRating || rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs text-cyan-400 font-semibold mt-2">
                {rating === 5 && 'Sangat Puas ⭐⭐⭐⭐⭐'}
                {rating === 4 && 'Puas ⭐⭐⭐⭐'}
                {rating === 3 && 'Cukup Puas ⭐⭐⭐'}
                {rating === 2 && 'Kurang Puas ⭐⭐'}
                {rating === 1 && 'Kecewa ⭐'}
              </span>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {type === 'product' ? 'Detail Ulasan Akun' : 'Komentar Layanan'}
              </label>
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  type === 'product'
                    ? 'Contoh: Akun sesuai deskripsi, all unbind bersih dan aman, admin responsif!'
                    : 'Contoh: Pelayanan cepat, ramah, dan terpercaya!'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Mengirim...' : 'Kirim Ulasan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
