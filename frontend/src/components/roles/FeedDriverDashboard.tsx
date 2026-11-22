import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { compressImage } from '../../utils/imageCompressor';
import {
  Package,
  Camera,
  CheckCircle2,
  ShieldCheck,
  Building,
  Scale,
  Plus,
  Loader2
} from 'lucide-react';

export const FeedDriverDashboard: React.FC = () => {
  const { feedTransports, addFeedTransport, addPhotoReport } = useApp();

  const [vehicleNumber, setVehicleNumber] = useState('50 B 456 BB (Kamaz Yem tashuvchi)');
  const [feedType, setFeedType] = useState<any>('Finisher (Tuxum berish)');
  const [tonnage, setTonnage] = useState(10.5);
  const [destinationBuilding, setDestinationBuilding] = useState('2-Bino Bunkeri');
  const [sealNumber, setSealNumber] = useState('UZ-88421');
  const [sealPhoto, setSealPhoto] = useState('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80');
  const [notes, setNotes] = useState('Yem tegirmondan yangi keltirildi, namlik 11.8%');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isProcessingSeal, setIsProcessingSeal] = useState(false);

  const handleSealPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingSeal(true);
        const compressed = await compressImage(file, 960, 960, 0.70);
        if (compressed) {
          setSealPhoto(compressed);
        }
      } catch (err) {
        console.warn('Seal photo error:', err);
      } finally {
        setIsProcessingSeal(false);
        e.target.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addFeedTransport({
      vehicleNumber,
      feedType,
      tonnage: Number(tonnage),
      destinationBuilding,
      sealNumber,
      sealPhotoUrl: sealPhoto,
      status: 'bunkerga_tushirildi',
      notes,
    });

    // Auto publish to photo reports
    addPhotoReport(
      `Yem Plombasi & Yuklash: ${tonnage} tonna (${destinationBuilding})`,
      'plomba',
      sealPhoto,
      `Plomba: #${sealNumber}. Yem turi: ${feedType}. Mashina: ${vehicleNumber}.`,
      destinationBuilding
    );

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-lime-950/60 via-slate-900 to-green-950/40 p-6 rounded-3xl border border-lime-500/30 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-lime-500/20 border border-lime-500/40 flex items-center justify-center text-lime-400">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Yem Tashuvchi Haydovchi Paneli
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime-500/20 text-lime-300 border border-lime-500/30">
                Ozuqa Logistikasi & Plomba Nazorati
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Yem tonnaji, bunker manzili va mashina/konteyner plomba fotosuratini kiritish
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Yem qabul qilish va plomba surati tizimga muvaffaqiyatli saqlandi!</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Plus className="w-4 h-4 text-lime-400" />
            <span>Yangi Ozuqa Tashish va Tushirish Qaydnomasi</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mashina davlat raqami:
                </label>
                <input
                  type="text"
                  required
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tushiriladigan bino bunkeri:
                </label>
                <select
                  value={destinationBuilding}
                  onChange={(e) => setDestinationBuilding(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                >
                  <option value="1-Bino Bunkeri">1-Bino Bunkeri (Broyler)</option>
                  <option value="2-Bino Bunkeri">2-Bino Bunkeri (Tuxum)</option>
                  <option value="3-Bino Bunkeri">3-Bino Bunkeri (Yosh parranda)</option>
                  <option value="Bosh Omborxona">Bosh Yem Omborxonasi</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Yem turi (Tarkibi):
                </label>
                <select
                  value={feedType}
                  onChange={(e) => setFeedType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                >
                  <option value="Starter (0-4 hafta)">Starter (0-4 hafta)</option>
                  <option value="Grover (5-16 hafta)">Grover (5-16 hafta)</option>
                  <option value="Finisher (Tuxum berish)">Finisher (Tuxum berish)</option>
                  <option value="Maxsus ozuqa">Maxsus ozuqa (Premikslar bilan)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Vazni / Miqdori (Tonnada):
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={tonnage}
                  onChange={(e) => setTonnage(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-lime-400" />
                  <span>Plomba raqami (Zavod/Tegirmon plombasi):</span>
                </label>
                <input
                  type="text"
                  required
                  value={sealNumber}
                  onChange={(e) => setSealNumber(e.target.value)}
                  placeholder="Masalan: UZ-88421"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-lime-300 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-lime-400" />
                  <span>Majburiy: Konteyner plombalari va bunkerga tushirish surati:</span>
                </label>
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 h-36">
                  {isProcessingSeal ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-lime-300 bg-slate-900/90">
                      <Loader2 className="w-5 h-5 animate-spin text-lime-400" />
                      <span className="text-[10px]">Yuklanmoqda...</span>
                    </div>
                  ) : (
                    <img
                      src={sealPhoto}
                      alt="Plomba surati"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <label className="w-full py-2 px-3 bg-lime-600/30 hover:bg-lime-600/40 text-lime-200 border border-lime-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
                  <Camera className="w-4 h-4 text-lime-300" />
                  <span>Plomba va Bunker Suratini Olish / Yuklash</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleSealPhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Izoh yoki yem sifati bo'yicha ma'lumot:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-lime-500/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Yem Qabul Qilishni Qayd Etish & Plomba Surati Yuklash</span>
            </button>
          </form>
        </div>

        {/* Right: History of Feed Deliveries (5 cols) */}
        <div className="lg:col-span-5 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Building className="w-4 h-4 text-lime-400" />
            <span>Bugungi Ozuqa Tushirish Tarixi ({feedTransports.length})</span>
          </h2>

          <div className="space-y-3">
            {feedTransports.map((f) => (
              <div
                key={f.id}
                className="p-3.5 bg-slate-800/70 border border-slate-700/80 rounded-2xl space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-lime-400" />
                      <span>{f.destinationBuilding}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {f.vehicleNumber} • {f.driverName}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-lime-500/20 text-lime-300 border border-lime-500/30 font-mono">
                    {f.tonnage} tonna
                  </span>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-xl space-y-1 text-[11px]">
                  <div className="text-slate-300">
                    <span className="text-slate-400">Yem turi:</span> {f.feedType}
                  </div>
                  <div className="text-lime-300 font-mono">
                    <span className="text-slate-400">Plomba raqami:</span> #{f.sealNumber}
                  </div>
                  <div className="text-slate-400 italic mt-1">"{f.notes}"</div>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block mb-1">Tasdiqlangan plomba surati:</span>
                  <img
                    src={f.sealPhotoUrl}
                    alt="Plomba"
                    className="w-full h-24 object-cover rounded-lg border border-slate-700"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
