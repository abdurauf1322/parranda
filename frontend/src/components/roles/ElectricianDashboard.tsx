import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { compressImage } from '../../utils/imageCompressor';
import {
  Zap,
  Activity,
  Fuel,
  Gauge,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  Loader2
} from 'lucide-react';

export const ElectricianDashboard: React.FC = () => {
  const { electricityLog, updateElectricityLog, addPhotoReport, photoReports, currentUser } = useApp();

  const [meterReading, setMeterReading] = useState(electricityLog.meterReadingKwh);
  const [dailyConsumption, setDailyConsumption] = useState(electricityLog.dailyConsumptionKwh);
  const [fuelLevel, setFuelLevel] = useState(electricityLog.generatorFuelLevelPercent);
  const [oilPressure, setOilPressure] = useState(electricityLog.generatorOilPressure);
  const [genStatus, setGenStatus] = useState(electricityLog.generatorStatus);
  const [notes, setNotes] = useState(electricityLog.notes || '');
  const [outageStartTime, setOutageStartTime] = useState(electricityLog.outageStartTime || '');
  const [outageEndTime, setOutageEndTime] = useState(electricityLog.outageEndTime || '');
  const [outageReason, setOutageReason] = useState(electricityLog.outageReason || '');
  const [meterPhoto, setMeterPhoto] = useState(electricityLog.meterPhotoUrl || 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const electricReports = photoReports.filter(
    (p) => p.uploaderId === currentUser.id || p.uploaderRole === 'elektrik' || p.category === 'hisoblagich'
  );

  const handleMeterPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingPhoto(true);
        const compressed = await compressImage(file, 960, 960, 0.70);
        if (compressed) {
          setMeterPhoto(compressed);
        }
      } catch (err) {
        console.warn('Meter photo compression error:', err);
      } finally {
        setIsProcessingPhoto(false);
        e.target.value = '';
      }
    }
  };

  const handleSaveElectricityLog = (e: React.FormEvent) => {
    e.preventDefault();
    updateElectricityLog({
      meterReadingKwh: Number(meterReading),
      dailyConsumptionKwh: Number(dailyConsumption),
      generatorFuelLevelPercent: Number(fuelLevel),
      generatorOilPressure: oilPressure,
      generatorStatus: genStatus,
      notes,
      meterPhotoUrl: meterPhoto,
      outageStartTime,
      outageEndTime,
      outageReason,
    });

    // Also auto-add to Photo Reports
    addPhotoReport(
      `Kunlik Elektr Hisoblagich: ${meterReading} kVt/soat`,
      'hisoblagich',
      meterPhoto,
      `Kundalik sarf: ${dailyConsumption} kVt. Tarmoq uzilishi: ${outageStartTime || 'Yoq'} - ${outageEndTime || 'Yoq'}. ${notes}`,
      'Transformator TP-1'
    );

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-yellow-950/40 p-6 rounded-3xl border border-amber-500/30 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Bosh Elektrik Paneli
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Elektr & Generator Nazorati
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Kunlik elektr hisoblagich fotosuratini topshirish va dizel generatori parametrlarini kiritish
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Elektr ko'rsatkichlari va fotosurat rahbariyatga muvaffaqiyatli topshirildi!</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-400" />
            <span>Kunlik Elektr va Generator Qaydnomasi</span>
          </h2>

          <form onSubmit={handleSaveElectricityLog} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Umumiy hisoblagich ko'rsatkichi (kVt/soat):
                </label>
                <input
                  type="number"
                  required
                  value={meterReading}
                  onChange={(e) => setMeterReading(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Kunlik sarf (kVt):
                </label>
                <input
                  type="number"
                  required
                  value={dailyConsumption}
                  onChange={(e) => setDailyConsumption(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                Zaxira Dizel Generatori Holati:
              </span>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Yoqilg'i baki (%):
                  </label>
                  <input
                    type="number"
                    max={100}
                    min={0}
                    value={fuelLevel}
                    onChange={(e) => setFuelLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Moy bosimi:
                  </label>
                  <input
                    type="text"
                    value={oilPressure}
                    onChange={(e) => setOilPressure(e.target.value)}
                    placeholder="Masalan: 4.2 Bar"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Generator holati:
                  </label>
                  <select
                    value={genStatus}
                    onChange={(e) => setGenStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="tayyor">Tayyor (Avtomat)</option>
                    <option value="ishlamoqda">Ishlamoqda</option>
                    <option value="tamirda">Ta'mirda</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Power Outage & Restoration Timing Section */}
            <div className="p-4 bg-amber-950/30 rounded-2xl border border-amber-500/30 space-y-3">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Elektr Tarmog'i O'chib Yongan Vaqti (Avariya / Uzilishlar):</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    O'chgan vaqti:
                  </label>
                  <input
                    type="time"
                    value={outageStartTime}
                    onChange={(e) => setOutageStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Yongan (tiklangan) vaqti:
                  </label>
                  <input
                    type="time"
                    value={outageEndTime}
                    onChange={(e) => setOutageEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    O'chish sababi:
                  </label>
                  <input
                    type="text"
                    value={outageReason}
                    onChange={(e) => setOutageReason(e.target.value)}
                    placeholder="Masalan: Tashqi tarmoq o'chishi"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Kuchlanish va elektr tarmog'i holati bo'yicha izoh:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Masalan: 3 fazada ham 225-230V barqaror, nosozlik yo'q"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Elektr Hisobotini Saqlash va Foto Yuklash</span>
            </button>
          </form>
        </div>

        {/* Right: Mandatory Photo of Meter (5 cols) */}
        <div className="lg:col-span-5 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Majburiy Hisoblagich Fotosurati</span>
          </h2>

          <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900/60 p-2 space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-slate-950 h-56">
              {isProcessingPhoto ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-amber-300 bg-slate-900/90">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                  <span className="text-xs font-semibold">Rasm qayta ishlanmoqda...</span>
                </div>
              ) : (
                <img
                  src={meterPhoto}
                  alt="Elektr hisoblagich surati"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <label className="w-full py-2.5 px-3 bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
              <Camera className="w-4 h-4 text-amber-300" />
              <span>Hisoblagichni Suratga Olish / Yuklash</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleMeterPhotoUpload}
                className="hidden"
              />
            </label>

            <div className="p-2 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>So'nggi rasm:</span>
                <span className="font-mono text-amber-400">{electricityLog.time}</span>
              </div>
              <div className="text-slate-300 font-semibold">
                Mas'ul elektrik: {electricityLog.reportedByName}
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Har kuni ertalab 07:30 da transformator TP-1 bosh hisoblagichi suratga olinishi va tizimga yuklanishi shart!
            </span>
          </div>

          {/* Mening Yuklagan Hisobotlarim Tarixi */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Mening Yuklagan Hisobotlarim</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {electricReports.length} ta
              </span>
            </h3>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {electricReports.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Hozircha yuklangan hisobotlar yo'q.
                </div>
              ) : (
                electricReports.map((rep) => (
                  <div key={rep.id} className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-xs">{rep.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {rep.timestamp} {rep.building ? `• ${rep.building}` : ''}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rep.status === 'tasdiqlandi'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {rep.status === 'tasdiqlandi' ? 'Tasdiqlangan' : 'Kutilmoqda'}
                      </span>
                    </div>

                    {rep.imageUrl && (
                      <img
                        src={rep.imageUrl}
                        alt={rep.title}
                        className="w-full h-24 object-cover rounded-xl border border-slate-700"
                      />
                    )}

                    {rep.notes && (
                      <p className="text-[11px] text-slate-300 italic bg-slate-800/60 p-2 rounded-xl">
                        "{rep.notes}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
