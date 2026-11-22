import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/mockData';
import { PhotoReport } from '../../types';
import {
  Camera,
  Filter,
  CheckCircle2,
  Clock,
  Building,
  Upload,
  Eye,
  Check,
  X
} from 'lucide-react';

export const PhotoReportsView: React.FC<{ onOpenUpload: () => void }> = ({ onOpenUpload }) => {
  const { photoReports, verifyPhotoReport, currentUser } = useApp();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [previewPhoto, setPreviewPhoto] = useState<PhotoReport | null>(null);

  const canVerify = ['direktor', 'ish_boshqaruvchi', 'veterinar'].includes(currentUser.role);

  const filtered = photoReports.filter((p) => {
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/40 p-6 rounded-3xl border border-blue-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Camera className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Foto-Hisobotlar Markazi (Photo-Report Center)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Barcha 11 ta lavozim uchun majburiy foto-tekshiruv va tasdiqlash lentalari
            </p>
          </div>
        </div>

        <button
          onClick={onOpenUpload}
          className="self-start md:self-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
        >
          <Camera className="w-4 h-4" />
          <span>Yangi Foto-Hisobot Yuklash</span>
        </button>
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-850 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-300">Kategoriya:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
          >
            <option value="all">Barcha toifalar</option>
            <option value="hisoblagich">Elektr hisoblagich</option>
            <option value="plomba">Mashina plombasi</option>
            <option value="tuxum_yuklash">Tuxum yuklash / kvitansiya</option>
            <option value="surveillance">Qorovul monitori (Tungi)</option>
            <option value="sanitariya">Sanitariya va tozalik</option>
            <option value="diagnostika">Veterinar diagnostika</option>
            <option value="boshqa">Boshqa</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300">Holat:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
          >
            <option value="all">Barchasi ({photoReports.length})</option>
            <option value="kutilmoqda">Kutilmoqda</option>
            <option value="tasdiqlandi">Tasdiqlangan</option>
          </select>
        </div>
      </div>

      {/* Grid of photo reports */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
            <Camera className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Foto-hisobotlar topilmadi</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tanlangan filtr bo'yicha hech qanday foto-hisobot mavjud emas. Yangi foto-hisobot yuklashingiz mumkin.
            </p>
          </div>
          <button
            onClick={onOpenUpload}
            className="mt-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Yangi Foto-Hisobot Yuklash</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-slate-850 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 transition-all flex flex-col"
            >
            {/* Image banner with overlay */}
            <div
              className="relative h-48 cursor-pointer group"
              onClick={() => setPreviewPhoto(item)}
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

              <div className="absolute top-3 left-3">
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900/80 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
                  {item.category.toUpperCase()}
                </span>
              </div>

              <div className="absolute top-3 right-3">
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-sm ${
                    item.status === 'tasdiqlandi'
                      ? 'bg-emerald-500/80 text-white'
                      : 'bg-amber-500/80 text-slate-950 font-bold'
                  }`}
                >
                  {item.status === 'tasdiqlandi' ? '✓ Tasdiqlangan' : '⏳ Kutilmoqda'}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                <span className="font-bold drop-shadow">{item.building || 'Fabrika'}</span>
                <span className="font-mono text-slate-300 text-[11px] drop-shadow">{item.timestamp}</span>
              </div>
            </div>

            {/* Info details */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white line-clamp-1">{item.title}</h3>
                <div className="text-xs text-amber-400 font-semibold mt-0.5">
                  {item.uploaderName} ({ROLE_LABELS[item.uploaderRole]?.short || item.uploaderRole})
                </div>
                {item.notes && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 italic">
                    "{item.notes}"
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                {item.verifiedBy ? (
                  <span className="text-[11px] text-emerald-400">
                    Tasdiqladi: {item.verifiedBy}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">Tekshirish kutilmoqda</span>
                )}

                {canVerify && item.status === 'kutilmoqda' && (
                  <button
                    onClick={() => verifyPhotoReport(item.id, 'tasdiqlandi')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3 h-3" />
                    <span>Tasdiqlash</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{previewPhoto.title}</h3>
                <p className="text-xs text-slate-400">
                  {previewPhoto.uploaderName} • {previewPhoto.timestamp} • {previewPhoto.building}
                </p>
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <img
              src={previewPhoto.imageUrl}
              alt={previewPhoto.title}
              className="w-full max-h-[65vh] object-contain rounded-2xl bg-black/40"
            />

            {previewPhoto.notes && (
              <div className="p-3 bg-slate-800 rounded-xl text-xs text-slate-300">
                <span className="font-bold text-white block mb-0.5">Izoh:</span>
                {previewPhoto.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
