import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Tag,
  CreditCard,
  QrCode,
  Smartphone,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.js';
import { useAuth } from '../context/AuthContext.js';
import { fetchApi, formatRupiah } from '../lib/api.js';
import { PaymentMethod } from '../types/index.js';

interface CheckoutPageProps {
  navigate: (path: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ navigate }) => {
  const { cart, removeFromCart, clearCart, qrisSettings } = useStore();
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '085819822250');
  const [notes, setNotes] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherSuccessMsg, setVoucherSuccessMsg] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  const subtotal = cart.reduce((acc, item) => {
    const price = item.product.discount_price ?? item.product.price;
    return acc + price * item.quantity;
  }, 0);

  // Auto 5% discount if subtotal >= 50.000
  const autoDiscount = subtotal >= 50000 ? Math.min(30000, Math.round(subtotal * 0.05)) : 0;
  const total = Math.max(0, subtotal - autoDiscount - voucherDiscount);

  // Handle voucher verification
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setValidatingVoucher(true);
    setVoucherError('');
    setVoucherSuccessMsg('');

    try {
      const res = await fetchApi<{ success: boolean; voucher: any; discount_amount: number }>(
        '/vouchers/validate',
        {
          method: 'POST',
          body: JSON.stringify({
            code: voucherCode.trim(),
            subtotal,
          }),
        }
      );

      if (res.success && res.discount_amount !== undefined) {
        setVoucherDiscount(res.discount_amount);
        setVoucherSuccessMsg(`Voucher berhasil! Potongan ${formatRupiah(res.discount_amount)}`);
      }
    } catch (err: any) {
      setVoucherDiscount(0);
      setVoucherError(err.message || 'Kode voucher tidak valid.');
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Keranjang belanja Anda kosong.');
      return;
    }

    if (!agreedTerms) {
      setErrorMessage('Harap menyetujui syarat & ketentuan transaksi.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const payload = {
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        voucherCode: voucherDiscount > 0 ? voucherCode.trim() : undefined,
        paymentMethod,
        customerName: customerName.trim() || user.name,
        customerPhone: customerPhone.trim() || user.phone,
        notes: notes.trim(),
      };

      const res = await fetchApi<{ success: boolean; order: any; invoice: any; message: string }>(
        '/orders/checkout',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      if (res.success && res.order) {
        // Trigger celebratory confetti!
        try {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch {
          // ignore
        }

        clearCart();
        setCompletedOrder(res.order);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Maaf, terjadi kesalahan saat memproses pesanan.');
    } finally {
      setLoading(false);
    }
  };

  // If completed, show confirmation card with quick button to Invoice & Pesanan
  if (completedOrder) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0f172a] border border-cyan-500/50 text-center space-y-6 shadow-2xl shadow-cyan-500/10">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">PESANAN BERHASIL DIBUAT!</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Terima kasih telah bertransaksi di Vortex ID. Nomor Invoice Anda telah diterbitkan.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Nomor Invoice:</span>
              <strong className="text-cyan-400 font-mono">{completedOrder.invoice_number}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Total Pembayaran:</span>
              <strong className="text-white font-mono">{formatRupiah(completedOrder.total)}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Metode Pembayaran:</span>
              <strong className="text-slate-200">{completedOrder.payment_method}</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-left text-xs text-cyan-200 space-y-1">
            <span className="font-bold block text-cyan-300">Panduan Selanjutnya:</span>
            <p className="text-[11px] text-slate-300">
              Buka menu <strong>Pesanan</strong> untuk memantau status atau cetak <strong>Invoice</strong> resmi Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => navigate(`/invoice/${completedOrder.invoice_number}`)}
              className="py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition cursor-pointer"
            >
              Lihat Nota Invoice
            </button>
            <button
              onClick={() => navigate('/pesanan')}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs tracking-wider uppercase transition cursor-pointer"
            >
              Ke Daftar Pesanan Saya
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty
  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
          <CreditCard className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Keranjang Belanja Kosong</h2>
        <p className="text-xs text-slate-400">
          Anda belum memilih akun game untuk dibeli. Silakan pilih akun favorit Anda di katalog.
        </p>
        <button
          onClick={() => navigate('/produk')}
          className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
        >
          Lihat Katalog Akun
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="border-b border-slate-800 pb-6 mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wide">
          CHECKOUT TRANSAKSI AKUN
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Lengkapi data pemesanan dan pilih metode pembayaran resmi.
        </p>
      </div>

      {!user && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Anda belum masuk. Silakan login agar pesanan tercatat di akun Anda.</span>
          </div>
          <button
            onClick={() => navigate('/login?redirect=/checkout')}
            className="px-3 py-1 bg-amber-400 text-slate-950 font-bold rounded-lg hover:bg-amber-300 cursor-pointer"
          >
            Masuk Sekarang
          </button>
        </div>
      )}

      <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Items, Customer Details & Payment (8 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Order Items Review */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Item Pesanan ({cart.length})
            </h3>
            <div className="divide-y divide-slate-800">
              {cart.map((item) => {
                const price = item.product.discount_price ?? item.product.price;
                const img = item.product.images[0]?.url;
                return (
                  <div key={item.product.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {img && (
                        <img
                          src={img}
                          alt={item.product.name}
                          className="w-14 h-11 object-cover rounded-lg bg-slate-900 border border-slate-800"
                        />
                      )}
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                          {item.product.name}
                        </h4>
                        <span className="text-[11px] text-cyan-400 font-mono font-medium">
                          {item.product.game} • {item.product.rank || 'Siap Main'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-xs font-mono font-bold text-white block">
                          {formatRupiah(price * item.quantity)}
                        </span>
                        <span className="text-[10px] text-slate-400">Qty: {item.quantity}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Contact Details */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Informasi Pembeli
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Pembeli"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Nomor WhatsApp Aktif</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="085819822250"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Tolong hubungi jam 7 malam atau pandu ganti email Moonton"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Pilih Metode Pembayaran
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'QRIS',
                  label: 'QRIS Instan (Semua Bank / E-Wallet)',
                  desc: 'BCA, Mandiri, Dana, GoPay, OVO, ShopeePay',
                  icon: QrCode,
                },
                {
                  id: 'BANK_TRANSFER',
                  label: 'Transfer Bank Otomatis',
                  desc: 'BCA, Mandiri, BRI, BNI Virtual Account',
                  icon: CreditCard,
                },
                {
                  id: 'EWALLET',
                  label: 'E-Wallet Langsung',
                  desc: 'Dana, GoPay, OVO, ShopeePay',
                  icon: Smartphone,
                },
                {
                  id: 'WHATSAPP_CONFIRMATION',
                  label: 'Bantuan CS WhatsApp',
                  desc: 'Verifikasi manual bersama Admin Vortex ID',
                  icon: ShieldCheck,
                },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{m.label}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{m.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* QRIS Interactive Preview if QRIS selected */}
            {paymentMethod === 'QRIS' && qrisSettings.is_active && qrisSettings.image_url && (
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <img
                  src={qrisSettings.image_url}
                  alt="QRIS Vortex ID"
                  className="w-32 h-32 object-contain bg-white p-2 rounded-xl shadow-lg border border-slate-300"
                />
                <div className="space-y-1 text-xs">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">
                    QRIS RESMI TOKO
                  </span>
                  <p className="text-white font-bold">{qrisSettings.account_name}</p>
                  <p className="text-slate-400 text-[11px]">
                    NMID: <span className="font-mono text-cyan-400">{qrisSettings.nmid || 'ID10202619822250'}</span>
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Scan QRIS ini melalui aplikasi BCA, Mandiri, Dana, GoPay, atau OVO setelah klik Checkout.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing Breakdown & Checkout Action (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-5 sticky top-24">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-3">
              Ringkasan Pembayaran
            </h3>

            {/* Voucher Box */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Punya Kode Voucher?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: VORTEX10"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs uppercase focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  disabled={validatingVoucher || !voucherCode.trim()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer disabled:opacity-50"
                >
                  {validatingVoucher ? 'Cek...' : 'Gunakan'}
                </button>
              </div>

              {voucherSuccessMsg && (
                <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {voucherSuccessMsg}
                </p>
              )}
              {voucherError && (
                <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {voucherError}
                </p>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 text-xs border-t border-slate-800 pt-4">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({cart.length} item)</span>
                <span className="font-mono text-white">{formatRupiah(subtotal)}</span>
              </div>

              {autoDiscount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Promo Toko Otomatis
                  </span>
                  <span className="font-mono">-{formatRupiah(autoDiscount)}</span>
                </div>
              )}

              {voucherDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Voucher ({voucherCode})
                  </span>
                  <span className="font-mono">-{formatRupiah(voucherDiscount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Total Tagihan</span>
                <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
                  {formatRupiah(total)}
                </span>
              </div>
            </div>

            {/* Terms Agreement Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span>
                  Saya menyetujui Syarat & Ketentuan Transaksi serta Kebijakan Garansi Anti-Hackback Vortex ID.
                </span>
              </label>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !agreedTerms}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Memproses Pesanan...' : 'Bayar & Proses Pesanan'}
            </button>

            <p className="text-[10px] text-center text-slate-500">
              Transaksi dilindungi garansi 100% dan verifikasi data akun langsung oleh admin.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
