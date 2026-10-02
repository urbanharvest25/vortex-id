import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Percent,
  Star,
  BarChart3,
  QrCode,
  Mail,
  Settings,
  History,
  AlertTriangle,
  LogOut,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useStore } from '../../context/StoreContext.js';

interface AdminLayoutProps {
  currentPath: string;
  navigate: (path: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentPath, navigate, children }) => {
  const { user, logout, login } = useAuth();
  const { storeSettings } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Admin Login state if not authenticated as Admin
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#06090f] flex items-center justify-center p-4">
        <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white font-mono tracking-wide">
              ADMIN CONTROL PANEL
            </h1>
            <p className="text-xs text-slate-400">
              Otorisasi diperlukan untuk mengakses konsol manajemen {storeSettings.store_name || 'Vortex ID'}.
            </p>
          </div>

          {loginErr && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {loginErr}
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setLoginLoading(true);
              setLoginErr('');
              const res = await login(adminEmail.trim(), adminPass);
              if (!res.success || res.user?.role !== 'ADMIN') {
                setLoginErr('Akses ditolak. Email atau kata sandi admin tidak valid.');
              }
              setLoginLoading(false);
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Email Administrator</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@vortex.id"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Kata Sandi</label>
              <input
                type="password"
                required
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? 'Memeriksa Akses...' : 'Autentikasi Admin'}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={() => {
                setAdminEmail('admin@vortex.id');
                setAdminPass('AdminVortex2026!');
              }}
              className="text-[11px] text-cyan-400 hover:underline cursor-pointer font-mono"
            >
              Isi Kredensial Default Admin
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Kembali ke Halaman Toko
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Produk', path: '/admin/products', icon: Package },
    { label: 'Transaksi', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Customer', path: '/admin/customers', icon: Users },
    { label: 'Voucher', path: '/admin/vouchers', icon: Tag },
    { label: 'Diskon', path: '/admin/discounts', icon: Percent },
    { label: 'Rating & Review', path: '/admin/ratings', icon: Star },
    { label: 'Analytics / Performa', path: '/admin/analytics', icon: BarChart3 },
    { label: 'QRIS', path: '/admin/qris', icon: QrCode },
    { label: 'Email', path: '/admin/email', icon: Mail },
    { label: 'Pengaturan Toko', path: '/admin/settings', icon: Settings },
    { label: 'Audit Log', path: '/admin/audit-log', icon: History },
    { label: 'Reset Data', path: '/admin/reset', icon: AlertTriangle, danger: true },
  ];

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-200 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0e17] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
            V
          </div>
          <span className="font-bold text-white font-mono text-sm">PANEL ADMIN</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-[#0a0e17] border-r border-slate-800 flex-shrink-0 flex flex-col justify-between`}
      >
        <div>
          {/* Brand & Store Name */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-lg font-mono">
                V
              </div>
              <div>
                <h2 className="text-sm font-bold text-white font-mono leading-tight">
                  {storeSettings.store_name || 'VORTEX ID'}
                </h2>
                <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase">
                  Admin Panel
                </span>
              </div>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? item.danger
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      : item.danger
                      ? 'text-rose-400 hover:bg-rose-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {/* Storefront Link */}
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition cursor-pointer"
          >
            <span>Buka Halaman Toko</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* Admin User Info */}
          <div className="p-2.5 rounded-xl bg-slate-900/50 flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <p className="font-bold text-white text-xs truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
              title="Keluar Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
};
