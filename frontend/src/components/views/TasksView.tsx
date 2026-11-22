import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/mockData';
import { Role } from '../../types';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Star,
  Plus,
  Filter,
  User,
  Building,
  Bell,
  Volume2,
  AlertTriangle
} from 'lucide-react';
import { isTaskOverdue, formatTaskDeadline } from '../../utils/taskUtils';

export const TasksView: React.FC = () => {
  const {
    tasks,
    currentUser,
    updateTaskStatus,
    start3MinAlert,
    recurring3MinAlert,
    markAlertCompleted,
    farmCurrentTime,
  } = useApp();

  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTasks = tasks.filter((t) => {
    if (filterRole !== 'all' && t.assignedToRole !== filterRole) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-800 p-6 rounded-3xl border border-amber-500/30 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span>Fabrika Vazifalar & Topshiriqlar Markazi</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Barcha lavozimlar topshiriqlari, 3 daqiqalik ovozli ogohlantirish va "Bajarildi" nazorati
          </p>
        </div>

        {/* Global info badge */}
        <div className="px-3.5 py-2 bg-slate-800/90 border border-amber-500/30 rounded-2xl flex items-center gap-2 text-xs text-amber-300">
          <Bell className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Muhim vazifalar uchun har 3 daqiqada signal chalinadi</span>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-850 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-300">Filtr:</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
          >
            <option value="all">Barcha lavozimlar</option>
            {Object.keys(ROLE_LABELS).map((roleKey) => (
              <option key={roleKey} value={roleKey}>
                {ROLE_LABELS[roleKey as Role].title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
          >
            <option value="all">Barcha holatlar</option>
            <option value="yangi">Yangi</option>
            <option value="jarayonda">Jarayonda</option>
            <option value="bajarildi">Bajarildi</option>
            <option value="tasdiqlandi">Tasdiqlandi & Baholandi</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map((task) => {
          const isMyTask = task.assignedToRole === currentUser.role;
          const is3MinActive = recurring3MinAlert?.targetId === task.id && recurring3MinAlert.isActive;

          return (
            <div
              key={task.id}
              className={`p-5 rounded-3xl space-y-3 shadow-lg transition-all ${
                is3MinActive
                  ? 'bg-slate-850 border-2 border-amber-500 shadow-amber-500/20 ring-4 ring-amber-500/20'
                  : 'bg-slate-850 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{task.title}</h3>
                    {task.priority === 'urgent' && (
                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold">
                        Tezkor
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-amber-400 font-medium mt-0.5">
                    {ROLE_LABELS[task.assignedToRole]?.title || task.assignedToRole}
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    task.status === 'tasdiqlandi'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : task.status === 'bajarildi'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {task.status === 'tasdiqlandi'
                    ? 'Tasdiqlangan'
                    : task.status === 'bajarildi'
                    ? 'Bajarildi'
                    : 'Kutilmoqda'}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{task.description}</p>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Topshiriq berdi:</span>
                  <span className="text-slate-200 font-semibold">{task.assignedByName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bajaruvchi:</span>
                  <span className="text-slate-200 font-semibold">{task.assignedToName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bino / Joy:</span>
                  <span className="text-slate-200">{task.building}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Muddat:</span>
                  {isTaskOverdue(task, farmCurrentTime) ? (
                    <span className="font-mono text-rose-400 font-bold bg-rose-500/15 px-1.5 py-0.5 rounded border border-rose-500/30 text-[10px]">
                      ⚠️ Muddati o'tgan ({formatTaskDeadline(task.dueDate, task.dueTime)})
                    </span>
                  ) : (
                    <span className="font-mono text-amber-400 font-bold">
                      {formatTaskDeadline(task.dueDate, task.dueTime)}
                    </span>
                  )}
                </div>
              </div>

              {/* Active 3-minute recurring indicator on card */}
              {is3MinActive && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs text-amber-200 animate-pulse">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="font-bold block text-white">3 daqiqalik ogohlantirish faol!</span>
                      <span className="text-[11px] text-amber-300">
                        Keyingi signal: {Math.floor(recurring3MinAlert.secondsLeft / 60)}:
                        {String(recurring3MinAlert.secondsLeft % 60).padStart(2, '0')} ({recurring3MinAlert.cycleCount}-marta chalindi)
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => markAlertCompleted()}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>BAJARILDI</span>
                  </button>
                </div>
              )}

              {task.evaluationScore && (
                <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs flex items-center justify-between text-yellow-300">
                  <div className="flex items-center gap-1 font-bold">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>Baholandi: {task.evaluationScore} / 5 yulduz</span>
                  </div>
                  <span className="text-[11px] text-slate-300">"{task.evaluationNote}"</span>
                </div>
              )}

              {/* Action buttons */}
              {task.status !== 'bajarildi' && task.status !== 'tasdiqlandi' && (
                <div className="flex items-center gap-2 pt-1">
                  {/* Start 3-min recurring alarm button */}
                  {!is3MinActive && (
                    <button
                      type="button"
                      onClick={() => start3MinAlert(task.title, task.description, task.id, 'task')}
                      className="flex-1 py-2 px-3 bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      title="Har 3 daqiqada ovozli ogohlantirishni yoqish"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>3 min signalni yoqish</span>
                    </button>
                  )}

                  {/* Complete Task Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (is3MinActive) {
                        markAlertCompleted();
                      } else {
                        updateTaskStatus(task.id, 'bajarildi');
                      }
                    }}
                    className={`py-2 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all ${
                      is3MinActive
                        ? 'w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        : isMyTask
                        ? 'flex-1 bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Bajarildi</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
