import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SlesarMilestone } from '../../types';
import {
  Wrench,
  Clock,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Play,
  Volume2,
  Send,
  Layers,
  ArrowRight,
  Edit2,
  Plus,
  RotateCcw,
  Trash2,
  X,
  Settings2
} from 'lucide-react';
import { soundSynth } from '../../utils/audioAlert';

export const SlesarDashboard: React.FC = () => {
  const {
    slesarMilestones,
    completeMilestone,
    triggerTestAlert,
    farmCurrentTime,
    updateMilestone,
    addMilestone,
    deleteMilestone,
    resetMilestonesToDefault
  } = useApp();

  // Notification Permission state
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    return typeof window !== 'undefined' ? soundSynth.getNotificationPermission() : 'default';
  });

  const handleRequestNotification = async () => {
    const res = await soundSynth.requestNotificationPermission();
    setNotifPermission(res);
  };

  // Modals state
  const [editingMilestone, setEditingMilestone] = useState<SlesarMilestone | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Edit form state
  const [editTime, setEditTime] = useState('');
  const [editAlertTime, setEditAlertTime] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Add form state
  const [newTime, setNewTime] = useState('08:00');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Find next upcoming milestone
  const nextMilestone = slesarMilestones.find((m) => m.status === 'kutilmoqda' || m.status === 'ogohlantirildi');

  const handleComplete = (id: string) => {
    completeMilestone(id, 'Muvaffaqiyatli bajarildi');
  };

  const handleTestAlert = (milestoneId: string) => {
    triggerTestAlert(milestoneId);
  };

  const startEdit = (m: SlesarMilestone) => {
    setEditingMilestone(m);
    setEditTime(m.time);
    setEditAlertTime(m.alertTime);
    setEditTitle(m.title);
    setEditDescription(m.description);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;

    updateMilestone(editingMilestone.id, {
      time: editTime,
      alertTime: editAlertTime,
      title: editTitle,
      description: editDescription,
    });

    setEditingMilestone(null);
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addMilestone({
      time: newTime,
      title: newTitle.trim(),
      description: newDescription.trim(),
    });

    setNewTitle('');
    setNewDescription('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* 1. Bildirishnoma ruxsati faqat yoqilmagan bo'lsagina ko'rsatiladigan ixcham 1 qatorli ogohlantirish */}
      {notifPermission !== 'granted' && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <Bell className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <span>
              <strong>Bildirishnomalar yoqilmagan:</strong> Texnologik signallarni telefon yopiq paytida ham eshitish uchun ruxsat bering.
            </span>
          </div>
          <button
            onClick={handleRequestNotification}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shrink-0 self-start sm:self-auto cursor-pointer transition-colors"
          >
            Ruxsat berish
          </button>
        </div>
      )}

      {/* 2. Eng Muhim Karta: "NAVBATDAGI TEXNOLOGIK BOSQICH" (Markazda, Katta va Aniq) */}
      {nextMilestone ? (
        <div className="p-5 sm:p-6 bg-slate-900 border border-amber-500/30 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black shrink-0">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Navbatdagi Texnologik Bosqich
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    Signal: {nextMilestone.alertTime} (-3 daqiqa)
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {nextMilestone.time} — {nextMilestone.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => startEdit(nextMilestone)}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>O'zgartirish</span>
              </button>

              <button
                onClick={() => handleComplete(nextMilestone.id)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all transform hover:scale-[1.02]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Bajarildi</span>
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {nextMilestone.description}
          </p>
        </div>
      ) : (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">Bugungi barcha texnologik bosqichlar bajarildi!</h3>
          <p className="text-xs text-slate-400 mt-1">Yangi topshiriqlar bo'lsa ro'yxatdan kuzatishingiz mumkin.</p>
        </div>
      )}

      {/* Complete Milestones Schedule Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Texnologik Ish Grafigi ({slesarMilestones.length} ta bosqich)</span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Bosqich Qo'shish</span>
            </button>
            <button
              onClick={() => triggerTestAlert()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Signalni Sinash</span>
            </button>
            <button
              onClick={() => {
                if (confirm("Haqiqatan ham barcha vaqtlarni zavod standart (07:00-17:00) holatiga qaytarmoqchimisiz?")) {
                  resetMilestonesToDefault();
                }
              }}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 rounded-xl border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Standart</span>
            </button>
            <span className="text-xs text-amber-400 font-mono font-bold ml-1">
              {farmCurrentTime}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {slesarMilestones.map((item, idx) => {
            const isCompleted = item.status === 'bajarildi';
            const isAlerting = item.status === 'ogohlantirildi';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                    : isAlerting
                    ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/30 text-white animate-pulse'
                    : 'bg-slate-800/70 border-slate-700/80 text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Time and Title */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isAlerting
                          ? 'bg-orange-500 text-slate-950 font-black'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-base font-black text-amber-400">
                          {item.time}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-orange-300 border border-slate-700">
                          Ogohlantirish: {item.alertTime} (-3 daqiqa)
                        </span>
                        {isCompleted && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Bajarildi: {item.completedAt}
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-sm font-bold mt-1 ${
                          isCompleted ? 'text-slate-400 line-through' : 'text-white'
                        }`}
                      >
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>

                      {item.notes && (
                        <div className="mt-1.5 text-[11px] text-emerald-400/90 font-medium">
                          ✓ Izoh: {item.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 sm:self-center">
                    {/* Time editing button */}
                    <button
                      onClick={() => startEdit(item)}
                      title="Ushbu amal vaqtini o'zgartirish"
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Vaqtni o'zgartirish</span>
                    </button>

                    {!isCompleted ? (
                      <>
                        <button
                          onClick={() => handleTestAlert(item.id)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Signal</span>
                        </button>

                        <button
                          onClick={() => handleComplete(item.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Bajarildi</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tasdiqlangan</span>
                      </span>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`"${item.title}" bosqichini o'chirmoqchimisiz?`)) {
                          deleteMilestone(item.id);
                        }
                      }}
                      title="O'chirish"
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Milestone Modal */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-orange-400" />
                <span>Slesar Amali Vaqtini O'zgartirish</span>
              </h3>
              <button
                onClick={() => setEditingMilestone(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Boshlanish vaqti (HH:mm):
                  </label>
                  <input
                    type="time"
                    required
                    value={editTime}
                    onChange={(e) => {
                      setEditTime(e.target.value);
                      // Auto calculate 3 minutes earlier
                      const parts = e.target.value.split(':');
                      if (parts.length === 2) {
                        let h = parseInt(parts[0], 10);
                        let m = parseInt(parts[1], 10) - 3;
                        if (m < 0) {
                          m += 60;
                          h = (h - 1 + 24) % 24;
                        }
                        setEditAlertTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Ogohlantirish vaqti (-3 daqiqa):
                  </label>
                  <input
                    type="time"
                    required
                    value={editAlertTime}
                    onChange={(e) => setEditAlertTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-orange-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Amal / Vazifa nomi:
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tavsif va ko'rsatmalar:
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMilestone(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 rounded-xl font-bold"
                >
                  Yangi Vaqtni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Milestone Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-400" />
                <span>Yangi Texnologik Amal Qo'shish</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMilestone} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Bajarilish vaqti (HH:mm):
                </label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-[10px] text-orange-400 mt-1 block">
                  * 3 daqiqa oldin ogohlantirish avtomatik hisoblanadi
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Amal nomi:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Masalan: Yem bunkerlarini tozalash"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tavsif (ixtiyoriy):
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Bajarish tartibi va datchiklar nazorati..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 rounded-xl font-bold"
                >
                  Grafikga Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
