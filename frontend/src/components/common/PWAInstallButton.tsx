import React, { useState } from 'react';
import { usePWAInstall } from '../../utils/usePWAInstall';
import { Download, Smartphone, X, CheckCircle, Share, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  // If already running as installed standalone PWA, hide button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow with beforeinstallprompt
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 transition-all active:scale-95 border border-emerald-400/30 animate-pulse"
        title="Ilovani telefonga o'rnatish"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Ilovani O'rnatish</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-medium transition-all"
          title="iPhone / iPad ga o'rnatish"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>iOS O'rnatish</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">iPhone / iPad ga O'rnatish</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                  <div>
                    Safari brauzerining pastki panelidagi <Share className="w-4 h-4 inline text-blue-400 mx-1" /> <strong>Ulashish (Share)</strong> tugmasini bosing.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                  <div>
                    Menyuni pastga surib, <PlusSquare className="w-4 h-4 inline text-emerald-400 mx-1" /> <strong>"Asosiy ekranga qo'shish" (Add to Home Screen)</strong> bandini tanlang.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                  <div>
                    Yuqori o'ng burchakdagi <strong>"Qo'shish" (Add)</strong> tugmasini bosing. Ilova telefoningizga o'rnatiladi!
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-semibold text-slate-950 transition text-sm"
              >
                Tushundim
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for Android Chrome when prompt isn't immediately ready
  return (
    <>
      <button
        onClick={() => setShowAndroidGuide(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all"
        title="Telefonga ilova sifatida o'rnatish"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>O'rnatish</span>
      </button>

      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Telefonga O'rnatish</h3>
              </div>
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                <div>
                  Brauzerning (Chrome) yuqori o'ng burchagidagi <strong>3 nuqta (⋮)</strong> menyusini bosing.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                <div>
                  <strong>"Ilovani o'rnatish"</strong> yoki <strong>"Bosh ekranga qo'shish"</strong> (Install App / Add to Home screen) bandini bosing.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                <div>
                  <strong>"O'rnatish"</strong> tugmasini tasdiqlang. Ilova ekranda alohida ikonka bilan paydo bo'ladi!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAndroidGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-semibold text-slate-950 transition text-sm"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </>
  );
};
