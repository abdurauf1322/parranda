import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { ROLE_LABELS } from '../../data/mockData';
import { isTaskOverdue, formatTaskDeadline } from '../../utils/taskUtils';

interface OverdueTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OverdueTasksModal: React.FC<OverdueTasksModalProps> = ({ isOpen, onClose }) => {
  const { tasks, farmCurrentTime } = useApp();

  if (!isOpen) return null;

  const overdueTasks = tasks.filter(t => isTaskOverdue(t, farmCurrentTime));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Muddati o'tgan topshiriqlar</h3>
            <p className="text-xs text-slate-400">Jami: {overdueTasks.length} ta topshiriq o'z vaqtida bajarilmagan</p>
          </div>
        </div>

        <div className="space-y-3">
          {overdueTasks.map(task => (
            <div key={task.id} className="p-4 bg-slate-800 rounded-2xl border border-slate-700 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400"/>
                    {task.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                <div className="text-[11px] text-rose-400 mt-2 font-medium flex items-center gap-1.5">
                    <Clock className="w-3 h-3"/>
                    Muddat: {formatTaskDeadline(task.dueDate, task.dueTime)}
                </div>
              </div>
              <div className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 whitespace-nowrap">
                {ROLE_LABELS[task.assignedToRole]?.title || task.assignedToRole}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
