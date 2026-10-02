import React, { useState } from 'react';
import { ShieldCheck, Lock, Headphones, MessageCircle, FileText, CheckCircle2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext.js';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const { storeSettings } = useStore();
  const [activeModal, setActiveModal] = useState<'terms' | 'refund' | 'disclaimer' | null>(null);

  const phoneDisplay = storeSettings.whatsapp_number || '085819822250';
  const phoneLink = storeSettings.whatsapp_link_number || '6285819822250';

  return (
    <footer className="bg-[#06090f] border-t border-slate-800/80 text-slate-400 text-sm">
      {/* Trust Badges Bar */}
      <div className="border-b border-slate-800/60 bg-[#0a0e17]/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Garansi Anti Hack-Back</h4>
              <p className="text-[11px] text-slate-400">Jaminan perlindungan data & dana aman</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Verifikasi 100% Bersih</h4>
              <p className="text-[11px] text-slate-400">All unbind & validasi keaslian data akun</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Pengiriman Cepat</h4>
              <p className="text-[11px] text-slate-400">Proses serah terima kilat 5-15 menit</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Bantuan 24/7</h4>
              <p className="text-[11px] text-slate-400">Layanan ramah via WhatsApp resmi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black">
                V
              </div>
              <span className="text-xl font-black text-white tracking-wider font-mono">
                {storeSettings.store_name || 'VORTEX ID'}
              </span>
            </div>
            <p className="text-cyan-400 font-semibold text-xs tracking-wider uppercase">
              {storeSettings.tagline || 'Beli Aman, Main Nyaman.'}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Marketplace jual beli akun gaming terkemuka di Indonesia. Menghadirkan transaksi yang transparan, aman, dan
              bergaransi penuh untuk Mobile Legends, Free Fire, Valorant, Genshin Impact, dan game populer lainnya.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href={`https://wa.me/${phoneLink}?text=${encodeURIComponent(
                  storeSettings.whatsapp_default_message || 'Halo Vortex ID, saya ingin bertanya mengenai produk.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp: {phoneDisplay}</span>
              </a>
            </div>
          </div>

          {/* Nav Quick Links */}
          <div className="space-y-3">
            <h5 className="text-white text-xs font-bold uppercase tracking-wider">Navigasi Utama</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/produk')}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  Katalog Akun Gaming
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/pesanan')}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  Cek Pesanan Saya
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/profile')}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  Akun & Profil
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Terms */}
          <div className="space-y-3">
            <h5 className="text-white text-xs font-bold uppercase tracking-wider">Syarat & Kebijakan</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActiveModal('terms')}
                  className="hover:text-cyan-400 transition flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Syarat & Ketentuan Transaksi
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal('refund')}
                  className="hover:text-cyan-400 transition flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Kebijakan Garansi & Refund
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal('disclaimer')}
                  className="hover:text-cyan-400 transition flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Disclaimer Game Platform
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {storeSettings.store_name || 'Vortex ID'}. Beli Aman, Main Nyaman. Seluruh hak cipta dilindungi.</p>
          <p className="text-[11px] text-slate-600">
            Platform independen fasilitator keamanan transaksi akun gaming.
          </p>
        </div>
      </div>

      {/* Modal Dialog for Policy / Terms */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 text-slate-300 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 pb-2 border-b border-slate-800">
              {activeModal === 'terms' && 'Syarat & Ketentuan Transaksi'}
              {activeModal === 'refund' && 'Kebijakan Garansi & Refund'}
              {activeModal === 'disclaimer' && 'Disclaimer Platform Game'}
            </h3>

            <div className="text-xs leading-relaxed space-y-3 whitespace-pre-wrap text-slate-300">
              {activeModal === 'terms' &&
                (storeSettings.terms_conditions || 'Syarat dan ketentuan berlaku untuk seluruh transaksi di Vortex ID.')}
              {activeModal === 'refund' &&
                (storeSettings.refund_policy || 'Kebijakan pengembalian dana berlaku jika akun tidak sesuai deskripsi.')}
              {activeModal === 'disclaimer' &&
                (storeSettings.gaming_disclaimer ||
                  'Vortex ID adalah fasilitator pihak ketiga yang membantu proses serah terima data secara aman. Transaksi mengikuti kebijakan pengembang game masing-masing.')}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
