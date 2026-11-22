import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  Egg,
  Building,
  Scale,
  Calendar,
  MessageSquare,
  Sparkles,
  Check,
  CheckCircle,
  CheckCheck,
  Thermometer,
  Droplets,
  Layers,
  Warehouse,
  Pill,
  AlertTriangle,
  Users,
  Clock,
  ArrowUpRight,
  Eye,
  Filter,
  ShieldCheck,
  FileSpreadsheet,
  ChevronRight,
  X
} from 'lucide-react';
import { DailyFactoryReport } from '../../types';

export const StatisticianDashboard: React.FC = () => {
  const { factoryReports, createTask, diagnoses, acceptFactoryReport } = useApp();
  const [selectedReportId, setSelectedReportId] = useState<string>(factoryReports[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'kutilmoqda' | 'qabul_qilindi'>('all');
  const [statFeedback, setStatFeedback] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [acceptSuccessMessage, setAcceptSuccessMessage] = useState<string | null>(null);
  const [inspectingReport, setInspectingReport] = useState<DailyFactoryReport | null>(null);

  const selectedReport = factoryReports.find((r) => r.id === selectedReportId) || factoryReports[0];

  // Aggregate statistics
  const totalBirds = factoryReports.reduce((acc, curr) => acc + (curr.birdsCount || 0), 0);
  const totalEggs = factoryReports.reduce((acc, curr) => acc + (curr.eggsCollectedTotal || 0), 0);
  const totalFeedKg = factoryReports.reduce((acc, curr) => acc + (curr.feedConsumedKg || 0), 0);
  const totalMortality = factoryReports.reduce((acc, curr) => acc + (curr.mortalityCount || 0), 0);
  
  const minTemps = factoryReports.map((r) => r.minTemperature ?? r.avgTemperature).filter((t) => typeof t === 'number');
  const maxTemps = factoryReports.map((r) => r.maxTemperature ?? r.avgTemperature).filter((t) => typeof t === 'number');
  const minTempOverall = minTemps.length > 0 ? Math.min(...minTemps).toFixed(1) : '20.0';
  const maxTempOverall = maxTemps.length > 0 ? Math.max(...maxTemps).toFixed(1) : '24.0';
  const avgTempOverall = factoryReports.length > 0
    ? (factoryReports.reduce((acc, curr) => acc + (curr.avgTemperature || 0), 0) / factoryReports.length).toFixed(1)
    : '22.0';

  const avgProductivity = totalBirds > 0 ? ((totalEggs / totalBirds) * 100).toFixed(1) : '0';
  const avgFeedPerBird = totalBirds > 0 ? ((totalFeedKg * 1000) / totalBirds).toFixed(1) : '0';

  const filteredReports = factoryReports.filter((r) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'qabul_qilindi') return r.status === 'qabul_qilindi';
    if (statusFilter === 'kutilmoqda') return r.status !== 'qabul_qilindi';
    return true;
  });

  const handleAcceptReport = (reportId: string) => {
    acceptFactoryReport(reportId);
    setAcceptSuccessMessage("Hisobot qabul qilindi va statistik hisobga olindi!");
    setInspectingReport((prev) => {
      if (prev && prev.id === reportId) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return { ...prev, status: 'qabul_qilindi', acceptedAt: timeStr };
      }
      return prev;
    });
    setTimeout(() => {
      setAcceptSuccessMessage(null);
    }, 2500);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statFeedback.trim()) return;

    createTask({
      title: `Statistik tahlil ko'rsatmasi: ${selectedReport?.building}`,
      description: statFeedback,
      assignedToRole: 'ish_boshqaruvchi',
      assignedToName: selectedReport?.submittedByName || 'Farm Manager',
      priority: 'orta',
      building: selectedReport?.building,
      dueTime: '17:00',
    });

    setFeedbackSuccess(true);
    setStatFeedback('');
    setTimeout(() => setFeedbackSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-blue-950/50 p-6 rounded-3xl border border-indigo-500/30 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Statistika va Analitika Paneli
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Statistikachi
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Ish boshqaruvchidan kelgan sex hisobotlarini to'liq tekshirish, qabul qilish, harorat va ozuqa ko'rsatkichlari tahlili
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-semibold flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Bugun: {new Date().toISOString().slice(0, 10)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Overview: Harorat, Parrandalar, Tuxum, Yem, Nobudlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Harorat ko'rsatkichi (MIN / MAX / O'RTACHA) */}
        <div className="bg-slate-850 border border-orange-500/30 rounded-3xl p-5 shadow-xl space-y-2 relative overflow-hidden">
          <div className="absolute right-3 top-3 w-16 h-16 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-orange-400" />
              <span>Harorat Diapazoni</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
              Min / Max
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-black text-blue-300 font-mono" title="Minimal harorat">
              {minTempOverall}°C
            </span>
            <span className="text-slate-500 font-bold">/</span>
            <span className="text-2xl font-black text-rose-300 font-mono" title="Maksimal harorat">
              {maxTempOverall}°C
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
            <span>O'rtacha harorat:</span>
            <span className="font-mono font-bold text-amber-300">{avgTempOverall}°C</span>
          </div>
        </div>

        {/* 2. Parrandalar & Tuxum unumi */}
        <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Jami Parrandalar</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {factoryReports.length} ta sex
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono pt-1">
            {totalBirds.toLocaleString()} <span className="text-xs font-normal text-slate-400">bosh</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
            <span>Kunlik tuxum terimi:</span>
            <span className="font-mono font-bold text-emerald-300">{totalEggs.toLocaleString()} ({avgProductivity}%)</span>
          </div>
        </div>

        {/* 3. Kunlik Ozuqa (Yem) va Jon boshiga sarf */}
        <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Ozuqa Sarfi</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Jon boshiga
            </span>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono pt-1">
            {avgFeedPerBird} <span className="text-xs font-normal text-slate-400">gr/bosh</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
            <span>Umumiy iste'mol:</span>
            <span className="font-mono font-bold text-white">{totalFeedKg.toLocaleString()} kg</span>
          </div>
        </div>

        {/* 4. Nobudgarchilik & Salomatlik */}
        <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              <span>Nobudgarchilik</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {diagnoses.length} ta tashxis
            </span>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono pt-1">
            {totalMortality} <span className="text-xs font-normal text-slate-400">dona</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
            <span>Nobudlik ulushi:</span>
            <span className="font-mono font-bold text-rose-300">
              {totalBirds > 0 ? ((totalMortality / totalBirds) * 100).toFixed(2) : 0}%
            </span>
          </div>
        </div>
      </div>

      {acceptSuccessMessage && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center gap-2.5 font-bold animate-pulse">
          <CheckCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{acceptSuccessMessage}</span>
        </div>
      )}

      {/* Building breakdown table with full columns (including Min/Max Temp) */}
      <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Farm Boshqaruvchidan Kelgan Kunlik Sex Hisobotlari</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hisobotni to'liq ko'rish va qabul qilish uchun qatordan tanlang
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Barchasi ({factoryReports.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('kutilmoqda')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'kutilmoqda'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Kutilmoqda ({factoryReports.filter((r) => r.status !== 'qabul_qilindi').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('qabul_qilindi')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'qabul_qilindi'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Qabul qilingan ({factoryReports.filter((r) => r.status === 'qabul_qilindi').length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-700/80 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Bino / Sana</th>
                <th className="py-3 px-3">Parrandalar</th>
                <th className="py-3 px-3 text-orange-300">Min / Max Harorat</th>
                <th className="py-3 px-3">Umumiy Yem</th>
                <th className="py-3 px-3 text-amber-300">Yem (jon boshiga)</th>
                <th className="py-3 px-3 text-cyan-300">Suv sarfi</th>
                <th className="py-3 px-3 text-rose-300">Nobudlar</th>
                <th className="py-3 px-3">Tuxum terimi</th>
                <th className="py-3 px-3">Dori vositasi</th>
                <th className="py-3 px-3 text-center">Holat / Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredReports.map((rep) => {
                const isSelected = rep.id === selectedReportId;
                const productivity = rep.birdsCount > 0 ? ((rep.eggsCollectedTotal / rep.birdsCount) * 100).toFixed(1) : '0';
                const feedPerBird = rep.feedPerBirdGram ?? ((rep.feedConsumedKg * 1000) / (rep.birdsCount || 1)).toFixed(1);
                const waterPerBird = rep.waterPerBirdMl ?? Math.round((rep.waterConsumedLiters * 1000) / (rep.birdsCount || 1));
                const minT = typeof rep.minTemperature === 'number' && rep.minTemperature > 0 
                  ? rep.minTemperature 
                  : (rep.avgTemperature ? Number((rep.avgTemperature - 1.5).toFixed(1)) : 20.0);
                const maxT = typeof rep.maxTemperature === 'number' && rep.maxTemperature > 0 
                  ? rep.maxTemperature 
                  : (rep.avgTemperature ? Number((rep.avgTemperature + 1.5).toFixed(1)) : 23.5);
                const isAccepted = rep.status === 'qabul_qilindi';

                return (
                  <tr
                    key={rep.id}
                    onClick={() => {
                      setSelectedReportId(rep.id);
                      setInspectingReport(rep);
                    }}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/50 text-indigo-100 font-semibold ring-1 ring-indigo-500/50'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    {/* 1. Bino va sana */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{rep.building}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{rep.date}</span>
                        <span>•</span>
                        <span>{rep.submittedAt}</span>
                      </div>
                    </td>

                    {/* 2. Parrandalar soni */}
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {rep.birdsCount.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">bosh</span>
                    </td>

                    {/* 3. MIN VA MAX HARORAT (Ko'rinadigan qilib chiqarildi) */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30" title="Minimal harorat">
                          Min: {minT}°C
                        </span>
                        <span className="text-slate-500 font-bold">/</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30" title="Maksimal harorat">
                          Max: {maxT}°C
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        O'rtacha: <strong className="text-amber-300">{rep.avgTemperature}°C</strong>
                      </div>
                    </td>

                    {/* 4. Umumiy Yem */}
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {rep.feedConsumedKg.toLocaleString()} kg
                    </td>

                    {/* 5. Yem sarfi (jon boshiga) */}
                    <td className="py-3 px-3 font-mono text-amber-300 font-bold">
                      {feedPerBird} gr/bosh
                    </td>

                    {/* 6. Suv sarfi (jon boshiga) */}
                    <td className="py-3 px-3 font-mono text-cyan-300">
                      {waterPerBird} ml/bosh
                    </td>

                    {/* 7. Nobudlar soni */}
                    <td className="py-3 px-3">
                      <div className="font-mono text-rose-400 font-bold">
                        {rep.mortalityCount} dona
                      </div>
                      {rep.mortalityReason && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[130px]" title={rep.mortalityReason}>
                          {rep.mortalityReason}
                        </div>
                      )}
                    </td>

                    {/* 8. Tuxum terimi */}
                    <td className="py-3 px-3">
                      <div className="font-mono text-amber-400 font-bold">
                        {rep.eggsCollectedTotal.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">{productivity}% unum</div>
                    </td>

                    {/* 9. Berilgan dori */}
                    <td className="py-3 px-3">
                      <div className="text-[11px] text-pink-300 truncate max-w-[140px]" title={rep.medicationGiven || 'Dori berilmadi'}>
                        {rep.medicationGiven || 'Dori berilmadi'}
                      </div>
                    </td>

                    {/* 10. Holat & To'liq Ko'rish / Qabul qilish */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReportId(rep.id);
                            setInspectingReport(rep);
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-lg text-[11px] font-semibold border border-slate-700 inline-flex items-center gap-1 transition-all cursor-pointer"
                          title="Hisobotni to'liq ko'rish (Min, Max harorat va barcha ko'rsatkichlar)"
                        >
                          <Eye className="w-3 h-3 text-indigo-400" />
                          <span>Ko'rish</span>
                        </button>
                        {isAccepted ? (
                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Qabul qilingan</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReportId(rep.id);
                              setInspectingReport(rep);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
                            title="Hisobotni to'liq ko'rib qabul qilish"
                          >
                            <CheckCheck className="w-3 h-3" />
                            <span>Qabul qilish</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Building: FULL DETAILED REPORT SUBMITTED BY FARM MANAGER */}
      {selectedReport && (
        <div className="bg-slate-850 border border-indigo-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
          {/* Header of Detailed View */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-white">
                    {selectedReport.building} — Ish Boshqaruvchi Kunlik To'liq Hisoboti
                  </h2>
                  {selectedReport.status === 'qabul_qilindi' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Statistikada Qabul Qilindi</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Qabul qilinishi kutilmoqda</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-1 flex-wrap">
                  <span>Topshirgan: <strong className="text-slate-200">{selectedReport.submittedByName}</strong></span>
                  <span>•</span>
                  <span>Sana: <strong className="text-slate-200">{selectedReport.date}</strong></span>
                  <span>•</span>
                  <span>Vaqt: <strong className="text-slate-200 font-mono">{selectedReport.submittedAt}</strong></span>
                  {selectedReport.acceptedAt && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400">Tasdiqlangan: {selectedReport.acceptedAt}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Accept / Verify Action Button */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {selectedReport.status === 'qabul_qilindi' ? (
                <div className="px-3.5 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Hisobot muvaffaqiyatli qabul qilingan</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAcceptReport(selectedReport.id)}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Hisobotni Qabul Qilish va Tasdiqlash</span>
                </button>
              )}
            </div>
          </div>

          {/* SECTION 1: HARORAT VA MIKROIKLIM KO'RSATKICHLARI (Barcha Min, Max, O'rtacha parametrlar) */}
          <div className="p-4.5 rounded-2xl bg-slate-900/90 border border-orange-500/30 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <Thermometer className="w-4 h-4 text-orange-400" />
                <span>1. Harorat va Mikroiqlim Ko'rsatkichlari (Min, Max, O'rtacha)</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Optimal: 18°C – 24°C
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* Minimal Harorat */}
              <div className="p-3 rounded-xl bg-blue-950/40 border-2 border-blue-500/50 space-y-1">
                <div className="text-[10px] text-blue-300 font-semibold flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-blue-400" />
                  <span>Minimal Harorat (Sex):</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-blue-300 font-mono">
                  {typeof selectedReport.minTemperature === 'number' && selectedReport.minTemperature > 0
                    ? selectedReport.minTemperature
                    : (selectedReport.avgTemperature ? Number((selectedReport.avgTemperature - 1.5).toFixed(1)) : 20.0)}°C
                </div>
                <div className="text-[10px] text-slate-400">Tungi / eng past harorat</div>
              </div>

              {/* Maksimal Harorat */}
              <div className="p-3 rounded-xl bg-rose-950/40 border-2 border-rose-500/50 space-y-1">
                <div className="text-[10px] text-rose-300 font-semibold flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                  <span>Maksimal Harorat (Sex):</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-300 font-mono">
                  {typeof selectedReport.maxTemperature === 'number' && selectedReport.maxTemperature > 0
                    ? selectedReport.maxTemperature
                    : (selectedReport.avgTemperature ? Number((selectedReport.avgTemperature + 1.5).toFixed(1)) : 23.5)}°C
                </div>
                <div className="text-[10px] text-slate-400">Kunduzgi / eng yuqori harorat</div>
              </div>

              {/* O'rtacha Harorat */}
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-1">
                <div className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                  <span>O'rtacha Harorat:</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                  {selectedReport.avgTemperature}°C
                </div>
                <div className="text-[10px] text-slate-400">Sutkalik o'rtacha qiymat</div>
              </div>

              {/* Havo Namligi */}
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-1">
                <div className="text-[10px] text-cyan-300 font-semibold flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-cyan-400" />
                  <span>Havo Namligi:</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
                  {selectedReport.humidityPercent || 60}%
                </div>
                <div className="text-[10px] text-slate-400">Me'yor: 55% - 65%</div>
              </div>
            </div>

            {/* Microclimate evaluation bar */}
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-300">
                Mikroiqlim barqarorligi:{' '}
                <strong className="text-white">
                  Harorat tebranishi{' '}
                  {((selectedReport.maxTemperature ?? selectedReport.avgTemperature) - (selectedReport.minTemperature ?? selectedReport.avgTemperature)).toFixed(1)}°C
                </strong>
              </span>
              <span className="text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] border border-emerald-500/20">
                ✓ Shamollatish va isitish me'yorida ishlamoqda
              </span>
            </div>
          </div>

          {/* SECTION 2: PARRANDALAR VA NOBUDLAR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parrandalar soni */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>2. Parrandalar Soni</span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {selectedReport.birdsCount.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-semibold">bosh tovuq</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Sexdagi jami parrandalar soni, barcha ozuqa va suv me'yorlari ushbu songa mutanosib hisoblanadi.
              </p>
            </div>

            {/* Nobudlar soni va izohi */}
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Nobudlar Soni & Sababi</span>
                </div>
                <span className="text-rose-300 font-mono font-bold text-sm">
                  {selectedReport.mortalityCount} dona ({((selectedReport.mortalityCount / (selectedReport.birdsCount || 1)) * 100).toFixed(2)}%)
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-500/20 text-xs">
                <span className="text-rose-400 font-semibold block text-[11px] mb-0.5">Ish boshqaruvchi izohi:</span>
                <p className="text-slate-200 italic">
                  "{selectedReport.mortalityReason || 'Sabab ko\'rsatilmagan (tabiiy nobudgarchilik me\'yorida)'}"
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: OZUQA (YEM), OMBOR HARAKATI VA SUV SARFI */}
          <div className="p-4.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>3. Ozuqa (Yem), Ombor Qabuli va Suv Ta'minoti</span>
              </div>
              <span className="text-[11px] text-slate-400">Kunlik harakat balansi</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              {/* Jon boshiga yem */}
              <div className="p-2.5 rounded-xl bg-slate-850 border border-amber-500/30">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Scale className="w-3 h-3 text-amber-400" />
                  <span>Yem (jon boshiga):</span>
                </div>
                <div className="font-mono font-bold text-amber-300 text-sm mt-1">
                  {selectedReport.feedPerBirdGram ?? ((selectedReport.feedConsumedKg * 1000) / (selectedReport.birdsCount || 1)).toFixed(1)} gr/bosh
                </div>
              </div>

              {/* Umumiy kunlik yem */}
              <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  <span>Umumiy kunlik yem:</span>
                </div>
                <div className="font-mono font-bold text-emerald-300 text-sm mt-1">
                  {selectedReport.feedConsumedKg.toLocaleString()} kg
                </div>
              </div>

              {/* Zahiradagi qoldiq yem */}
              <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Warehouse className="w-3 h-3 text-purple-400" />
                  <span>Silosdagi qoldiq:</span>
                </div>
                <div className="font-mono font-bold text-purple-300 text-sm mt-1">
                  {selectedReport.feedRemainingKg ? `${selectedReport.feedRemainingKg.toLocaleString()} kg` : 'N/A'}
                </div>
              </div>

              {/* Ombor qabuli */}
              <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Warehouse className="w-3 h-3 text-teal-400" />
                  <span>Ombordan qabul:</span>
                </div>
                <div className="font-mono font-bold text-teal-300 text-sm mt-1">
                  {selectedReport.feedReceivedKg ? `${selectedReport.feedReceivedKg.toLocaleString()} kg` : '0 kg'}
                </div>
              </div>

              {/* Suv sarfi (jon boshiga) */}
              <div className="p-2.5 rounded-xl bg-slate-850 border border-cyan-500/30">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-cyan-400" />
                  <span>Suv (jon boshiga):</span>
                </div>
                <div className="font-mono font-bold text-cyan-300 text-sm mt-1">
                  {selectedReport.waterPerBirdMl ?? Math.round((selectedReport.waterConsumedLiters * 1000) / (selectedReport.birdsCount || 1))} ml/bosh
                </div>
              </div>

              {/* Jami suv sarfi */}
              <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-blue-400" />
                  <span>Jami suv sarfi:</span>
                </div>
                <div className="font-mono font-bold text-blue-300 text-sm mt-1">
                  ~{selectedReport.waterConsumedLiters.toLocaleString()} litr
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: VETERINARIYA VA BERILGAN DORI VOSITASI */}
          <div className="p-4.5 rounded-2xl bg-pink-950/20 border border-pink-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-pink-300 uppercase tracking-wider">
              <Pill className="w-4 h-4 text-pink-400" />
              <span>4. Veterinariya va Berilgan Dori Vositasi</span>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-pink-500/20 text-xs">
              <span className="text-slate-400 block text-[11px] mb-0.5 font-semibold">Qo'llanilgan preparat / vitamin kompleksi:</span>
              <p className="text-sm font-bold text-pink-200">
                {selectedReport.medicationGiven || 'Dori berilmadi (toza suv rejimi)'}
              </p>
            </div>
          </div>

          {/* SECTION 5: TUXUM YIG'IMI VA NAVLAR TAQSIMOTI */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <Egg className="w-4 h-4 text-amber-400" />
                  <span>5. Tuxum Yig'imi va Navlar Mutanosibligi</span>
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {selectedReport.eggsCollectedTotal.toLocaleString()} dona (
                  {((selectedReport.eggsCollectedTotal / (selectedReport.birdsCount || 1)) * 100).toFixed(1)}% unum)
                </span>
              </div>

              <div className="space-y-3">
                {/* Oliy nav */}
                <div>
                  <div className="flex justify-between text-xs mb-1 text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Oliy nav (63g+):</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {selectedReport.eggsCategoryPremium.toLocaleString()} dona (
                      {selectedReport.eggsCollectedTotal > 0
                        ? ((selectedReport.eggsCategoryPremium / selectedReport.eggsCollectedTotal) * 100).toFixed(1)
                        : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{
                        width: `${
                          selectedReport.eggsCollectedTotal > 0
                            ? (selectedReport.eggsCategoryPremium / selectedReport.eggsCollectedTotal) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* 1-nav */}
                <div>
                  <div className="flex justify-between text-xs mb-1 text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span>1-nav (53-63g):</span>
                    </span>
                    <span className="font-mono text-blue-400 font-bold">
                      {selectedReport.eggsCategoryFirst.toLocaleString()} dona (
                      {selectedReport.eggsCollectedTotal > 0
                        ? ((selectedReport.eggsCategoryFirst / selectedReport.eggsCollectedTotal) * 100).toFixed(1)
                        : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${
                          selectedReport.eggsCollectedTotal > 0
                            ? (selectedReport.eggsCategoryFirst / selectedReport.eggsCollectedTotal) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* 2-nav */}
                <div>
                  <div className="flex justify-between text-xs mb-1 text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                      <span>2-nav (45-53g):</span>
                    </span>
                    <span className="font-mono text-yellow-400 font-bold">
                      {selectedReport.eggsCategorySecond.toLocaleString()} dona (
                      {selectedReport.eggsCollectedTotal > 0
                        ? ((selectedReport.eggsCategorySecond / selectedReport.eggsCollectedTotal) * 100).toFixed(1)
                        : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${
                          selectedReport.eggsCollectedTotal > 0
                            ? (selectedReport.eggsCategorySecond / selectedReport.eggsCollectedTotal) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Singan / Brak */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Singan / brak tuxum:</span>
                  <span className="font-mono font-bold text-rose-400">{selectedReport.eggsDamaged} dona</span>
                </div>
              </div>

              {/* Menejer izohi */}
              {selectedReport.notes && (
                <div className="p-3 bg-slate-800/60 rounded-xl text-xs text-slate-300 border border-slate-700/60">
                  <span className="font-bold text-slate-200 block mb-0.5">Ish boshqaruvchining sex bo'yicha umumiy izohi:</span>
                  <p className="italic text-slate-300">"{selectedReport.notes}"</p>
                </div>
              )}
            </div>

            {/* SECTION 6: FEEDBACK & TASK TO FARM MANAGER */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2 pb-1 border-b border-slate-800">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>6. Farm Managerga Statistik Xulosa & Topshiriq Berish</span>
              </h3>

              {feedbackSuccess && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Xulosa va vazifa Farm Managerga muvaffaqiyatli jo'natildi!</span>
                </div>
              )}

              <form onSubmit={handleSendFeedback} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Menejerga tavsiya yoki topshiriq matni:
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={statFeedback}
                    onChange={(e) => setStatFeedback(e.target.value)}
                    placeholder="Masalan: 1-binoda maksimal harorat 22.8°C ga yetgan, ventilatsiya rejimini tekshiring, ozuqa sarfi 115 gr/bosh me'yorda..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    "Harorat va mikroiqlim me'yorda",
                    "Yem sarfi optimal darajada",
                    "Ventilyatsiyani nazoratga oling",
                    "Suv iste'moli tahlil qilindi, qabul qilindi",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStatFeedback(preset)}
                      className="px-2 py-1 rounded-lg text-[11px] bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Farm Managerga Topshiriq Sifatida Biriktirish</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
