import React, { useState } from 'react';
import { User as UserIcon, Phone, Mail, Shield, KeyRound, Check, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface ProfilePageProps {
  navigate: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ navigate }) => {
  const { user, updateProfile, changePassword, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [updatingPwd, setUpdatingPwd] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <p className="text-slate-400 text-sm">Silakan login untuk mengakses profil.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
        >
          Login Sekarang
        </button>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMsg('');
    setProfileError('');

    const res = await updateProfile(name, phone);
    if (res.success) {
      setProfileMsg('Profil berhasil diperbarui!');
      setTimeout(() => setProfileMsg(''), 3000);
    } else {
      setProfileError(res.error || 'Gagal memperbarui profil.');
    }
    setUpdatingProfile(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdError('Konfirmasi password tidak cocok.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Password minimal 6 karakter.');
      return;
    }

    setUpdatingPwd(true);
    setPwdMsg('');
    setPwdError('');

    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      setPwdMsg('Password berhasil diubah!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdMsg(''), 3000);
    } else {
      setPwdError(res.error || 'Password lama salah.');
    }
    setUpdatingPwd(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Profile Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0f172a] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-black text-2xl">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{user.name}</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold font-mono">
                CUSTOMER TERVERIFIKASI
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pesanan')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
          >
            Lihat Pesanan
          </button>
          <button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/30 cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Update Profile Card */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserIcon className="w-4 h-4 text-cyan-400" /> Informasi Data Pribadi
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            {profileMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4" /> {profileMsg}
              </div>
            )}
            {profileError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
                {profileError}
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Email Terdaftar (Tidak dapat diubah)</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 cursor-not-allowed text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Nomor WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updatingProfile}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {updatingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
            <KeyRound className="w-4 h-4 text-cyan-400" /> Ubah Kata Sandi
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            {pwdMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4" /> {pwdMsg}
              </div>
            )}
            {pwdError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
                {pwdError}
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1">Password Saat Ini</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Password Baru</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Konfirmasi Password Baru</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updatingPwd}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs rounded-xl border border-slate-700 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {updatingPwd ? 'Memperbarui...' : 'Ubah Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
