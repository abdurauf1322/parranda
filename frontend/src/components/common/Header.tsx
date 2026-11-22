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

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
        {/* Top Banner & Quick Controls */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          {/* Farm Brand Identity */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black shrink-0">
              <Egg className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
                <h1 className="text-sm font-black tracking-tight text-white leading-tight">
                  UYCHI PARRANDA
                </h1>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">
                  Operativ Nazorat
                </p>
            </div>
          </div>

          {/* Live Farm Clock & Live Sync Badge & 3-Min Alert Trigger */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Live Clock */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs font-mono text-amber-400">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-semibold tracking-wider">{farmCurrentTime}</span>
            </div>

            {/* Cloud Firestore Online/Offline Sync Badge */}
            <button
              type="button"
              title={
                syncStatus === 'online_synced'
                  ? `Server bilan to'liq sinxronlangan (${lastSyncTime || 'Faol'})`
                  : syncStatus === 'online_syncing'
                  ? 'Serverga sinxronizatsiya qilinmoqda...'
                  : "Internet yo'q: Ma'lumotlar lokal xotirada 100% xavfsiz saqlanmoqda, internet yonganda serverga avtomatik uzatiladi"
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                syncStatus === 'online_synced'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15'
                  : syncStatus === 'online_syncing'
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/15'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/15'
              }`}
              onClick={() => {
                syncNow();
                soundSynth.playHarmonicChime();
              }}
            >
              {syncStatus === 'online_synced' && <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              {syncStatus === 'online_syncing' && <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin shrink-0" />}
              {syncStatus === 'offline' && <CloudOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              <span className="hidden sm:inline">
                {syncStatus === 'online_synced'
                  ? 'Onlayn Sinxron'
                  : syncStatus === 'online_syncing'
                  ? 'Sinxronlanmoqda'
                  : 'Oflayn Saqlanmoqda'}
              </span>
            </button>

            {/* 3 Daqiqalik Ogohlantirish Tizimi Trigger */}
            <button
              onClick={() => setIsQuickAlertOpen(true)}
              title="3 daqiqalik ogohlantiruvchi signal o'rnatish"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                recurring3MinAlert?.isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>3 daqiqa</span>
            </button>

            {/* Native Browser Notification Permission Button */}
            <button
              onClick={handleRequestNotification}
              title={
                notifPermission === 'granted'
                  ? "Brauzer bildirishnomalari faol: Barcha texnologik signallar vaqtida keladi"
                  : "Bildirishnomalarni yoqish: Signal va eslatmalarni o'tkazib yubormaslik uchun bosing"
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                notifPermission === 'granted'
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
              }`}
            >
              <Bell className={`w-3.5 h-3.5 ${notifPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="hidden lg:inline">
                {notifPermission === 'granted' ? 'Signallar faol' : 'Ovozli signalni yoqish'}
              </span>
            </button>

            {/* Quick Sound Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? "Ovozli signallar yoqilgan" : "Ovoz o'chirilgan"}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-750'
                  : 'bg-slate-850 border-slate-750 text-slate-500 hover:text-slate-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Quick Search Button (Ctrl+K) */}
            <button
              onClick={() => setIsQuickSearchOpen(true)}
              title="Tezkor qidiruv (Ctrl + K)"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Qidirish</span>
              <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-700 text-[10px] text-slate-400 rounded font-mono hidden md:inline">Ctrl+K</span>
            </button>

            {/* Attendance Check-in Status */}
            <button
              onClick={onOpenAttendance}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                hasCheckedInToday
                  ? currentUserAttendance?.isSubstitution
                    ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
              }`}
            >
              {hasCheckedInToday ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {currentUserAttendance?.isSubstitution ? "O'rinbosar" : 'Kelgan'}: {currentUserAttendance?.checkInTime.slice(0, 5)}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Davomat belgilash</span>
                </>
              )}
            </button>
          </div>

          {/* Role Switcher & User Profile */}
          <div className="flex items-center gap-2">
            {/* Quick Button to Change Login / Password */}
            <button
              onClick={() => {
                setIsChangePasswordOpen(true);
                setNewUsernameInput(currentUser.username);
                setCurrentPasswordInput('');
                setNewPasswordInput('');
                setConfirmPasswordInput('');
                setChangePasswordMsg(null);
              }}
              title="Shaxsiy kabinet login va parolini o'zgartirish"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-500/50 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Login / Parol</span>
            </button>

            <PWAInstallButton />

            {/* Direct Source Code Download (.ZIP) */}
            <a
              href="/uychi-parranda-source-code.zip"
              download="uychi-parranda-source-code.zip"
              title="Barcha kodlarni (.ZIP) yuklab olish"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 hover:text-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Kodni yuklash (.zip)</span>
            </a>

            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-amber-400">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-200 line-clamp-1">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-amber-400/90 font-medium">
                    {currentRoleInfo?.title || currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Modal for Roles & Employees (Ekran markazida ochiladi, ekrandan chiqib ketmaydi) */}
              {roleDropdownOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-start sm:items-center justify-center pt-16 sm:pt-4 p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
                  onClick={() => setRoleDropdownOpen(false)}
                >
                  <div
                    className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-4 sm:p-5 max-w-md w-full relative max-h-[82vh] flex flex-col animate-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header with Title and Close button */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 shrink-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                          <UserCog className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white">Xodimni Tanlash & Profil</h3>
                          <p className="text-[11px] text-slate-400">Filiallar va xodimlar kabineti</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setRoleDropdownOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                        title="Yopish"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Personal Security Button */}
                    <div className="mb-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangePasswordOpen(true);
                          setRoleDropdownOpen(false);
                          setChangePasswordMsg(null);
                          setNewUsernameInput(currentUser.username);
                          setCurrentPasswordInput('');
                          setNewPasswordInput('');
                          setConfirmPasswordInput('');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <KeyRound className="w-4 h-4 text-amber-400" />
                        <span>Shaxsiy Login & Parolni O'zgartirish</span>
                      </button>

                      {/* Download Python Developer Package */}
                      <a
                        href="/uychi_parranda_python_project.zip"
                        download="uychi_parranda_python_project.zip"
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <Download className="w-4 h-4 text-amber-400" />
                        <span>Python Dasturchi Uchun Papka (.ZIP)</span>
                      </a>

                      {/* Download Full Source Code */}
                      <a
                        href="/uychi-parranda-source-code.zip"
                        download="uychi-parranda-source-code.zip"
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium transition-all cursor-pointer shadow-sm"
                      >
                        <Download className="w-4 h-4 text-slate-400" />
                        <span>Frontend React Kodlari (.ZIP)</span>
                      </a>
                    </div>

                    <div className="px-1 py-1 flex items-center justify-between mb-2 shrink-0">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Xodimni tanlash (Parolli kirish):</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        5 ta filial
                      </span>
                    </div>

                    {/* Scrollable employee list */}
                    <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                      {users.map((u) => {
                        const roleConfig = ROLE_LABELS[u.role];
                        const isCurrent = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              if (isCurrent) {
                                setRoleDropdownOpen(false);
                                return;
                              }
                              setTargetUserToSwitch(u);
                              setSwitchPasswordInput('');
                              setSwitchError(null);
                              setRoleDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                                : 'hover:bg-slate-800 bg-slate-800/40 text-slate-300 border border-slate-750'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-100 truncate">{u.fullName}</span>
                                {isCurrent && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                                <span className="text-amber-400 font-medium">{roleConfig?.short || u.role}</span>
                                <span className="text-slate-400 truncate">• {u.branchName || 'Bosh Filial'}</span>
                              </div>
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded-lg shrink-0 border flex items-center gap-1 ${
                              isCurrent
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              <Lock className="w-2.5 h-2.5" />
                              {isCurrent ? 'Faol' : 'Kirish'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Bottom Close action button */}
                    <div className="pt-3 mt-3 border-t border-slate-800 flex justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() => setRoleDropdownOpen(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                      >
                        Yopish
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              title="Tizimdan chiqish (Logout)"
              className="p-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Hidden on mobile where BottomNavBar takes over) */}
        <nav className="hidden md:flex max-w-7xl mx-auto px-2 sm:px-4 items-center gap-1 overflow-x-auto border-t border-slate-800/80 py-1.5 scrollbar-none text-xs">
          {/* 1. Foydalanuvchining o'z lavozimiga oid Boshqaruv Paneli */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span>{currentRoleInfo?.short ? `${currentRoleInfo.short}` : 'Paneli'}</span>
          </button>

          {/* 2. Kundalik Operativ Reja */}
          {isAccessible('operational_plan') && (
            <button
              onClick={() => setActiveTab('operational_plan')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                activeTab === 'operational_plan'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-800'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
              <span>Reja</span>
            </button>
          )}

          {/* Inventarizatsiya */}
          {isAccessible('inventory') && (
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                activeTab === 'inventory'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inv</span>
            </button>
          )}

          {/* Parrandalar vazni */}
          {isAccessible('chicken_weight') && (
            <button
              onClick={() => setActiveTab('chicken_weight')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                activeTab === 'chicken_weight'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-amber-300 hover:text-amber-200 hover:bg-slate-800'
              }`}
            >
              <Egg className="w-3.5 h-3.5 text-amber-300" />
              <span>Vazn</span>
            </button>
          )}

          {/* 2. Filiallar Analitikasi */}
          {isAccessible('branch_analytics') && (
            <button
              onClick={() => setActiveTab('branch_analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                activeTab === 'branch_analytics'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Filiallar Analitikasi</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                5 ta
              </span>
            </button>
          )}

          {/* 3. Kadrlar (HR) bo'limi */}
          {isAccessible('hr') && (
            <button
              onClick={() => setActiveTab('hr')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                activeTab === 'hr'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-cyan-400 hover:text-cyan-200 hover:bg-slate-800'
              }`}
            >
              <UserCog className="w-3.5 h-3.5" />
              <span>Kadrlar (HR)</span>
            </button>
          )}

          {/* 4. UMUMIY BO'LIMLAR (Barcha lavozimlar uchun ochiq) */}
          {isAccessible('chat') && (
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                activeTab === 'chat'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Umumiy Chat</span>
            </button>
          )}

          {isAccessible('tasks') && (
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                activeTab === 'tasks'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Topshiriqlar</span>
            </button>
          )}

          {isAccessible('attendance') && (
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                activeTab === 'attendance'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Davomat Jurnali</span>
            </button>
          )}

          {isAccessible('photos') && (
            <button
              onClick={() => setActiveTab('photos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                activeTab === 'photos'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Foto-Hisobotlar</span>
            </button>
          )}

          {isAccessible('notes') && (
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                activeTab === 'notes'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <StickyNote className="w-3.5 h-3.5" />
              <span>Shaxsiy Zametkalar</span>
              {currentUserNotes.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'notes' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {currentUserNotes.length}
                </span>
              )}
            </button>
          )}



          {/* Quick Photo Upload Trigger */}
          <button
            onClick={onOpenPhotoUpload}
            className="ml-auto hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>Rasm Yuklash</span>
          </button>
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
