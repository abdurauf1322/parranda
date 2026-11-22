import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GroceryItem } from '../../types';
import {
  Utensils,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

export const CookDashboard: React.FC = () => {
  const { groceryRequests, addGroceryRequest } = useApp();

  const [mealTarget, setMealTarget] = useState<any>('Tushlik');
  const [urgency, setUrgency] = useState<'oddiy' | 'tezkor'>('tezkor');
  const [items, setItems] = useState<GroceryItem[]>([
    { id: '1', name: 'Mol go\'shti (laxtak)', quantity: 12, unit: 'kg', category: 'Gosht' },
    { id: '2', name: 'Kartoshka', quantity: 25, unit: 'kg', category: 'Sabzavot' },
    { id: '3', name: 'O\'simlik yog\'i', quantity: 8, unit: 'litr', category: 'Quruq oziq-ovqat' },
  ]);

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState<any>('kg');
  const [newItemCategory, setNewItemCategory] = useState<any>('Sabzavot');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        name: newItemName,
        quantity: Number(newItemQty),
        unit: newItemUnit,
        category: newItemCategory,
      },
    ]);
    setNewItemName('');
    setNewItemQty(1);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    addGroceryRequest(mealTarget, items, urgency);
    setSavedSuccess(true);
    setItems([]);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-950/60 via-slate-900 to-rose-950/40 p-6 rounded-3xl border border-pink-500/30 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
            <Utensils className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Oshpaz Paneli (Xodimlar Oshxonasi)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Masalliqlar Buyurtmasi
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Kunlik taomnoma uchun masalliqlar ro'yxatini tuzish va rahbariyatga tasdiqlash uchun yuborish
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Masalliqlar buyurtmasi Farm Managerga tasdiqlash uchun yuborildi!</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Create Grocery Request (7 cols) */}
        <div className="lg:col-span-7 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-pink-400" />
            <span>Kunlik Masalliqlar Ro'yxatini Shakllantirish</span>
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Taomnoma maqsadli vaqti:
              </label>
              <select
                value={mealTarget}
                onChange={(e) => setMealTarget(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
              >
                <option value="Nonushta">Nonushta</option>
                <option value="Tushlik">Tushlik (Asosiy ovqat)</option>
                <option value="Kechki ovqat">Kechki ovqat</option>
                <option value="Kunlik zaxira">3 kunlik zaxira ombori</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Shoshilinchlik darajasi:
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
              >
                <option value="tezkor">Tezkor (Bugun tushlikkacha kerak)</option>
                <option value="oddiy">Oddiy rejadagi xarid</option>
              </select>
            </div>
          </div>

          {/* Add item inline mini-form */}
          <form onSubmit={handleAddItem} className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-pink-300 block text-[11px]">
              + Ro'yxatga masalliq qo'shish:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="col-span-2">
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Masalliq nomi (Go'sht, kartoshka...)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <input
                  type="number"
                  min={0.1}
                  step="0.1"
                  required
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(Number(e.target.value))}
                  placeholder="Miqdor"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="kg">kg</option>
                  <option value="dona">dona</option>
                  <option value="litr">litr</option>
                  <option value="qop">qop</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-pink-300 font-bold rounded-xl text-xs border border-pink-500/30 transition-all flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Qo'shish</span>
            </button>
          </form>

          {/* Current list of items */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 block">
              Buyurtma qilinayotgan mahsulotlar ({items.length} ta):
            </span>

            {items.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl">
                Ro'yxat bo'sh. Yuqoridan masalliq qo'shing.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{item.name}</span>
                    <span className="text-slate-400 font-mono">
                      ({item.quantity} {item.unit})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmitRequest}
            disabled={items.length === 0}
            className="w-full py-3 px-4 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Buyurtmani Rahbariyatga Tasdiqlash Uchun Yuborish</span>
          </button>
        </div>

        {/* Right: Past Requests and Status (5 cols) */}
        <div className="lg:col-span-5 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-pink-400" />
            <span>So'nggi Buyurtmalar va Tasdiq Holati</span>
          </h2>

          <div className="space-y-3">
            {groceryRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 bg-slate-800/70 border border-slate-700/80 rounded-2xl space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-white">
                      {req.mealTarget} uchun masalliqlar
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {req.date} • {req.createdAt}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      req.status === 'tasdiqlandi'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : req.status === 'rad_etildi'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {req.status === 'tasdiqlandi'
                      ? 'Tasdiqlandi'
                      : req.status === 'rad_etildi'
                      ? 'Rad etildi'
                      : 'Kutilmoqda'}
                  </span>
                </div>

                <div className="p-2 bg-slate-900/60 rounded-xl space-y-1">
                  {req.items.map((i) => (
                    <div key={i.id} className="flex justify-between text-[11px] text-slate-300">
                      <span>• {i.name}</span>
                      <span className="font-mono text-slate-400">
                        {i.quantity} {i.unit}
                      </span>
                    </div>
                  ))}
                </div>

                {req.approvalNote && (
                  <div className="text-[11px] text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    <span className="font-bold">Menejer javobi:</span> {req.approvalNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
