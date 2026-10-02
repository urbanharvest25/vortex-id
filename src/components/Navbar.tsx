import React, { useState } from 'react';
import { ShoppingBag, User as UserIcon, Menu, X, ShieldCheck, LogOut } from 'lucide-react';
import { useStore } from '../context/StoreContext.js';
import { useAuth } from '../context/AuthContext.js';
import { WhatsAppButton } from './WhatsAppButton.js';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { storeSettings, cart } = useStore();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const navLinks = [
    { label: 'HOME', path: '/' },
    { label: 'PRODUK', path: '/produk' },
    { label: 'PESANAN', path: '/pesanan' },
    { label: 'PROFILE', path: user ? '/profile' : '/login' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0a0e17]/95 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            {storeSettings.logo_url ? (
              <img
                src={storeSettings.logo_url}
                alt={storeSettings.store_name}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl object-contain border border-cyan-500/30 group-hover:border-cyan-400 transition"
              />
            ) : (
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition">
                <div className="w-full h-full bg-[#0a0e17] rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            )}
            <div>
              <div className="text-xl sm:text-2xl font-black tracking-wider text-white font-mono flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                  {storeSettings.store_name || 'VORTEX ID'}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 tracking-wide font-medium">
                {storeSettings.tagline || 'Beli Aman, Main Nyaman.'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`text-sm font-semibold tracking-wider transition-all duration-200 relative py-1 cursor-pointer ${
                    isActive
                      ? 'text-cyan-400'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* WhatsApp Quick Link */}
            <WhatsAppButton variant="compact" />

            {/* Cart Button */}
            <button
              onClick={() => navigate('/checkout')}
              className="relative p-2.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition cursor-pointer"
              title="Keranjang Belanja"
            >
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-cyan-500 text-slate-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-[#0a0e17] animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* User Profile or Login */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 hover:text-white text-xs font-medium transition cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name}</span>
                </button>

                <button
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
            )}
          </div>

          {/* Mobile Menu & Cart Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => navigate('/checkout')}
              className="relative p-2 text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/60 rounded-lg cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/60 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0c1220] border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => {
                    navigate(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-3 py-2.5 rounded-lg text-sm font-semibold tracking-wider transition ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
            <WhatsAppButton variant="inline" className="w-full justify-center" />

            {user ? (
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                <div>
                  <p className="text-xs text-slate-400">Masuk sebagai:</p>
                  <p className="text-sm font-bold text-white">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <button
                  onClick={async () => {
                    await logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="px-3 py-1.5 bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-lg hover:bg-rose-500/30 transition cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl text-center shadow-lg transition cursor-pointer"
              >
                Masuk / Daftar Akun
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
