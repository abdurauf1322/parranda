import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/mockData';
import { Role, AppTab } from '../../types';
import { getAccessibleTabsForRole } from '../../context/AppContext';
import { soundSynth } from '../../utils/audioAlert';
import { registerWebPushSubscription } from '../../utils/webPushHelper';
import {
  Egg,
  Clock,
  Volume2,
  VolumeX,
  UserCheck,
  AlertCircle,
  Bell,
  MessageSquare,
  Camera,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  PlayCircle,
  StickyNote,
  UserCog,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
  Building2,
  BarChart3,
  ClipboardList,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldAlert,
  Search,
  Boxes,
  X,
  Download,
} from 'lucide-react';
import { OverdueTasksModal } from './OverdueTasksModal';
import { Quick3MinAlertModal } from './Quick3MinAlertModal';
import { QuickSearchModal } from './QuickSearchModal';
import { PWAInstallButton } from './PWAInstallButton';
import { isTaskOverdue } from '../../utils/taskUtils';

interface HeaderProps {
  onOpenAttendance: () => void;
  onOpenPhotoUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAttendance, onOpenPhotoUpload }) => {
  const {
    currentUser,
    switchRole,
    switchUser,
    users,
    hasCheckedInToday,
    currentUserAttendance,
    soundEnabled,
    toggleSound,
    activeTab,
    setActiveTab,
    farmCurrentTime,
    triggerTestAlert,
    currentUserNotes,
    logout,
    syncStatus,
    lastSyncTime,
    syncNow,
    recurring3MinAlert,
    changeUserPassword,
    changeUserCredentials,
    switchUserWithPassword,
    tasks,
  } = useApp();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isQuickAlertOpen, setIsQuickAlertOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isOverdueTasksModalOpen, setIsOverdueTasksModalOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    return typeof window !== 'undefined' ? soundSynth.getNotificationPermission() : 'default';
  });

  const handleRequestNotification = async () => {
    const res = await soundSynth.requestNotificationPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      await registerWebPushSubscription({
        id: typeof currentUser.id === 'number' ? currentUser.id : undefined,
        username: currentUser.username || currentUser.id,
        role: currentUser.role
      });
    }
  };

  // Ctrl+K keyboard shortcut for quick search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Shaxsiy kabinet xavfsizligi: Login va Parol o'zgartirish holatlari
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changePasswordMsg, setChangePasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Boshqa xodimning kabinetiga parol orqali kirish
  const [targetUserToSwitch, setTargetUserToSwitch] = useState<typeof users[0] | null>(null);
  const [switchPasswordInput, setSwitchPasswordInput] = useState('');
  const [showSwitchPassword, setShowSwitchPassword] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const currentRoleInfo = ROLE_LABELS[currentUser.role];

  const isAccessible = (tab: AppTab) => getAccessibleTabsForRole(currentUser.role).includes(tab);

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-lg">
        {/* Top Header Row - Toza 1 Qator */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Chap: Logo va Status nuqtasi */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-black shrink-0">
              <Egg className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                UYCHI PARRANDA
              </h1>
              {/* Kichik birlashtirilgan status indikatori */}
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-mono"
                title={`Vaqt: ${farmCurrentTime} • Sinxron: ${syncStatus === 'online_synced' ? 'Faol' : syncStatus}`}
              >
                <span className={`w-2 h-2 rounded-full ${syncStatus === 'online_synced' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-slate-300 hidden sm:inline">{farmCurrentTime}</span>
              </div>
            </div>
          </div>

          {/* O'ng: Foydalanuvchi Profili Dropdown */}
          <div className="flex items-center gap-2">
            {/* Ovoz tugmasi faqat kichik icon */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? "Ovoz yoqilgan" : "Ovoz o'chirilgan"}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-750'
                  : 'bg-slate-850 border-slate-750 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Foydalanuvchi Profili */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-400">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-200 line-clamp-1 max-w-[130px]">
                    {currentUser.fullName}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Modal */}
              {roleDropdownOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-start sm:items-center justify-center pt-14 sm:pt-4 p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
                  onClick={() => setRoleDropdownOpen(false)}
                >
                  <div
                    className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 max-w-sm w-full relative max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 shrink-0">
                      <div>
                        <h3 className="text-sm font-bold text-white">{currentUser.fullName}</h3>
                        <p className="text-[11px] text-amber-400 font-medium">{currentRoleInfo?.title || currentUser.role}</p>
                      </div>
                      <button
                        onClick={() => setRoleDropdownOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Yashirilgan Tezkor Amallar: Login/Parol, Kodni yuklash, Chiqish */}
                    <div className="space-y-2 mb-3 shrink-0">
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          setIsChangePasswordOpen(true);
                          setNewUsernameInput(currentUser.username);
                          setCurrentPasswordInput('');
                          setNewPasswordInput('');
                          setConfirmPasswordInput('');
                          setChangePasswordMsg(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-amber-300 rounded-xl text-xs font-bold transition-all"
                      >
                        <KeyRound className="w-4 h-4 text-amber-400" />
                        <span>Login va Parolni O'zgartirish</span>
                      </button>

                      <a
                        href="/uychi-parranda-source-code.zip"
                        download="uychi-parranda-source-code.zip"
                        className="w-full flex items-center gap-2.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-emerald-300 rounded-xl text-xs font-bold transition-all"
                      >
                        <Download className="w-4 h-4 text-emerald-400" />
                        <span>Kodni yuklash (.zip)</span>
                      </a>

                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Tizimdan Chiqish</span>
                      </button>
                    </div>

                    {/* Xodimni almashtirish ro'yxati */}
                    <div className="text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                      Boshqa xodimga o'tish
                    </div>
                    <div className="overflow-y-auto space-y-1 pr-1 max-h-48 scrollbar-thin">
                      {users.map((u) => {
                        const isCurrent = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setTargetUserToSwitch(u);
                              setSwitchPasswordInput('');
                              setSwitchError(null);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-all ${
                              isCurrent
                                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold'
                                : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-transparent'
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-white">{u.fullName}</div>
                              <div className="text-[10px] text-slate-400">{ROLE_LABELS[u.role]?.title || u.role}</div>
                            </div>
                            {isCurrent && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ixcham Navigatsiya Satri (Asosiy 4-5 ta bo'lim + "Ko'proq ▾") */}
        <nav className="hidden md:flex max-w-7xl mx-auto px-3 sm:px-6 items-center gap-1.5 border-t border-slate-800/80 py-1.5 text-xs">
          {/* 1. Asosiy Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {currentRoleInfo?.short || 'Boshqaruv'}
          </button>

          {/* 2. Reja */}
          {isAccessible('operational_plan') && (
            <button
              onClick={() => setActiveTab('operational_plan')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'operational_plan'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Reja
            </button>
          )}

          {/* 3. Topshiriqlar */}
          {isAccessible('tasks') && (
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'tasks'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Topshiriqlar
            </button>
          )}

          {/* 4. Ombor & Vazn */}
          {(isAccessible('inventory') || isAccessible('chicken_weight')) && (
            <button
              onClick={() => setActiveTab(isAccessible('inventory') ? 'inventory' : 'chicken_weight')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'inventory' || activeTab === 'chicken_weight'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Ombor & Vazn
            </button>
          )}

          {/* 5. Umumiy Chat */}
          {isAccessible('chat') && (
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'chat'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Chat
            </button>
          )}

          {/* "Ko'proq ▾" Dropdown (Davomat, Foto-Hisobot, Zametkalar va h.k.) */}
          <div className="relative ml-auto">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                ['attendance', 'photos', 'notes', 'branch_analytics', 'hr'].includes(activeTab)
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>Ko'proq</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {moreMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setMoreMenuOpen(false)}
              >
                {isAccessible('attendance') && (
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-left ${
                      activeTab === 'attendance' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Davomat Jurnali</span>
                  </button>
                )}
                {isAccessible('photos') && (
                  <button
                    onClick={() => setActiveTab('photos')}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-left ${
                      activeTab === 'photos' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Foto-Hisobotlar</span>
                  </button>
                )}
                {isAccessible('notes') && (
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-left ${
                      activeTab === 'notes' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <StickyNote className="w-4 h-4" />
                    <span>Shaxsiy Zametkalar</span>
                  </button>
                )}
                {isAccessible('branch_analytics') && (
                  <button
                    onClick={() => setActiveTab('branch_analytics')}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-left ${
                      activeTab === 'branch_analytics' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Filiallar Analitikasi</span>
                  </button>
                )}
                {isAccessible('hr') && (
                  <button
                    onClick={() => setActiveTab('hr')}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-left ${
                      activeTab === 'hr' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <UserCog className="w-4 h-4" />
                    <span>Kadrlar (HR)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Overdue Tasks Alert Banner */}
      {tasks.filter(t => isTaskOverdue(t, farmCurrentTime)).length > 0 && (
        <button
          onClick={() => setIsOverdueTasksModalOpen(true)}
          className="w-full bg-rose-950/90 border-b border-rose-500/30 text-rose-200 px-4 py-2 text-center text-xs font-bold animate-pulse hover:bg-rose-900 transition-colors"
        >
           ⚠️ {tasks.filter(t => isTaskOverdue(t, farmCurrentTime)).length} ta topshiriqning muddati o'tib ketgan! (Ko'rish uchun bosing)
        </button>
      )}

      {/* Overdue Tasks Modal */}
      <OverdueTasksModal
        isOpen={isOverdueTasksModalOpen}
        onClose={() => setIsOverdueTasksModalOpen(false)}
      />

      {/* Quick 3-Min Alert Modal */}
      <Quick3MinAlertModal
        isOpen={isQuickAlertOpen}
        onClose={() => setIsQuickAlertOpen(false)}
      />

      {/* 1. Xodim Shaxsiy Kabinetiga Parol Bilan Kirish Modali */}
      {targetUserToSwitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Shaxsiy Kabinetga Kirish</h3>
                <p className="text-xs text-slate-400">Begona shaxslar kirishi taqiqlanadi</p>
              </div>
            </div>

            {/* Target user info */}
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-750 mb-4 text-xs">
              <div className="font-bold text-white text-sm">{targetUserToSwitch.fullName}</div>
              <div className="text-[11px] text-amber-400 font-medium flex items-center gap-2 mt-0.5">
                <span>{ROLE_LABELS[targetUserToSwitch.role]?.short || targetUserToSwitch.role}</span>
                <span className="text-slate-400">• {targetUserToSwitch.branchName || 'Bosh Filial'}</span>
              </div>
            </div>

            {switchError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2 mb-4 animate-in shake">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">{switchError}</div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSwitchError(null);
                const res = switchUserWithPassword(targetUserToSwitch.id, switchPasswordInput);
                if (res.success) {
                  setTargetUserToSwitch(null);
                  setSwitchPasswordInput('');
                } else {
                  setSwitchError(res.message);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Ushbu xodimning maxfiy parolini kiriting:</span>
                  <span className="text-[10px] text-amber-400 font-normal">Standart: 12345</span>
                </label>
                <div className="relative">
                  <input
                    type={showSwitchPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={switchPasswordInput}
                    onChange={(e) => {
                      setSwitchPasswordInput(e.target.value);
                      setSwitchError(null);
                    }}
                    placeholder="Parol (Standart: 12345)"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSwitchPassword(!showSwitchPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showSwitchPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTargetUserToSwitch(null);
                    setSwitchPasswordInput('');
                    setSwitchError(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Tasdiqlash & Kirish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Shaxsiy Kabinet: Login va Parolni O'zgartirish Modali */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Shaxsiy Login & Parolni O'zgartirish</h3>
                <p className="text-xs text-slate-400">Begona shaxslar kabinetingizga kirishini to'liq cheklash</p>
              </div>
            </div>

            {/* Current user badge */}
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-750 mb-4 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Sizning shaxsiy hisobingiz:</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-amber-300 font-mono font-bold">
                  @{currentUser.username}
                </span>
              </div>
              <div className="font-bold text-white text-sm">{currentUser.fullName}</div>
              <div className="text-[11px] text-amber-400">
                {currentRoleInfo?.title || currentUser.role} • {currentUser.branchName || 'Bosh Filial'}
              </div>
            </div>

            {changePasswordMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 mb-4 font-medium animate-in fade-in duration-200 ${
                  changePasswordMsg.type === 'success'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                }`}
              >
                {changePasswordMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">{changePasswordMsg.text}</div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setChangePasswordMsg(null);

                const cleanNewUser = newUsernameInput.trim().replace(/^@+/, '');
                const isChangingLogin = cleanNewUser && cleanNewUser !== currentUser.username;
                const isChangingPassword = !!newPasswordInput.trim();

                if (!isChangingLogin && !isChangingPassword) {
                  setChangePasswordMsg({
                    type: 'error',
                    text: "Hech qanday o'zgarish kiritilmadi! Yangi login yoki yangi parol kiriting.",
                  });
                  return;
                }

                if (!currentPasswordInput.trim()) {
                  setChangePasswordMsg({
                    type: 'error',
                    text: "Iltimos, amaldagi shaxsiy parolingizni kiriting! (Boshlang'ich parol: 12345)",
                  });
                  return;
                }

                if (isChangingPassword) {
                  if (newPasswordInput !== confirmPasswordInput) {
                    setChangePasswordMsg({
                      type: 'error',
                      text: "Yangi parol va tasdiqlovchi parol bir-biriga mos kelmadi!",
                    });
                    return;
                  }
                  if (newPasswordInput.trim().length < 4) {
                    setChangePasswordMsg({
                      type: 'error',
                      text: "Yangi maxfiy parol kamida 4 ta belgidan iborat bo'lishi lozim!",
                    });
                    return;
                  }
                }

                if (isChangingLogin && cleanNewUser.length < 3) {
                  setChangePasswordMsg({
                    type: 'error',
                    text: "Yangi login kamida 3 ta belgidan iborat bo'lishi lozim!",
                  });
                  return;
                }

                const res = changeUserCredentials(currentUser.id, {
                  newUsername: isChangingLogin ? cleanNewUser : undefined,
                  currentPassword: currentPasswordInput.trim(),
                  newPassword: isChangingPassword ? newPasswordInput.trim() : undefined,
                });

                if (res.success) {
                  setChangePasswordMsg({ type: 'success', text: res.message });
                  setCurrentPasswordInput('');
                  setNewPasswordInput('');
                  setConfirmPasswordInput('');
                  setTimeout(() => {
                    setIsChangePasswordOpen(false);
                    setChangePasswordMsg(null);
                  }, 2500);
                } else {
                  setChangePasswordMsg({ type: 'error', text: res.message });
                }
              }}
              className="space-y-3.5 text-xs"
            >
              {/* 1. Yangi Login */}
              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>1. Shaxsiy Login (Foydalanuvchi nomi):</span>
                  <span className="text-[10px] text-amber-400 font-normal">Hozirgi: @{currentUser.username}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">@</span>
                  <input
                    type="text"
                    value={newUsernameInput}
                    onChange={(e) => setNewUsernameInput(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder={`Yangi login (masalan: ${currentUser.role}_${currentUser.fullName.split(' ')[0].toLowerCase()})`}
                    className="w-full pl-7 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs sm:text-sm"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  * Tizimga kirishda ushbu loginni terasiz (lotin harflari va raqamlar). O'zgartirmaslik uchun shu holda qoldiring.
                </span>
              </div>

              {/* 2. Joriy Parol */}
              <div className="pt-1 border-t border-slate-800">
                <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>2. Joriy Parol (Tasdiqlash uchun):</span>
                  <span className="text-[10px] text-amber-400 font-normal">Standart: 12345</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="Amaldagi parolingizni kiriting"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  * Xavfsizlik uchun login yoki parolni o'zgartirishda amaldagi parolingiz tekshiriladi.
                </span>
              </div>

              {/* 3. Yangi Parol */}
              <div className="pt-1 border-t border-slate-800">
                <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>3. Yangi Maxfiy Parol (Ixtiyoriy):</span>
                  <span className="text-[10px] text-slate-400">Kamida 4 ta belgi</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Yangi parol (faqat login o'zgarsa bo'sh qoldiring)"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 4. Yangi Parol Tasdig'i */}
              {newPasswordInput.trim() && (
                <div className="animate-in fade-in duration-150">
                  <label className="block font-bold text-slate-300 mb-1">
                    4. Yangi Parolni Qayta Kiriting:
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Yangi parolni tasdiqlang"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePasswordOpen(false);
                    setChangePasswordMsg(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Saqlash & Yangilash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Global Search Modal (Ctrl+K) */}
      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
      />
    </>
  );
};
