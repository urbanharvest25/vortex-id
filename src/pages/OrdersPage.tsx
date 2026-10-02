import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  Eye,
  MessageCircle,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useStore } from '../context/StoreContext.js';
import { Order } from '../types/index.js';
import { fetchApi, formatRupiah, formatDate } from '../lib/api.js';
import { ReviewModal } from '../components/ReviewModal.js';

interface OrdersPageProps {
  navigate: (path: string) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ navigate }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { storeSettings } = useStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review Modal state
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    type: 'product' | 'service';
    orderId: string;
    productId?: string;
    productName?: string;
  }>({
    isOpen: false,
    type: 'product',
    orderId: '',
  });

  // Secure reveal modal state for completed orders
  const [secureDetailModal, setSecureDetailModal] = useState<{
    isOpen: boolean;
    orderNumber: string;
    credentials?: string;
  }>({
    isOpen: false,
    orderNumber: '',
  });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; data: Order[] }>('/orders/my-orders');
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar pesanan Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login?redirect=/pesanan');
      } else {
        loadOrders();
      }
    }
  }, [user, authLoading]);

  // Fetch verified credentials safely for a completed order
  const handleRevealCredentials = async (orderId: string, orderNumber: string) => {
    try {
      const res = await fetchApi<{ success: boolean; data: any }>(`/orders/${orderId}`);
      if (res.success && res.data) {
        setSecureDetailModal({
          isOpen: true,
          orderNumber,
          credentials: res.data.delivered_credentials || 'Data akun telah diserahkan langsung oleh Admin via WhatsApp resmi.',
        });
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengambil data akun.');
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono">Memeriksa autentikasi pesanan...</p>
      </div>
    );
  }

  const getStatusBadge = (status: Order['order_status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
          </span>
        );
      case 'PAID':
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Terbayar
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Diproses
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Menunggu Pembayaran
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Dibatalkan
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wide">
            RIWAYAT PESANAN SAYA
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pantau status transaksi, invoice resmi, dan serah terima akun gaming Anda.
          </p>
        </div>

        <button
          onClick={() => navigate('/produk')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 w-fit cursor-pointer"
        >
          Belanja Lagi
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono">Memuat daftar pesanan Anda...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 bg-slate-900/40 rounded-3xl border border-slate-800 text-center p-8 space-y-4">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Belum Ada Riwayat Transaksi</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Anda belum pernah melakukan pemesanan akun game. Jelajahi katalog dan dapatkan akun impian Anda sekarang!
          </p>
          <button
            onClick={() => navigate('/produk')}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
          >
            Mulai Belanja
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const isCompleted = order.order_status === 'COMPLETED' || order.order_status === 'PAID';
            const isCancelled = order.order_status === 'CANCELLED';

            return (
              <div
                key={order.id}
                className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-lg"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-5 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      #{order.invoice_number}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{formatDate(order.created_at)}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300 font-mono">Metode: {order.payment_method}</span>
                  </div>

                  <div>{getStatusBadge(order.order_status)}</div>
                </div>

                {/* Items List */}
                <div className="p-4 sm:p-5 divide-y divide-slate-800/80">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt=""
                            className="w-12 h-10 object-cover rounded-lg bg-slate-800 border border-slate-700/60"
                          />
                        )}
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white">{item.product_name}</h4>
                          <span className="text-[11px] text-cyan-400 font-mono">
                            {item.product_game} • Qty: {item.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-mono font-bold text-white block">
                          {formatRupiah(item.price * item.quantity)}
                        </span>

                        {/* Rate Product button if completed */}
                        {isCompleted && (
                          <button
                            onClick={() =>
                              setReviewModal({
                                isOpen: true,
                                type: 'product',
                                orderId: order.id,
                                productId: item.product_id,
                                productName: item.product_name,
                              })
                            }
                            className="mt-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 justify-end cursor-pointer"
                          >
                            <Star className="w-3 h-3 fill-amber-400" /> Beri Ulasan
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cancellation notice if cancelled */}
                {isCancelled && order.cancellation_reason && (
                  <div className="mx-4 sm:mx-5 mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                    <strong>Alasan Pembatalan:</strong> {order.cancellation_reason}
                  </div>
                )}

                {/* Order Bottom Actions */}
                <div className="p-4 sm:p-5 bg-slate-900/40 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block">Total Tagihan:</span>
                    <strong className="text-base sm:text-lg font-black text-white font-mono">
                      {formatRupiah(order.total)}
                    </strong>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Invoice */}
                    <button
                      onClick={() => navigate(`/invoice/${order.invoice_number}`)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      Lihat Invoice
                    </button>

                    {/* Secure Account Credentials for completed orders */}
                    {isCompleted && (
                      <button
                        onClick={() => handleRevealCredentials(order.id, order.invoice_number)}
                        className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Serah Terima Akun
                      </button>
                    )}

                    {/* Store Service Review button */}
                    {isCompleted && (
                      <button
                        onClick={() =>
                          setReviewModal({
                            isOpen: true,
                            type: 'service',
                            orderId: order.id,
                          })
                        }
                        className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        Ulas Layanan
                      </button>
                    )}

                    {/* WhatsApp Assist */}
                    <a
                      href={`https://wa.me/${storeSettings.whatsapp_link_number || '6285819822250'}?text=${encodeURIComponent(
                        `Halo Vortex ID, saya ingin menanyakan status pesanan invoice #${order.invoice_number}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold transition flex items-center gap-1.5 border border-emerald-500/30"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Bantuan CS
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal Dialog */}
      {reviewModal.isOpen && (
        <ReviewModal
          type={reviewModal.type}
          orderId={reviewModal.orderId}
          productId={reviewModal.productId}
          productName={reviewModal.productName}
          onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
          onSuccess={() => {
            loadOrders();
          }}
        />
      )}

      {/* Secure Account Detail Modal */}
      {secureDetailModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-cyan-500/50 rounded-2xl max-w-lg w-full p-6 text-slate-200 shadow-2xl relative">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
              <Lock className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white font-mono">
                Data Akun Resmi (Invoice #{secureDetailModal.orderNumber})
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 font-mono text-cyan-200 whitespace-pre-wrap select-all">
                {secureDetailModal.credentials}
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                <strong>INSTRUKSI PENTING KEAMANAN:</strong>
                <p>1. Segera lakukan login dan ubah password akun Anda.</p>
                <p>2. Aktifkan verifikasi 2 Langkah (2FA) dengan nomor/email pribadi Anda.</p>
                <p>3. Jika membutuhkan panduan bind/unbind, hubungi CS kami di 085819822250.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSecureDetailModal({ isOpen: false, orderNumber: '' })}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
