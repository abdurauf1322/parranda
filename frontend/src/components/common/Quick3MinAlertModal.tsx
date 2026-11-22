import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Clock,
  Volume2,
  CheckCircle2,
  X,
  Play,
  Sparkles,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface Quick3MinAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Quick3MinAlertModal: React.FC<Quick3MinAlertModalProps> = ({ isOpen, onClose }) => {
  const { start3MinAlert, testTriggerAlarmNow, recurring3MinAlert } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const presets = [
    {
      title: "1-va 2-korpus suv liniyasi bosimini tekshirish",
      desc: "Nippellar va suv ta'minoti klapanlarini ko'zdan kechirish",
    },
    {
      title: "Tuxum yig'ish lentasini to'xtatish",
      desc: "Lenta to'lib ketmasligi uchun o'z vaqtida o'chirish",
    },
    {
      title: "4-korpus ventilyator va harorat nazorati",
      desc: "Optimal mikroiqlimni saqlash uchun datchiklarni tekshirish",
    },
    {
      title: "Yem bunkeriga yem yetkazib berish nazorati",
      desc: "Avtomatik yem taqsimlagichni ishga tushirish",
    },
    {
      title: "Karantin va dezinfeksiya to'sig'ini tekshirish",
      desc: "Kirish darvozasidagi dezobaryer eritmasini yangilash",
    },
  ];

  const handleStart = (customTitle?: string, customDesc?: string) => {
    const finalTitle = customTitle || title.trim();
    if (!finalTitle) return;

    start3MinAlert(finalTitle, customDesc || description.trim(), undefined, 'custom');
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/20 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-yellow-600 px-6 py-4 flex items-center justify-between text-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center shadow">
              <Bell className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight leading-tight">
                3 Daqiqalik Ovozli Ogohlantirish
              </h3>
              <p className="text-xs font-semibold text-slate-900/80">
                "Bajarildi" bosilmaguncha har 3 daqiqada ogohlantiradi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-950/80 hover:text-slate-950 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Active status info */}
          {recurring3MinAlert?.isActive && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">
                  Hozirda boshqa 3 min signal faol: "{recurring3MinAlert.title}"
                </span>
              </div>
            </div>
          )}

          {/* Explanation Box */}
          <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs text-slate-300 space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Qanday ishlaydi?</span>
            </div>
            <p className="leading-relaxed">
              Vazifani boshlaganingizda yoki ogohlantirish o'rnatganingizda, brauzer har 3 daqiqada (180 soniya) maxsus sanoat signal ohangini chaladi. Siz <strong className="text-emerald-400">"✅ Bajarildi"</strong> tugmasini bosganingizda signalizatsiya to'xtatiladi.
            </p>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Tayyor fabrika vazifalari (1-klikda boshlash):
            </label>
            <div className="space-y-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleStart(preset.title, preset.desc)}
                  className="w-full text-left p-3 bg-slate-800/60 hover:bg-amber-500/10 border border-slate-700 hover:border-amber-500/50 rounded-xl transition-all group flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
                      {preset.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {preset.desc}
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 bg-amber-500/20 text-amber-300 text-[11px] font-bold rounded-lg border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors flex items-center gap-1">
                    <Play className="w-3 h-3 fill-current" />
                    Boshlash
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom form */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Yoki o'zingiz yangi vazifa yozing:
            </label>
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Vazifa nomi (masalan: 3-korpusdagi suvni ko'rish)"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Batafsil ma'lumot (ixtiyoriy)"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => handleStart()}
              disabled={!title.trim()}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Bell className="w-4 h-4 fill-current" />
              <span>3 Daqiqalik Signalni Yoqish</span>
            </button>

            <button
              type="button"
              onClick={testTriggerAlarmNow}
              title="Ogohlantirish signalini hozir sinab ko'rish"
              className="py-3 px-3.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>Ovozni sinash</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
