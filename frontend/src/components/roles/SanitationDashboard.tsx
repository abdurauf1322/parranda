import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { PhotoUploadModal } from '../common/PhotoUploadModal';
import { compressImage } from '../../utils/imageCompressor';
import { SanitationTask } from '../../types';
import {
  Sparkles,
  CheckCircle2,
  Camera,
  Upload,
  ShieldCheck,
  Building,
  AlertCircle,
  Plus,
  X,
  FileText,
  Clock,
  Eye,
  Filter,
  Check,
  Droplets,
  FlaskConical,
  Image as ImageIcon,
  Loader2,
  Trash2,
  RotateCcw
} from 'lucide-react';

const COMMON_ZONES = [
  '1-Bino (Sex 1)',
  '2-Bino (Sex 2)',
  '3-Bino (Sex 3)',
  '4-Bino (Sex 4)',
  '5-Bino (Sex 5)',
  'Katta Dezobaryer (Kirish darvozasi)',
  'Bosh Omborxona & Yuklash rampasi',
  'Tuxum saralash va qadoqlash sexi',
  'Kushxona va sovitish ombori',
  'Xodimlar oshxonasi & yuvinish xonasi',
  'Chiqindi va go\'ng maydoni',
  'Tashqi perimetr va hudud'
];

const DISINFECTANT_PRESETS = [
  'Xlor eritmasi 2%',
  'Xlor eritmasi 5%',
  'Virkon S (1:100)',
  'Formalin eritmasi 1%',
  'Kaustik soda 2%',
  'So\'ndirilgan ohak eritmasi',
  'Yuvish vositasi va antiseptik',
  'Toza suv va mexanik tozalash'
];

const PRESET_SANITATION_PHOTOS = [
  {
    label: 'Dezobaryer yuvilishi',
    url: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Sex polini dezinfeksiya qilish',
    url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Uskunalar tozaligi',
    url: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Kanalizatsiya va novlar tozaligi',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
  }
];

