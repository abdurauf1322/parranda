import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BranchInventoryItem, InventoryCategory, BranchId } from '../../types';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Edit2,
  Trash2,
  Package,
  Wrench,
  Pill,
  Wheat,
  Clock,
  User,
  X
} from 'lucide-react';

const CATEGORY_LABELS: Record<InventoryCategory, { label: string; icon: any; color: string; bg: string }> = {
  yem: {
    label: 'Yem va Ozuqa',
    icon: Wheat,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
  },
  dori: {
    label: 'Dori va Vaksina',
    icon: Pill,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
  },
  asbob: {
    label: 'Asbob va Uskunalar',
    icon: Wrench,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
  },
};

export const BranchInventoryView: React.FC = () => {
  const {
    branches,
    currentUser,
    branchInventory,
    addBranchInventoryItem,
    updateBranchInventoryQuantity,
    deleteBranchInventoryItem
  } = useApp();

  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<InventoryCategory>('yem');
  const [newQuantity, setNewQuantity] = useState<number>(100);
  const [newUnit, setNewUnit] = useState('kg');
  const [newMinThreshold, setNewMinThreshold] = useState<number>(50);
  const [newNotes, setNewNotes] = useState('');
  const [targetBranchForAdd, setTargetBranchForAdd] = useState<BranchId>(currentUser.branchId || 'uychi_bosh');
  const [isManualBranch, setIsManualBranch] = useState(false);
  const [manualBranchName, setManualBranchName] = useState('');

  // Update Quantity Modal
  const [editingItem, setEditingItem] = useState<BranchInventoryItem | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editNotes, setEditNotes] = useState('');

  const filteredInventory = branchInventory.filter((item) => {
    const matchesBranch = selectedBranchId === 'all' || item.branchId === selectedBranchId;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesBranch && matchesCategory && matchesSearch;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addBranchInventoryItem({
      branchId: isManualBranch ? (manualBranchName || 'Boshqa') as BranchId : targetBranchForAdd,
      category: newCategory,
      name: newName.trim(),
      quantity: Number(newQuantity) || 0,
      unit: newUnit.trim() || 'dona',
      minThreshold: Number(newMinThreshold) || 10,
      notes: newNotes.trim(),
    });

    setNewName('');
    setNewQuantity(100);
    setNewNotes('');
    setManualBranchName('');
    setIsManualBranch(false);
    setIsAddModalOpen(false);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    updateBranchInventoryQuantity(editingItem.id, Number(editQuantity) || 0, editNotes.trim());
    setEditingItem(null);
  };

  // Low stock warning count
  const lowStockCount = branchInventory.filter((item) => item.quantity <= item.minThreshold).length;

  return (
    <div className="space-y-6 w-full">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-emerald-950/50 p-6 rounded-3xl border border-amber-500/30 shadow-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Boxes className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Filiallar Inventarizatsiyasi & Zahiralar
              </h1>
              {lowStockCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{lowStockCount} ta kamomad xavfi</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Har bir filial bo'yicha yem, dori-darmon va asbob-uskunalar zahirasini real vaqtda nazorat qilish va kiritish
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start md:self-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Zahira Qo'shish</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branch Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button
            onClick={() => setSelectedBranchId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedBranchId === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Barcha Filiallar
          </button>
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBranchId(b.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedBranchId === b.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              {b.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Category & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Zahira nomi bo'yicha qidirish..."
              className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl focus:outline-none"
          >
            <option value="all">Barcha Toifalar</option>
            <option value="yem">Yem va Ozuqa</option>
            <option value="dori">Dori va Vaksina</option>
            <option value="asbob">Asbob-uskunalar</option>
          </select>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInventory.length === 0 ? (
          <div className="col-span-full py-16 text-center space-y-2 bg-slate-900/50 border border-slate-800 rounded-3xl">
            <Package className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Inventarizatsiya ma'lumotlari topilmadi</p>
            <p className="text-xs text-slate-500">Yangi zahira qo'shish tugmasi orqali ma'lumot kiriting.</p>
          </div>
        ) : (
          filteredInventory.map((item) => {
            const isLow = item.quantity <= item.minThreshold;
            const catInfo = CATEGORY_LABELS[item.category];
            const CatIcon = catInfo ? catInfo.icon : Package;
            const branchObj = branches.find((b) => b.id === item.branchId);

            return (
              <div
                key={item.id}
                className={`bg-slate-900/90 border rounded-2xl p-4 shadow-xl flex flex-col justify-between gap-3 relative transition-all ${
                  isLow ? 'border-rose-500/50 bg-rose-950/10' : 'border-slate-800 hover:border-amber-500/40'
                }`}
              >
                {/* Top header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${catInfo?.bg || 'bg-slate-800 border-slate-700'}`}>
                      <CatIcon className={`w-5 h-5 ${catInfo?.color || 'text-slate-300'}`} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {branchObj?.name || item.branchId}
                      </span>
                      <h3 className="text-sm font-black text-white">{item.name}</h3>
                    </div>
                  </div>

                  {isLow ? (
                    <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Kamomad!</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Yetarli</span>
                    </span>
                  )}
                </div>

                {/* Quantity & Threshold */}
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Joriy Zahira Miqdori:</span>
                    <span className={`text-lg font-black ${isLow ? 'text-rose-400' : 'text-amber-400'}`}>
                      {item.quantity.toLocaleString()} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Min. Chegara:</span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {item.minThreshold.toLocaleString()} {item.unit}
                    </span>
                  </div>
                </div>

                {/* Notes & Last update */}
                {item.notes && (
                  <p className="text-xs text-slate-300 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
                    "{item.notes}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{item.lastUpdated}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setEditQuantity(item.quantity);
                        setEditNotes(item.notes || '');
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>O'zgartirish</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`"${item.name}" zahirasini o'chirishni tasdiqlaysizmi?`)) {
                          deleteBranchInventoryItem(item.id);
                        }
                      }}
                      className="p-1 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer"
                      title="O'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Inventory Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <span>Yangi Zahira Yoki Mahsulot Kiritish</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Filialni Tanlang:</span>
                  <label className="flex items-center gap-1.5 text-[10px] text-amber-400 cursor-pointer">
                    <input type="checkbox" checked={isManualBranch} onChange={(e) => setIsManualBranch(e.target.checked)} />
                    Qo'lda kiritish
                  </label>
                </label>
                {isManualBranch ? (
                  <input
                    type="text"
                    required
                    value={manualBranchName}
                    onChange={(e) => setManualBranchName(e.target.value)}
                    placeholder="Filial nomini yozing"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                ) : (
                  <select
                    value={targetBranchForAdd}
                    onChange={(e) => setTargetBranchForAdd(e.target.value as BranchId)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Kategoriya:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as InventoryCategory)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="yem">Yem va Ozuqa</option>
                  <option value="dori">Dori va Vaksina</option>
                  <option value="asbob">Asbob va Uskunalar</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Zahira Nomi:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Masalan: Starter Kombikorm yoki Enrofloksatsin"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Miqdori:</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">O'lchov Birligi:</label>
                  <input
                    type="text"
                    required
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="kg, dona, litr, qop"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Minimal Ogohlantirish Chegarasi:</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newMinThreshold}
                  onChange={(e) => setNewMinThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Qo'shimcha Izoh / Sifat Holati:</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ombor holati yoki partiya haqida qisqacha..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Quantity Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Zahira Miqdorini Yangilash</span>
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Mahsulot: <strong className="text-white">{editingItem.name}</strong> ({editingItem.unit})
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Yangi Miqdor:</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Izoh / O'zgarish Sababi:</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Masalan: 500 kg sarflandi yoki yangi partiya keltirildi"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-md shadow-amber-500/20"
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
