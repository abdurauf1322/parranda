import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Volume2,
  HelpCircle,
  CheckCircle2,
  Radio,
  Send,
  Terminal,
  AlertCircle,
  Compass,
} from 'lucide-react';
import { AppTab } from '../../types';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceAssistantWidgetProps {
  onOpenAttendance?: () => void;
  onOpenPhotoUpload?: () => void;
}

interface CommandMatch {
  type: 'tab' | 'action' | 'note' | 'help' | 'unknown';
  tab?: AppTab;
  tabLabel?: string;
  feedbackText: string;
  speechText: string;
  actionFn?: () => void;
  isHighConfidence?: boolean;
}

export const VoiceAssistantWidget: React.FC<VoiceAssistantWidgetProps> = ({
  onOpenAttendance,
  onOpenPhotoUpload,
}) => {
  const {
    currentUser,
    setActiveTab,
    addPersonalNote,
    getAccessibleTabs,
    toggleSound,
    syncNow,
  } = useApp();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [manualCommand, setManualCommand] = useState('');

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const hasExecutedRef = useRef(false);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Speech synthesis helper for voice feedback
  const speakFeedback = (text: string) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'uz-UZ';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // ignore speech synthesis errors
      }
    }
  };

  /**
   * Normalizes spoken text (removes apostrophes, punctuation, accents, lowercase)
   */
  const normalize = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/['`’‘ʻ]/g, "'")
      .replace(/[.,\/#!$%\^&\*;:{}=\-_~()?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  /**
   * Matches spoken phrase against all application sections & actions
   */
  const matchCommand = useCallback(
    (rawText: string): CommandMatch => {
      const norm = normalize(rawText);
      const allowedTabs = getAccessibleTabs();

      // 1. Yangi eslatma yozish / saqlash (Agar eslatma yoz, qo'sh, qayd qil deyilgan bo'lsa)
      if (
        norm.includes('eslatma yoz') ||
        norm.includes('eslatma qosh') ||
        norm.includes("eslatma qo'sh") ||
        norm.includes('zametka yoz') ||
        norm.includes('zametka qosh') ||
        norm.includes("zametka qo'sh") ||
        norm.includes('qayd yoz') ||
        norm.includes('yangi eslatma') ||
        norm.includes('yangi zametka')
      ) {
        const cleanContent = rawText
          .replace(
            /eslatma qo'sh|eslatma qosh|eslatma yoz|zametka qo'sh|zametka qosh|zametka yoz|qayd yoz|yangi eslatma|yangi zametka/gi,
            ''
          )
          .trim();
        const noteTitle = cleanContent ? cleanContent.slice(0, 32) : 'Ovozli Eslatma';
        const noteBody = cleanContent || rawText;

        return {
          type: 'note',
          feedbackText: `Yangi eslatma saqlandi: "${noteTitle}"`,
          speechText: 'Eslatma saqlandi va eslatmalar bo\'limi ochildi',
          actionFn: () => {
            addPersonalNote(noteTitle, noteBody, 'ish', 'yellow', true);
            setActiveTab('notes');
          },
          isHighConfidence: true,
        };
      }

      // 2. Maxsus operativ harakatlar (Modal ochish)
      // Davomat belgilash
      if (
        norm.includes('davomat belgilash') ||
        norm.includes('davomatni belgilash') ||
        norm.includes('keldim') ||
        norm.includes('ketdim') ||
        norm.includes('ishga keldim') ||
        norm.includes('отметиться')
      ) {
        return {
          type: 'action',
          feedbackText: 'Davomat belgilash oynasi ochildi',
          speechText: 'Davomat belgilash oynasi ochildi',
          actionFn: () => {
            if (onOpenAttendance) onOpenAttendance();
            setActiveTab('attendance');
          },
          isHighConfidence: true,
        };
      }

      // Foto hisobot yuklash
      if (
        norm.includes('rasm yuklash') ||
        norm.includes('foto yuklash') ||
        norm.includes('surat yuklash') ||
        norm.includes('rasmga olish') ||
        norm.includes('загрузить фото')
      ) {
        return {
          type: 'action',
          feedbackText: 'Foto hisobot yuklash oynasi ochildi',
          speechText: 'Foto hisobot yuklash oynasi ochildi',
          actionFn: () => {
            if (onOpenPhotoUpload) onOpenPhotoUpload();
            setActiveTab('photos');
          },
          isHighConfidence: true,
        };
      }

      // Server bilan sinxronlash
      if (
        norm.includes('sinxronlash') ||
        norm.includes('yangilash') ||
        norm.includes('server bilan') ||
        norm.includes('обновить')
      ) {
        return {
          type: 'action',
          feedbackText: 'Server bilan sinxronizatsiya qilindi',
          speechText: 'Server bilan sinxronizatsiya bajarildi',
          actionFn: () => syncNow(),
          isHighConfidence: true,
        };
      }

      // Ovozli signallarni boshqarish
      if (
        norm.includes('ovozni yoq') ||
        norm.includes('ovozni ochir') ||
        norm.includes("ovozni o'chir") ||
        norm.includes('signal')
      ) {
        return {
          type: 'action',
          feedbackText: 'Ovoz rejimi yangilandi',
          speechText: 'Ovoz rejimi yangilandi',
          actionFn: () => toggleSound(),
          isHighConfidence: true,
        };
      }

      // Yordam oynasi
      if (
        norm.includes('yordam') ||
        norm.includes('buyruqlar') ||
        norm.includes('korsat') ||
        norm.includes("ko'rsat") ||
        norm.includes('помощь')
      ) {
        return {
          type: 'help',
          feedbackText: 'Buyruqlar yo\'riqnomasi ochildi',
          speechText: 'Buyruqlar ro\'yxati ekranda ko\'rsatildi',
          actionFn: () => setIsHelpOpen(true),
          isHighConfidence: true,
        };
      }

      // 3. Navigation Commands (Bo'limlar bo'ylab o'tish)

      // Davomat
      if (
        norm.includes('davomat') ||
        norm.includes('yoqlama') ||
        norm.includes("yo'qlama") ||
        norm.includes('ishga kelish') ||
        norm.includes('keldi ketdi') ||
        norm.includes('давомат') ||
        norm.includes('посещаемость')
      ) {
        return {
          type: 'tab',
          tab: 'attendance',
          tabLabel: 'Davomat',
          feedbackText: 'Davomat jurnali bo\'limiga o\'tildi',
          speechText: 'Davomat bo\'limi ochildi',
          isHighConfidence: true,
        };
      }

      // Operativ reja
      if (
        norm.includes('operativ reja') ||
        norm.includes('operativ') ||
        norm.includes('reja') ||
        norm.includes('rejalar') ||
        norm.includes('rejaga') ||
        norm.includes('kundalik reja') ||
        norm.includes('kunlik reja') ||
        norm.includes('bugungi reja') ||
        norm.includes('режа') ||
        norm.includes('план')
      ) {
        return {
          type: 'tab',
          tab: 'operational_plan',
          tabLabel: 'Operativ reja',
          feedbackText: 'Kundalik operativ reja bo\'limiga o\'tildi',
          speechText: 'Operativ reja ochildi',
          isHighConfidence: true,
        };
      }

      // Umumiy chat
      if (
        norm.includes('chat') ||
        norm.includes('xabar') ||
        norm.includes('xabarlar') ||
        norm.includes('yozishma') ||
        norm.includes('yozishmalar') ||
        norm.includes('guruh') ||
        norm.includes('чат') ||
        norm.includes('сообщение')
      ) {
        return {
          type: 'tab',
          tab: 'chat',
          tabLabel: 'Umumiy chat',
          feedbackText: 'Umumiy chatga o\'tildi',
          speechText: 'Umumiy chat ochildi',
          isHighConfidence: true,
        };
      }

      // Inventarizatsiya / Ombor
      if (
        norm.includes('inventar') ||
        norm.includes('inventarizatsiya') ||
        norm.includes('ombor') ||
        norm.includes('omborga') ||
        norm.includes('ombordagi') ||
        norm.includes('zaxira') ||
        norm.includes('zaxiralar') ||
        norm.includes('yem ombori') ||
        norm.includes('dori ombori') ||
        norm.includes('sklad') ||
        norm.includes('инвентарь') ||
        norm.includes('склад') ||
        norm.includes('омбор')
      ) {
        return {
          type: 'tab',
          tab: 'inventory',
          tabLabel: 'Ombor & Inventar',
          feedbackText: 'Filiallar ombori va inventarizatsiya bo\'limiga o\'tildi',
          speechText: 'Inventarizatsiya bo\'limi ochildi',
          isHighConfidence: true,
        };
      }

      // Parrandalar vazni
      if (
        norm.includes('vazn') ||
        norm.includes('vaznlar') ||
        norm.includes('vaznga') ||
        norm.includes('parranda vazni') ||
        norm.includes('parrandalar vazni') ||
        norm.includes('tovuq vazni') ||
        norm.includes('tovuqlar vazni') ||
        norm.includes('tortish') ||
        norm.includes('gramm') ||
        norm.includes('вазн') ||
        norm.includes('весы')
      ) {
        return {
          type: 'tab',
          tab: 'chicken_weight',
          tabLabel: 'Parrandalar vazni',
          feedbackText: 'Parrandalar vazni bo\'limiga o\'tildi',
          speechText: 'Parrandalar vazni ochildi',
          isHighConfidence: true,
        };
      }

      // Topshiriqlar / Vazifalar
      if (
        norm.includes('topshiriq') ||
        norm.includes('topshiriqlar') ||
        norm.includes('vazifa') ||
        norm.includes('vazifalar') ||
        norm.includes('ishlar') ||
        norm.includes('zadacha') ||
        norm.includes('вазифа') ||
        norm.includes('топшириқ') ||
        norm.includes('задачи')
      ) {
        return {
          type: 'tab',
          tab: 'tasks',
          tabLabel: 'Topshiriqlar',
          feedbackText: 'Vazifalar va topshiriqlar bo\'limiga o\'tildi',
          speechText: 'Topshiriqlar bo\'limi ochildi',
          isHighConfidence: true,
        };
      }

      // Foto hisobotlar
      if (
        norm.includes('foto') ||
        norm.includes('fotolar') ||
        norm.includes('foto hisobot') ||
        norm.includes('rasm') ||
        norm.includes('rasmlar') ||
        norm.includes('surat') ||
        norm.includes('suratlar') ||
        norm.includes('galereya') ||
        norm.includes('фото') ||
        norm.includes('расм') ||
        norm.includes('галерея')
      ) {
        return {
          type: 'tab',
          tab: 'photos',
          tabLabel: 'Foto hisobotlar',
          feedbackText: 'Foto hisobotlar galereyasiga o\'tildi',
          speechText: 'Foto hisobotlar ochildi',
          isHighConfidence: true,
        };
      }

      // Shaxsiy zametkalar / Eslatmalar (ochish)
      if (
        norm.includes('eslatma') ||
        norm.includes('eslatmalar') ||
        norm.includes('zametka') ||
        norm.includes('zametkalar') ||
        norm.includes('qayd') ||
        norm.includes('qaydlar') ||
        norm.includes('bloknot') ||
        norm.includes('заметка') ||
        norm.includes('эслатма')
      ) {
        return {
          type: 'tab',
          tab: 'notes',
          tabLabel: 'Shaxsiy eslatmalar',
          feedbackText: 'Shaxsiy zametkalar bo\'limiga o\'tildi',
          speechText: 'Eslatmalar bo\'limi ochildi',
          isHighConfidence: true,
        };
      }

      // Filiallar analitikasi / Statistika
      if (
        norm.includes('analitika') ||
        norm.includes('statistika') ||
        norm.includes('hisobot') ||
        norm.includes('hisobotlar') ||
        norm.includes('filiallar') ||
        norm.includes('korsatkich') ||
        norm.includes("ko'rsatkich") ||
        norm.includes('grafik') ||
        norm.includes('аналитика') ||
        norm.includes('статистика') ||
        norm.includes('отчет')
      ) {
        if (!allowedTabs.includes('branch_analytics')) {
          return {
            type: 'tab',
            tab: 'branch_analytics',
            tabLabel: 'Analitika',
            feedbackText: 'Bu bo\'lim faqat korxona rahbariyati uchun ochiq',
            speechText: 'Analitika bo\'limiga kirish huquqingiz yetarli emas',
            isHighConfidence: true,
          };
        }
        return {
          type: 'tab',
          tab: 'branch_analytics',
          tabLabel: 'Filiallar analitikasi',
          feedbackText: 'Filiallar analitikasi va statistikaga o\'tildi',
          speechText: 'Analitika bo\'limi ochildi',
          isHighConfidence: true,
        };
      }

      // Kadrlar / HR bo'limi
      if (
        norm.includes('kadr') ||
        norm.includes('kadrlar') ||
        norm.includes('hr') ||
        norm.includes('xodimlar') ||
        norm.includes('кадр') ||
        norm.includes('персонал')
      ) {
        if (!allowedTabs.includes('hr')) {
          return {
            type: 'tab',
            tab: 'hr',
            tabLabel: 'Kadrlar bo\'limi',
            feedbackText: 'Kadrlar bo\'limi faqat kadrlar va direktor uchun ochiq',
            speechText: 'Kadrlar bo\'limiga kirish huquqingiz yo\'q',
            isHighConfidence: true,
          };
        }
        return {
          type: 'tab',
          tab: 'hr',
          tabLabel: 'Kadrlar bo\'limi',
          feedbackText: 'Kadrlar (HR) bo\'limiga o\'tildi',
          speechText: 'Kadrlar bo\'limi ochildi',
          isHighConfidence: true,
        };
      }

      // Boshqaruv paneli / Bosh sahifa
      if (
        norm.includes('bosh sahifa') ||
        norm.includes('asosiy') ||
        norm.includes('panel') ||
        norm.includes('glavniy') ||
        norm.includes('uy') ||
        norm.includes('boshqaruv') ||
        norm.includes('бош саҳифа') ||
        norm.includes('главная')
      ) {
        return {
          type: 'tab',
          tab: 'dashboard',
          tabLabel: 'Bosh sahifa',
          feedbackText: 'Boshqaruv paneliga o\'tildi',
          speechText: 'Bosh sahifaga o\'tildi',
          isHighConfidence: true,
        };
      }

      // Unknown command
      return {
        type: 'unknown',
        feedbackText: `Buyruq tushunilmadi: "${rawText}". Bo'lim nomini ayting (masalan: Davomat, Reja, Ombor, Chat)`,
        speechText: 'Bo\'lim nomi tushunilmadi. Iltimos qaytadan ayting.',
        isHighConfidence: false,
      };
    },
    [
      addPersonalNote,
      getAccessibleTabs,
      onOpenAttendance,
      onOpenPhotoUpload,
      setActiveTab,
      syncNow,
      toggleSound,
    ]
  );

  /**
   * Executes the recognized command, updates tab state, scrolls to top, and speaks feedback
   */
  const executeCommand = useCallback(
    (commandText: string) => {
      if (!commandText || !commandText.trim()) return;
      hasExecutedRef.current = true;

      const match = matchCommand(commandText.trim());

      if (match.type === 'tab' && match.tab) {
        const allowed = getAccessibleTabs();
        if (allowed.includes(match.tab)) {
          setActiveTab(match.tab);
          setFeedbackMessage({ text: match.feedbackText, type: 'success' });
          speakFeedback(match.speechText);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setFeedbackMessage({ text: match.feedbackText, type: 'warning' });
          speakFeedback(match.speechText);
        }
      } else if (match.type === 'action' || match.type === 'note' || match.type === 'help') {
        if (match.actionFn) {
          match.actionFn();
        }
        setFeedbackMessage({ text: match.feedbackText, type: 'success' });
        speakFeedback(match.speechText);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setFeedbackMessage({ text: match.feedbackText, type: 'warning' });
        speakFeedback(match.speechText);
      }

      // Reset feedback message after delay
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => {
        setFeedbackMessage(null);
        setTranscript('');
      }, 4500);
    },
    [getAccessibleTabs, matchCommand, setActiveTab]
  );

  // Initialize SpeechRecognition API
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'uz-UZ';

      recognition.onstart = () => {
        setIsListening(true);
        hasExecutedRef.current = false;
        setFeedbackMessage({
          text: 'Ovoz qabul qilinmoqda... Masalan: "Davomat", "Reja", "Ombor", "Chat"',
          type: 'info',
        });
      };

      recognition.onresult = (event: any) => {
        let fullText = '';
        let hasFinalResult = false;

        for (let i = 0; i < event.results.length; i++) {
          fullText += event.results[i][0].transcript + ' ';
          if (event.results[i].isFinal) {
            hasFinalResult = true;
          }
        }
        fullText = fullText.trim();
        setTranscript(fullText);
        transcriptRef.current = fullText;

        // Instant match check: If the user said an obvious command, execute it immediately!
        if (fullText.length > 2) {
          const match = matchCommand(fullText);
          if (match.type !== 'unknown' && (hasFinalResult || match.isHighConfidence)) {
            // Stop further listening and execute immediately!
            try {
              recognition.stop();
            } catch (e) {}
            setIsListening(false);
            executeCommand(fullText);
          }
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsManualInputOpen(true);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcriptRef.current && !hasExecutedRef.current) {
          executeCommand(transcriptRef.current);
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      // Ignore initialization errors
    }

    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, [executeCommand, matchCommand]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setIsManualInputOpen(true);
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
      if (transcriptRef.current && !hasExecutedRef.current) {
        executeCommand(transcriptRef.current);
      }
    } else {
      setTranscript('');
      hasExecutedRef.current = false;
      try {
        recognitionRef.current?.start();
      } catch (e: any) {
        setIsManualInputOpen(true);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCommand.trim()) return;
    executeCommand(manualCommand.trim());
    setManualCommand('');
    setIsManualInputOpen(false);
  };

  const handleQuickChipClick = (cmd: string) => {
    executeCommand(cmd);
    setIsManualInputOpen(false);
    setIsHelpOpen(false);
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto">
      {/* Feedback / Transcript Popover */}
      {(feedbackMessage || isListening || transcript) && (
        <div
          className={`bg-slate-900/95 border backdrop-blur-md rounded-2xl p-4 shadow-2xl max-w-xs text-xs animate-in slide-in-from-bottom-3 duration-200 space-y-2.5 ${
            feedbackMessage?.type === 'success'
              ? 'border-emerald-500/60 ring-2 ring-emerald-500/20'
              : feedbackMessage?.type === 'warning'
              ? 'border-rose-500/60 ring-2 ring-rose-500/20'
              : 'border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 font-bold">
            <div className="flex items-center gap-1.5">
              <Radio
                className={`w-3.5 h-3.5 ${
                  isListening ? 'animate-pulse text-red-400' : 'text-amber-400'
                }`}
              />
              <span>Ovozli Yordamchi</span>
            </div>
            <button
              onClick={() => {
                setFeedbackMessage(null);
                setTranscript('');
              }}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {isListening && (
            <div className="text-slate-300 italic flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="font-medium text-amber-200">
                Eshitilmoqda... Qaysi bo'limga o'tishni ayting:
              </span>
            </div>
          )}

          {transcript && (
            <div className="bg-slate-950 p-2.5 rounded-xl text-slate-100 border border-slate-800 font-medium">
              <span className="text-[10px] text-slate-400 block mb-0.5">Eshitilgan so'z:</span>
              "{transcript}"
            </div>
          )}

          {feedbackMessage && (
            <div
              className={`font-semibold flex items-start gap-1.5 p-2 rounded-xl text-[11px] ${
                feedbackMessage.type === 'success'
                  ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/30'
                  : feedbackMessage.type === 'warning'
                  ? 'text-rose-300 bg-rose-950/40 border border-rose-500/30'
                  : 'text-amber-300 bg-amber-950/40 border border-amber-500/30'
              }`}
            >
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : feedbackMessage.type === 'warning' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{feedbackMessage.text}</span>
            </div>
          )}
        </div>
      )}

      {/* Manual Command Input Modal */}
      {isManualInputOpen && (
        <form
          onSubmit={handleManualSubmit}
          className="bg-slate-900 border border-amber-500/50 rounded-2xl p-4 shadow-2xl w-80 text-xs space-y-3 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Terminal className="w-4 h-4" />
              Buyruq / Bo'limga O'tish
            </span>
            <button
              type="button"
              onClick={() => setIsManualInputOpen(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-slate-400 text-[11px]">
            Bo'lim nomi yoki buyruqni yozing (masalan: "Davomat", "Operativ reja", "Ombor"):
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualCommand}
              onChange={(e) => setManualCommand(e.target.value)}
              placeholder="Masalan: Davomat yoki Ombor"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center cursor-pointer transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Clickable Suggestions */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Tezkor tanlash:
            </span>
            <div className="flex flex-wrap gap-1">
              {[
                'Davomat',
                'Operativ reja',
                'Ombor',
                'Umumiy chat',
                'Vazifalar',
                'Parrandalar vazni',
                'Foto hisobotlar',
                'Zametkalar',
                'Bosh sahifa',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleQuickChipClick(chip)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 hover:text-amber-400 text-slate-300 rounded-lg text-[10px] font-medium border border-slate-700/60 transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* Help Modal Popup */}
      {isHelpOpen && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl w-84 text-xs space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Ovozli Buyruqlar Qo'llanmasi
            </span>
            <button
              onClick={() => setIsHelpOpen(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 text-slate-300">
            <p className="font-semibold text-white">Quyidagi so'zlarni aytsangiz bo'lim ochiladi:</p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
              <div
                onClick={() => handleQuickChipClick('Davomat')}
                className="p-1.5 bg-slate-950/80 rounded-lg border border-slate-800 hover:border-amber-500/50 cursor-pointer"
              >
                <div className="font-bold text-amber-400">"Davomat"</div>
                <div className="text-[10px] text-slate-500">Davomat jurnali</div>
              </div>
              <div
                onClick={() => handleQuickChipClick('Operativ reja')}
                className="p-1.5 bg-slate-950/80 rounded-lg border border-slate-800 hover:border-amber-500/50 cursor-pointer"
              >
                <div className="font-bold text-amber-400">"Operativ reja"</div>
                <div className="text-[10px] text-slate-500">Kunlik reja</div>
              </div>
              <div
                onClick={() => handleQuickChipClick('Ombor')}
                className="p-1.5 bg-slate-950/80 rounded-lg border border-slate-800 hover:border-amber-500/50 cursor-pointer"
              >
                <div className="font-bold text-emerald-400">"Ombor"</div>
                <div className="text-[10px] text-slate-500">Inventarizatsiya</div>
              </div>
              <div
                onClick={() => handleQuickChipClick('Parrandalar vazni')}
                className="p-1.5 bg-slate-950/80 rounded-lg border border-slate-800 hover:border-amber-500/50 cursor-pointer"
              >
                <div className="font-bold text-yellow-400">"Vazn"</div>
                <div className="text-[10px] text-slate-500">Parrandalar vazni</div>
              </div>
              <div
                onClick={() => handleQuickChipClick('Chat')}
                className="p-1.5 bg-slate-950/80 rounded-lg border border-slate-800 hover:border-amber-500/50 cursor-pointer"
              >
                <div className="font-bold text-sky-400">"Chat"</div>
                <div className="text-[10px] text-slate-500">Umumiy chat</div>
              </div>
              <div
                onClick={() => handleQuickChipClick('Topshiriqlar')}
                className="p-1.5 bg-slate-950/80 rounded-lg border border-slate-800 hover:border-amber-500/50 cursor-pointer"
              >
                <div className="font-bold text-indigo-400">"Vazifalar"</div>
                <div className="text-[10px] text-slate-500">Topshiriqlar ro'yxati</div>
              </div>
              <div
                onClick={() => handleQuickChipClick('Foto hisobotlar')}
                className="p-1.5 bg-slate-950/80 rounded-lg border border-slate-800 hover:border-amber-500/50 cursor-pointer"
              >
                <div className="font-bold text-pink-400">"Foto hisobot"</div>
                <div className="text-[10px] text-slate-500">Rasmlar galereyasi</div>
              </div>
              <div
                onClick={() => handleQuickChipClick('Zametkalar')}
                className="p-1.5 bg-slate-950/80 rounded-lg border border-slate-800 hover:border-amber-500/50 cursor-pointer"
              >
                <div className="font-bold text-amber-300">"Zametkalar"</div>
                <div className="text-[10px] text-slate-500">Shaxsiy eslatmalar</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div>
                <strong className="text-white">Eslatma yozish:</strong> "Eslatma yoz: [matn]"
              </div>
              <div>
                <strong className="text-white">Davomat belgilash:</strong> "Davomat belgilash"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Floating Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsManualInputOpen(!isManualInputOpen)}
          title="Buyruq / Eslatma yozish"
          className="w-10 h-10 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-400 rounded-2xl shadow-xl flex items-center justify-center transition-all cursor-pointer"
        >
          <Terminal className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          title="Buyruqlar yo'riqnomasi"
          className="w-10 h-10 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-400 rounded-2xl shadow-xl flex items-center justify-center transition-all cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={toggleListening}
          title={isListening ? "To'xtatish" : "Ovozli buyruq berish"}
          className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center font-bold transition-all cursor-pointer border ${
            isListening
              ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 animate-pulse scale-105 shadow-red-500/40'
              : 'bg-gradient-to-tr from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 border-amber-300 shadow-amber-500/30'
          }`}
        >
          {isListening ? (
            <MicOff className="w-6 h-6 animate-pulse" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
};
