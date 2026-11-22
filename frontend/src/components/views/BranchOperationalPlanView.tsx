import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BranchId,
  EnterpriseBranch,
  BranchDailyPlan,
  BranchDailyTask,
  BranchOperationalChange,
  OperationalPriority,
  OperationalTaskStatus,
  OperationalChangeCategory,
  Role,
} from '../../types';
import { ROLE_LABELS } from '../../data/mockData';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Users,
  Plus,
  Trash2,
  Edit3,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Sliders,
  Wheat,
  Thermometer,
  Activity,
  Wrench,
  Droplets,
  Syringe,
  Printer,
  ChevronRight,
  Check,
  X,
  Phone,
  UserCheck,
  Calendar,
  Layers,
  Info
} from 'lucide-react';

const PRIORITY_CONFIG: Record<OperationalPriority, { label: string; badge: string; border: string }> = {
  urgent: {
    label: 'Shoshilinch',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    border: 'border-l-rose-500',
  },
  shoshilinch: {
    label: 'Shoshilinch',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    border: 'border-l-rose-500',
  },
  yuqori: {
    label: 'Yuqori',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    border: 'border-l-amber-500',
  },
  orta: {
    label: "O'rta",
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    border: 'border-l-blue-500',
  },
  oddiy: {
    label: 'Oddiy',
    badge: 'bg-slate-700 text-slate-300 border-slate-600',
    border: 'border-l-slate-500',
  },
};

const STATUS_CONFIG: Record<OperationalTaskStatus, { label: string; badge: string; icon: any }> = {
  kutilmoqda: {
    label: 'Kutilmoqda',
    badge: 'bg-slate-800 text-slate-400 border-slate-700',
    icon: Clock,
  },
  jarayonda: {
    label: 'Jarayonda',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    icon: Activity,
  },
  bajarildi: {
    label: 'Bajarildi',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: CheckCircle2,
  },
  kechiktirildi: {
    label: 'Kechiktirildi',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    icon: AlertTriangle,
  },
};

const CHANGE_CATEGORIES: Record<
  OperationalChangeCategory,
  { label: string; icon: any; color: string; badge: string }
