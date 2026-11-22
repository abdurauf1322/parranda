import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { PhotoReport } from '../../types';
import { compressImage } from '../../utils/imageCompressor';
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Building,
  Sparkles,
  Loader2
} from 'lucide-react';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: PhotoReport['category'];
  defaultBuilding?: string;
  defaultTitle?: string;
}

const PRESET_FARM_PHOTOS = [
  {
    label: 'Elektr hisoblagich',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    category: 'hisoblagich' as const,
  },
  {
    label: 'Mashina plombasi',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    category: 'plomba' as const,
  },
  {
    label: 'Tuxum yuklash',
    url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
    category: 'tuxum_yuklash' as const,
  },
  {
    label: 'Kuzatuv monitori (Qorovul)',
    url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
    category: 'surveillance' as const,
  },
  {
    label: 'Sanitariya tozaligi',
    url: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80',
    category: 'sanitariya' as const,
  },
  {
    label: 'Parranda holati (Veterinar)',
    url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80',
    category: 'diagnostika' as const,
  },
];

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'boshqa',
  defaultBuilding = '1-Bino',
  defaultTitle = '',
}) => {
  const { addPhotoReport } = useApp();

  const [title, setTitle] = useState(defaultTitle || 'Operativ foto-hisobot');
  const [category, setCategory] = useState<PhotoReport['category']>(defaultCategory);
  const [building, setBuilding] = useState(defaultBuilding);
  const [imageUrl, setImageUrl] = useState(PRESET_FARM_PHOTOS[0].url);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessing(true);
        setSaveError(null);
        const compressedBase64 = await compressImage(file, 960, 960, 0.70);
        if (compressedBase64) {
          setImageUrl(compressedBase64);
        } else {
          setSaveError('Rasmni yuklashda xatolik yuz berdi. Boshqa rasm tanlab ko\'ring.');
        }
      } catch (err) {
        console.warn('Rasm siqishda xatolik:', err);
        setSaveError('Rasmni qayta ishlashda xatolik yuz berdi.');
      } finally {
        setIsProcessing(false);
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl || isSubmitting) return;
    setIsSubmitting(true);
    setSaveError(null);

    try {
      let finalImg = imageUrl;
      // If it's a huge string that wasn't compressed, safely compress it once
      if (finalImg.length > 450000) {
        finalImg = await compressImage(finalImg, 960, 960, 0.65);
      }

      await addPhotoReport(title.trim(), category, finalImg, notes.trim(), building);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error('Foto hisobot saqlashda xatolik:', err);
      setSaveError('Foto-hisobotni saqlashda xatolik yuz berdi. Iltimos qayta urinib ko\'ring.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-800/90 border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Foto-Hisobot Yuklash Markazi
              </h2>
              <p className="text-xs text-slate-400">
                Tekshiruv va operativ hisobotlar uchun foto dalil
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Foto-hisobot sarlavhasi:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: 1-Bino hisoblagich ko'rsatkichi"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kategoriya:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PhotoReport['category'])}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="hisoblagich">Elektr hisoblagich</option>
                <option value="plomba">Mashina plombasi</option>
                <option value="tuxum_yuklash">Tuxum yuklash / qabul</option>
                <option value="surveillance">Qorovul monitori</option>
                <option value="sanitariya">Sanitariya va tozalik</option>
                <option value="diagnostika">Veterinar diagnostika</option>
                <option value="boshqa">Boshqa hisobot</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bino / Hudud:
              </label>
              <select
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="1-Bino">1-Bino (Loman Braun)</option>
                <option value="2-Bino">2-Bino (Dekalb Oq)</option>
                <option value="3-Bino">3-Bino (Yosh parranda)</option>
                <option value="Inkubator">Inkubator sexi</option>
                <option value="Omborxona №1">Omborxona №1 (Tuxum)</option>
                <option value="Yem bunkeri">Yem bunkeri maydoni</option>
                <option value="Nazorat KPP">Nazorat punkti (KPP)</option>
                <option value="Transformator TP">Transformator / Generator</option>
              </select>
            </div>
          </div>

          {/* Image Preview & Upload Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Rasm manbai (Kamera yoki Fayl):
            </label>

            <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-slate-700 bg-slate-800/40 p-2 text-center">
              {isProcessing ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                  <p className="text-xs text-amber-300 font-semibold">Rasm qayta ishlanmoqda va siqilmoqda...</p>
                </div>
              ) : imageUrl ? (
                <div className="relative group">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-44 object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity rounded-xl">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Almashtirish</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <ImageIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Rasm tanlang yoki rasmga oling</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-600 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Kamera / Fayl tanlash</span>
                </button>
              </div>
            </div>

            {/* Quick preset farm photos */}
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Tezkor farm namunalari (Tizim andozalari):
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESET_FARM_PHOTOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageUrl(preset.url);
                      setCategory(preset.category);
                    }}
                    className={`px-2 py-1.5 rounded-lg border text-[10px] font-medium text-left truncate transition-all ${
                      imageUrl === preset.url
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Qo'shimcha izoh yoki ko'rsatkichlar:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Masalan: Ko'rsatkich 148,924 kVt/soat, plomba butun, harorat +21°C"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {saveError && (
            <div className="p-3 bg-rose-950/70 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <span className="font-bold">Diqqat:</span>
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-center gap-2 font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Foto-hisobot muvaffaqiyatli saqlandi va yuborildi!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!imageUrl || isProcessing || isSubmitting || saveSuccess}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Foto-Hisobot Saqlanmoqda...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Muvaffaqiyatli Saqlandi!</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Foto-Hisobotni Yuborish</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
