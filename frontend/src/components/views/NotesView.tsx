import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PersonalNote } from '../../types';
import {
  StickyNote,
  Plus,
  Pin,
  Trash2,
  Edit3,
  Search,
  Lock,
  Calendar,
  Check,
  X,
  Sparkles,
  Tag
} from 'lucide-react';

const COLOR_CLASSES: Record<PersonalNote['color'], { bg: string; border: string; badge: string; ring: string }> = {
  yellow: {
    bg: 'bg-amber-950/30',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    ring: 'focus:ring-amber-500',
  },
  blue: {
    bg: 'bg-blue-950/30',
    border: 'border-blue-500/40',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    ring: 'focus:ring-blue-500',
  },
  green: {
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    ring: 'focus:ring-emerald-500',
  },
  purple: {
    bg: 'bg-purple-950/30',
    border: 'border-purple-500/40',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    ring: 'focus:ring-purple-500',
  },
  rose: {
    bg: 'bg-rose-950/30',
    border: 'border-rose-500/40',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    ring: 'focus:ring-rose-500',
  },
};

export const NotesView: React.FC = () => {
  const { currentUser, currentUserNotes, addPersonalNote, updatePersonalNote, deletePersonalNote } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PersonalNote | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PersonalNote['category']>('ish');
  const [color, setColor] = useState<PersonalNote['color']>('yellow');
  const [isPinned, setIsPinned] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<PersonalNote['category']>('ish');
  const [editColor, setEditColor] = useState<PersonalNote['color']>('yellow');
  const [editIsPinned, setEditIsPinned] = useState(false);

  const filteredNotes = currentUserNotes.filter((n) =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    addPersonalNote(title.trim() || 'Eslatma', content.trim(), category, color, isPinned);
    setTitle('');
    setContent('');
    setIsPinned(false);
    setIsAddModalOpen(false);
  };

  const startEdit = (note: PersonalNote) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category);
    setEditColor(note.color);
    setEditIsPinned(note.isPinned);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;

    updatePersonalNote(editingNote.id, {
      title: editTitle.trim() || 'Eslatma',
      content: editContent.trim(),
      category: editCategory,
      color: editColor,
      isPinned: editIsPinned,
    });

    setEditingNote(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/50 p-6 rounded-3xl border border-amber-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <StickyNote className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Shaxsiy Zametkalar va Eslatmalar
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Faqat sizga ko'rinadi</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Ish rejalaringiz, eslatmalar va muhim yozuvlar (Boshqa hech kim o'qiy olmaydi)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start md:self-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Zametka Yozish</span>
        </button>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Muallif: <strong className="text-white">{currentUser.fullName}</strong>. Ushbu bo'limdagi zametkalar faqat sizning hisobingizga tegishli va 100% maxfiy saqlanadi.
          </span>
        </div>
        <span className="font-mono text-amber-400 font-bold hidden sm:inline">
          {currentUserNotes.length} ta yozuv
        </span>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Zametkalar ichidan qidirish..."
            className="w-full pl-9 pr-3 py-2 bg-slate-850 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="p-12 text-center bg-slate-850 border border-slate-800 rounded-3xl space-y-3">
          <StickyNote className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">Hozircha hech qanday zametka yo'q</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            O'zingiz uchun muhim eslatma, topshiriq yoki rejalarni yozib qo'yish uchun "Yangi Zametka Yozish" tugmasini bosing.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
          >
            Birinchi zametkani yozish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const style = COLOR_CLASSES[note.color] || COLOR_CLASSES.yellow;
            return (
              <div
                key={note.id}
                className={`p-5 rounded-3xl border shadow-xl flex flex-col justify-between space-y-3 transition-all hover:scale-[1.01] ${style.bg} ${style.border}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${style.badge}`}>
                      {note.category}
                    </span>

                    <div className="flex items-center gap-1">
                      {note.isPinned && (
                        <span title="Qadalgan zametka" className="text-amber-400">
                          <Pin className="w-3.5 h-3.5 fill-amber-400" />
                        </span>
                      )}
                      <button
                        onClick={() => startEdit(note)}
                        title="Tahrirlash"
                        className="p-1 text-slate-400 hover:text-white rounded"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deletePersonalNote(note.id)}
                        title="O'chirish"
                        className="p-1 text-slate-400 hover:text-rose-400 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-tight mb-1">
                    {note.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{note.createdAt}</span>
                  {note.updatedAt && <span>(tahrirlandi: {note.updatedAt.slice(11)})</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Note Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-amber-400" />
                <span>Yangi Shaxsiy Zametka Yozish</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mavzu / Sarlavha:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Ertangi ozuqa yetkazib berish nazorati"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Eslatma matni:
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Batafsil ma'lumot, telefon raqamlari, eslatmalar..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategoriya:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="ish">Ishga oid</option>
                    <option value="muhim">Muhim</option>
                    <option value="eslatma">Oddiy eslatma</option>
                    <option value="shaxsiy">Shaxsiy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rang tanlash:</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="yellow">Sariq (Standart)</option>
                    <option value="green">Yashil</option>
                    <option value="blue">Moviy</option>
                    <option value="purple">Binafsha</option>
                    <option value="rose">Qizil</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-800/80 rounded-xl">
                <input
                  type="checkbox"
                  id="pin_note"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500"
                />
                <label htmlFor="pin_note" className="text-slate-200 font-semibold cursor-pointer">
                  Zametkani yuqoriga qadab qo'yish (Pin to top)
                </label>
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
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>Zametkani Tahrirlash</span>
              </h3>
              <button
                onClick={() => setEditingNote(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mavzu / Sarlavha:
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Eslatma matni:
                </label>
                <textarea
                  rows={4}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategoriya:</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="ish">Ishga oid</option>
                    <option value="muhim">Muhim</option>
                    <option value="eslatma">Oddiy eslatma</option>
                    <option value="shaxsiy">Shaxsiy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rang:</label>
                  <select
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="yellow">Sariq</option>
                    <option value="green">Yashil</option>
                    <option value="blue">Moviy</option>
                    <option value="purple">Binafsha</option>
                    <option value="rose">Qizil</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-800/80 rounded-xl">
                <input
                  type="checkbox"
                  id="edit_pin_note"
                  checked={editIsPinned}
                  onChange={(e) => setEditIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500"
                />
                <label htmlFor="edit_pin_note" className="text-slate-200 font-semibold cursor-pointer">
                  Zametkani yuqoriga qadash
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold"
                >
                  Yangilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