> = {
  ratsion: {
    label: 'Yem ratsioni',
    icon: Wheat,
    color: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  harorat: {
    label: 'Harorat / Ventilyatsiya',
    icon: Thermometer,
    color: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  partiya: {
    label: 'Qushlar partiyasi',
    icon: Users,
    color: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  profilaktika: {
    label: 'Texnik ta\'mirlash',
    icon: Wrench,
    color: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
  suv_ventilyatsiya: {
    label: 'Suv va sanitariya',
    icon: Droplets,
    color: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  vaksina: {
    label: 'Vaksina / Dori',
    icon: Syringe,
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  boshqa: {
    label: 'Boshqa o\'zgarish',
    icon: Sliders,
    color: 'text-slate-400',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
  },
};

export const BranchOperationalPlanView: React.FC = () => {
  const {
    currentUser,
    branches,
    addBranch,
    branchOperationalPlans,
    updateBranchPlanGoal,
    addBranchDailyTask,
    updateBranchDailyTaskStatus,
    deleteBranchDailyTask,
    addBranchOperationalChange,
    users,
  } = useApp();

  // Selected Branch (Default: User's own branch if assigned, otherwise first branch)
  const [selectedBranchId, setSelectedBranchId] = useState<BranchId>(() => {
    if (currentUser.branchId && branches.some((b) => b.id === currentUser.branchId)) {
      return currentUser.branchId;
    }
    return 'uychi_bosh';
  });

  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabSection, setActiveTabSection] = useState<'tasks' | 'changes' | 'comparison'>('tasks');

  // Top Bar Manual Branch selection/entry
  const [isManualBranchMode, setIsManualBranchMode] = useState(false);
  const [manualBranchBarInput, setManualBranchBarInput] = useState('');

  // Modals
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddChangeOpen, setIsAddChangeOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);

  // Form: Add Task
  const [targetBranchForTask, setTargetBranchForTask] = useState<BranchId>(selectedBranchId);
  const [isTaskManualBranch, setIsTaskManualBranch] = useState(false);
  const [taskManualBranchName, setTaskManualBranchName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTimeSlot, setTaskTimeSlot] = useState('08:00 - 09:30');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskBuilding, setTaskBuilding] = useState('1-korpus');
  const [taskResponsible, setTaskResponsible] = useState('');
  const [taskPriority, setTaskPriority] = useState<OperationalPriority>('yuqori');

  // Form: Add Change Log
  const [targetBranchForChange, setTargetBranchForChange] = useState<BranchId>(selectedBranchId);
  const [isChangeManualBranch, setIsChangeManualBranch] = useState(false);
  const [changeManualBranchName, setChangeManualBranchName] = useState('');
  const [changeCategory, setChangeCategory] = useState<OperationalChangeCategory>('ratsion');
  const [changeTitle, setChangeTitle] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const [changeImpact, setChangeImpact] = useState<'muhim' | 'ogohlantirish' | 'oddiy'>('muhim');
  const [changeStatus, setChangeStatus] = useState<'joriy_etildi' | 'rejalashtirilgan' | 'kuzatuvda'>('joriy_etildi');

  // Form: Edit Goal
  const [editGoalText, setEditGoalText] = useState('');
  const [editShiftStatus, setEditShiftStatus] = useState<'kunduzgi' | 'tungi' | 'yakunlangan'>('kunduzgi');
  const [editNotesText, setEditNotesText] = useState('');

  // Selected branch data
  const currentBranch = useMemo(
    () => branches.find((b) => b.id === selectedBranchId) || branches[0] || {
      id: selectedBranchId,
      name: typeof selectedBranchId === 'string' ? selectedBranchId : 'Filial',
      code: 'FIL',
      location: 'Namangan viloyati',
      buildingsCount: 3,
      capacityBirds: 50000,
      phone: '+998 69 541 00 00',
      managerName: currentUser.fullName,
    },
    [branches, selectedBranchId, currentUser.fullName]
  );

  const currentPlan = useMemo(() => {
    const found = branchOperationalPlans.find((p) => p.branchId === selectedBranchId);
    if (found) return found;
    // Fallback if not found yet
    return {
      id: `plan-${selectedBranchId}`,
      branchId: selectedBranchId,
      branchName: currentBranch?.name || 'Filial',
      date: new Date().toISOString().slice(0, 10),
      leaderName: currentBranch?.managerName || currentUser.fullName,
      leaderRole: 'Ish Boshqaruvchi',
      leaderPhone: currentBranch?.phone || '',
      dailyGoal: 'Kunlik ishlab chiqarish va parvarish rejasini bajarish',
      shiftStatus: 'kunduzgi' as const,
      weatherOrCondition: "22°C, Me'yorda",
      tasks: [],
      changes: [],
      lastUpdated: '08:00',
    };
  }, [branchOperationalPlans, selectedBranchId, currentBranch, currentUser.fullName]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return currentPlan.tasks.filter((t) => {
      const matchesStatus = taskStatusFilter === 'all' || t.status === taskStatusFilter;
      const matchesQuery =
        !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.responsiblePerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.buildingOrSector && t.buildingOrSector.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesQuery;
    });
  }, [currentPlan.tasks, taskStatusFilter, searchQuery]);

  // Task Stats for current branch
  const totalTasks = currentPlan.tasks.length;
  const completedTasks = currentPlan.tasks.filter((t) => t.status === 'bajarildi').length;
  const inProgressTasks = currentPlan.tasks.filter((t) => t.status === 'jarayonda').length;
  const pendingTasks = currentPlan.tasks.filter((t) => t.status === 'kutilmoqda').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Branch employees for responsible person auto-complete
  const branchEmployees = useMemo(
    () => users.filter((u) => u.branchId === selectedBranchId || !u.branchId),
    [users, selectedBranchId]
  );

  const canEditCurrentBranch =
    currentUser.role === 'direktor' ||
    currentUser.role === 'ish_boshqaruvchi' ||
    currentUser.role === 'kadrlar' ||
    currentUser.role === 'veterinar' ||
    currentUser.role === 'statistikachi' ||
    currentUser.branchId === selectedBranchId ||
    !currentUser.branchId;

  // Top Bar: Select or Add manual branch
  const handleSelectOrAddManualBranch = (branchName: string) => {
    const cleanName = branchName.trim();
    if (!cleanName) return;

    const existing = branches.find(
      (b) => b.name.toLowerCase() === cleanName.toLowerCase() || b.code.toLowerCase() === cleanName.toLowerCase()
    );

    if (existing) {
      setSelectedBranchId(existing.id);
      setIsManualBranchMode(false);
      setManualBranchBarInput('');
      return;
    }

    const words = cleanName.split(/\s+/);
    const code =
      words.length >= 2
        ? (words[0].slice(0, 2) + words[1].slice(0, 1)).toUpperCase()
        : cleanName.slice(0, 3).toUpperCase();

    const created = addBranch({
      name: cleanName,
      code: code || 'FIL',
      location: 'Namangan viloyati, Yangi filial',
      buildingsCount: 3,
      capacityBirds: 50000,
      phone: '+998 69 541 22 00',
      managerName: currentUser.fullName,
    });

    setSelectedBranchId(created.id);
    setIsManualBranchMode(false);
    setManualBranchBarInput('');
  };

  // Handlers
  const handleOpenEditGoal = () => {
    setEditGoalText(currentPlan.dailyGoal);
    setEditShiftStatus(currentPlan.shiftStatus);
    setEditNotesText(currentPlan.notes || '');
    setIsEditGoalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGoalText.trim()) return;
    updateBranchPlanGoal(selectedBranchId, editGoalText.trim(), editShiftStatus, editNotesText.trim());
    setIsEditGoalOpen(false);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    let destinationBranchId = targetBranchForTask;

    if (isTaskManualBranch && taskManualBranchName.trim()) {
      const cleanName = taskManualBranchName.trim();
      const existing = branches.find(
        (b) => b.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (existing) {
        destinationBranchId = existing.id;
      } else {
        const words = cleanName.split(/\s+/);
        const code =
          words.length >= 2
            ? (words[0].slice(0, 2) + words[1].slice(0, 1)).toUpperCase()
            : cleanName.slice(0, 3).toUpperCase();
        const created = addBranch({
          name: cleanName,
          code: code || 'FIL',
          location: 'Namangan viloyati',
          buildingsCount: 2,
          capacityBirds: 40000,
          phone: '+998 69 541 00 00',
          managerName: currentUser.fullName,
        });
        destinationBranchId = created.id;
      }
    }

    addBranchDailyTask(destinationBranchId, {
      title: taskTitle.trim(),
      timeSlot: taskTimeSlot.trim() || '08:00 - 09:00',
      description: taskDescription.trim() || undefined,
      buildingOrSector: taskBuilding.trim() || 'Bosh sex',
      responsiblePerson: taskResponsible.trim() || currentUser.fullName,
      priority: taskPriority,
      status: 'kutilmoqda',
    });

    setSelectedBranchId(destinationBranchId);

    setTaskTitle('');
    setTaskDescription('');
    setIsTaskManualBranch(false);
    setTaskManualBranchName('');
    setIsAddTaskOpen(false);
  };

  const handleCreateChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeTitle.trim()) return;

    let destinationBranchId = targetBranchForChange;

    if (isChangeManualBranch && changeManualBranchName.trim()) {
      const cleanName = changeManualBranchName.trim();
      const existing = branches.find(
        (b) => b.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (existing) {
        destinationBranchId = existing.id;
      } else {
        const words = cleanName.split(/\s+/);
        const code =
          words.length >= 2
            ? (words[0].slice(0, 2) + words[1].slice(0, 1)).toUpperCase()
            : cleanName.slice(0, 3).toUpperCase();
        const created = addBranch({
          name: cleanName,
          code: code || 'FIL',
          location: 'Namangan viloyati',
          buildingsCount: 2,
          capacityBirds: 40000,
          phone: '+998 69 541 00 00',
          managerName: currentUser.fullName,
        });
        destinationBranchId = created.id;
      }
    }

    addBranchOperationalChange(destinationBranchId, {
      category: changeCategory,
      title: changeTitle.trim(),
      description: changeDescription.trim(),
      impactLevel: changeImpact,
      reportedBy: `${currentUser.fullName} (${ROLE_LABELS[currentUser.role]?.short || currentUser.role})`,
      appliedDate: new Date().toISOString().slice(0, 10),
      status: changeStatus,
    });

    setSelectedBranchId(destinationBranchId);

    setChangeTitle('');
    setChangeDescription('');
    setIsChangeManualBranch(false);
    setChangeManualBranchName('');
    setIsAddChangeOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Kunlik Operativ Boshqaruv</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                Sana: {new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Kundalik Operativ Reja & O'zgarishlar Nazorati</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Har bir filial rahbari va mutaxassislari uchun kunlik vazifalar jadvali, texnologik o'zgarishlar (ratsion, harorat, vaksina, profilaktika) va reja ijrosi monitoringi.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => window.print()}
              title="Operativ rejani chop etish"
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Chop etish</span>
            </button>

            {canEditCurrentBranch && (
              <>
                <button
                  onClick={() => {
                    setTargetBranchForChange(selectedBranchId);
                    setIsChangeManualBranch(false);
                    setChangeManualBranchName('');
                    setIsAddChangeOpen(true);
                  }}
                  className="px-3.5 py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>+ O'zgarish Qayd Etish</span>
                </button>

                <button
                  onClick={() => {
                    setTargetBranchForTask(selectedBranchId);
                    setIsTaskManualBranch(false);
                    setTaskManualBranchName('');
                    setIsAddTaskOpen(true);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Kunlik Ish Qo'shish</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Enterprise Branches Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>«Uychi Parranda» Filialini Tanlang ({branches.length} ta filial):</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-amber-400 font-bold cursor-pointer select-none bg-slate-800/90 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-all">
              <input
                type="checkbox"
                checked={isManualBranchMode}
                onChange={(e) => setIsManualBranchMode(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
              />
              <span>Qo'lda filial kiritish</span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Tanlangan filial operativ rejasi pastda aks etadi
            </span>
          </div>
        </div>

        {/* Manual Branch Input Bar */}
        {isManualBranchMode && (
          <div className="p-3 mb-3 bg-slate-800/80 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-center gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 w-full flex-1">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <input
                type="text"
                value={manualBranchBarInput}
                onChange={(e) => setManualBranchBarInput(e.target.value)}
                placeholder="Filial nomini yozing (masalan: Yangiqo'rg'on filiali yoki 2-Sex)..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSelectOrAddManualBranch(manualBranchBarInput);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSelectOrAddManualBranch(manualBranchBarInput)}
                disabled={!manualBranchBarInput.trim()}
                className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Rejaga Tanlash / Qo'shish</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsManualBranchMode(false);
                  setManualBranchBarInput('');
                }}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-650 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {branches.map((b) => {
            const isSelected = b.id === selectedBranchId;
            const bPlan = branchOperationalPlans.find((p) => p.branchId === b.id);
            const bTotal = bPlan?.tasks.length || 0;
            const bDone = bPlan?.tasks.filter((t) => t.status === 'bajarildi').length || 0;
            const bPct = bTotal > 0 ? Math.round((bDone / bTotal) * 100) : 0;
            const isUserBranch = currentUser.branchId === b.id;

            return (
              <button
                key={b.id}
                onClick={() => setSelectedBranchId(b.id)}
                className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-slate-900 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-slate-850 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950/60 text-amber-400 border border-slate-750">
                      {b.code}
                    </span>
                    {isUserBranch && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        Sizning filial
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-xs line-clamp-1 text-white">{b.name}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{b.managerName}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Reja ijrosi:</span>
                  <span
                    className={`font-black ${
                      bPct >= 70
                        ? 'text-emerald-400'
                        : bPct >= 40
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {bDone}/{bTotal} ({bPct}%)
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Selected Branch Detail Passport & Goal Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        {/* Branch Leader & Stats Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">{currentBranch.name}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentBranch.code}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {currentPlan.shiftStatus === 'kunduzgi'
                    ? 'Kunduzgi smena'
                    : currentPlan.shiftStatus === 'tungi'
                    ? 'Tungi smena'
                    : 'Yakunlangan'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Filial rahbari: <strong>{currentPlan.leaderName}</strong></span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{currentPlan.leaderPhone || currentBranch.phone}</span>
                </span>
                <span>•</span>
                <span className="text-slate-400">
                  Binolar: <strong>{currentBranch.buildingsCount} ta</strong> ({((currentBranch.capacityBirds || 0) / 1000).toFixed(0)}k qush sig'imi)
                </span>
              </div>
            </div>
          </div>

          {/* KPI Mini Stats */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 bg-slate-800/80 rounded-2xl border border-slate-750 text-center min-w-[90px]">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Jami Ishlar</span>
              <span className="text-base font-black text-white">{totalTasks} ta</span>
            </div>
            <div className="px-3.5 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 text-center min-w-[90px]">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">Bajarildi</span>
              <span className="text-base font-black text-emerald-300">{completedTasks} ta</span>
            </div>
            <div className="px-3.5 py-2 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-center min-w-[90px]">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">Reja Ijrosi</span>
              <span className="text-base font-black text-amber-300">{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Daily Primary Goal Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/15 via-slate-850 to-slate-850 border border-amber-500/30 rounded-2xl relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bugungi Filial Bosh Maqsadi & Operativ Shiori:</span>
              </span>
              <p className="text-sm sm:text-base font-bold text-white leading-snug">
                "{currentPlan.dailyGoal}"
              </p>
              {currentPlan.notes && (
                <p className="text-xs text-slate-400 italic">
                  Eslatma: {currentPlan.notes}
                </p>
              )}
            </div>

            {canEditCurrentBranch && (
              <button
                onClick={handleOpenEditGoal}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-center transition-all cursor-pointer shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Maqsadni Tahrirlash</span>
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Kundalik reja bajarilishi progressi:</span>
              <span className="font-bold text-amber-300">{completedTasks} / {totalTasks} ish yakunlandi ({progressPercent}%)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Section Navigation Tabs: [1. Kunlik Ishlar], [2. O'zgarishlar Qaydi], [3. 5 Filial Taqqoslash] */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTabSection('tasks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTabSection === 'tasks'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Kunlik Bajarilishi Kerak Bo'lgan Ishlar</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            activeTabSection === 'tasks' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
          }`}>
            {currentPlan.tasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSection('changes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTabSection === 'changes'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Filialdagi Texnologik O'zgarishlar</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            activeTabSection === 'changes' ? 'bg-slate-950 text-cyan-400' : 'bg-slate-800 text-slate-300'
          }`}>
            {currentPlan.changes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSection('comparison')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTabSection === 'comparison'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Barcha Filiallar Qiyosiy Ko'rinishi ({branches.length} ta)</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: KUNLIK BAJARILISHI KERAK BO'LGAN ISHLAR RO'YXATI */}
      {/* ============================================================ */}
      {activeTabSection === 'tasks' && (
        <div className="space-y-4">
          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: 'Barchasi', count: totalTasks },
                { id: 'kutilmoqda', label: 'Kutilmoqda', count: pendingTasks },
                { id: 'jarayonda', label: 'Jarayonda', count: inProgressTasks },
                { id: 'bajarildi', label: 'Bajarildi', count: completedTasks },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTaskStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    taskStatusFilter === f.id
                      ? 'bg-slate-800 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className="text-[10px] px-1.5 rounded bg-slate-900 text-slate-400">
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Vazifa yoki xodim qidirish..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <ClipboardList className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Hech qanday kunlik vazifa topilmadi</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Ushbu filial uchun yuqoridagi «+ Kunlik Ish Qo'shish» tugmasi orqali rejalashtirilgan yangi operativ ishni kiriting.
              </p>
              {canEditCurrentBranch && (
                <button
                  onClick={() => {
                    setTargetBranchForTask(selectedBranchId);
                    setIsTaskManualBranch(false);
                    setTaskManualBranchName('');
                    setIsAddTaskOpen(true);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Vazifa qo'shish</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const priorityInfo = PRIORITY_CONFIG[task.priority];
                const statusInfo = STATUS_CONFIG[task.status];
                const StatusIcon = statusInfo.icon;
                const isDone = task.status === 'bajarildi';

                return (
                  <div
                    key={task.id}
                    className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 transition-all hover:border-slate-700 shadow-md border-l-4 ${priorityInfo.border} ${
                      isDone ? 'opacity-85 bg-slate-900/60' : ''
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Task Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          {/* Time badge */}
                          <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-amber-300 border border-slate-700 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{task.timeSlot}</span>
                          </span>

                          {/* Building */}
                          {task.buildingOrSector && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                              {task.buildingOrSector}
                            </span>
                          )}

                          {/* Priority */}
                          <span className={`px-2 py-0.5 rounded-lg font-bold border ${priorityInfo.badge}`}>
                            {priorityInfo.label}
                          </span>

                          {/* Current Status Badge */}
                          <span className={`px-2 py-0.5 rounded-lg font-bold border flex items-center gap-1 ${statusInfo.badge}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{statusInfo.label}</span>
                          </span>
                        </div>

                        <div>
                          <h4 className={`text-sm sm:text-base font-bold text-white ${isDone ? 'line-through text-slate-300' : ''}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Responsible person and completion note */}
                        <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1">
                          <span className="flex items-center gap-1.5 text-amber-300/90 font-medium">
                            <Users className="w-3.5 h-3.5 text-amber-400" />
                            <span>Mas'ul: {task.responsiblePerson}</span>
                          </span>

                          {task.completedAt && (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{task.completedAt} da yakunlandi ({task.completionNote || "Bajarildi"})</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Status Toggles & Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                        {/* Status switcher buttons */}
                        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 gap-1 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => updateBranchDailyTaskStatus(selectedBranchId, task.id, 'kutilmoqda')}
                            title="Kutilmoqda holatiga o'tkazish"
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              task.status === 'kutilmoqda'
                                ? 'bg-slate-700 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Kutilmoqda
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBranchDailyTaskStatus(selectedBranchId, task.id, 'jarayonda')}
                            title="Jarayonda holatiga o'tkazish"
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              task.status === 'jarayonda'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Jarayonda
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBranchDailyTaskStatus(selectedBranchId, task.id, 'bajarildi')}
                            title="Bajarildi deb belgilash"
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                              task.status === 'bajarildi'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-emerald-400'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>Bajarildi</span>
                          </button>
                        </div>

                        {canEditCurrentBranch && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`"${task.title}" vazifasini o'chirmoqchimisiz?`)) {
                                deleteBranchDailyTask(selectedBranchId, task.id);
                              }
                            }}
                            title="Vazifani o'chirish"
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 2: FILIALDAGI TEXNOLOGIK VA OPERATIV O'ZGARISHLAR     */}
      {/* ============================================================ */}
      {activeTabSection === 'changes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl flex-wrap gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>{currentBranch.name}: Bugungi Texnologik O'zgarishlar Qaydi</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ratsiondagi o'zgarishlar, harorat/ventilyatsiya tartibi, qushlar harakati, ta'mirlash va veterinariya tadbirlari
              </p>
            </div>

            {canEditCurrentBranch && (
              <button
                onClick={() => setIsAddChangeOpen(true)}
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi O'zgarish Kiritish</span>
              </button>
            )}
          </div>

          {currentPlan.changes.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <Sliders className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Bugun operativ o'zgarishlar kiritilmagan</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Filialda texnologik parametrlar, ozuqa tarkibi yoki bino sharoitlarida o'zgarish bo'lsa, yangi qayd qoldiring.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPlan.changes.map((ch) => {
                const cat = CHANGE_CATEGORIES[ch.category] || CHANGE_CATEGORIES.boshqa;
                const CatIcon = cat.icon;

                return (
                  <div
                    key={ch.id}
                    className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-all shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${cat.badge}`}>
                        <CatIcon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-750">
                          {ch.time}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            ch.impactLevel === 'muhim'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : ch.impactLevel === 'ogohlantirish'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {ch.impactLevel}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white">{ch.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-850 p-3 rounded-xl border border-slate-800">
                        {ch.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>Xabar berdi: <strong className="text-slate-300">{ch.reportedBy}</strong></span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-medium">
                        {ch.status === 'joriy_etildi' ? 'Joriy etildi' : ch.status === 'rejalashtirilgan' ? 'Rejalashtirilgan' : 'Kuzatuvda'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 3: BARCHA FILIALLARNING QIYOSIY REJA KO'RINISHI       */}
      {/* ============================================================ */}
      {activeTabSection === 'comparison' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>«Uychi Parranda» Barcha Filiallar Operativ Rejalari Solishtirmasi ({branches.length} ta)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rahbariyat va Bosh direktor uchun har bir filialning bugungi asosiy maqsadi, ijro darajasi va smena holati
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((b) => {
              const bPlan = branchOperationalPlans.find((p) => p.branchId === b.id);
              const bTasks = bPlan?.tasks || [];
              const total = bTasks.length;
              const done = bTasks.filter((t) => t.status === 'bajarildi').length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const isCurrent = b.id === selectedBranchId;

              return (
                <div
                  key={b.id}
                  className={`p-5 rounded-2xl bg-slate-900 border transition-all shadow-xl flex flex-col justify-between ${
                    isCurrent ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                        {b.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          pct >= 70
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : pct >= 40
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {done}/{total} bajarildi ({pct}%)
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">{b.name}</h4>
                      <p className="text-xs text-slate-400">
                        Rahbar: <strong className="text-slate-300">{bPlan?.leaderName || b.managerName}</strong>
                      </p>
                    </div>

                    <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-xs">
                      <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">
                        Bugungi Maqsad:
                      </span>
                      <p className="text-slate-300 font-medium line-clamp-2">
                        "{bPlan?.dailyGoal || 'Operativ reja belgilanmoqda'}"
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      O'zgarishlar: <strong>{bPlan?.changes.length || 0} ta</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBranchId(b.id);
                        setActiveTabSection('tasks');
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Boshqarish</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: ADD DAILY TASK                                      */}
      {/* ============================================================ */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Yangi Kunlik Vazifa Qo'shish</h3>
                  <p className="text-xs text-slate-400">{currentBranch.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTaskOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              {/* Filial Tanlash */}
              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Filialni Tanlang:</span>
                  </span>
                  <label className="flex items-center gap-1.5 text-[10px] text-amber-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTaskManualBranch}
                      onChange={(e) => setIsTaskManualBranch(e.target.checked)}
                    />
                    <span>Qo'lda kiritish</span>
                  </label>
                </label>
                {isTaskManualBranch ? (
                  <input
                    type="text"
                    required
                    value={taskManualBranchName}
                    onChange={(e) => setTaskManualBranchName(e.target.value)}
                    placeholder="Filial nomini yozing..."
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-amber-500/40 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                ) : (
                  <select
                    value={targetBranchForTask}
                    onChange={(e) => setTargetBranchForTask(e.target.value as BranchId)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  1. Vazifa Nomi / Bajariladigan ish:
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Masalan: 2-korpus ozuqa bunkerlarini to'ldirish va tarqatish"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs sm:text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    2. Vaqt oralig'i:
                  </label>
                  <input
                    type="text"
                    required
                    value={taskTimeSlot}
                    onChange={(e) => setTaskTimeSlot(e.target.value)}
                    placeholder="Masalan: 08:00 - 09:30"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    3. Bino / Sex / Hudud:
                  </label>
                  <input
                    type="text"
                    value={taskBuilding}
                    onChange={(e) => setTaskBuilding(e.target.value)}
                    placeholder="Masalan: 1-korpus yoki Yem ombori"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    4. Mas'ul xodim:
                  </label>
                  <input
                    type="text"
                    required
                    value={taskResponsible}
                    onChange={(e) => setTaskResponsible(e.target.value)}
                    placeholder="Xodim ismi va lavozimi"
                    list="branch-workers-list"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                  <datalist id="branch-workers-list">
                    {branchEmployees.map((e) => (
                      <option key={e.id} value={`${e.fullName} (${ROLE_LABELS[e.role]?.short || e.role})`} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    5. Ustuvorlik darajasi:
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as OperationalPriority)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="urgent">🚨 Shoshilinch</option>
                    <option value="yuqori">⭐ Yuqori</option>
                    <option value="orta">🔹 O'rta</option>
                    <option value="oddiy">⚪ Oddiy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  6. Batafsil tafsilot / Ko'rsatmalar:
                </label>
                <textarea
                  rows={2}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Ishni bajarish bo'yicha maxsus talablar yoki ehtiyot choralari..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Rejaga Kiritish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: ADD OPERATIONAL CHANGE LOG                          */}
      {/* ============================================================ */}
      {isAddChangeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Texnologik O'zgarish Qayd Etish</h3>
                  <p className="text-xs text-slate-400">{currentBranch.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddChangeOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChange} className="space-y-3.5 text-xs">
              {/* Filial Tanlash */}
              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Filialni Tanlang:</span>
                  </span>
                  <label className="flex items-center gap-1.5 text-[10px] text-cyan-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChangeManualBranch}
                      onChange={(e) => setIsChangeManualBranch(e.target.checked)}
                    />
                    <span>Qo'lda kiritish</span>
                  </label>
                </label>
                {isChangeManualBranch ? (
                  <input
                    type="text"
                    required
                    value={changeManualBranchName}
                    onChange={(e) => setChangeManualBranchName(e.target.value)}
                    placeholder="Filial nomini yozing..."
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-cyan-500/40 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                ) : (
                  <select
                    value={targetBranchForChange}
                    onChange={(e) => setTargetBranchForChange(e.target.value as BranchId)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    1. O'zgarish sohasi:
                  </label>
                  <select
                    value={changeCategory}
                    onChange={(e) => setChangeCategory(e.target.value as OperationalChangeCategory)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="ratsion">🌾 Yem ratsioni o'zgarishi</option>
                    <option value="harorat">🌡️ Harorat / Ventilyatsiya rejimi</option>
                    <option value="partiya">🐣 Qushlar partiyasi harakati</option>
                    <option value="profilaktika">⚙️ Texnik profilaktika / ta'mirlash</option>
                    <option value="suv_ventilyatsiya">💧 Suv va sanitariya</option>
                    <option value="vaksina">💉 Vaksina / Dori berish</option>
                    <option value="boshqa">⚪ Boshqa operativ qayd</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    2. Ta'sir darajasi:
                  </label>
                  <select
                    value={changeImpact}
                    onChange={(e) => setChangeImpact(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="muhim">🔴 Muhim (Yetakchi o'zgarish)</option>
                    <option value="ogohlantirish">🟡 Ogohlantirish / Nazorat</option>
                    <option value="oddiy">🟢 Oddiy texnologik qayd</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  3. O'zgarish qisqacha mazmuni:
                </label>
                <input
                  type="text"
                  required
                  value={changeTitle}
                  onChange={(e) => setChangeTitle(e.target.value)}
                  placeholder="Masalan: 1-korpus ratsioniga oqsil va premiks qo'shildi"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  4. Batafsil tavsif va parametrlar:
                </label>
                <textarea
                  rows={3}
                  required
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  placeholder="Qanday sabab bilan amalga oshirildi, qaysi me'yorlar o'zgardi, kim ko'rsatma berdi..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  5. Amalga oshirish holati:
                </label>
                <select
                  value={changeStatus}
                  onChange={(e) => setChangeStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="joriy_etildi">✅ Amalda joriy etildi</option>
                  <option value="rejalashtirilgan">⏳ Rejalashtirilgan (Kutilmoqda)</option>
                  <option value="kuzatuvda">🔍 Sinov / Kuzatuv ostida</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddChangeOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Qayd Etish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: EDIT DAILY GOAL & SHIFT STATUS                      */}
      {/* ============================================================ */}
      {isEditGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Filial Bosh Maqsadini Tahrirlash</h3>
                  <p className="text-xs text-slate-400">{currentBranch.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditGoalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  1. Bugungi Filial Bosh Maqsadi:
                </label>
                <textarea
                  rows={3}
                  required
                  value={editGoalText}
                  onChange={(e) => setEditGoalText(e.target.value)}
                  placeholder="Bugun filialda amalga oshiriladigan eng asosiy ko'rsatkich..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  2. Smena holati:
                </label>
                <select
                  value={editShiftStatus}
                  onChange={(e) => setEditShiftStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="kunduzgi">☀️ Kunduzgi smena (07:00 - 19:00)</option>
                  <option value="tungi">🌙 Tungi smena (19:00 - 07:00)</option>
                  <option value="yakunlangan">🏁 Smena yakunlangan</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  3. Qo'shimcha tezkor eslatma (ixtiyoriy):
                </label>
                <input
                  type="text"
                  value={editNotesText}
                  onChange={(e) => setEditNotesText(e.target.value)}
                  placeholder="Masalan: Soat 17:00 da tezkor yig'ilish o'tkaziladi"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditGoalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
