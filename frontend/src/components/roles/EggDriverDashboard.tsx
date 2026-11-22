import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { compressImage } from '../../utils/imageCompressor';
import {
  Truck,
  Egg,
  Camera,
  CheckCircle2,
  FileCheck,
  MapPin,
  Package,
  Plus,
  Loader2
} from 'lucide-react';

export const EggDriverDashboard: React.FC = () => {
  const { eggTransports, addEggTransport, addPhotoReport } = useApp();

  const [vehicleNumber, setVehicleNumber] = useState('50 A 777 AA (Isuzu)');
  const [destination, setDestination] = useState('Namangan Markaziy Ulgurji Bozor');
  const [boxesCount, setBoxesCount] = useState(350);
  const [totalEggsCount, setTotalEggsCount] = useState(126000);
  const [eggCategory, setEggCategory] = useState<'Oliy nav' | '1-nav' | '2-nav' | 'Aralash'>('Oliy nav');
  const [loadingPhoto, setLoadingPhoto] = useState('https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80');
  const [receiptPhoto, setReceiptPhoto] = useState('https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80');
  const [notes, setNotes] = useState('Furgon harorati +15°C, yuklar xavfsiz bog\'landi');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isProcessingLoading, setIsProcessingLoading] = useState(false);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);

  const handleLoadingPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingLoading(true);
        const compressed = await compressImage(file, 960, 960, 0.70);
        if (compressed) {
          setLoadingPhoto(compressed);
        }
      } catch (err) {
        console.warn('Loading photo error:', err);
      } finally {
        setIsProcessingLoading(false);
        e.target.value = '';
      }
    }
  };

  const handleReceiptPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingReceipt(true);
        const compressed = await compressImage(file, 960, 960, 0.70);
        if (compressed) {
          setReceiptPhoto(compressed);
        }
      } catch (err) {
        console.warn('Receipt photo error:', err);
      } finally {
        setIsProcessingReceipt(false);
        e.target.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEggTransport({
      vehicleNumber,
      destination,
      boxesCount: Number(boxesCount),
      totalEggsCount: Number(totalEggsCount),
      eggCategory,
      loadingPhotoUrl: loadingPhoto,
      receiptPhotoUrl: receiptPhoto,
      status: 'yolda',
      notes,
    });

    // Auto publish to photo reports
    addPhotoReport(
      `Tuxum Yuklash: ${boxesCount} quti (${destination})`,
      'tuxum_yuklash',
      loadingPhoto,
      `Mashina: ${vehicleNumber}. Nav: ${eggCategory}. Jami: ${totalEggsCount} dona. Kvitansiya ilova qilindi.`,
      'Omborxona №1'
    );

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-yellow-950/60 via-slate-900 to-amber-950/40 p-6 rounded-3xl border border-yellow-500/30 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Eltuvchi (Tuxum Haydovchisi) Paneli
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                Tuxum Tashish & Logistika
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Yuklangan tuxum soni, manzil, yuklash surati va qabul kvitansiyasini majburiy kiritish
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Tuxum tashish reysi va majburiy fotosuratlar muvaffaqiyatli saqlandi!</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Transport Log Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Plus className="w-4 h-4 text-yellow-400" />
            <span>Yangi Tuxum Reysini Qayd Etish</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mashina davlat raqami / Rusumi:
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
                  Yetkazish manzili:
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Qutilar soni (karobka):
                </label>
                <input
                  type="number"
                  required
                  value={boxesCount}
                  onChange={(e) => {
                    const b = Number(e.target.value);
                    setBoxesCount(b);
                    setTotalEggsCount(b * 360);
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Jami dona tuxum:
                </label>
                <input
                  type="number"
                  required
                  value={totalEggsCount}
                  onChange={(e) => setTotalEggsCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tuxum navi:</label>
                <select
                  value={eggCategory}
                  onChange={(e) => setEggCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                >
                  <option value="Oliy nav">Oliy nav</option>
                  <option value="1-nav">1-nav</option>
                  <option value="2-nav">2-nav</option>
                  <option value="Aralash">Aralash</option>
                </select>
              </div>
            </div>

            {/* Mandatory Photos with Camera Capture */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
              {/* 1. Loading Photo */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-yellow-300 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-yellow-400" />
                  <span>1. Yuklash surati (Furgon):</span>
                </label>
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 h-28">
                  {isProcessingLoading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-yellow-300 bg-slate-900/90">
                      <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
                      <span className="text-[10px]">Yuklanmoqda...</span>
                    </div>
                  ) : (
                    <img
                      src={loadingPhoto}
                      alt="Yuklash surati"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <label className="w-full py-1.5 px-2 bg-yellow-600/30 hover:bg-yellow-600/40 text-yellow-200 border border-yellow-500/40 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                  <Camera className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Suratga olish / O'zgartirish</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleLoadingPhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 2. Receipt Photo */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-yellow-300 flex items-center gap-1">
                  <FileCheck className="w-3 h-3 text-yellow-400" />
                  <span>2. Kvitansiya surati / Yuk xati:</span>
                </label>
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 h-28">
                  {isProcessingReceipt ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-yellow-300 bg-slate-900/90">
                      <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
                      <span className="text-[10px]">Yuklanmoqda...</span>
                    </div>
                  ) : (
                    <img
                      src={receiptPhoto}
                      alt="Kvitansiya surati"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <label className="w-full py-1.5 px-2 bg-yellow-600/30 hover:bg-yellow-600/40 text-yellow-200 border border-yellow-500/40 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                  <Camera className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Kvitansiyani Rasmga Olish</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleReceiptPhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Izoh yoki logistika tafsilotlari:
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
              className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Reysni Qayd Etish & Foto Hisobotni Yuborish</span>
            </button>
          </form>
        </div>

        {/* Right: Transport Log History (5 cols) */}
        <div className="lg:col-span-5 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Package className="w-4 h-4 text-yellow-400" />
            <span>Bugungi Tuxum Jo'natmalari ({eggTransports.length})</span>
          </h2>

          <div className="space-y-3">
            {eggTransports.map((t) => (
              <div
                key={t.id}
                className="p-3.5 bg-slate-800/70 border border-slate-700/80 rounded-2xl space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-yellow-400" />
                      <span>{t.destination}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {t.vehicleNumber} • {t.driverName}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                    {t.status === 'yolda' ? "Yo'lda" : 'Yetkazildi'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2 rounded-xl">
                  <div>
                    <span className="text-slate-400">Qutilar:</span>{' '}
                    <span className="font-bold text-white font-mono">{t.boxesCount} quti</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Jami dona:</span>{' '}
                    <span className="font-bold text-amber-400 font-mono">{t.totalEggsCount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Yuklash surati:</span>
                    <img
                      src={t.loadingPhotoUrl}
                      alt="Yuklash"
                      className="w-full h-16 object-cover rounded-lg border border-slate-700"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Kvitansiya:</span>
                    <img
                      src={t.receiptPhotoUrl}
                      alt="Kvitansiya"
                      className="w-full h-16 object-cover rounded-lg border border-slate-700"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
