import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, ShieldCheck, CheckCircle2, MessageCircle } from 'lucide-react';
import { Invoice, StoreSettings } from '../types/index.js';
import { fetchApi, formatRupiah, formatDate } from '../lib/api.js';

interface InvoicePageProps {
  invoiceNumber: string;
  navigate: (path: string) => void;
}

export const InvoicePage: React.FC<InvoicePageProps> = ({ invoiceNumber, navigate }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [store, setStore] = useState<Partial<StoreSettings> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInvoice() {
      setLoading(true);
      try {
        const res = await fetchApi<{ success: boolean; invoice: Invoice; store: any }>(
          `/invoices/${invoiceNumber}`
        );
        if (res.success && res.invoice) {
          setInvoice(res.invoice);
          setStore(res.store);
        } else {
          setError('Nota invoice tidak ditemukan.');
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat invoice.');
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [invoiceNumber]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono">Memuat nota invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Invoice Tidak Ditemukan</h2>
        <p className="text-xs text-slate-400">{error || 'Nomor invoice yang Anda cari tidak valid.'}</p>
        <button
          onClick={() => navigate('/pesanan')}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
        >
          Ke Riwayat Pesanan
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => navigate('/pesanan')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Pesanan
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer transition"
        >
          <Printer className="w-4 h-4" /> Cetak / Unduh Invoice
        </button>
      </div>

      {/* Invoice Document Box */}
      <div
        id="invoice-print-area"
        className="bg-[#0f172a] text-slate-200 p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl space-y-8"
      >
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black text-xl">
              V
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-mono tracking-wider">
                {store?.store_name || 'VORTEX ID'}
              </h2>
              <p className="text-xs text-cyan-400 font-medium">{store?.tagline || 'Beli Aman, Main Nyaman.'}</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
              OFFICIAL INVOICE
            </span>
            <p className="text-xs font-mono text-slate-400 mt-1">No: {invoice.invoice_number}</p>
          </div>
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block">DITUJUKAN KEPADA:</span>
            <p className="font-bold text-white text-sm">{invoice.customer_name}</p>
            <p className="text-slate-400">{invoice.customer_email}</p>
            <p className="text-slate-400 font-mono">WA: {invoice.customer_phone}</p>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-slate-400 text-[11px] block">INFORMASI TRANSAKSI:</span>
            <p>
              <span className="text-slate-400">Tanggal: </span>
              <strong className="text-white">{formatDate(invoice.created_at)}</strong>
            </p>
            <p>
              <span className="text-slate-400">Metode Bayar: </span>
              <strong className="text-cyan-400 font-mono">{invoice.payment_method}</strong>
            </p>
            <p>
              <span className="text-slate-400">Status Pembayaran: </span>
              <strong className="text-emerald-400">{invoice.payment_status}</strong>
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-2.5">Akun Game</th>
                <th className="py-2.5 text-center">Jumlah</th>
                <th className="py-2.5 text-right">Harga Satuan</th>
                <th className="py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3">
                    <p className="font-bold text-white">{item.product_name}</p>
                    <span className="text-[11px] text-cyan-400 font-mono">{item.product_game}</span>
                  </td>
                  <td className="py-3 text-center text-slate-300 font-mono">{item.quantity}</td>
                  <td className="py-3 text-right font-mono text-slate-300">{formatRupiah(item.price)}</td>
                  <td className="py-3 text-right font-mono font-bold text-white">
                    {formatRupiah(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations */}
        <div className="border-t border-slate-800 pt-4 flex justify-end">
          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono text-white">{formatRupiah(invoice.subtotal)}</span>
            </div>

            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>Diskon Promo:</span>
                <span className="font-mono">-{formatRupiah(invoice.discount_amount)}</span>
              </div>
            )}

            {invoice.voucher_amount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Potongan Voucher:</span>
                <span className="font-mono">-{formatRupiah(invoice.voucher_amount)}</span>
              </div>
            )}

            <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline font-bold">
              <span className="text-white text-sm">Total Bayar:</span>
              <span className="text-lg text-cyan-400 font-mono">{formatRupiah(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes & Guarantee */}
        <div className="border-t border-slate-800 pt-6 text-[11px] text-slate-400 space-y-2">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Garansi Resmi Vortex ID</span>
          </div>
          <p>
            Nota ini merupakan bukti sah transaksi jual beli akun gaming di Vortex ID. Transaksi dilindungi garansi
            keaslian data dan anti hack-back sesuai kebijakan toko.
          </p>
          <p>
            Kontak Resmi Toko: <strong>085819822250</strong> (WhatsApp) | Email: <strong>orders@vortex.id</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
