import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, CheckCircle2, Clock, Volume2, X, Wrench, AlertTriangle } from 'lucide-react';
import { soundSynth } from '../../utils/audioAlert';

export const MilestoneAlertModal: React.FC = () => {
  const { activeMilestoneAlert, dismissMilestoneAlert, completeMilestone } = useApp();
  const [completionNote, setCompletionNote] = useState('');

  if (!activeMilestoneAlert) return null;

  const handleComplete = () => {
    completeMilestone(activeMilestoneAlert.id, completionNote || 'Vaqtida to\'liq bajarildi');
    setCompletionNote('');
  };

  const handlePlaySoundAgain = () => {
    soundSynth.playMilestoneAlarm();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-orange-500 rounded-3xl shadow-2xl shadow-orange-500/30 overflow-hidden ring-4 ring-orange-500/20">
        {/* Animated Warning Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-bounce">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-orange-200">
                Slesar Texnologik Ogohlantirish (3 daqiqa qoldi!)
              </div>
              <h3 className="text-lg font-black tracking-tight">
                {activeMilestoneAlert.time} - {activeMilestoneAlert.title}
              </h3>
            </div>
          </div>
          <button
            onClick={dismissMilestoneAlert}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div className="text-xs text-orange-200 leading-relaxed">
              <span className="font-bold text-white block mb-0.5">Operativ vazifa boshlanishiga 3 daqiqa:</span>
              {activeMilestoneAlert.description}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-slate-400 block text-[11px]">Ogohlantirish vaqti:</span>
              <span className="text-amber-400 font-mono font-bold text-sm">
                {activeMilestoneAlert.alertTime}
              </span>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-slate-400 block text-[11px]">Boshlanish vaqti:</span>
              <span className="text-emerald-400 font-mono font-bold text-sm">
                {activeMilestoneAlert.time}
              </span>
            </div>
          </div>

          {/* Quick note input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Bajarish bo'yicha qisqacha izoh (ixtiyoriy):
            </label>
            <input
              type="text"
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder="Masalan: 1-va 2-liniyalar ishga tushirildi, me'yorda"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleComplete}
              className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Bajarildi deb belgilash</span>
            </button>

            <button
              onClick={handlePlaySoundAgain}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 text-xs font-semibold"
              title="Ogohlantirish signalini qayta chalish"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Qayta signal</span>
            </button>

            <button
              onClick={dismissMilestoneAlert}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
            >
              Keyinroq
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