export const SanitationDashboard: React.FC = () => {
  const { sanitationTasks, toggleSanitationTask, addSanitationTask, photoReports, addPhotoReport, currentUser } = useApp();

  // Active view tab: tasks or photo reports
  const [activeTab, setActiveTab] = useState<'tasks' | 'photos'>('tasks');

  // Filter tasks
  const [taskFilter, setTaskFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Manual work modal state
  const [isManualTaskModalOpen, setIsManualTaskModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualZone, setManualZone] = useState(COMMON_ZONES[0]);
  const [customZoneInput, setCustomZoneInput] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualDisinfectant, setManualDisinfectant] = useState(DISINFECTANT_PRESETS[0]);
  const [customDisinfectantInput, setCustomDisinfectantInput] = useState('');
  const [manualPhotoUrl, setManualPhotoUrl] = useState('');
  const [isCompressingManualPhoto, setIsCompressingManualPhoto] = useState(false);
  const [manualModalError, setManualModalError] = useState<string | null>(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Quick photo upload modal
  const [isPhotoUploadModalOpen, setIsPhotoUploadModalOpen] = useState(false);

  // Complete existing task modal state
  const [taskToComplete, setTaskToComplete] = useState<SanitationTask | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeDisinfectant, setCompleteDisinfectant] = useState(DISINFECTANT_PRESETS[0]);
  const [completePhotoUrl, setCompletePhotoUrl] = useState('');
  const [isCompressingCompletePhoto, setIsCompressingCompletePhoto] = useState(false);

  // Lightbox modal for viewing photos in full size
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string; zone?: string; timestamp?: string } | null>(null);

  const fileInputManualRef = useRef<HTMLInputElement>(null);
  const fileInputCompleteRef = useRef<HTMLInputElement>(null);

  // Filter sanitation tasks
  const filteredTasks = sanitationTasks.filter((task) => {
    if (taskFilter === 'completed') return task.isCompleted;
    if (taskFilter === 'pending') return !task.isCompleted;
    return true;
  });

  const completedCount = sanitationTasks.filter((t) => t.isCompleted).length;

  // Filter photo reports for sanitation
  const sanitationPhotoReports = photoReports.filter(
    (pr) => pr.category === 'sanitariya' || pr.uploaderRole === 'tozalik_masuli'
  );

  // Handle uploading photo for manual task
  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setPhotoState: (val: string) => void,
    setLoadingState: (val: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoadingState(true);
      const compressed = await compressImage(file, 960, 960, 0.70);
      if (compressed) {
        setPhotoState(compressed);
      }
    } catch (err) {
      console.warn('Rasm siqishda xatolik:', err);
    } finally {
      setLoadingState(false);
      e.target.value = '';
    }
  };

  // Submit manual task
  const handleSubmitManualTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedZone = manualZone === 'Boshqa' ? customZoneInput.trim() : manualZone;
    const resolvedTitle = manualTitle.trim();

    if (!resolvedTitle) {
      setManualModalError('Iltimos, bajargan ishingiz nomini yozing!');
      return;
    }

    if (!resolvedZone) {
      setManualModalError('Iltimos, hudud yoki binoni belgilang!');
      return;
    }

    setIsSubmittingManual(true);
    setManualModalError(null);

    try {
      const resolvedDisinfectant =
        manualDisinfectant === 'Boshqa'
          ? customDisinfectantInput.trim()
          : manualDisinfectant;

      await addSanitationTask({
        title: resolvedTitle,
        zone: resolvedZone,
        notes: manualNotes.trim() || undefined,
        photoUrl: manualPhotoUrl || undefined,
        disinfectantUsed: resolvedDisinfectant || undefined,
        isCompleted: true,
      });

      // Reset form
      setManualTitle('');
      setManualNotes('');
      setManualPhotoUrl('');
      setCustomZoneInput('');
      setCustomDisinfectantInput('');
      setIsManualTaskModalOpen(false);
    } catch (err) {
      console.error('Bajarilgan ishni saqlashda xatolik:', err);
      setManualModalError('Saqlashda xatolik yuz berdi. Qayta urinib ko\'ring.');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Submit completing an existing task
  const handleConfirmTaskCompletion = async () => {
    if (!taskToComplete) return;

    const photoToUse = completePhotoUrl || PRESET_SANITATION_PHOTOS[0].url;

    toggleSanitationTask(
      taskToComplete.id,
      photoToUse,
      completeNotes.trim() || undefined,
      completeDisinfectant || undefined
    );

    // Auto add to photo reports
    if (photoToUse) {
      await addPhotoReport(
        `Sanitariya: ${taskToComplete.zone} - ${taskToComplete.title}`,
        'sanitariya',
        photoToUse,
        completeNotes.trim() || `${taskToComplete.zone} tozalab topshirildi. Vosita: ${completeDisinfectant}`,
        taskToComplete.zone
      );
    }

    setTaskToComplete(null);
    setCompleteNotes('');
    setCompletePhotoUrl('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-950/70 via-slate-900 to-emerald-950/50 p-5 sm:p-6 rounded-3xl border border-teal-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0 shadow-lg shadow-teal-500/10">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Tozalik va Sanitariya Mas'uli Paneli
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Biosavfsizlik & Dezinfeksiya
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Bajarilgan tozalash ishlarini qo'lda yozish, dezinfeksiya nazorati va foto-hisobotlar
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setManualTitle('');
              setManualNotes('');
              setManualPhotoUrl('');
              setManualModalError(null);
              setIsManualTaskModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-teal-500/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Qo'lda Ish Yozish</span>
          </button>

          <button
            onClick={() => setIsPhotoUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-teal-300 border border-teal-500/40 hover:border-teal-500/70 font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Camera className="w-4 h-4 text-teal-400" />
            <span>Foto Hisobot Yuborish</span>
          </button>
        </div>
      </div>

      {/* Progress & Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Progress Bar Card */}
        <div className="p-4 sm:p-5 bg-slate-850 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Kunlik Reja Bajarilishi
            </span>
            <span className="text-xs font-bold text-teal-400">
              {sanitationTasks.length > 0
                ? `${Math.round((completedCount / sanitationTasks.length) * 100)}%`
                : '100%'}
            </span>
          </div>
          <div className="text-xl font-black text-white mb-2">
            {completedCount} / {sanitationTasks.length} ta hudud
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${sanitationTasks.length > 0 ? (completedCount / sanitationTasks.length) * 100 : 100}%`,
              }}
            />
          </div>
        </div>

        {/* Photo Reports Stat */}
        <div className="p-4 sm:p-5 bg-slate-850 border border-slate-800 rounded-3xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Sanitariya Foto-Hisobotlari
            </span>
            <div className="text-xl font-black text-white">
              {sanitationPhotoReports.length} ta surat
            </div>
            <span className="text-[11px] text-teal-400 font-medium">
              Rahbariyat nazoratiga uzatilgan
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Camera className="w-6 h-6" />
          </div>
        </div>

        {/* Responsible Person Badge */}
        <div className="p-4 sm:p-5 bg-slate-850 border border-slate-800 rounded-3xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Mas'ul Xodim
            </span>
            <div className="text-base font-black text-white line-clamp-1">
              {currentUser.fullName}
            </div>
            <span className="text-[11px] text-amber-400 font-medium">
              {currentUser.branchName || 'Bosh Filial'} • Faol navbatchilik
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Tasks vs Photo Gallery */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Tozalash Vazifalari & Ishlar ({sanitationTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Sanitariya Foto-Hisobotlari ({sanitationPhotoReports.length})</span>
          </button>
        </div>

        {/* Filter buttons when in tasks tab */}
        {activeTab === 'tasks' && (
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setTaskFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                taskFilter === 'all'
                  ? 'bg-slate-800 text-teal-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setTaskFilter('pending')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                taskFilter === 'pending'
                  ? 'bg-slate-800 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bajarilmagan ({sanitationTasks.length - completedCount})
            </button>
            <button
              onClick={() => setTaskFilter('completed')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                taskFilter === 'completed'
                  ? 'bg-slate-800 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bajarilgan ({completedCount})
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'tasks' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Task Checklist & Logs */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Tozalash va Dezinfeksiya Ishlari Ro'yxati</span>
              </h2>

              <button
                onClick={() => {
                  setManualTitle('');
                  setManualNotes('');
                  setManualPhotoUrl('');
                  setManualModalError(null);
                  setIsManualTaskModalOpen(true);
                }}
                className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yangi ish yozish</span>
              </button>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="bg-slate-850 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
                <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                <p className="font-bold text-sm">Hozircha bunday vazifalar mavjud emas</p>
                <button
                  onClick={() => setIsManualTaskModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 rounded-xl text-xs font-bold"
                >
                  + Qo'lda yangi bajarilgan ish yozish
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      task.isCompleted
                        ? 'bg-teal-950/25 border-teal-500/40 text-teal-100 shadow-sm'
                        : 'bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Checkbox toggle button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!task.isCompleted) {
                              setTaskToComplete(task);
                              setCompleteNotes(task.notes || '');
                              setCompleteDisinfectant(task.disinfectantUsed || DISINFECTANT_PRESETS[0]);
                              setCompletePhotoUrl('');
                            } else {
                              toggleSanitationTask(task.id);
                            }
                          }}
                          title={task.isCompleted ? 'Qaytarish' : 'Bajarildi deb belgilash'}
                          className={`w-7 h-7 mt-0.5 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            task.isCompleted
                              ? 'bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/30'
                              : 'border-2 border-slate-600 hover:border-teal-400 bg-slate-800/80'
                          }`}
                        >
                          {task.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-black text-teal-400 uppercase tracking-wider bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                              {task.zone}
                            </span>
                            {task.disinfectantUsed && (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                                <FlaskConical className="w-3 h-3" />
                                {task.disinfectantUsed}
                              </span>
                            )}
                          </div>

                          <h3
                            className={`text-sm sm:text-base font-bold mt-1.5 leading-snug ${
                              task.isCompleted ? 'text-teal-100 font-semibold' : 'text-white'
                            }`}
                          >
                            {task.title}
                          </h3>

                          {/* Notes if written manually */}
                          {task.notes && (
                            <p className="text-xs text-slate-300 mt-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                              {task.notes}
                            </p>
                          )}

                          {/* Execution details */}
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 flex-wrap">
                            {task.completedAt ? (
                              <span className="text-teal-300 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3 text-teal-400" />
                                Bajarilgan vaqti: {task.completedAt} ({task.cleanedByName || currentUser.fullName})
                              </span>
                            ) : (
                              <span className="text-amber-400/90 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Kutilmoqda
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Photo thumbnail & Action Buttons */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                        {task.photoUrl ? (
                          <div
                            onClick={() =>
                              setPreviewPhoto({
                                url: task.photoUrl!,
                                title: task.title,
                                zone: task.zone,
                                timestamp: task.completedAt,
                              })
                            }
                            className="relative group cursor-pointer"
                            title="Suratni kattalashtirib ko'rish"
                          >
                            <img
                              src={task.photoUrl}
                              alt="Tozalik surati"
                              className="w-16 h-14 sm:w-20 sm:h-16 object-cover rounded-xl border border-teal-500/40 group-hover:border-teal-400 transition-all shadow-md"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Surat yo'q</span>
                        )}

                        <div className="flex items-center gap-1.5">
                          {!task.isCompleted ? (
                            <button
                              type="button"
                              onClick={() => {
                                setTaskToComplete(task);
                                setCompleteNotes(task.notes || '');
                                setCompleteDisinfectant(task.disinfectantUsed || DISINFECTANT_PRESETS[0]);
                                setCompletePhotoUrl('');
                              }}
                              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Camera className="w-3 h-3" />
                              <span>Bajarildi & Foto</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleSanitationTask(task.id)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                              title="Holatni qaytarish"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Qaytarish</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Biosafety Guidelines & Information */}
          <div className="lg:col-span-4 space-y-4">
            {/* Quick manual entry promo card */}
            <div className="bg-gradient-to-br from-teal-900/30 to-slate-900 border border-teal-500/30 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Qo'lda Ish Yozish & Hisobot</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Ro'yxatda bo'lmagan qo'shimcha tozalash yoki rejadan tashqari dezinfeksiya ishlarini qo'lda yozib,
                foto hisobot bilan birga saqlashingiz mumkin.
              </p>
              <button
                onClick={() => {
                  setManualTitle('');
                  setManualNotes('');
                  setManualPhotoUrl('');
                  setIsManualTaskModalOpen(true);
                }}
                className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Bajarilgan Ishni Yozish</span>
              </button>
            </div>

            {/* Biosafety rules */}
            <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Biosavfsizlik Qoidalari</span>
              </h2>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-900/70 rounded-2xl border border-slate-800">
                  <span className="font-bold text-teal-400 block mb-1">Dezobaryer Talablari:</span>
                  <p className="text-slate-400 leading-relaxed">
                    Darvozadagi chuqurlikda kamida 15 sm xlorli yoki formalinli dezinfeksiya eritmasi bo'lishi va har 2 kunda yangilanishi shart.
                  </p>
                </div>

                <div className="p-3 bg-slate-900/70 rounded-2xl border border-slate-800">
                  <span className="font-bold text-teal-400 block mb-1">Kiyim va Maxsus Forma:</span>
                  <p className="text-slate-400 leading-relaxed">
                    Sexlarga faqat maxsus dezinfeksiyalangan kombinezon va etiklarda kirish ruxsat etiladi. Oyoq kiyim dezokovrikdan o'tishi majburiy.
                  </p>
                </div>

                <div className="p-3 bg-slate-900/70 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                  <span className="font-bold text-amber-400 block mb-1">Foto Dalil Majburiy:</span>
                  <p className="text-slate-300 leading-relaxed">
                    Har bir tozalash va dori sepishdan so'ng rasmga olib hisobot yuboring. Ushbu fotolar to'g'ridan-to'g'ri bosh shifokor va direktor nazoratiga boradi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Sanitariya Foto-Hisobotlari Galereyasi */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-teal-400" />
                <span>Tozalik va Dezinfeksiya Foto-Hisobotlari Galereyasi</span>
              </h2>
              <p className="text-xs text-slate-400">
                Tozalik mas'uli tomonidan yuborilgan barcha suratlarning arxiv va tasdiq ro'yxati
              </p>
            </div>

            <button
              onClick={() => setIsPhotoUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-md transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Yangi Foto Yuklash</span>
            </button>
          </div>

          {sanitationPhotoReports.length === 0 ? (
            <div className="bg-slate-850 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              <Camera className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-sm font-bold text-slate-300">Hozircha foto-hisobotlar yuklanmagan</p>
              <p className="text-xs text-slate-500 mt-1">
                Tozalangan hududlar suratini yuborish uchun quyidagi tugmani bosing
              </p>
              <button
                onClick={() => setIsPhotoUploadModalOpen(true)}
                className="mt-4 px-5 py-2.5 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-md"
              >
                + Birinchi Foto-Hisobotni Yuborish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sanitationPhotoReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-slate-850 border border-slate-800 hover:border-teal-500/50 rounded-2xl overflow-hidden shadow-lg transition-all group flex flex-col"
                >
                  {/* Photo container */}
                  <div
                    onClick={() =>
                      setPreviewPhoto({
                        url: report.imageUrl,
                        title: report.title,
                        zone: report.building,
                        timestamp: report.timestamp,
                      })
                    }
                    className="relative h-44 bg-slate-900 cursor-pointer overflow-hidden"
                  >
                    <img
                      src={report.imageUrl}
                      alt={report.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          report.status === 'tasdiqlandi'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {report.status === 'tasdiqlandi' ? 'Tasdiqlangan' : 'Kutilmoqda'}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider block">
                        {report.building || 'Hudud'}
                      </span>
                      <h4 className="text-xs font-bold truncate">{report.title}</h4>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3 text-xs space-y-1.5 flex-1 flex flex-col justify-between">
                    {report.notes && (
                      <p className="text-slate-300 line-clamp-2 text-[11px] leading-relaxed">
                        {report.notes}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>{report.uploaderName}</span>
                      <span className="font-mono text-teal-400">{report.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL 1: Qo'lda Bajarilgan Ishni Yozish Modali
         ======================================================== */}
      {isManualTaskModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsManualTaskModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-5 sm:p-6 max-w-lg w-full relative max-h-[92vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Bajarilgan Ishni Qo'lda Yozish</h3>
                  <p className="text-xs text-slate-400">Tozalash, dezinfeksiya va foto-hisobot kiritish</p>
                </div>
              </div>
              <button
                onClick={() => setIsManualTaskModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {manualModalError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{manualModalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitManualTask} className="space-y-4 text-xs">
              {/* 1. Hudud yoki Bino tanlash */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  1. Hudud / Sex / Bino:
                </label>
                <select
                  value={manualZone}
                  onChange={(e) => setManualZone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-teal-400 focus:outline-none"
                >
                  {COMMON_ZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                  <option value="Boshqa">+ Boshqa hudud (qo'lda kiritish)</option>
                </select>

                {manualZone === 'Boshqa' && (
                  <input
                    type="text"
                    required
                    value={customZoneInput}
                    onChange={(e) => setCustomZoneInput(e.target.value)}
                    placeholder="Hudud nomini yozing..."
                    className="w-full mt-2 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                  />
                )}
              </div>

              {/* 2. Bajarilgan ish nomi */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  2. Bajarilgan ish nomi (Nima ish qilindi?):
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Masalan: Pol va kataklar ostini xlor eritmasi bilan yuvish"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none text-xs sm:text-sm font-semibold"
                />
              </div>

              {/* 3. Ishlatilgan dezinfeksiya vositasi */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  3. Ishlatilgan dezinfeksiya / tozalash vositasi:
                </label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {DISINFECTANT_PRESETS.slice(0, 6).map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => {
                        setManualDisinfectant(preset);
                        setCustomDisinfectantInput('');
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold text-left transition-all border ${
                        manualDisinfectant === preset
                          ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={customDisinfectantInput || (DISINFECTANT_PRESETS.includes(manualDisinfectant) ? '' : manualDisinfectant)}
                  onChange={(e) => {
                    setCustomDisinfectantInput(e.target.value);
                    setManualDisinfectant(e.target.value || DISINFECTANT_PRESETS[0]);
                  }}
                  placeholder="Yoki boshqa vosita/konsentratsiya yozing..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none text-xs"
                />
              </div>

              {/* 4. Batafsil hisobot va izoh */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  4. Bajarilgan ish tafsilotlari / hisobot:
                </label>
                <textarea
                  rows={3}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Qilingan ishlar tafsiloti, xlor konsentratsiyasi, qancha maydon tozalangani haqida yozing..."
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* 5. Foto Hisobot (Camera / Gallery Upload) */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-teal-400" />
                    <span>5. Foto-Hisobot (Rasm ilova qilish):</span>
                  </span>
                  <span className="text-[10px] text-teal-400 font-normal">Kamera yoki Galereya</span>
                </label>

                {/* Upload box */}
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={fileInputManualRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) =>
                      handlePhotoUpload(e, setManualPhotoUrl, setIsCompressingManualPhoto)
                    }
                  />

                  {manualPhotoUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-teal-500/50 bg-slate-800">
                      <img
                        src={manualPhotoUrl}
                        alt="Yuklangan surat"
                        className="w-full h-40 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setManualPhotoUrl('')}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600/90 text-white rounded-xl hover:bg-rose-500 transition-colors cursor-pointer"
                        title="Suratni o'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] text-teal-300 font-bold">
                        ✓ Surat biriktirildi
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputManualRef.current?.click()}
                        disabled={isCompressingManualPhoto}
                        className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-teal-500/40 hover:border-teal-400 bg-teal-500/5 hover:bg-teal-500/10 rounded-2xl transition-all cursor-pointer group"
                      >
                        {isCompressingManualPhoto ? (
                          <Loader2 className="w-6 h-6 text-teal-400 animate-spin mb-1" />
                        ) : (
                          <Camera className="w-6 h-6 text-teal-400 group-hover:scale-110 transition-transform mb-1" />
                        )}
                        <span className="font-bold text-white text-[11px]">Suratga Olish / Yuklash</span>
                        <span className="text-[10px] text-slate-400">Kamera yoki Galereya</span>
                      </button>

                      <div className="p-2.5 bg-slate-800/60 rounded-2xl border border-slate-700/80 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Namuna fotolardan tanlash:
                        </span>
                        <div className="grid grid-cols-2 gap-1 my-1">
                          {PRESET_SANITATION_PHOTOS.slice(0, 2).map((p, idx) => (
                            <button
                              type="button"
                              key={idx}
                              onClick={() => setManualPhotoUrl(p.url)}
                              className="text-[10px] p-1 bg-slate-800 hover:bg-teal-500/20 text-slate-300 rounded border border-slate-700 text-center truncate cursor-pointer"
                            >
                              {p.label.slice(0, 12)}..
                            </button>
                          ))}
                        </div>
                        <span className="text-[9px] text-slate-500 italic text-center">
                          O'zingiz olgan haqiqiy surat tavsiya etiladi
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualTaskModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual || isCompressingManualPhoto}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl shadow-lg shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingManual ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Saqlash & Foto-Hisobotga Yuborish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: Mavjud Vazifani Bajarish & Foto Qo'shish
         ======================================================== */}
      {taskToComplete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setTaskToComplete(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-5 sm:p-6 max-w-md w-full relative max-h-[92vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Vazifani Bajarildi deb Belgilash
                  </h3>
                  <span className="text-[11px] text-teal-400 font-bold">{taskToComplete.zone}</span>
                </div>
              </div>
              <button
                onClick={() => setTaskToComplete(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 mb-3 text-xs">
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Vazifa:</span>
              <p className="font-bold text-white text-sm mt-0.5">{taskToComplete.title}</p>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Vosita */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Ishlatilgan vosita / dori:
                </label>
                <select
                  value={completeDisinfectant}
                  onChange={(e) => setCompleteDisinfectant(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-teal-400 focus:outline-none"
                >
                  {DISINFECTANT_PRESETS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Izoh */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Qo'shimcha izoh yoki hisobot:
                </label>
                <textarea
                  rows={2}
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="Masalan: Yuvildi, xlor sepildi, tozalik me'yorida topshirildi"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none resize-none"
                />
              </div>

              {/* Rasm yuklash */}
              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-teal-400" />
                    <span>Foto Dalil Yuklash:</span>
                  </span>
                  <span className="text-[10px] text-teal-400 font-normal">Kamera</span>
                </label>

                <input
                  type="file"
                  ref={fileInputCompleteRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) =>
                    handlePhotoUpload(e, setCompletePhotoUrl, setIsCompressingCompletePhoto)
                  }
                />

                {completePhotoUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-teal-500/50 bg-slate-800">
                    <img
                      src={completePhotoUrl}
                      alt="Yuklangan surat"
                      className="w-full h-36 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setCompletePhotoUrl('')}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600/90 text-white rounded-xl hover:bg-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputCompleteRef.current?.click()}
                    disabled={isCompressingCompletePhoto}
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-teal-500/40 hover:border-teal-400 bg-teal-500/5 hover:bg-teal-500/10 rounded-2xl transition-all cursor-pointer"
                  >
                    {isCompressingCompletePhoto ? (
                      <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-teal-400" />
                    )}
                    <span className="font-bold text-white text-xs">
                      Haqiqiy Suratga Olish (Kamera)
                    </span>
                  </button>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTaskToComplete(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTaskCompletion}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Tasdiqlash & Yuborish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: Lightbox (Suratni kattalashtirib ko'rish)
         ======================================================== */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title}
                className="w-full max-h-[75vh] object-contain bg-slate-950"
              />
              <button
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-3 right-3 p-2 bg-slate-950/80 hover:bg-slate-900 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{previewPhoto.title}</h4>
                <p className="text-xs text-teal-400">{previewPhoto.zone || 'Sanitariya hududi'}</p>
              </div>
              {previewPhoto.timestamp && (
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
                  {previewPhoto.timestamp}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Photo Upload Modal Component */}
      <PhotoUploadModal
        isOpen={isPhotoUploadModalOpen}
        onClose={() => setIsPhotoUploadModalOpen(false)}
        defaultCategory="sanitariya"
        defaultBuilding="1-Bino (Sex 1)"
        defaultTitle="Sanitariya va tozalash ishlari hisoboti"
      />
    </div>
  );
};
