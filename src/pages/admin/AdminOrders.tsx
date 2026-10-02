import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  Eye,
  X,
} from 'lucide-react';
import { Order } from '../../types/index.js';
import { fetchApi, formatRupiah, formatDate } from '../../lib/api.js';

interface AdminOrdersProps {
  navigate: (path: string) => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ navigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; data: Order[] }>('/admin/orders');
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Error loading admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: Order['order_status']) => {
    try {
      const res = await fetchApi<{ success: boolean; message: string }>(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ order_status: newStatus }),
      });
      if (res.success) {
        setToastMessage(`Status pesanan berhasil diubah menjadi ${newStatus}`);
        loadOrders();
        if (detailOrder?.id === orderId) {
          setDetailOrder((prev) => (prev ? { ...prev, order_status: newStatus } : null));
        }
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status pesanan.');
    }
  };

  const handleCancelOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder || !cancelReason.trim()) {
      setCancelError('Alasan pembatalan wajib diisi.');
      return;
    }

    setCancelLoading(true);
    setCancelError('');

    try {
      const res = await fetchApi<{ success: boolean; message: string; order: Order }>(
        `/admin/orders/${cancelModalOrder.id}/cancel`,
        {
          method: 'POST',
          body: JSON.stringify({ reason: cancelReason.trim() }),
        }
      );

      if (res.success) {
        setToastMessage('Pesanan berhasil dibatalkan dan stok telah dikembalikan ke katalog.');
        setCancelModalOrder(null);
        setCancelReason('');
        loadOrders();
      }
    } catch (err: any) {
      setCancelError(err.message || 'Gagal membatalkan pesanan.');
    } finally {
      setCancelLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.order_status === statusFilter;
    return matchSearch && matchStatus;
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
            MANAJEMEN TRANSAKSI & PESANAN
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Pantau status pembayaran, nota invoice, dan proses pembatalan dengan pemulihan stok.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor invoice, customer, email..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="">Semua Status Pesanan</option>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Memuat data transaksi...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Tidak ada transaksi pesanan yang sesuai filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] bg-slate-900/60">
                  <th className="py-3 px-4">Invoice & Tanggal</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Item Akun</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Status Pesanan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-cyan-400 block">{o.invoice_number}</span>
                      <span className="text-[10px] text-slate-500">{formatDate(o.created_at)}</span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-white font-bold">{o.customer_name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{o.customer_phone}</span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-slate-300 font-bold line-clamp-1 max-w-xs">{o.items[0]?.product_name}</p>
                      <span className="text-[10px] text-cyan-400 font-mono">
                        {o.items[0]?.product_game} {o.items.length > 1 && `(+${o.items.length - 1} item)`}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {formatRupiah(o.total)}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                        {o.payment_method}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={o.order_status}
                        onChange={(e: any) => handleUpdateStatus(o.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border focus:outline-none cursor-pointer ${
                          o.order_status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : o.order_status === 'PAID'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : o.order_status === 'CANCELLED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailOrder(o)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                          title="Lihat Detail Pesanan"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {o.order_status !== 'CANCELLED' && (
                          <button
                            onClick={() => {
                              setCancelModalOrder(o);
                              setCancelReason('');
                              setCancelError('');
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                            title="Batalkan Transaksi & Kembalikan Stok"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-3xl max-w-xl w-full p-6 text-slate-200 shadow-2xl relative max-h-[85vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setDetailOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white font-mono">
              Rincian Pesanan #{detailOrder.invoice_number}
            </h3>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <p>
                <strong className="text-slate-400">Customer: </strong> {detailOrder.customer_name} (
                {detailOrder.customer_email})
              </p>
              <p>
                <strong className="text-slate-400">WhatsApp: </strong> {detailOrder.customer_phone}
              </p>
              <p>
                <strong className="text-slate-400">Tanggal Transaksi: </strong> {formatDate(detailOrder.created_at)}
              </p>
              <p>
                <strong className="text-slate-400">Metode Bayar: </strong> {detailOrder.payment_method}
              </p>
              {detailOrder.notes && (
                <p>
                  <strong className="text-slate-400">Catatan Pembeli: </strong> {detailOrder.notes}
                </p>
              )}
            </div>

            {/* Items */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-300 block">Daftar Akun:</span>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl p-3 bg-slate-900/60">
                {detailOrder.items.map((i) => (
                  <div key={i.id} className="py-2 flex justify-between">
                    <div>
                      <p className="font-bold text-white">{i.product_name}</p>
                      <span className="text-[11px] text-cyan-400 font-mono">
                        {i.product_game} • Qty: {i.quantity}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white">{formatRupiah(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sensitive credentials assigned */}
            {detailOrder.delivered_credentials && (
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 text-xs text-amber-200 font-mono space-y-1">
                <span className="text-[10px] text-amber-400 font-bold block uppercase">
                  Data Kredensial Akun (Tersimpan Aman):
                </span>
                <p className="whitespace-pre-wrap">{detailOrder.delivered_credentials}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDetailOrder(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal (Restores stock automatically) */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-rose-500/50 rounded-2xl max-w-md w-full p-6 text-slate-200 shadow-2xl relative space-y-4">
            <button
              onClick={() => setCancelModalOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold font-mono">Batalkan Transaksi #{cancelModalOrder.invoice_number}</h3>
            </div>

            <p className="text-xs text-slate-300">
              Pembatalan transaksi ini akan secara otomatis <strong>mengembalikan stok akun</strong> ke etalase toko
              dan mencatat alasan pembatalan ke Audit Log.
            </p>

            {cancelError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {cancelError}
              </div>
            )}

            <form onSubmit={handleCancelOrderSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Alasan Pembatalan Transaksi *</label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Contoh: Pembayaran kedaluwarsa / Permintaan pembatalan dari customer / Bukti transfer tidak valid"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={cancelLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {cancelLoading ? 'Membatalkan...' : 'Konfirmasi Batalkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
