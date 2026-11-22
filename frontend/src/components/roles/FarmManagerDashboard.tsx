import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/mockData';
import { Role, FarmTask } from '../../types';
import {
  Briefcase,
  Plus,
  Star,
  CheckCircle2,
  AlertTriangle,
  FilePlus,
  Users,
  Building,
  Check,
  X,
  Droplets,
  Scale,
  Thermometer,
  Pill,
  Warehouse,
  History,
  Info,
  Calendar,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Edit3,
  Filter,
  Eye,
  Camera,
  CheckCheck,
  Clock
} from 'lucide-react';
import {
  isTaskOverdue,
  formatTaskDeadline,
  getDefaultDueDateTime,
  getTodayDateString,
  getTomorrowDateString,
} from '../../utils/taskUtils';
import { NumberStepper } from '../common/NumberStepper';

const COMMON_BUILDINGS = [
  '1-Bino',
  '2-Bino',
  '3-Bino',
  '4-Bino',
  '5-Bino',
  'Karantin Binosi',
  'Jo\'ja boqish binosi'
];

const COMMON_MORTALITY_REASONS = [
  'Tabiiy holsizlik / keksa tovuqlar',
  'Issiq urishi / shamollatish buzilishi',
  'Mexanik shikastlanish / qafas qisishi',
  'Zaif parrandalar saralandi',
  'Suv/yem tizimidagi nosozlik sabab',
  'Sababi veterinariya tomonidan tekshirilmoqda'
];

const COMMON_MEDICATIONS = [
  'Dori berilmadi (toza suv)',
  'Chiktonik (vitamin kompleksi 1L / 1000L suv)',
  'Enrofloksatsin 10% (profilaktik antibiotik)',
  'Aminovital (o\'sish rag\'batlantiruvchi)',
  'Glyukoza + Vitamin C eritmasi',
  'Vaksinatsiya (suv orqali berildi)'
];

