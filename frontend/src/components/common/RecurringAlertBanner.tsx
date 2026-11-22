import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CheckCircle2,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  AlertTriangle,
  Play,
  X,
  RotateCcw
} from 'lucide-react';

export const RecurringAlertBanner: React.FC = () => {
  const {
    recurring3MinAlert,
    markAlertCompleted,
    silenceAlarmSound,
    testTriggerAlarmNow,
    stop3MinAlert,
    soundEnabled,
    toggleSound,
  } = useApp();

  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  if (!recurring3MinAlert || !recurring3MinAlert.isActive) {
    return null;
  }

  const { title, description, secondsLeft, cycleCount, isRinging, targetType } = recurring3MinAlert;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleDone = () => {
    markAlertCompleted(note || undefined);
    setNote('');
    setShowNoteInput(false);
  };

  return (
    <div
      className={`sticky top-0 z-50 transition-all duration-300 shadow-2xl ${
        isRinging
          ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white animate-pulse border-b-4 border-yellow-300'
          : 'bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-amber-100 border-b-2 border-amber-500/50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left: Info & Status */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isRinging
                  ? 'bg-yellow-400 text-slate-950 animate-bounce shadow-lg shadow-yellow-400/50'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              <Bell className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/30 border border-white/20 text-yellow-300">
                  {isRinging ? '🚨 SIGNAL CHALINMOQDA!' : '🔔 3 DAQIQALIK OGOHLANTIRISH'}
                </span>
                {cycleCount > 0 && (
                  <span className="text-[11px] font-bold text-amber-200">
                    ({cycleCount}-marta signal chalindi)
                  </span>
                )}
                {targetType === 'task' && (
                  <span className="text-[10px] bg-blue-500/20 text-blue-200 border border-blue-400/30 px-1.5 py-0.5 rounded">
                    Vazifa
                  </span>
                )}
              </div>

              <h4 className="text-sm sm:text-base font-black truncate text-white mt-0.5">
                {title}
              </h4>
              {description && (
                <p className="text-xs text-amber-200/90 truncate max-w-xl">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Right: Timer Countdown & Action Buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap">
            {/* Live Countdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs font-mono font-bold text-yellow-300">
              <Clock className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
              <span>Keyingi: {formattedTime}</span>
            </div>

            {/* Silence sound button if actively ringing */}
            {isRinging && (
              <button
                onClick={silenceAlarmSound}
                title="Tovushni vaqtincha to'xtatish"
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Ovozsiz</span>
              </button>
            )}

            {/* Quick Test Alarm Button */}
            <button
              onClick={testTriggerAlarmNow}
              title="Ogohlantirish ovozini sinab ko'rish"
              className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Ovoz sinash</span>
            </button>

            {/* THE BIG "BAJARILDI" (COMPLETED) BUTTON */}
            <button
              onClick={handleDone}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 transform hover:scale-105 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>✅ BAJARILDI</span>
            </button>

            {/* Dismiss / Stop Alert */}
            <button
              onClick={stop3MinAlert}
              title="Ogohlantirishni bekor qilish"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
