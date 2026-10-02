import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useStore } from '../context/StoreContext.js';

interface LoginPageProps {
  navigate: (path: string) => void;
  redirectPath?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate, redirectPath }) => {
  const { login } = useAuth();
  const { storeSettings } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(email.trim(), password);
    if (res.success && res.user) {
      if (res.user.role === 'ADMIN') {
        navigate('/admin');
      } else if (redirectPath) {
        navigate(redirectPath);
      } else {
        navigate('/');
      }
    } else {
      setError(res.error || 'Email atau password salah.');
    }
    setLoading(false);
  };

  const handleQuickFill = (role: 'admin' | 'customer') => {
    if (role === 'admin') {
      setEmail('admin@vortex.id');
      setPassword('AdminVortex2026!');
    } else {
      setEmail('customer@vortex.id');
      setPassword('Customer2026!');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white font-mono tracking-wide">
            MASUK KE {storeSettings.store_name?.toUpperCase() || 'VORTEX ID'}
          </h1>
          <p className="text-xs text-slate-400">
            {storeSettings.tagline || 'Beli Aman, Main Nyaman.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Email Akun</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-slate-300 font-medium">Kata Sandi</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 placeholder-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-cyan-500/25 transition cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
          </button>
        </form>

        {/* Quick Demo Fill Buttons for convenience */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 text-center space-y-2">
          <span>Akun Demo Cepat:</span>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('customer')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 cursor-pointer font-mono"
            >
              Demo Customer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 border border-slate-700 cursor-pointer font-mono"
            >
              Demo Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 pt-2">
          Belum punya akun?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-cyan-400 font-bold hover:underline cursor-pointer"
          >
            Daftar Akun Baru
          </button>
        </div>
      </div>
    </div>
  );
};
