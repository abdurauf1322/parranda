import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarCheck2,
  CheckCircle2,
  Camera,
  ClipboardList,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface QuickWorkerBarProps {
  onOpenAttendance: () => void;
  onOpenPhotoUpload: () => void;
}

export const QuickWorkerBar: React.FC<QuickWorkerBarProps> = ({
  onOpenAttendance,
  onOpenPhotoUpload,
}) => {
  const {
    currentUser,
    hasCheckedInToday,
    currentUserAttendance,
    tasks,
    setActiveTab,
    farmCurrentTime,
  } = useApp();

  // Xodimning kutilayotgan bugungi vazifalari
  const myPendingTasks = tasks.filter(
    (t) =>
      (t.assignedToRole === currentUser.role || t.assignedToUserId === currentUser.id) &&
      t.status !== 'bajarildi'
  );

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-xl space-y-3">
      {/* Yuqori qism: Xush kelibsiz va bugungi holat */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black shrink-0">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                Salom, {currentUser.fullName}!
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-bold border border-slate-700">
                {currentUser.branchName || 'Bosh filial'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Fabrika vaqti: <strong className="text-slate-200">{farmCurrentTime}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">Tizim faol</span>
            </p>
          </div>
        </div>

        {/* Tezkor vazifalar hisoblagichi */}
        <button
          onClick={() => setActiveTab('tasks')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <ClipboardList className="w-4 h-4 text-amber-400" />
          <span>Vazifalarim:</span>
          <span className={`px-1.5 py-0.2 rounded-full font-bold text-[11px] ${
            myPendingTasks.length > 0
              ? 'bg-amber-500 text-slate-950 font-black'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {myPendingTasks.length > 0 ? `${myPendingTasks.length} ta kutmoqda` : 'Hammasi bajarilgan'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>

      {/* Asosiy 3 ta Katta va Sodda Harakat Tugmasi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* 1. Davomat Tugmasi */}
        <button
          onClick={onOpenAttendance}
          className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
            hasCheckedInToday
              ? 'bg-emerald-950/30 hover:bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-300 ring-2 ring-amber-500/20 animate-pulse'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                hasCheckedInToday
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500 text-slate-950 font-bold'
              }`}
            >
              {hasCheckedInToday ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <CalendarCheck2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">
                {hasCheckedInToday ? 'Davomat Belgilangan' : '1. Ishga Keldim'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {hasCheckedInToday
                  ? `Kelgan vaqti: ${currentUserAttendance?.checkInTime || '07:55'}`
                  : 'Belgilash uchun bosing'}
              </div>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
              hasCheckedInToday
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500 text-slate-950 border-amber-400'
            }`}
          >
            {hasCheckedInToday ? 'Faol' : 'Bosing'}
          </span>
        </button>

        {/* 2. Bugungi Vazifa va Ish Rejasi */}
        <button
          onClick={() => setActiveTab('operational_plan')}
          className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 text-left transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-white group-hover:text-sky-300 transition-colors">
                2. Kunlik Ish Rejasi
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Filial va sex grafigi
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </button>

        {/* 3. Foto Hisobot Yuklash */}
        <button
          onClick={onOpenPhotoUpload}
          className="p-3 rounded-2xl bg-pink-950/20 hover:bg-pink-950/40 border border-pink-500/30 hover:border-pink-500/60 text-left transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-400 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-white group-hover:text-pink-300 transition-colors">
                3. Foto Hisobot
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Hisoblagich va plomba surati
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/40">
            Kamera
          </span>
        </button>
      </div>
    </div>
  );
};
