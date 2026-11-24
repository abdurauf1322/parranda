import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarCheck2,
  CheckCircle2,
  Camera,
  ClipboardList,
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
  } = useApp();

  const myPendingTasks = tasks.filter(
    (t) =>
      (t.assignedToRole === currentUser.role || t.assignedToUserId === currentUser.id) &&
      t.status !== 'bajarildi'
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Chap: Xodim va uning filiali */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-white mr-1.5">{currentUser.fullName}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {currentUser.branchName || 'Fabrika'}
            </span>
          </div>
        </div>

        {/* O'ng: Ixcham Tezkor Chiplar (Davomat, Reja, Foto, Vazifalar) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Davomat chipi */}
          <button
            onClick={onOpenAttendance}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-medium border transition-all cursor-pointer ${
              hasCheckedInToday
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold animate-pulse'
            }`}
          >
            {hasCheckedInToday ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Davomat: {currentUserAttendance?.checkInTime.slice(0, 5) || 'Belgilangan'}</span>
              </>
            ) : (
              <>
                <CalendarCheck2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Davomat belgilanmagan</span>
              </>
            )}
          </button>

          {/* Kunlik Reja chipi */}
          <button
            onClick={() => setActiveTab('operational_plan')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 transition-all cursor-pointer"
          >
            <ClipboardList className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Kunlik Reja</span>
          </button>

          {/* Foto Hisobot chipi */}
          <button
            onClick={onOpenPhotoUpload}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Foto</span>
          </button>

          {/* Vazifalar soni chipi */}
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-semibold border transition-all cursor-pointer ${
              myPendingTasks.length > 0
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <span>Vazifalar:</span>
            <span className="font-bold text-amber-400">{myPendingTasks.length}</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
