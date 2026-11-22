import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/mockData';
import { Role } from '../../types';
import {
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Egg,
  ArrowRight,
  Users,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

export const AuthGateModal: React.FC = () => {
  const { isAuthenticated, loginUser, users } = useApp();
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelperList, setShowHelperList] = useState(false);

  if (isAuthenticated) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginInput.trim()) {
      setErrorMessage("Iltimos, login, ism-familiya yoki telefon raqamingizni kiriting!");
      return;
    }

    if (!password) {
      setErrorMessage("Iltimos, shaxsiy kabinet parolingizni kiriting! (Boshlang'ich parol: 12345)");
      return;
    }

    const result = loginUser(
      loginInput.trim(),
      password.trim(),
      selectedRole ? (selectedRole as Role) : undefined
    );

    if (!result.success) {
      setErrorMessage(result.message);
    }
  };

  const handleQuickSelect = (user: typeof users[0]) => {
    setSelectedRole(user.role);
    setLoginInput(user.username);
    setPassword('');
    setErrorMessage(null);
    setShowHelperList(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-6 text-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-400 font-black flex items-center justify-center shadow-lg">
              <Egg className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                Parrandachilik Fabrikasi
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                UYCHI PARRANDA
              </h1>
              <p className="text-xs font-semibold text-slate-900/80 mt-0.5">
                Shaxsiy Kabinetga Xavfsiz Kirish (Login & Parol)
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Shaxsiy kabinetingizga begona shaxslar kira olmasligi uchun tizimga kirish <strong>Login va Maxfiy Parol</strong> orqali himoyalangan.
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-xs text-rose-300 flex items-start gap-3 animate-in shake">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Login / Username input */}
            <div>
              <label className="block text-slate-200 font-bold mb-1.5 flex items-center justify-between">
                <span>1. Login, Ism-familiya yoki Telefon:</span>
                <span className="text-[10px] text-amber-400 font-normal">Majburiy</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginInput}
                  onChange={(e) => {
                    setLoginInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Login (masalan: @direktor yoki o'zgartirilgan loginingiz)"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            {/* Role select (optional) */}
            <div>
              <label className="block text-slate-200 font-bold mb-1.5 flex items-center justify-between">
                <span>2. Lavozimni tanlang (Ixtiyoriy):</span>
                <span className="text-[10px] text-slate-400 font-normal">Avtomatik aniqlanadi</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as Role | '');
                  setErrorMessage(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm"
              >
                <option value="">Barcha lavozimlar (Login orqali avtomatik aniqlash)</option>
                {Object.keys(ROLE_LABELS).map((roleKey) => (
                  <option key={roleKey} value={roleKey}>
                    {ROLE_LABELS[roleKey as Role].title}
                  </option>
                ))}
              </select>
            </div>

            {/* Password input with toggle */}
            <div>
              <label className="block text-slate-200 font-bold mb-1.5 flex items-center justify-between">
                <span>3. Maxfiy Parol:</span>
                <span className="text-[10px] text-amber-400 font-medium">Boshlang'ich parol: 12345</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Shaxsiy parolingizni kiriting"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                  title={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                * Begona shaxslar kirmasligi uchun tizimga kirgach yuqoridagi <strong>«Login / Parol»</strong> tugmasi orqali o'z parolingiz va loginingizni o'zgartirishingiz mumkin.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Shaxsiy Kabinetga Kirish</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>

          {/* Quick Helper: View registered employees in farm */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowHelperList(!showHelperList)}
              className="w-full text-center text-[11px] text-amber-400/90 hover:text-amber-300 font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>
                {showHelperList ? "Ro'yxatni yashirish" : "Kadrlar ro'yxatidagi xodimlarni ko'rish / Loginni tanlash"}
              </span>
            </button>

            {showHelperList && (
              <div className="mt-3 p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <span>Kadrlar ro'yxatidagi xodimlar ({users.length}):</span>
                  <span className="text-amber-400">Boshlang'ich: 12345</span>
                </div>
                {users.map((u) => {
                  const hasCustomPass = u.password && u.password !== '12345';
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickSelect(u)}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/80 hover:bg-slate-750 text-left text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-bold text-white truncate flex items-center gap-1.5">
                          <span>{u.fullName}</span>
                          <span className="font-mono text-[10px] text-amber-300 font-bold bg-slate-800 px-1 py-0.2 rounded border border-slate-700">
                            @{u.username}
                          </span>
                          {hasCustomPass && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Maxfiy
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-amber-400 font-medium flex items-center gap-1.5">
                          <span>{ROLE_LABELS[u.role]?.title || u.role}</span>
                          <span className="text-slate-400 truncate">• {u.branchName || 'Bosh Filial'}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 shrink-0 font-bold">
                        Tanlash
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