export const FarmManagerDashboard: React.FC = () => {
  const {
    tasks,
    createTask,
    updateTaskStatus,
    resetTasksToDefault,
    sanitationTasks,
    toggleSanitationTask,
    evaluateSanitationTask,
    addFactoryReport,
    factoryReports,
    users,
    groceryRequests,
    updateGroceryStatus,
    currentUser,
    farmCurrentTime
  } = useApp();

  // Subordinate task view & filters
  const [taskFilterTab, setTaskFilterTab] = useState<'all' | 'ready_to_review' | 'evaluated' | 'in_progress'>('all');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [activeMainTab, setActiveMainTab] = useState<'tasks' | 'sanitation'>('tasks');
  const [quickRateSuccessId, setQuickRateSuccessId] = useState<string | null>(null);
  const [sanitationPreviewPhoto, setSanitationPreviewPhoto] = useState<{ url: string; title: string; zone: string } | null>(null);

  // Task assignment state - dynamic due date and time
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [assignedToRole, setAssignedToRole] = useState<Role>('slesar');
  const [taskBuilding, setTaskBuilding] = useState('1-Bino');
  const [taskDueDate, setTaskDueDate] = useState(() => getDefaultDueDateTime().dueDate);
  const [taskDueTime, setTaskDueTime] = useState(() => getDefaultDueDateTime().dueTime);

  // Evaluation modal state
  const [evaluatingTaskId, setEvaluatingTaskId] = useState<string | null>(null);
  const [evaluatingSanitationId, setEvaluatingSanitationId] = useState<string | null>(null);
  const [evalScore, setEvalScore] = useState<number>(5);
  const [evalNote, setEvalNote] = useState('');

  // Daily Report submission form state (Partiya raqami olib tashlangan)
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportBuilding, setReportBuilding] = useState('1-Bino');
  const [customBuildingInput, setCustomBuildingInput] = useState('');
  const [isCustomBuilding, setIsCustomBuilding] = useState(false);

  // Nobudlar soni va izohi
  const [mortalityCount, setMortalityCount] = useState<number>(4);
  const [mortalityReason, setMortalityReason] = useState<string>(
    'Tabiiy holsizlik / keksa tovuqlar, xonada umumiy holat me\'yorda'
  );

  // Kunlik ko'rsatkichlar
  const [birdsCount, setBirdsCount] = useState<number>(28500); // Umumiy parrandalar soni
  const [waterPerBirdMl, setWaterPerBirdMl] = useState<number>(220); // Suv sarfi (jon boshiga, ml)
  const [feedPerBirdGram, setFeedPerBirdGram] = useState<number>(114); // Yem sarfi (jon boshiga, gr)
  const [feedConsumedKg, setFeedConsumedKg] = useState<number>(3250); // Umumiy yem (kg)
  const [feedRemainingKg, setFeedRemainingKg] = useState<number>(4500); // Zahiradagi qoldiq yem (kg)
  const [minTemp, setMinTemp] = useState<number>(20.0); // Minimal harorat (°C)
  const [maxTemp, setMaxTemp] = useState<number>(23.5); // Maksimal harorat (°C)
  const [medicationGiven, setMedicationGiven] = useState<string>(
    'Chiktonik (vitamin kompleksi 1L / 1000L suv)'
  );
  const [feedReceivedKg, setFeedReceivedKg] = useState<number>(3500); // Qabul qilib olingan yem miqdori (yem omboridan) (kg)

  // Qo'shimcha/yordamchi ishlab chiqarish ko'rsatkichlari
  const [showEggSection, setShowEggSection] = useState<boolean>(true);
  const [eggsCollected, setEggsCollected] = useState<number>(27100);
  const [premiumEggs, setPremiumEggs] = useState<number>(18600);
  const [firstEggs, setFirstEggs] = useState<number>(7500);
  const [secondEggs, setSecondEggs] = useState<number>(1000);
  const [damagedEggs, setDamagedEggs] = useState<number>(38);
  const [humidity, setHumidity] = useState<number>(60);
  const [reportNotes, setReportNotes] = useState<string>(
    'Liniyalar me\'yorda, suv va yem ta\'minoti barqaror, ventilatsiya yaxshi ishlamoqda.'
  );

  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Auto-calculation helper: when birdsCount or feedConsumedKg changes, automatically recalculate feedPerBirdGram
  // Formula: Jon boshiga yem (gr) = (Umumiy kunlik yem (kg) * 1000) / Umumiy parrandalar soni
  const handleBirdsCountChange = (count: number) => {
    setBirdsCount(count);
    if (count > 0 && feedConsumedKg > 0) {
      const perBird = Number(((feedConsumedKg * 1000) / count).toFixed(1));
      setFeedPerBirdGram(perBird);
    }
  };

  const handleFeedKgChange = (kg: number) => {
    setFeedConsumedKg(kg);
    if (birdsCount > 0 && kg > 0) {
      const perBird = Number(((kg * 1000) / birdsCount).toFixed(1));
      setFeedPerBirdGram(perBird);
    }
  };

  const handleFeedPerBirdChange = (gram: number) => {
    setFeedPerBirdGram(gram);
    if (birdsCount > 0 && gram > 0) {
      const totalKg = Math.round((birdsCount * gram) / 1000);
      setFeedConsumedKg(totalKg);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const assignedUser = users.find((u) => u.role === assignedToRole);
    createTask({
      title: taskTitle,
      description: taskDescription,
      assignedToRole,
      assignedToName: assignedUser ? `${assignedUser.fullName} (${ROLE_LABELS[assignedToRole].short})` : assignedToRole,
      priority: 'orta',
      building: taskBuilding,
      dueDate: taskDueDate,
      dueTime: taskDueTime,
    });
    setTaskTitle('');
    setTaskDescription('');
    const def = getDefaultDueDateTime();
    setTaskDueDate(def.dueDate);
    setTaskDueTime(def.dueTime);
  };

  const handleQuickRate = (task: FarmTask, score: number) => {
    const defaultNote = score >= 4 ? "Sifatli va o'z vaqtida bajarildi" : "Ko'rib chiqildi, qabul qilindi";
    const note = task.evaluationNote || defaultNote;
    updateTaskStatus(task.id, 'tasdiqlandi', score, note);
    setQuickRateSuccessId(task.id);
    setTimeout(() => {
      setQuickRateSuccessId(null);
    }, 1500);
  };

  const handleQuickRateSanitation = (st: any, score: number) => {
    const defaultNote = score >= 4 ? "Tozalik va dezinfeksiya a'lo darajada" : "Ko'rib chiqildi, qabul qilindi";
    const note = st.evaluationNote || defaultNote;
    evaluateSanitationTask(st.id, score, note);
    setQuickRateSuccessId(st.id);
    setTimeout(() => {
      setQuickRateSuccessId(null);
    }, 1500);
  };

  const openEvaluationModal = (task: FarmTask) => {
    setEvaluatingSanitationId(null);
    setEvaluatingTaskId(task.id);
    setEvalScore(task.evaluationScore || 5);
    setEvalNote(task.evaluationNote || "Sifatli va o'z vaqtida bajarildi");
  };

  const openSanitationEvaluationModal = (st: any) => {
    setEvaluatingTaskId(null);
    setEvaluatingSanitationId(st.id);
    setEvalScore(st.evaluationScore || 5);
    setEvalNote(st.evaluationNote || "Tozalik va dezinfeksiya me'yorida bajarildi");
  };

  const handleEvaluateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNote = evalNote.trim() || (evalScore >= 4 ? "Sifatli va o'z vaqtida bajarildi" : "Ko'rib chiqildi, qabul qilindi");
    if (evaluatingTaskId) {
      updateTaskStatus(evaluatingTaskId, 'tasdiqlandi', evalScore, finalNote);
      setEvaluatingTaskId(null);
    } else if (evaluatingSanitationId) {
      evaluateSanitationTask(evaluatingSanitationId, evalScore, finalNote);
      setEvaluatingSanitationId(null);
    }
    setEvalNote('');
  };

  const handleBatchEvaluateAll = (score: number = 5) => {
    const readyTasks = subordinateTasks.filter((t) => t.status === 'bajarildi' && !t.evaluationScore);
    if (readyTasks.length === 0) return;
    readyTasks.forEach((task) => {
      updateTaskStatus(task.id, 'tasdiqlandi', score, "Sifatli va o'z vaqtida bajarildi (Yalpi tasdiqlandi)");
    });
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedBuilding = isCustomBuilding && customBuildingInput.trim()
      ? customBuildingInput.trim()
      : reportBuilding;

    const calculatedAvgTemp = Number(((Number(minTemp) + Number(maxTemp)) / 2).toFixed(1));
    const calculatedWaterLiters = Math.round((Number(birdsCount) * Number(waterPerBirdMl)) / 1000) || 6000;

    addFactoryReport({
      building: selectedBuilding,
      // "Partiya raqami" butunlay olib tashlangan!
      birdsCount: Number(birdsCount) || 0,
      mortalityCount: Number(mortalityCount) || 0,
      mortalityReason: mortalityReason.trim(),
      waterPerBirdMl: Number(waterPerBirdMl) || 0,
      feedPerBirdGram: Number(feedPerBirdGram) || 0,
      feedConsumedKg: Number(feedConsumedKg) || 0,
      feedRemainingKg: Number(feedRemainingKg) || 0,
      minTemperature: Number(minTemp) || 0,
      maxTemperature: Number(maxTemp) || 0,
      avgTemperature: calculatedAvgTemp,
      medicationGiven: medicationGiven.trim() || 'Dori berilmadi',
      feedReceivedKg: Number(feedReceivedKg) || 0,
      eggsCollectedTotal: Number(eggsCollected) || 0,
      eggsCategoryPremium: Number(premiumEggs) || 0,
      eggsCategoryFirst: Number(firstEggs) || 0,
      eggsCategorySecond: Number(secondEggs) || 0,
      eggsDamaged: Number(damagedEggs) || 0,
      waterConsumedLiters: calculatedWaterLiters,
      humidityPercent: Number(humidity) || 60,
      notes: reportNotes.trim(),
    });

    setFormSuccessMessage(`${selectedBuilding} uchun kunlik hisobot muvaffaqiyatli saqlandi!`);
    setTimeout(() => {
      setFormSuccessMessage(null);
      setShowReportForm(false);
    }, 1500);
  };

  const subordinateTasks = tasks.filter((t) => t.assignedToRole !== 'ish_boshqaruvchi');

  const filteredTasks = subordinateTasks.filter((t) => {
    if (roleFilter !== 'all' && t.assignedToRole !== roleFilter) return false;
    if (taskFilterTab === 'ready_to_review') return t.status === 'bajarildi' && !t.evaluationScore;
    if (taskFilterTab === 'evaluated') return !!t.evaluationScore || t.status === 'tasdiqlandi';
    if (taskFilterTab === 'in_progress') return t.status === 'jarayonda' || t.status === 'yangi';
    return true;
  });

  const readyToReviewCount = subordinateTasks.filter((t) => t.status === 'bajarildi' && !t.evaluationScore).length;
  const evaluatedCount = subordinateTasks.filter((t) => !!t.evaluationScore || t.status === 'tasdiqlandi').length;
  const inProgressCount = subordinateTasks.filter((t) => t.status === 'jarayonda' || t.status === 'yangi').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/50 p-6 rounded-3xl border border-blue-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Briefcase className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Ish Boshqaruvchi (Farm Manager)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Operativ Boshqaruv
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Kunlik sex ko'rsatkichlari (suv, yem, nobudlar, harorat, dori), ishchilarga topshiriq berish va ijro nazorati
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setFormSuccessMessage(null);
            setShowReportForm(true);
          }}
          className="self-start md:self-auto px-5 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-emerald-600/30 active:scale-95 transition-all"
        >
          <FilePlus className="w-5 h-5 text-emerald-200" />
          <span>Kunlik Sex Hisoboti Topshirish</span>
        </button>
      </div>

      {/* Pending Cook Grocery Requests Approval banner */}
      {groceryRequests.some((g) => g.status === 'kutilmoqda') && (
        <div className="p-4 bg-pink-950/30 border border-pink-500/30 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
              !
            </div>
            <div>
              <div className="text-xs font-bold text-pink-200">
                Oshpazdan masalliqlar so'rovi kutilmoqda
              </div>
              <div className="text-[11px] text-pink-300/80">
                Xodimlar oshxonasi uchun buyurtma berilgan
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {groceryRequests
              .filter((g) => g.status === 'kutilmoqda')
              .map((req) => (
                <button
                  key={req.id}
                  onClick={() => updateGroceryStatus(req.id, 'tasdiqlandi', 'Farm Manager tomonidan tasdiqlandi')}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg"
                >
                  Tasdiqlash ({req.items.length} ta masalliq)
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Main Grid: Assign Task & Subordinate Task Management with Star Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Worker Task Assignment Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Ishchilarga Topshiriq Tayinlash</span>
          </h2>

          <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Topshiriq mazmuni:
              </label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Masalan: 2-bino yem tarqatgich reduktorini moylash"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Ijrochi xodim lavozimi:
              </label>
              <select
                value={assignedToRole}
                onChange={(e) => setAssignedToRole(e.target.value as Role)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(ROLE_LABELS).map((roleKey) => (
                  <option key={roleKey} value={roleKey}>
                    {ROLE_LABELS[roleKey as Role].title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Bino / Joy:</label>
              <input
                type="text"
                value={taskBuilding}
                onChange={(e) => setTaskBuilding(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Topshiriq Muddati: Sana va Aniq Vaqt */}
            <div className="p-3 bg-slate-900/90 border border-blue-500/30 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Topshiriq muddati (Sana va Vaqt):</span>
                </label>
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {formatTaskDeadline(taskDueDate, taskDueTime)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Sana:</span>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Bajarish vaqti:</span>
                  <input
                    type="time"
                    required
                    value={taskDueTime}
                    onChange={(e) => setTaskDueTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Quick Deadline Presets */}
              <div className="pt-1 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Tezkor muddat tanlash:</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const h = (now.getHours() + 1) % 24;
                      setTaskDueDate(getTodayDateString());
                      setTaskDueTime(`${String(h).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 text-[10px] font-semibold border border-slate-700 cursor-pointer"
                  >
                    +1 soat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const h = (now.getHours() + 2) % 24;
                      setTaskDueDate(getTodayDateString());
                      setTaskDueTime(`${String(h).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 text-[10px] font-semibold border border-slate-700 cursor-pointer"
                  >
                    +2 soat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskDueDate(getTodayDateString());
                      setTaskDueTime('18:00');
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-semibold border border-slate-700 cursor-pointer"
                  >
                    Bugun 18:00
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskDueDate(getTomorrowDateString());
                      setTaskDueTime('10:00');
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-semibold border border-slate-700 cursor-pointer"
                  >
                    Ertaga 10:00
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskDueDate(getTomorrowDateString());
                      setTaskDueTime('18:00');
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 text-[10px] font-semibold border border-slate-700 cursor-pointer"
                  >
                    Ertaga 18:00
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Tushuntirish / Ko'rsatma:
              </label>
              <textarea
                rows={2}
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Topshiriq qanday tartibda bajarilishi kerak..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Topshiriqni Biriktirish</span>
            </button>
          </form>
        </div>

        {/* Right Column: Subordinate Tasks & 1-5 Star Grading (7 cols) */}
        <div className="lg:col-span-7 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Xodimlar Topshiriqlari & Baholash (1-5 Yulduz)</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Bajarilgan ishlarni tekshirish, har bir xodimga yulduzcha va izoh bilan baho qo'yish
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {readyToReviewCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleBatchEvaluateAll(5)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer animate-pulse"
                  title="Tekshirishga tayyor barcha topshiriqlarni 5 yulduz bilan tasdiqlash"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Barchasini 5★ bilan tasdiqlash ({readyToReviewCount})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (confirm("Topshiriqlar ro'yxatini yangilash va namunaviy vazifalarni qayta yuklashni tasdiqlaysizmi?")) {
                    resetTasksToDefault();
                  }
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700/80 transition-all cursor-pointer"
                title="Namunaviy topshiriqlar ro'yxatini qayta yuklash"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                <span>Topshiriqlarni yangilash</span>
              </button>
            </div>
          </div>

          {/* Navigation between General Subordinate Tasks and Tozalik Mas'uli ishlari */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <button
              type="button"
              onClick={() => setActiveMainTab('tasks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMainTab === 'tasks'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Barcha Topshiriqlar ({subordinateTasks.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('sanitation')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMainTab === 'sanitation'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>Tozalik Mas'uli Ishlari ({sanitationTasks.length})</span>
            </button>
          </div>

          {activeMainTab === 'tasks' ? (
            <>
              {/* Filter Tabs & Role select */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTaskFilterTab('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      taskFilterTab === 'all'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    Barchasi ({subordinateTasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilterTab('ready_to_review')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      taskFilterTab === 'ready_to_review'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : readyToReviewCount > 0
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 animate-pulse'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span>Tekshirishga tayyor</span>
                    {readyToReviewCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 text-[10px] flex items-center justify-center font-black">
                        {readyToReviewCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilterTab('evaluated')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      taskFilterTab === 'evaluated'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    Baholangan ({evaluatedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilterTab('in_progress')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      taskFilterTab === 'in_progress'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    Jarayonda ({inProgressCount})
                  </button>
                </div>

                {/* Role select */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as Role | 'all')}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">Barcha lavozimlar</option>
                    {Object.keys(ROLE_LABELS).map((roleKey) => (
                      <option key={roleKey} value={roleKey}>
                        {ROLE_LABELS[roleKey as Role].title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Task list container */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-2">
                    <p>Ushbu filtr bo'yicha topshiriqlar topilmadi.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setTaskFilterTab('all');
                        setRoleFilter('all');
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-xs font-bold"
                    >
                      Barcha topshiriqlarni ko'rsatish
                    </button>
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const isReadyToReview = task.status === 'bajarildi' && !task.evaluationScore;
                    const isEvaluated = !!task.evaluationScore;
                    const isJustSaved = quickRateSuccessId === task.id;

                    return (
                      <div
                        key={task.id}
                        className={`p-4 bg-slate-800/80 border rounded-2xl space-y-2.5 transition-all shadow-md ${
                          isJustSaved
                            ? 'border-yellow-400/80 ring-2 ring-yellow-400/30'
                            : isReadyToReview
                            ? 'border-emerald-500/50 hover:border-emerald-400 bg-gradient-to-r from-emerald-950/20 via-slate-800 to-slate-800'
                            : isEvaluated
                            ? 'border-blue-500/40 hover:border-blue-400'
                            : 'border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        {/* Header: Title and Status Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-xs sm:text-sm font-bold text-white">{task.title}</h3>
                              {isReadyToReview && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                                  Tekshirishga tayyor
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{task.description}</p>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${
                              task.status === 'bajarildi'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : task.status === 'tasdiqlandi'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {task.status === 'bajarildi'
                              ? 'Tekshirishga tayyor'
                              : task.status === 'tasdiqlandi'
                              ? 'Baholandi & Tasdiqlandi'
                              : 'Jarayonda'}
                          </span>
                        </div>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-700/60 text-xs gap-2">
                          <div className="text-slate-400 text-[11px] flex items-center gap-1.5 flex-wrap">
                            <span className="text-blue-300 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                              {task.assignedToName}
                            </span>
                            <span>•</span>
                            <span className="text-slate-300">{task.building}</span>
                            {(task.dueTime || task.dueDate) && (
                              <>
                                <span>•</span>
                                {isTaskOverdue(task, farmCurrentTime) ? (
                                  <span className="font-mono text-rose-400 font-bold bg-rose-500/15 px-1.5 py-0.5 rounded border border-rose-500/30 inline-flex items-center gap-1">
                                    ⚠️ Muddati o'tgan: {formatTaskDeadline(task.dueDate, task.dueTime)}
                                  </span>
                                ) : (
                                  <span className="font-mono text-amber-400 inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    Muddat: {formatTaskDeadline(task.dueDate, task.dueTime)}
                                  </span>
                                )}
                              </>
                            )}
                            {task.completedAt && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400 text-[10px]">Bajarildi: {task.completedAt}</span>
                              </>
                            )}
                          </div>

                          {/* Actions & Rating controls */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* If in progress, allow manager to accept completion directly */}
                            {task.status !== 'bajarildi' && task.status !== 'tasdiqlandi' && (
                              <button
                                type="button"
                                onClick={() => updateTaskStatus(task.id, 'bajarildi')}
                                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-emerald-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                title="Xodim bajarganini tasdiqlab, baholashga o'tkazish"
                              >
                                <Check className="w-3 h-3" />
                                <span>Bajarildi deb qabul qilish</span>
                              </button>
                            )}

                            {/* Interactive Quick Star Rating (1-5 stars) directly on the card */}
                            <div className="flex items-center gap-0.5 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-700/80">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const isFilled = (task.evaluationScore || 0) >= star;
                                return (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleQuickRate(task, star)}
                                    title={`${star} yulduz bilan baholash`}
                                    className={`p-1 transition-transform hover:scale-125 cursor-pointer ${
                                      isFilled ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-300'
                                    }`}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${isFilled ? 'fill-yellow-400' : ''}`} />
                                  </button>
                                );
                              })}
                            </div>

                            {/* Evaluation or Edit button */}
                            {isEvaluated ? (
                              <button
                                type="button"
                                onClick={() => openEvaluationModal(task)}
                                className="px-2.5 py-1 bg-slate-700/90 hover:bg-slate-600 text-yellow-300 font-bold rounded-lg text-[11px] flex items-center gap-1 border border-yellow-500/30 transition-all cursor-pointer shadow-sm"
                                title="Bahoni yoki izohni qayta o'zgartirish"
                              >
                                <Edit3 className="w-3 h-3 text-yellow-400" />
                                <span>Bahoni o'zgartirish ({task.evaluationScore}★)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openEvaluationModal(task)}
                                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-lg text-[11px] flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                              >
                                <Star className="w-3.5 h-3.5 fill-slate-950" />
                                <span>Baholash (1-5)</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Manager evaluation note if present */}
                        {task.evaluationNote && (
                          <div className="text-[11px] text-slate-200 bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 flex items-start justify-between gap-2">
                            <div>
                              <span className="text-yellow-400 font-bold">Menejer bahosi va izohi:</span>{' '}
                              <span className="italic">{task.evaluationNote}</span>
                            </div>
                            {task.evaluatedByName && (
                              <span className="text-[10px] text-slate-400 shrink-0">
                                ({task.evaluatedByName})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* Tozalik Mas'uli Ishlari Tab */
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {sanitationTasks.length === 0 ? (
                <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  Tozalik mas'uli tomonidan topshirilgan sanitariya ishlari mavjud emas.
                </div>
              ) : (
                sanitationTasks.map((st) => (
                  <div
                    key={st.id}
                    className="p-4 bg-slate-800/80 border border-teal-500/30 rounded-2xl space-y-2.5 transition-all shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-white">{st.title}</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            {st.zone}
                          </span>
                        </div>
                        {st.notes && <p className="text-[11px] text-slate-300 mt-1 italic">{st.notes}</p>}
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                        {st.isCompleted ? 'Bajarildi' : 'Rejada'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-700/60 text-xs gap-2">
                      <div className="text-slate-400 text-[11px] flex items-center gap-2 flex-wrap">
                        <span className="text-teal-300 font-semibold">{st.cleanedByName || "Tozalik mas'uli"}</span>
                        {st.disinfectantUsed && (
                          <>
                            <span>•</span>
                            <span className="text-slate-300">Vosita: {st.disinfectantUsed}</span>
                          </>
                        )}
                        {st.completedAt && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-mono">{st.completedAt}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {st.photoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setSanitationPreviewPhoto({
                                url: st.photoUrl!,
                                title: st.title,
                                zone: st.zone,
                              })
                            }
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 text-teal-300 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border border-teal-500/30 transition-all cursor-pointer"
                          >
                            <Camera className="w-3 h-3 text-teal-400" />
                            <span>Foto hisobotni ko'rish</span>
                          </button>
                        )}

                        {/* Interactive Quick Star Rating (1-5 stars) */}
                        <div className="flex items-center gap-0.5 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-700/80">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = (st.evaluationScore || 0) >= star;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleQuickRateSanitation(st, star)}
                                title={`${star} yulduz bilan baholash`}
                                className={`p-1 transition-transform hover:scale-125 cursor-pointer ${
                                  isFilled ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-300'
                                }`}
                              >
                                <Star className={`w-3.5 h-3.5 ${isFilled ? 'fill-yellow-400' : ''}`} />
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => openSanitationEvaluationModal(st)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer ${
                            st.evaluationScore
                              ? 'bg-slate-700 hover:bg-slate-600 text-yellow-300 border border-yellow-500/30'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          }`}
                        >
                          <Star className={`w-3 h-3 ${st.evaluationScore ? 'text-yellow-400' : 'fill-slate-950'}`} />
                          <span>{st.evaluationScore ? `O'zgartirish (${st.evaluationScore}★)` : 'Baholash (1-5)'}</span>
                        </button>
                      </div>
                    </div>

                    {st.evaluationNote && (
                      <div className="text-[11px] text-slate-200 bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 flex items-start justify-between gap-2">
                        <div>
                          <span className="text-yellow-400 font-bold">Menejer bahosi ({st.evaluationScore}★):</span>{' '}
                          <span className="italic">{st.evaluationNote}</span>
                        </div>
                        {st.evaluatedByName && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            ({st.evaluatedByName})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Topshirilgan Kunlik Hisobotlar Tarixi (Ish Boshqaruvchi uchun ko'rinishi) */}
      <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Topshirilgan Kunlik Sex Hisobotlari Ro'yxati
              </h2>
              <p className="text-xs text-slate-400">
                Suv, yem sarfi, nobudlar, harorat, berilgan dori va yem ombori ma'lumotlari
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setFormSuccessMessage(null);
              setShowReportForm(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Hisobot Qo'shish</span>
          </button>
        </div>

        {factoryReports.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/50 rounded-2xl border border-slate-800/80 text-slate-400 text-xs">
            Hozircha topshirilgan hisobotlar yo'q. Yuqoridagi tugma orqali yangi hisobot yuboring.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {factoryReports.map((report) => (
              <div
                key={report.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4.5 space-y-3.5 transition-all shadow-lg"
              >
                {/* Header: Building and Date */}
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{report.building}</h3>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{report.date}</span>
                        <span>•</span>
                        <span>{report.submittedAt}</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Qabul qilindi
                  </span>
                </div>

                {/* Parrandalar soni va Nobudlar soni */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-emerald-950/20 border border-emerald-500/25 space-y-0.5">
                    <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Parrandalar soni:</span>
                    </div>
                    <div className="font-mono font-bold text-emerald-300 text-sm">
                      {report.birdsCount ? report.birdsCount.toLocaleString() : '28,500'} bosh
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-rose-950/20 border border-rose-500/25 space-y-0.5">
                    <div className="text-[10px] text-rose-300 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Nobudlar:</span>
                    </div>
                    <div className="font-mono font-bold text-rose-300 text-sm">
                      {report.mortalityCount} dona
                    </div>
                  </div>
                </div>

                {report.mortalityReason && (
                  <p className="text-[11px] text-rose-200/80 italic px-2 py-1 rounded bg-rose-950/30 border border-rose-500/20">
                    Izoh: {report.mortalityReason}
                  </p>
                )}

                {/* Kunlik Ko'rsatkichlar To'plami */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Suv sarfi (jon boshiga) */}
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-cyan-400" />
                      <span>Suv (jon boshiga)</span>
                    </div>
                    <div className="font-mono font-bold text-cyan-300 text-xs mt-0.5">
                      {report.waterPerBirdMl || Math.round((report.waterConsumedLiters * 1000) / (report.birdsCount || 1))} ml/bosh
                    </div>
                  </div>

                  {/* Yem sarfi (jon boshiga) */}
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Scale className="w-3 h-3 text-amber-400" />
                      <span>Yem (jon boshiga)</span>
                    </div>
                    <div className="font-mono font-bold text-amber-300 text-xs mt-0.5">
                      {report.feedPerBirdGram || ((report.feedConsumedKg * 1000) / (report.birdsCount || 1)).toFixed(1)} gr/bosh
                    </div>
                  </div>

                  {/* Umumiy yem */}
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-emerald-400" />
                      <span>Umumiy yem sarfi</span>
                    </div>
                    <div className="font-mono font-bold text-emerald-300 text-xs mt-0.5">
                      {report.feedConsumedKg.toLocaleString()} kg
                    </div>
                  </div>

                  {/* Zahiradagi qoldiq yem */}
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Warehouse className="w-3 h-3 text-purple-400" />
                      <span>Zahiradagi qoldiq yem</span>
                    </div>
                    <div className="font-mono font-bold text-purple-300 text-xs mt-0.5">
                      {report.feedRemainingKg ? `${report.feedRemainingKg.toLocaleString()} kg` : 'N/A'}
                    </div>
                  </div>

                  {/* Min va Max Harorat */}
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-orange-400" />
                      <span>Harorat (Min / Max)</span>
                    </div>
                    <div className="font-mono font-bold text-orange-300 text-xs mt-0.5">
                      {report.minTemperature && report.maxTemperature
                        ? `${report.minTemperature}°C / ${report.maxTemperature}°C`
                        : `${report.avgTemperature}°C (o'rtacha)`}
                    </div>
                  </div>

                  {/* Qabul qilingan yem miqdori */}
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Warehouse className="w-3 h-3 text-teal-400" />
                      <span>Yem omboridan qabul</span>
                    </div>
                    <div className="font-mono font-bold text-teal-300 text-xs mt-0.5">
                      {report.feedReceivedKg ? `${report.feedReceivedKg.toLocaleString()} kg` : '0 kg'}
                    </div>
                  </div>
                </div>

                {/* Berilgan dori vositasi */}
                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-1">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                    <Pill className="w-3.5 h-3.5 text-pink-400" />
                    <span>Berilgan dori vositasi:</span>
                  </div>
                  <p className="text-xs font-semibold text-pink-200 pl-4.5">
                    {report.medicationGiven || 'Dori berilmadi'}
                  </p>
                </div>

                {/* Footer notes & submittedBy */}
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Ma'sul: <strong className="text-slate-300">{report.submittedByName}</strong></span>
                  {report.eggsCollectedTotal > 0 && (
                    <span className="text-amber-300 font-mono font-bold">
                      🥚 {report.eggsCollectedTotal.toLocaleString()} dona
                    </span>
                  )}
                </div>

                {report.notes && (
                  <p className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                    "{report.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Evaluation Modal (1 to 5 Stars with Notes) */}
      {(evaluatingTaskId || evaluatingSanitationId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                  <Star className="w-5 h-5 fill-yellow-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {evaluatingSanitationId ? 'Tozalik Ishini Baholash' : 'Topshiriq Sifatini Baholash'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Bajarilgan ish sifatini 1 dan 5 yulduzgacha baholang va izoh qoldiring
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEvaluatingTaskId(null);
                  setEvaluatingSanitationId(null);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Task summary info */}
            {(() => {
              if (evaluatingTaskId) {
                const taskToEval = tasks.find((t) => t.id === evaluatingTaskId);
                if (!taskToEval) return null;
                return (
                  <div className="p-3 bg-slate-850 border border-slate-800 rounded-2xl space-y-1.5 text-xs">
                    <div className="font-bold text-white">{taskToEval.title}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                      <span className="text-blue-300 font-semibold">{taskToEval.assignedToName}</span>
                      <span>•</span>
                      <span>{taskToEval.building}</span>
                      {(taskToEval.dueTime || taskToEval.dueDate) && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 font-mono">Muddat: {formatTaskDeadline(taskToEval.dueDate, taskToEval.dueTime)}</span>
                        </>
                      )}
                    </div>
                    {taskToEval.description && (
                      <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-1">
                        {taskToEval.description}
                      </div>
                    )}
                  </div>
                );
              } else if (evaluatingSanitationId) {
                const stToEval = sanitationTasks.find((s) => s.id === evaluatingSanitationId);
                if (!stToEval) return null;
                return (
                  <div className="p-3 bg-slate-850 border border-teal-500/30 rounded-2xl space-y-1.5 text-xs">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{stToEval.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                        {stToEval.zone}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                      <span className="text-teal-300 font-semibold">{stToEval.cleanedByName || "Tozalik mas'uli"}</span>
                      {stToEval.disinfectantUsed && (
                        <>
                          <span>•</span>
                          <span>Vosita: {stToEval.disinfectantUsed}</span>
                        </>
                      )}
                      {stToEval.completedAt && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-mono">{stToEval.completedAt}</span>
                        </>
                      )}
                    </div>
                    {stToEval.notes && (
                      <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-1 italic">
                        "{stToEval.notes}"
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            <form onSubmit={handleEvaluateTask} className="space-y-4 text-xs">
              {/* Star Rating buttons */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Bajarilgan ishga baho (1 dan 5 yulduzgacha):
                </label>
                <div className="flex items-center justify-center gap-2 py-2.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEvalScore(star)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        evalScore >= star
                          ? 'text-yellow-400 scale-110 drop-shadow-md'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      <Star className={`w-7 h-7 sm:w-8 sm:h-8 ${evalScore >= star ? 'fill-yellow-400' : ''}`} />
                    </button>
                  ))}
                </div>
                <div className="text-center mt-1.5 text-xs font-bold text-yellow-400">
                  {evalScore === 5 && "5 / 5 - A'lo darajada bajarildi"}
                  {evalScore === 4 && "4 / 5 - Yaxshi, sifatli bajarildi"}
                  {evalScore === 3 && "3 / 5 - O'rtacha, qabul qilindi"}
                  {evalScore === 2 && "2 / 5 - Qoniqarli, kamchiliklar bor"}
                  {evalScore === 1 && "1 / 5 - Qoniqarsiz, qayta bajarilishi shart"}
                </div>
              </div>

              {/* Quick Suggestions Chips */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Tezkor baholash izohlari:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Sifatli va o'z vaqtida bajarildi",
                    "A'lo darajada sozlangan va tekshirilgan",
                    "Tozalik va dezinfeksiya me'yorida",
                    "Vaqtida to'liq yakunlandi",
                    "Kichik kamchiliklar bartaraf etildi",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEvalNote(preset)}
                      className={`px-2 py-1 rounded-lg text-[11px] transition-all border cursor-pointer ${
                        evalNote === preset
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 font-bold'
                          : 'bg-slate-850 text-slate-400 border-slate-700/80 hover:text-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note input */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Menejer izohi:
                </label>
                <input
                  type="text"
                  value={evalNote}
                  onChange={(e) => setEvalNote(e.target.value)}
                  placeholder="Masalan: Sifatli va o'z vaqtida bajarildi"
                  className="w-full px-3 py-2.5 bg-slate-850 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEvaluatingTaskId(null);
                    setEvaluatingSanitationId(null);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg shadow-yellow-500/30 transition-all active:scale-95"
                >
                  Bahoni Tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sanitation Photo Preview Modal */}
      {sanitationPreviewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="max-w-xl w-full bg-slate-900 border border-teal-500/40 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-sm">{sanitationPreviewPhoto.title}</h3>
                <span className="text-teal-400 text-xs">{sanitationPreviewPhoto.zone}</span>
              </div>
              <button
                type="button"
                onClick={() => setSanitationPreviewPhoto(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden max-h-[70vh] flex items-center justify-center bg-black">
              <img
                src={sanitationPreviewPhoto.url}
                alt={sanitationPreviewPhoto.title}
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Daily Factory Report Modal (YANGILANGAN: "Partiya raqami" olib tashlandi, to'liq ko'rsatkichlar ro'yxati) */}
      {showReportForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto my-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>Kunlik Sex Hisoboti Topshirish</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ish boshqaruvchi kunlik ko'rsatkichlari (suv, yem, nobudlar, harorat, dori)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowReportForm(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formSuccessMessage && (
              <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center gap-2 font-semibold animate-pulse">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{formSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleReportSubmit} className="space-y-5 text-xs">
              {/* 1. BINO RAQAMI VA UMUMIY PARRANDALAR SONI */}
              <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-400" />
                    <span>Bino raqami:</span>
                  </label>
                  <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    ✓ Partiya raqami olib tashlangan
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COMMON_BUILDINGS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        setReportBuilding(b);
                        setIsCustomBuilding(false);
                      }}
                      className={`px-3 py-2 rounded-xl font-bold text-xs transition-all text-center border cursor-pointer ${
                        !isCustomBuilding && reportBuilding === b
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                          : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCustomBuilding(true)}
                    className={`px-3 py-2 rounded-xl font-bold text-xs transition-all text-center border cursor-pointer ${
                      isCustomBuilding
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                        : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    + Boshqa bino
                  </button>
                </div>

                {isCustomBuilding && (
                  <div>
                    <input
                      type="text"
                      required
                      value={customBuildingInput}
                      onChange={(e) => setCustomBuildingInput(e.target.value)}
                      placeholder="Bino raqami yoki nomini kiriting (masalan: 6-Bino)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* UMUMIY PARRANDALAR SONI (Kiritilishi va avtomatik hisob) */}
                <div className="pt-3 border-t border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Umumiy parrandalar soni (bosh):</span>
                    </label>
                    <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                      <span>⚡ Jon boshiga yem avto-hisoblanadi</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      required
                      value={birdsCount}
                      onChange={(e) => handleBirdsCountChange(Number(e.target.value))}
                      placeholder="Masalan: 28500"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-emerald-500/40 focus:border-emerald-500 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 font-semibold text-xs">
                      bosh
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Sexdagi tovuqlar soni. Jon boshiga yem miqdori ({feedPerBirdGram} gr/bosh) ushbu son va umumiy kunlik yem ({feedConsumedKg.toLocaleString()} kg) asosida avtomatik hisoblanadi.
                  </p>
                </div>
              </div>

              {/* 2. NOBUDLAR SONI (IZOHI BILAN) */}
              <div className="bg-slate-850 border border-rose-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Nobudlar Soni (Izohi Bilan)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <NumberStepper
                      label="Nobudlar soni"
                      value={mortalityCount}
                      onChange={(val) => setMortalityCount(val)}
                      min={0}
                      max={2000}
                      step={1}
                      unit="dona"
                      quickDeltas={[-1, 1, 5, 10]}
                      warningThresholds={{ max: 50, message: "Nobudlar soni me'yordan ancha yuqori!" }}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">
                      Nobudlar izohi / sababi:
                    </label>
                    <input
                      type="text"
                      required
                      value={mortalityReason}
                      onChange={(e) => setMortalityReason(e.target.value)}
                      placeholder="Masalan: Issiq urishi, tabiiy nobudgarchilik, zaiflik"
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Quick suggestions for mortality reason */}
                <div>
                  <div className="text-[11px] text-slate-400 mb-1.5">Tezkor izoh tanlash:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_MORTALITY_REASONS.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setMortalityReason(reason)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] transition-all border cursor-pointer ${
                          mortalityReason === reason
                            ? 'bg-rose-500/20 text-rose-200 border-rose-500/40 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. KUNLIK TO'LDIRILADIGAN KO'RSATKICHLAR RO'YXATI */}
              <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    <span>Kunlik Ko'rsatkichlar Ro'yxati</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Sarf-xarajat va ombor harakati
                  </span>
                </div>

                {/* 3.1. Suv va Yem sarfi (jon boshiga) & Umumiy yem */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Umumiy kunlik yem */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Umumiy kunlik yem sarfi:</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        required
                        value={feedConsumedKg}
                        onChange={(e) => handleFeedKgChange(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                        kg
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Sexdagi jami yem iste'moli
                    </span>
                  </div>

                  {/* Yem sarfi (jon boshiga) - AVTO HISOBLANADI */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-amber-400" />
                        <span>Yem sarfi (jon boshiga):</span>
                      </label>
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                        ⚡ Avto-hisob
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        required
                        value={feedPerBirdGram}
                        onChange={(e) => handleFeedPerBirdChange(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-amber-500/60 rounded-xl text-amber-300 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                        gr/bosh
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-300/90 mt-1 block font-mono">
                      = {feedConsumedKg} kg / {birdsCount.toLocaleString()} bosh
                    </span>
                  </div>

                  {/* Suv sarfi (jon boshiga) */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Suv sarfi (jon boshiga):</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        required
                        value={waterPerBirdMl}
                        onChange={(e) => setWaterPerBirdMl(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                        ml/bosh
                      </span>
                    </div>
                    <span className="text-[10px] text-cyan-400 mt-1 block font-mono">
                      Jami: ~{Math.round((birdsCount * waterPerBirdMl) / 1000).toLocaleString()} litr
                    </span>
                  </div>
                </div>

                {/* 3.2. Zahiradagi qoldiq yem va Qabul qilib olingan yem miqdori (yem omboridan) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-purple-400" />
                      <span>Zahiradagi qoldiq yem (silos/bunker):</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        required
                        value={feedRemainingKg}
                        onChange={(e) => setFeedRemainingKg(Number(e.target.value))}
                        placeholder="Masalan: 4500"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                        kg
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-teal-400" />
                      <span>Qabul qilib olingan yem miqdori (yem omboridan):</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        required
                        value={feedReceivedKg}
                        onChange={(e) => setFeedReceivedKg(Number(e.target.value))}
                        placeholder="Masalan: 3500"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                        kg
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3.3. Minimal va Maksimal harorat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <NumberStepper
                    label="Minimal harorat"
                    value={minTemp}
                    onChange={(val) => setMinTemp(val)}
                    min={5}
                    max={45}
                    step={0.5}
                    unit="°C"
                    quickDeltas={[-1, -0.5, 0.5, 1]}
                    warningThresholds={{ min: 16, max: 28, message: "Harorat tovuqlar uchun noqulay diapazonda!" }}
                    icon={Thermometer}
                  />

                  <NumberStepper
                    label="Maksimal harorat"
                    value={maxTemp}
                    onChange={(val) => setMaxTemp(val)}
                    min={5}
                    max={45}
                    step={0.5}
                    unit="°C"
                    quickDeltas={[-1, -0.5, 0.5, 1]}
                    warningThresholds={{ min: 18, max: 29, message: "Harorat tovuqlar uchun noqulay diapazonda!" }}
                    icon={Thermometer}
                  />
                </div>

                {/* 3.4. Berilgan dori vositasi */}
                <div className="space-y-2">
                  <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-pink-400" />
                    <span>Berilgan dori vositasi:</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={medicationGiven}
                    onChange={(e) => setMedicationGiven(e.target.value)}
                    placeholder="Masalan: Chiktonik 1L / 1000L suv yoki Dori berilmadi"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />

                  {/* Preset medications */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COMMON_MEDICATIONS.map((med) => (
                      <button
                        key={med}
                        type="button"
                        onClick={() => setMedicationGiven(med)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] transition-all border ${
                          medicationGiven === med
                            ? 'bg-pink-500/20 text-pink-200 border-pink-500/40 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {med}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. TUXUM YIG'IMI (Sex Mahsuloti Bo'limi) */}
              <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowEggSection(!showEggSection)}
                    className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider hover:text-amber-300 cursor-pointer"
                  >
                    <span>🥚 Tuxum Yig'imi (Sex Mahsuloti)</span>
                    {showEggSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <span className="text-[11px] text-slate-400">
                    {showEggSection ? 'Yig\'ish' : 'Kengaytirish'}
                  </span>
                </div>

                {showEggSection && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Jami terilgan tuxum (dona):
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={eggsCollected}
                        onChange={(e) => setEggsCollected(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-amber-300"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Oliy nav:</label>
                        <input
                          type="number"
                          min={0}
                          value={premiumEggs}
                          onChange={(e) => setPremiumEggs(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-emerald-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">1-nav:</label>
                        <input
                          type="number"
                          min={0}
                          value={firstEggs}
                          onChange={(e) => setFirstEggs(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-blue-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">2-nav:</label>
                        <input
                          type="number"
                          min={0}
                          value={secondEggs}
                          onChange={(e) => setSecondEggs(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-yellow-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Singan / Brak:</label>
                        <input
                          type="number"
                          min={0}
                          value={damagedEggs}
                          onChange={(e) => setDamagedEggs(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-rose-300 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. UMUMIY XULOSA / IZOH */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Umumiy xulosa / Sex holati bo'yicha qo'shimcha izoh:
                </label>
                <textarea
                  rows={2}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Sex mikroiqlimi, liniyalar holati va boshqa muhim eslatmalar..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-bold transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Hisobotni Topshirish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
