import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/mockData';
import {
  Search,
  X,
  Building2,
  StickyNote,
  MessageSquare,
  Camera,
  ClipboardList,
  UserCheck,
  ArrowRight,
  Sparkles,
  Calendar
} from 'lucide-react';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ isOpen, onClose }) => {
  const {
    branches,
    currentUserNotes,
    chatMessages,
    photoReports,
    slesarMilestones,
    users,
    setActiveTab,
    setSelectedBranchFilter
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Ctrl+K or Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const query = searchQuery.toLowerCase().trim();

  // Filter items across data sources
  const matchedBranches = branches.filter(
    (b: any) =>
      b.name.toLowerCase().includes(query) ||
      b.code.toLowerCase().includes(query) ||
      b.location.toLowerCase().includes(query)
  );

  const matchedNotes = currentUserNotes.filter(
    (n: any) => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)
  );

  const matchedChat = chatMessages.filter(
    (m: any) => m.message.toLowerCase().includes(query) || m.senderName.toLowerCase().includes(query)
  );

  const matchedPhotos = photoReports.filter(
    (p: any) => p.title.toLowerCase().includes(query) || (p.notes && p.notes.toLowerCase().includes(query))
  );

  const matchedMilestones = slesarMilestones.filter(
    (m: any) => m.title.toLowerCase().includes(query) || (m.notes && m.notes.toLowerCase().includes(query))
  );

  const matchedUsers = users.filter(
    (u: any) => u.fullName.toLowerCase().includes(query) || u.username.toLowerCase().includes(query)
  );

  const totalResults =
    matchedBranches.length +
    matchedNotes.length +
    matchedChat.length +
    matchedPhotos.length +
    matchedMilestones.length +
    matchedUsers.length;

  const handleSelectResult = (tab: any, action?: () => void) => {
    setActiveTab(tab);
    if (action) action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Korxona bo'ylab tezkor qidirish (Filial, eslatma, chat, rasm, vazifa...)"
            className="flex-1 bg-transparent border-none text-white placeholder-slate-500 focus:outline-none text-sm sm:text-base"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">Tezkor Qidiruv Rejimi</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Filial nomini, shaxsiy eslatmalaringizni, chat xabarlarini, foto hisobotlarni yoki vazifalarni qidirish uchun so'z kiriting.
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm text-slate-300 font-semibold">"{searchQuery}" bo'yicha hech narsa topilmadi</p>
              <p className="text-xs text-slate-500">Boshqa kalit so'z bilan qidirib ko'ring.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Branches */}
              {matchedBranches.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Filiallar ({matchedBranches.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedBranches.map((b: any) => (
                      <div
                        key={b.id}
                        onClick={() =>
                          handleSelectResult('operational_plan', () => setSelectedBranchFilter(b.id))
                        }
                        className="p-3 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
                      >
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-amber-300">{b.name}</div>
                          <div className="text-[11px] text-slate-400">{b.location} • Kod: {b.code}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Notes */}
              {matchedNotes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5" />
                    <span>Shaxsiy Zametkalar ({matchedNotes.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedNotes.map((n: any) => (
                      <div
                        key={n.id}
                        onClick={() => handleSelectResult('notes')}
                        className="p-3 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
                      >
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-blue-300">{n.title}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{n.content}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {matchedChat.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat Xabarlari ({matchedChat.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedChat.map((m: any) => (
                      <div
                        key={m.id}
                        onClick={() => handleSelectResult('chat')}
                        className="p-3 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{m.senderName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{m.timestamp}</span>
                          </div>
                          <div className="text-[11px] text-slate-300 line-clamp-1">{m.message}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo Reports */}
              {matchedPhotos.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Foto Hisobotlar ({matchedPhotos.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedPhotos.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectResult('photos')}
                        className="p-3 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
                      >
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-purple-300">{p.title}</div>
                          <div className="text-[11px] text-slate-400">{p.category} • {p.building || 'Barcha binolar'}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones / Tasks */}
              {matchedMilestones.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Vazifalar ({matchedMilestones.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedMilestones.map((m: any) => (
                      <div
                        key={m.id}
                        onClick={() => handleSelectResult('tasks')}
                        className="p-3 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
                      >
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-yellow-300">{m.title}</div>
                          <div className="text-[11px] text-slate-400">Holati: {m.status} • Vaqti: {m.targetTime}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-yellow-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {matchedUsers.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Xodimlar ({matchedUsers.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedUsers.map((u: any) => (
                      <div
                        key={u.id}
                        onClick={() => handleSelectResult('attendance')}
                        className="p-3 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
                      >
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-rose-300">{u.fullName}</div>
                          <div className="text-[11px] text-slate-400">Rol: {(ROLE_LABELS as any)[u.role]?.title || u.role}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between px-4">
          <span>Tezkor qidiruv (Ctrl + K)</span>
          <span className="text-amber-400 font-semibold">{totalResults} ta natija topildi</span>
        </div>
      </div>
    </div>
  );
};
