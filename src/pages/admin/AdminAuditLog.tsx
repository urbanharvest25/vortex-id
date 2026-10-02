import React, { useState, useEffect } from 'react';
import { History, Search, Shield, RefreshCw } from 'lucide-react';
import { AuditLog } from '../../types/index.js';
import { fetchApi, formatDate } from '../../lib/api.js';

export const AdminAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; data: AuditLog[] }>('/admin/audit-logs');
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.admin_name.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white font-mono tracking-wide">
            AUDIT LOG & AKTIVITAS SISTEM
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Rekam jejak seluruh operasi administrator, perubahan data akun, transaksi, dan konfigurasi.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          title="Segarkan Log"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aksi, administrator, atau target..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 placeholder-slate-500 font-mono"
          />
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Memuat log audit...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">Belum ada riwayat aktivitas tercatat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] bg-slate-900/60">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Aktivitas (Action)</th>
                  <th className="py-3 px-4">Target Entitas</th>
                  <th className="py-3 px-4">Detail Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-3 px-4 text-white font-bold whitespace-nowrap">{log.admin_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono max-w-xs truncate">{log.target}</td>
                    <td className="py-3 px-4 text-[11px] text-slate-400 font-mono max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '-'}
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
