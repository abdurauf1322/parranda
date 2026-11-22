import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { compressImage } from '../../utils/imageCompressor';
import {
  Shield,
  Clock,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Eye,
  Plus,
  Upload,
  Loader2
} from 'lucide-react';

export const GuardDashboard: React.FC = () => {
  const { guardShift, updateGuardShift, addPhotoReport, farmCurrentTime } = useApp();

  const [shiftType, setShiftType] = useState<'kunduzgi' | 'tungi'>(guardShift.shiftType);
  const [takeoverTime, setTakeoverTime] = useState(guardShift.takeoverTime);
  const [handoverTime, setHandoverTime] = useState(guardShift.handoverTime || '06:00');
  const [handoverTo, setHandoverTo] = useState(guardShift.handoverToGuardName || "Po'latov Alisher");
  const [perimeterStatus, setPerimeterStatus] = useState<any>(guardShift.perimeterStatus);
  const [incidentReport, setIncidentReport] = useState(guardShift.incidentReport || '');
  const [monitorPhoto, setMonitorPhoto] = useState(guardShift.surveillancePhotoUrl || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Hourly night shift milestones
  const NIGHT_HOURS = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessing(true);
        setUploadError(null);
        const compressed = await compressImage(file, 960, 960, 0.70);
        if (compressed) {
          setMonitorPhoto(compressed);
        } else {
          setUploadError('Rasmni yuklashda xatolik yuz berdi.');
        }
      } catch (err) {
        console.warn('Rasm siqish xatosi:', err);
        setUploadError('Rasmni qayta ishlashda xatolik yuz berdi.');
      } finally {
        setIsProcessing(false);
        e.target.value = '';
      }
    }
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    updateGuardShift({
      shiftType,
      takeoverTime,
      handoverTime,
      handoverToGuardName: handoverTo,
      perimeterStatus,
      incidentReport,
      surveillancePhotoUrl: monitorPhoto,
      hourlyPhotosCount: guardShift.hourlyPhotosCount + 1,
      lastMonitorCheckTime: farmCurrentTime,
    });

    // Auto publish to photo reports
    addPhotoReport(
      `Tungi Kuzatuv Monitori (${farmCurrentTime}): ${perimeterStatus === 'tinch' ? 'Tinch' : 'Tekshiruv'}`,
      'surveillance',
      monitorPhoto,
      `Perimetr: ${perimeterStatus}. ${incidentReport || 'Hech qanday hodisa sodir bo\'lmadi, barcha kameralar ishlamoqda.'}`,
      'Nazorat Punkti (KPP-1)'
    );

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/40 p-6 rounded-3xl border border-purple-500/30 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Qorovul & Xavfsizlik Xizmati Paneli
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Tungi Nazorat (18:00 - 06:00)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Smenani topshirish-qabul qilish va har soatda videokuzatuv monitorlari fotosuratini yuklash
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Monitor fotosurati va smena qaydnomasi saqlandi!</span>
        </div>
      )}

      {/* Hourly Night Surveillance Progress Banner */}
      <div className="p-5 bg-slate-850 border border-slate-800 rounded-3xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Tungi Soatlik Monitor Foto-Qaydlari (18:00 dan 06:00 gacha)</span>
          </h2>
          <span className="text-xs text-purple-300 font-mono font-bold">
            {guardShift.hourlyPhotosCount} / 12 soat topshirildi
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-13 gap-1.5 text-center text-xs">
          {NIGHT_HOURS.map((hour, idx) => {
            const isDone = idx < guardShift.hourlyPhotosCount;
            return (
              <div
                key={hour}
                className={`p-2 rounded-xl border text-[11px] font-mono font-bold ${
                  isDone
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div>{hour}</div>
                <div className="text-[9px] mt-0.5">{isDone ? '✓ Yuklandi' : 'Kutilmoqda'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Shift Details & Incident (7 cols) */}
        <div className="lg:col-span-7 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <span>Smena Qabul / Topshirish & Monitor Surati Yuklash</span>
          </h2>

          <form onSubmit={handleSaveShift} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Smena turi:</label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                >
                  <option value="tungi">Tungi smena (18:00 - 06:00)</option>
                  <option value="kunduzgi">Kunduzgi smena (06:00 - 18:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Perimetr va hudud holati:
                </label>
                <select
                  value={perimeterStatus}
                  onChange={(e) => setPerimeterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                >
                  <option value="tinch">Tinch, tartibbuzarlik yo'q</option>
                  <option value="shubhali">Shubhali harakat kuzatildi</option>
                  <option value="nosozlik_mavjud">Kamera/yoritgichda nosozlik</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Smena qabul qilingan vaqt:
                </label>
                <input
                  type="text"
                  value={takeoverTime}
                  onChange={(e) => setTakeoverTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Smenani topshirish (Keyingi qorovul):
                </label>
                <input
                  type="text"
                  value={handoverTo}
                  onChange={(e) => setHandoverTo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-purple-400" />
                  <span>Majburiy Tungi Videokuzatuv Monitori Fotosurati:</span>
                </label>
                <span className="text-[10px] text-slate-400">Kameralar ekrani</span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
                {isProcessing ? (
                  <div className="w-full h-44 flex flex-col items-center justify-center gap-2 text-purple-300 bg-slate-900/80">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                    <span className="text-xs font-semibold">Rasm qayta ishlanmoqda...</span>
                  </div>
                ) : (
                  <img
                    src={monitorPhoto}
                    alt="Monitor surati"
                    className="w-full h-44 object-cover"
                  />
                )}
              </div>

              {uploadError && (
                <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-[11px] text-rose-300 font-medium">
                  {uploadError}
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap pt-1">
                <label className="flex-1 min-w-[140px] py-2 px-3 bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
                  <Camera className="w-4 h-4 text-purple-300" />
                  <span>Suratga olish / Yuklash</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMonitorPhoto('https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80');
                  }}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
                >
                  Asosiy Namuna
                </button>
              </div>

              <span className="text-[11px] text-slate-400 block">
                Barcha 16 ta perimetr kamerasi ekranda aniq ko'rinishi shart. Telefonda kamera orqali to'g'ridan-to'g'ri suratga olishingiz mumkin.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Tungi hisobot / Qoidabuzarliklar jurnali:
              </label>
              <textarea
                rows={2}
                value={incidentReport}
                onChange={(e) => setIncidentReport(e.target.value)}
                placeholder="Hech qanday hodisa sodir bo'lmadi, qulflar butun..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Soatlik Monitor Suratini Saqlash & Smenani Qayd Etish</span>
            </button>
          </form>
        </div>

        {/* Right: Security info & instructions (5 cols) */}
        <div className="lg:col-span-5 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Qorovullik Qat'iy Yo'riqnomasi</span>
          </h2>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400 block">1. 18:00 - 06:00 Tungi Rejim:</span>
              <p className="text-slate-400">
                Har soatda kompyuter/monitorlar oldidan surat olib tizimga yuklash majburiydir. Ushbu suratlar to'g'ridan-to'g'ri Direktor panelida ko'rinadi.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 block">2. Begona Avtotransport:</span>
              <p className="text-slate-400">
                Direktor yoki Farm Manager ruxsatisiz hech qanday transport dezobaryerdan ichkariga kiritilmaydi.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-blue-400 block">3. Favqulodda Holat:</span>
              <p className="text-slate-400">
                Elektr uzilishi bo'lsa, zudlik bilan Bosh Elektrikka va Farm Managerga telefon orqali yoki Umumiy Chat orqali xabar bering.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
