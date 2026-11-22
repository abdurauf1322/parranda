import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const ChickenWeightView: React.FC = () => {
  const { chickenWeights, addChickenWeightRecord, currentUser } = useApp();
  const [cageNumber, setCageNumber] = useState<number>(1);
  const [factoryNumber, setFactoryNumber] = useState<string>('');
  const [cageWeightsMap, setCageWeightsMap] = useState<Record<number, Record<number, number>>>(() => {
    const saved = sessionStorage.getItem('chicken_weight_drafts');
    return saved ? JSON.parse(saved) : {};
  });
  const [weighingDate, setWeighingDate] = useState<string>(new Date().toISOString().slice(0, 16));

  useEffect(() => {
    sessionStorage.setItem('chicken_weight_drafts', JSON.stringify(cageWeightsMap));
  }, [cageWeightsMap]);

  const weights = cageWeightsMap[cageNumber] || {};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.branchId) {
      alert("Sizda filial biriktirilmagan!");
      return;
    }
    if (!factoryNumber) {
        alert("Iltimos, fabrika raqamini kiriting!");
        return;
    }

    Object.entries(weights).forEach(([chickenNumber, weight]) => {
      if (weight > 0) {
        addChickenWeightRecord({
          cageNumber,
          chickenNumber: Number(chickenNumber),
          weight,
          createdAt: weighingDate,
          branchId: currentUser.branchId!,
          factoryNumber,
        });
      }
    });
    setCageWeightsMap(prev => ({...prev, [cageNumber]: {}}));
    alert(`Katak ${cageNumber} uchun vaznlar ${weighingDate} sanasi bilan saqlandi!`);
  };

  const weightsList = chickenWeights || [];
  
  // Sort records by createdAt to find the latest and second-to-latest weighing sessions
  const sortedSessions = [...new Set(weightsList.map(r => r.createdAt))].sort().reverse();
  
  const getAvgWeightForSession = (date: string) => {
      const sessionRecords = weightsList.filter(r => r.createdAt === date);
      const total = sessionRecords.reduce((sum, r) => sum + r.weight, 0);
      return sessionRecords.length > 0 ? total / sessionRecords.length : 0;
  };

  const currentAvgWeight = sortedSessions.length > 0 ? getAvgWeightForSession(sortedSessions[0]) : 0;
  const previousAvgWeight = sortedSessions.length > 1 ? getAvgWeightForSession(sortedSessions[1]) : 0;
  const diff = currentAvgWeight - previousAvgWeight;

  const totalCount = weightsList.length;

  const updateWeight = (chickenNumber: number, weight: number) => {
    setCageWeightsMap(prev => ({
      ...prev,
      [cageNumber]: {
        ...(prev[cageNumber] || {}),
        [chickenNumber]: weight
      }
    }));
  };

  const exportToCSV = () => {
    const headers = ['Sana', 'Fabrika raqami', 'Katak', 'Tovuq', 'Vazn (g)'];
    const rows = weightsList.map(r => [
      r.createdAt,
      r.factoryNumber,
      r.cageNumber,
      r.chickenNumber,
      r.weight
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parrandalar_vazni_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-white">Parrandalar vazni</h2>
      
      <div className="bg-slate-800 p-4 rounded-lg space-y-3">
        <label className="block text-slate-300 font-bold">Tortilgan sana va vaqt:</label>
        <input 
            type="datetime-local" 
            value={weighingDate} 
            onChange={(e) => setWeighingDate(e.target.value)} 
            className="w-full bg-slate-700 p-2 rounded text-white"
        />
        <label className="block text-slate-300 font-bold">Fabrika raqami:</label>
        <input 
            type="text" 
            value={factoryNumber} 
            onChange={(e) => setFactoryNumber(e.target.value)} 
            className="w-full bg-slate-700 p-2 rounded text-white"
            placeholder="Fabrika raqami"
        />
        <label className="block text-slate-300 font-bold">Katakni tanlang (1-12):</label>
        <select value={cageNumber} onChange={(e) => setCageNumber(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded text-white">
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>Katak {i + 1}</option>
          ))}
        </select>
        <button onClick={exportToCSV} className="w-full bg-emerald-600 p-2 rounded text-white font-bold mt-2">CSV Eksport</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-800 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-bold text-white mb-2">Katak {cageNumber} uchun vaznlar (gramm):</h3>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <label key={i + 1} className="block text-slate-300 text-sm">
              Tovuq {i + 1}:
              <input 
                type="number" 
                value={weights[i + 1] || ''} 
                onChange={(e) => updateWeight(i + 1, Number(e.target.value))} 
                className="w-full bg-slate-700 p-2 rounded text-white"
                placeholder="0"
              />
            </label>
          ))}
        </div>
        <button type="submit" className="w-full bg-cyan-600 p-2 rounded text-white font-bold">Hammasini Saqlash</button>
      </form>

      <div className="bg-slate-800 p-4 rounded-lg">
        <h3 className="text-white font-bold">Joriy o'rtacha vazn: {currentAvgWeight.toFixed(2)}g</h3>
        {previousAvgWeight > 0 && (
          <p className={`font-bold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Farq: {diff >= 0 ? '+' : ''}{diff.toFixed(2)}g (oldingi: {previousAvgWeight.toFixed(2)}g)
          </p>
        )}
        <p className="text-slate-400 text-xs mt-1">Jami tortilgan tovuqlar soni: {totalCount} ta</p>
      </div>
    </div>
  );
};
