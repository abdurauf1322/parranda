import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/mockData';
import { Role } from '../../types';
import { backupDatabase } from '../../utils/backup';
import {
  Crown,
  Egg,
  TrendingUp,
  Users,
  Zap,
  Package,
  Plus,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Camera,
  FileText,
  Star,
  Clock,
  Sparkles,
  Database
} from 'lucide-react';
import {
  isTaskOverdue,
  formatTaskDeadline,
  getDefaultDueDateTime,
  getTodayDateString,
  getTomorrowDateString,
} from '../../utils/taskUtils';

export const DirectorDashboard: React.FC = () => {
  const {
    factoryReports,
    attendanceRecords,
    photoReports,
    tasks,
    createTask,
    electricityLog,
    diagnoses,
    verifyPhotoReport,
    users,
    farmCurrentTime
  } = useApp();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [assignedToRole, setAssignedToRole] = useState<Role>('ish_boshqaruvchi');
  const [assignedToName, setAssignedToName] = useState('Rahimov Javohir (Farm Manager)');
  const [taskPriority, setTaskPriority] = useState<'yuqori' | 'orta' | 'oddiy'>('yuqori');
  const [taskBuilding, setTaskBuilding] = useState('Boshqaruv');
  const [taskDueDate, setTaskDueDate] = useState(() => getDefaultDueDateTime().dueDate);
  const [taskDueTime, setTaskDueTime] = useState(() => getDefaultDueDateTime().dueTime);

  // Aggregated metrics
  const totalEggsToday = factoryReports
    .filter((r) => r.date === '2026-10-01')
    .reduce((sum, r) => sum + r.eggsCollectedTotal, 0);

  const totalBirds = factoryReports.reduce((sum, r) => sum + r.birdsCount, 0);
  const totalFeedKg = factoryReports.reduce((sum, r) => sum + r.feedConsumedKg, 0);
  const totalMortality = factoryReports.reduce((sum, r) => sum + r.mortalityCount, 0);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    createTask({
      title: taskTitle,
      description: taskDescription,
      assignedToRole,
      assignedToName,
      priority: taskPriority,
      building: taskBuilding,
      dueDate: taskDueDate,
      dueTime: taskDueTime,
    });
    setTaskTitle('');
    setTaskDescription('');
    const def = getDefaultDueDateTime();
    setTaskDueDate(def.dueDate);
    setTaskDueTime(def.dueTime);
    setIsTaskModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/40 p-6 rounded-3xl border border-rose-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Boshqaruv Paneli (Direktor)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Umumiy Nazorat
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Parrandachilik fabrikasining barcha ishlab chiqarish, energetika, davomat va moliyaviy ko'rsatkichlari
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={backupDatabase}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all border border-slate-700"
            >
              <Database className="w-4 h-4" />
              <span>Backup</span>
            </button>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="self-start md:self-auto px-4 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Xodimlarga Topshiriq Berish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Eggs */}
        <div className="p-4 sm:p-5 bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Kunlik Tuxum Terimi</span>
            <Egg className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {totalEggsToday ? totalEggsToday.toLocaleString() : '50,550'}
            <span className="text-xs font-normal text-slate-400 ml-1">dona</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Mahsuldorlik 94.2%</span>
          </div>
        </div>

        {/* Birds count */}
        <div className="p-4 sm:p-5 bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tovuqlar Soni</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {totalBirds.toLocaleString()}
            <span className="text-xs font-normal text-slate-400 ml-1">bosh</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 font-semibold">
            <span>Nobudgarchilik: {totalMortality} dona (0.01%)</span>
          </div>
        </div>

        {/* Daily Electricity */}
        <div className="p-4 sm:p-5 bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Elektr Iste'moli</span>
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {electricityLog.dailyConsumptionKwh.toLocaleString()}
            <span className="text-xs font-normal text-slate-400 ml-1">kVt/kun</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <span>Generator zaxirasi: {electricityLog.generatorFuelLevelPercent}%</span>
          </div>
        </div>

        {/* Attendance */}
        <div className="p-4 sm:p-5 bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Bugungi Davomat</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {attendanceRecords.length}
            <span className="text-xs font-normal text-slate-400 ml-1">/ 11 xodim</span>
          </div>
          <div className="text-[11px] text-purple-300 flex items-center gap-1 mt-1 font-semibold">
            <span>
              {attendanceRecords.filter((a) => a.isSubstitution).length} ta o'rinbosar bilan
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Direct Tasks & Live Photo Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Direct Top-Level Tasks (7 cols) */}
        <div className="lg:col-span-7 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Direktor Topshiriqlari & Xodimlar Ijrosi ({tasks.length})</span>
            </h2>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              + Yangi qo'shish
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 bg-slate-800/70 border border-slate-700/80 rounded-2xl space-y-2 hover:border-slate-600 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{task.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                      task.priority === 'yuqori'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {task.priority === 'yuqori' ? 'Shoshilinch' : 'Oddiy'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-700/60 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 font-semibold">{task.assignedToName}</span>
                    <span className="text-slate-600">•</span>
                    <span>{task.building}</span>
                    <span className="text-slate-600">•</span>
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
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        task.status === 'bajarildi' || task.status === 'tasdiqlandi'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {task.status === 'bajarildi'
                        ? 'Bajarildi'
                        : task.status === 'tasdiqlandi'
                        ? 'Tasdiqlandi'
                        : 'Jarayonda'}
                    </span>

                    {task.evaluationScore && (
                      <span className="flex items-center text-yellow-400 font-bold text-xs bg-yellow-500/10 px-2 py-0.5 rounded">
                        ★ {task.evaluationScore} / 5
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Submitted Photo Reports across all 11 roles (5 cols) */}
        <div className="lg:col-span-5 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Foto-Hisobotlar Lentalari</span>
            </h2>
            <span className="text-xs text-slate-400">{photoReports.length} ta hisobot</span>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1 scrollbar-thin">
            {photoReports.map((rep) => (
              <div
                key={rep.id}
                className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex gap-3 text-xs"
              >
                <img
                  src={rep.imageUrl}
                  alt={rep.title}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <div className="font-bold text-slate-200 truncate">{rep.title}</div>
                    <span className="font-mono text-[10px] text-slate-400">{rep.timestamp}</span>
                  </div>
                  <div className="text-[11px] text-amber-400 font-medium">
                    {rep.uploaderName} ({ROLE_LABELS[rep.uploaderRole]?.short || rep.uploaderRole})
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{rep.notes}</p>

                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        rep.status === 'tasdiqlandi'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {rep.status === 'tasdiqlandi' ? 'Tasdiqlangan' : 'Kutilmoqda'}
                    </span>

                    {rep.status === 'kutilmoqda' && (
                      <button
                        onClick={() => verifyPhotoReport(rep.id, 'tasdiqlandi')}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                      >
                        Tasdiqlash
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Direktor Topshirig'i Berish</span>
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Topshiriq nomi:
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Masalan: 3-Bino ventilyatsiyasini tekshirish"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Ijrochi lavozimi:
                </label>
                <select
                  value={assignedToRole}
                  onChange={(e) => {
                    const r = e.target.value as Role;
                    setAssignedToRole(r);
                    const user = users.find((u) => u.role === r);
                    if (user) setAssignedToName(`${user.fullName} (${ROLE_LABELS[r].short})`);
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.role}>
                      {ROLE_LABELS[u.role].title} — {u.fullName}
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
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Topshiriq muddati */}
              <div className="p-3 bg-slate-800/80 border border-amber-500/30 rounded-2xl space-y-2">
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
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Bajarish vaqti:</span>
                    <input
                      type="time"
                      required
                      value={taskDueTime}
                      onChange={(e) => setTaskDueTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block mb-1">Tezkor tanlash:</span>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const h = (now.getHours() + 1) % 24;
                        setTaskDueDate(getTodayDateString());
                        setTaskDueTime(`${String(h).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-700 text-blue-300 text-[10px] font-semibold border border-slate-700 cursor-pointer"
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
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-700 text-blue-300 text-[10px] font-semibold border border-slate-700 cursor-pointer"
                    >
                      +2 soat
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTaskDueDate(getTodayDateString());
                        setTaskDueTime('18:00');
                      }}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-700 text-amber-300 text-[10px] font-semibold border border-slate-700 cursor-pointer"
                    >
                      Bugun 18:00
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTaskDueDate(getTomorrowDateString());
                        setTaskDueTime('10:00');
                      }}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-700 text-emerald-300 text-[10px] font-semibold border border-slate-700 cursor-pointer"
                    >
                      Ertaga 10:00
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTaskDueDate(getTomorrowDateString());
                        setTaskDueTime('18:00');
                      }}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-700 text-purple-300 text-[10px] font-semibold border border-slate-700 cursor-pointer"
                    >
                      Ertaga 18:00
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Topshiriq tafsiloti:
                </label>
                <textarea
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Batafsil ko'rsatma yozing..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold"
                >
                  Topshiriqni Yuborish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
