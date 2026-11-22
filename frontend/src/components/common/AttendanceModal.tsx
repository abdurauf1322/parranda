import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/mockData';
import {
  UserCheck,
  UserX,
  X,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
  ArrowRight,
  Info
} from 'lucide-react';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    hasCheckedInToday,
    currentUserAttendance,
    checkInAttendance,
    attendanceRecords,
    users
  } = useApp();

  const [isSubstitution, setIsSubstitution] = useState(false);
  const [originalWorkerName, setOriginalWorkerName] = useState(users[0]?.fullName || '');
  const [substituteWorkerName, setSubstituteWorkerName] = useState(currentUser.fullName);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkInAttendance(
      isSubstitution,
      isSubstitution ? originalWorkerName : undefined,
      isSubstitution ? substituteWorkerName : undefined,
      notes
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800/90 border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Davomat Qaydnomasi (Kelish jurnali)
              </h2>
              <p className="text-xs text-slate-400">
                Ishga kelish va o'rinbosarlik (Almashuvchi) tartibi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form & List */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Current User Status Banner */}
          <div
            className={`p-4 rounded-2xl border ${
              hasCheckedInToday
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Joriy xodim:
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{currentUser.fullName}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                    {ROLE_LABELS[currentUser.role].title}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Holat:</span>
                <span
                  className={`inline-block font-bold text-xs px-2.5 py-0.5 rounded-lg ${
                    hasCheckedInToday
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {hasCheckedInToday ? 'Kelgan' : 'Kutilmoqda'}
                </span>
              </div>
            </div>

            {hasCheckedInToday && (
              <div className="mt-3 pt-3 border-t border-emerald-500/20 text-xs flex items-center justify-between text-emerald-300 font-mono">
                <span>Kelish vaqti: {currentUserAttendance?.checkInTime}</span>
                {currentUserAttendance?.isSubstitution && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded border border-purple-500/40">
                    O'rinbosar: {currentUserAttendance.substituteWorkerName}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Check-In Form (Can check-in or update) */}
          <form onSubmit={handleSubmit} className="space-y-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{hasCheckedInToday ? "Qayta belgilash / Yangilash" : "Ishga kelishni tasdiqlash"}</span>
            </div>

            {/* Substitution Checkbox Mode */}
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-start gap-3">
              <input
                type="checkbox"
                id="sub_checkbox"
                checked={isSubstitution}
                onChange={(e) => setIsSubstitution(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-600 text-amber-500 focus:ring-amber-500 bg-slate-900"
              />
              <label htmlFor="sub_checkbox" className="text-xs cursor-pointer select-none">
                <span className="font-bold text-amber-300 block">
                  Almashuvchi rejimi (Substitution Mode)?
                </span>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  Boshqa xodim o'rniga smenaga chiqayotgan bo'lsangiz, ushbu bandni belgilang.
                </span>
              </label>
            </div>

            {/* Substitution Details */}
            {isSubstitution && (
              <div className="space-y-3 p-3 bg-purple-900/20 border border-purple-500/30 rounded-xl animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-bold text-purple-200 mb-1">
                    Asl xodim (O'rniga chiqilayotgan xodim):
                  </label>
                  <select
                    value={originalWorkerName}
                    onChange={(e) => setOriginalWorkerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-purple-500/40 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={`${u.fullName} (${ROLE_LABELS[u.role].short})`}>
                        {u.fullName} — {ROLE_LABELS[u.role].title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-200 mb-1">
                    O'rinbosar xodim to'liq ismi (Substitute Worker Full Name):
                  </label>
                  <input
                    type="text"
                    required
                    value={substituteWorkerName}
                    onChange={(e) => setSubstituteWorkerName(e.target.value)}
                    placeholder="Masalan: Mahmudov Otabek Shavkatovich"
                    className="w-full px-3 py-2 bg-slate-900 border border-purple-500/40 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Izoh yoki sabab (ixtiyoriy):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Masalan: 06:45 da o'z vaqtida yetib kelindi"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{hasCheckedInToday ? "Davomatni yangilash" : "Kelishni qayd etish (Check-in)"}</span>
            </button>
          </form>

          {/* Today's Farm Attendance List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Bugungi fabrika davomati ({attendanceRecords.length} ta yozuv)</span>
              </h3>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
              {attendanceRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-200">{rec.userName}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{ROLE_LABELS[rec.role]?.short || rec.role}</span>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-amber-400">{rec.checkInTime}</span>
                    </div>
                    {rec.isSubstitution && (
                      <div className="mt-1 text-[10px] text-purple-300 font-medium bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 inline-block">
                        Almashuvchi: {rec.substituteWorkerName} (Asl: {rec.originalWorkerName})
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      rec.status === 'orinbosar_bilan'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {rec.status === 'orinbosar_bilan' ? "O'rinbosar" : 'Keldi'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
