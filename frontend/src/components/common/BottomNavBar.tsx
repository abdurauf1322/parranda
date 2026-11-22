import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppTab } from '../../types';
import {
  Home,
  ClipboardList,
  MessageSquare,
  Grid,
  X,
  Boxes,
  Scale,
  CalendarCheck2,
  Camera,
  StickyNote,
  BarChart3,
  Users2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface BottomNavBarProps {
  onOpenAttendance: () => void;
  onOpenPhotoUpload: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  onOpenAttendance,
  onOpenPhotoUpload,
}) => {
  const { activeTab, setActiveTab, currentUser, getAccessibleTabs } = useApp();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const allowedTabs = getAccessibleTabs();

  const handleTabClick = (tab: AppTab) => {
    setActiveTab(tab);
    setIsMoreMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const moreSections: {
    tab: AppTab;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }[] = [
    {
      tab: 'tasks',
      label: 'Topshiriqlar',
      sublabel: 'Biriktirilgan vazifalar va muddatlar',
      icon: ClipboardList,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    },
    {
      tab: 'attendance',
      label: 'Davomat Jurnali',
      sublabel: 'Keldi-ketdi va yo\'qlama',
      icon: CalendarCheck2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      tab: 'inventory',
      label: 'Omborxona',
      sublabel: 'Yem, dori va ehtiyot qismlar',
      icon: Boxes,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      tab: 'chicken_weight',
      label: 'Parrandalar Vazni',
      sublabel: 'Qafaslar bo\'yicha o\'lchovlar',
      icon: Scale,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    },
    {
      tab: 'photos',
      label: 'Foto Hisobotlar',
      sublabel: 'Hisoblagich va plomba suratlari',
      icon: Camera,
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    },
    {
      tab: 'notes',
      label: 'Shaxsiy Eslatmalar',
      sublabel: 'Ovozli va yozma zametkalar',
      icon: StickyNote,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      tab: 'branch_analytics',
      label: 'Filiallar Analitikasi',
      sublabel: 'Kunlik mahsuldorlik va hisobotlar',
      icon: BarChart3,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    },
    {
      tab: 'hr',
      label: 'Kadrlar Bo\'limi',
      sublabel: 'Xodimlar va lavozimlar nazorati',
      icon: Users2,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    },
  ];

  // Filter allowed sections for this role
  const filteredMoreSections = moreSections.filter((s) => allowedTabs.includes(s.tab));

  const isMoreTabActive = [
    'tasks',
    'attendance',
    'inventory',
    'chicken_weight',
    'photos',
    'notes',
    'branch_analytics',
    'hr',
  ].includes(activeTab);

  return (
    <>
      {/* "Yana..." Barcha Bo'limlar Pastki Modali (Bottom Sheet) */}
      {isMoreMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Barcha Bo'limlar</h3>
                  <p className="text-[11px] text-slate-400">Kerakli bo'limni tanlang</p>
                </div>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar inside Menu */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenAttendance();
                }}
                className="p-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-left cursor-pointer transition-all"
              >
                <CalendarCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-300">Davomat Belgilash</div>
                  <div className="text-[10px] text-emerald-200/70">Keldim / Ketdim</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenPhotoUpload();
                }}
                className="p-2.5 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 rounded-2xl flex items-center gap-2 text-left cursor-pointer transition-all"
              >
                <Camera className="w-4 h-4 text-pink-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-pink-300">Rasm Yuklash</div>
                  <div className="text-[10px] text-pink-200/70">Foto hisobot</div>
                </div>
              </button>
            </div>

            {/* Scrollable list of other sections */}
            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
              {filteredMoreSections.map((item) => {
                const Icon = item.icon;
                const isCurrent = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => handleTabClick(item.tab)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer border ${
                      isCurrent
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-md'
                        : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{item.label}</span>
                          {isCurrent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.sublabel}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar (Mobile / Tablet) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 shadow-2xl safe-area-pb">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* 1. Bosh Sahifa */}
          <button
            onClick={() => handleTabClick('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'dashboard' ? 'bg-amber-500/20' : ''}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-tight">Asosiy</span>
          </button>

          {/* 2. Kunlik Ish Rejasi */}
          <button
            onClick={() => handleTabClick('operational_plan')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'operational_plan' || activeTab === 'tasks'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                activeTab === 'operational_plan' || activeTab === 'tasks' ? 'bg-amber-500/20' : ''
              }`}
            >
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-tight">Ish Rejasi</span>
          </button>

          {/* 3. Umumiy Chat */}
          <button
            onClick={() => handleTabClick('chat')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'chat' ? 'bg-amber-500/20' : ''}`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-tight">Chat</span>
          </button>

          {/* 4. Yana... (Barcha bo'limlar) */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              isMoreTabActive || isMoreMenuOpen
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg relative ${
                isMoreTabActive || isMoreMenuOpen ? 'bg-amber-500/20' : ''
              }`}
            >
              <Grid className="w-5 h-5" />
              {isMoreTabActive && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 leading-tight">Bo'limlar</span>
          </button>
        </div>
      </nav>
    </>
  );
};
