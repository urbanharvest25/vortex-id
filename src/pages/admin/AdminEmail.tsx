import React, { useState, useEffect } from 'react';
import { Mail, AlertTriangle, CheckCircle2, Send, Clock, XCircle, RefreshCw } from 'lucide-react';
import { EmailLog } from '../../types/index.js';
import { fetchApi, formatDate } from '../../lib/api.js';

interface EmailData {
  is_configured: boolean;
  provider: string;
  from_email: string;
  logs: EmailLog[];
}

export const AdminEmail: React.FC = () => {
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const loadEmailData = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; data: EmailData }>('/admin/email');
      if (res.success && res.data) {
        setEmailData(res.data);
      }
    } catch (err) {
      console.error('Error loading email data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmailData();
  }, []);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestLoading(true);
    setTestResult(null);

    try {
      const res = await fetchApi<{ success: boolean; status: string; error?: string }>(
        '/admin/email/test',
        {
          method: 'POST',
          body: JSON.stringify({ testEmail: testEmail.trim() }),
        }
      );

      if (res.success) {
        setTestResult({ success: true, msg: 'Email uji coba berhasil dikirim ke penerima!' });
        loadEmailData();
      } else {
        setTestResult({
          success: false,
          msg: res.error || 'Email gagal dikirim (Cek log error di bawah).',
        });
        loadEmailData();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: err.message || 'Email belum dikonfigurasi di environment variable.',
      });
      loadEmailData();
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono">Memeriksa status konfigurasi email...</p>
      </div>
    );
  }

  const isConfigured = emailData?.is_configured;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white font-mono tracking-wide">
            LAYANAN EMAIL OTOMATIS
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Status pengiriman nota invoice dan notifikasi transaksi ke email customer.
          </p>
        </div>

        <button
          onClick={loadEmailData}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          title="Refresh Log"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Configuration Status Card */}
      {!isConfigured ? (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase font-mono">
              STATUS: EMAIL BELUM DIKONFIGURASI
            </h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Kredensial API penyedia email belum terpasang di berkas <code>.env</code> (
            <code className="text-cyan-300">EMAIL_PROVIDER</code> dan{' '}
            <code className="text-cyan-300">EMAIL_API_KEY</code> masih kosong).
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 text-[11px] font-mono text-slate-400 space-y-1">
            <p># Tambahkan di environment variable sistem:</p>
            <p className="text-cyan-300">EMAIL_PROVIDER="resend"</p>
            <p className="text-cyan-300">EMAIL_API_KEY="re_1234567890..."</p>
            <p className="text-cyan-300">EMAIL_FROM="orders@vortex.id"</p>
            <p className="text-cyan-300">EMAIL_FROM_NAME="Vortex ID"</p>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Sistem tidak memalsukan status pengiriman; seluruh transaksi tetap tercatat dengan status email FAILED
            sampai konfigurasi email aktif.
          </p>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="font-bold">EMAIL TERHUBUNG AKTIF</h4>
              <p className="text-[11px] text-slate-300">
                Provider: {emailData?.provider} • Pengirim: {emailData?.from_email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Box */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
          <Send className="w-4 h-4 text-cyan-400" /> Uji Coba Pengiriman Email
        </h3>
        <p className="text-xs text-slate-400">
          Kirim sampel email nota transaksi ke alamat email tujuan untuk memastikan koneksi pengiriman berjalan normal.
        </p>

        {testResult && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{testResult.msg}</span>
          </div>
        )}

        <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="masukkan.email.tujuan@gmail.com"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={testLoading}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            {testLoading ? 'Mengirim...' : 'Kirim Email Uji Coba'}
          </button>
        </form>
      </div>

      {/* Email History Logs Table */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-lg space-y-2">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
            Log Riwayat Email Transaksi ({emailData?.logs.length || 0})
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Tersimpan di database</span>
        </div>

        {(!emailData?.logs || emailData.logs.length === 0) ? (
          <div className="py-12 text-center text-slate-500 text-xs">Belum ada riwayat email.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] bg-slate-900/60">
                  <th className="py-2.5 px-4">Penerima & Tanggal</th>
                  <th className="py-2.5 px-4">Subjek</th>
                  <th className="py-2.5 px-4">Status Pengiriman</th>
                  <th className="py-2.5 px-4">Keterangan / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {emailData.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4">
                      <p className="font-mono text-white font-bold">{log.recipient}</p>
                      <span className="text-[10px] text-slate-500">{formatDate(log.created_at)}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{log.subject}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SENT'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : log.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400 font-mono max-w-sm truncate">
                      {log.error_message || 'Email terkirim sukses'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
