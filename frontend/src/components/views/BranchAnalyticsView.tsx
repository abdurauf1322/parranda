import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BranchId, EnterpriseBranch } from '../../types';
import { ROLE_LABELS } from '../../data/mockData';
import {
  Building2,
  Users,
  Egg,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpDown,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  Thermometer,
  Droplets,
  Wheat,
  Activity,
  ChevronRight,
  ShieldCheck,
  Download,
  Info,
  UserCheck,
  RefreshCw,
  Search,
  ClipboardList
} from 'lucide-react';

export const BranchAnalyticsView: React.FC = () => {
  const {
    branches,
    users,
    attendanceRecords,
    tasks,
    branchMetrics,
    updateBranchMetrics,
    farmCurrentTime,
    setActiveTab,
  } = useApp();

  // Active view: 'all' (Taqqoslama tahlil) or specific branchId
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'layingRate' | 'attendance' | 'totalEggs' | 'birds'>('layingRate');
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBranchId, setEditingBranchId] = useState<BranchId | null>(null);
  const [editFormData, setEditFormData] = useState({
    eggsCollected: 0,
    layingRatePercent: 0,
    feedConsumedKg: 0,
    mortalityCount: 0,
  });

  // Calculate live branch performance stats
  const branchAnalyticsData = useMemo(() => {
    return branches.map((branch, index) => {
      // 1. Employees in this branch
      const branchUsers = users.filter((u) => u.branchId === branch.id);
      const totalEmployees = branchUsers.length;

      // 2. Attendance for this branch today
      const userIds = branchUsers.map((u) => u.id);
      const todayAttendance = attendanceRecords.filter((a) => userIds.includes(a.userId));
      const presentCount = todayAttendance.filter((a) => a.status === 'keldi' || a.status === 'orinbosar_bilan').length;
      const substitutionCount = todayAttendance.filter((a) => a.isSubstitution).length;
      const attendancePercent = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 100;

      // 3. Productivity metrics from store or fallback
      const metric = branchMetrics[branch.id] || {
        branchId: branch.id,
        date: '2026-10-01',
        totalBirds: branch.capacityBirds * 0.9,
        eggsCollected: Math.round(branch.capacityBirds * 0.9 * 0.92),
        layingRatePercent: 92.0,
        feedConsumedKg: Math.round(branch.capacityBirds * 0.11),
        feedConversionFcr: 1.23,
        waterConsumedLiters: Math.round(branch.capacityBirds * 0.23),
        mortalityCount: 6,
        mortalityRatePercent: 0.005,
        damagedEggsCount: 80,
        damagedEggsPercent: 0.08,
        avgTemperature: 21.6,
        avgHumidity: 60,
        tasksCompletedPercent: 92,
      };

      // 4. Tasks assigned or completed
      const branchTasks = tasks.filter((t) =>
        t.building?.toLowerCase().includes(branch.name.toLowerCase()) ||
        branchUsers.some((u) => u.role === t.assignedToRole)
      );
      const completedTasks = branchTasks.filter((t) => t.status === 'bajarildi').length;
      const taskSuccessRate = branchTasks.length > 0 ? Math.round((completedTasks / branchTasks.length) * 100) : metric.tasksCompletedPercent;

      // Overall composite productivity score (100 scale)
      // Weighted: 45% egg laying rate + 30% attendance + 15% tasks completion + 10% low mortality
      const compositeScore = Number(
        (metric.layingRatePercent * 0.45 + attendancePercent * 0.3 + taskSuccessRate * 0.15 + (100 - metric.mortalityRatePercent * 1000) * 0.1).toFixed(1)
      );

      return {
        branch,
        metric,
        employees: branchUsers,
        totalEmployees,
        presentCount,
        substitutionCount,
        attendancePercent,
        taskSuccessRate,
        compositeScore,
        ranking: index + 1, // Will be computed after sort
      };
    });
  }, [branches, users, attendanceRecords, tasks, branchMetrics]);

  // Sort branches
  const sortedBranches = useMemo(() => {
    const list = [...branchAnalyticsData];
    list.sort((a, b) => {
      if (sortBy === 'layingRate') return b.metric.layingRatePercent - a.metric.layingRatePercent;
      if (sortBy === 'attendance') return b.attendancePercent - a.attendancePercent;
      if (sortBy === 'totalEggs') return b.metric.eggsCollected - a.metric.eggsCollected;
      if (sortBy === 'birds') return b.metric.totalBirds - a.metric.totalBirds;
      return b.compositeScore - a.compositeScore;
    });

    // Assign ranking based on composite performance
    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [branchAnalyticsData, sortBy]);

  // Enterprise totals across all branches
  const enterpriseTotals = useMemo(() => {
    let totalBirds = 0;
    let totalCapacity = 0;
    let totalEggs = 0;
    let totalFeedKg = 0;
    let totalEmployees = 0;
    let totalPresent = 0;
    let totalSubstitutions = 0;
    let totalMortality = 0;

    sortedBranches.forEach((b) => {
      totalBirds += b.metric.totalBirds;
      totalCapacity += b.branch.capacityBirds;
      totalEggs += b.metric.eggsCollected;
      totalFeedKg += b.metric.feedConsumedKg;
      totalEmployees += b.totalEmployees;
      totalPresent += b.presentCount;
      totalSubstitutions += b.substitutionCount;
      totalMortality += b.metric.mortalityCount;
    });

    const avgLayingRate = totalBirds > 0 ? ((totalEggs / totalBirds) * 100).toFixed(1) : '92.4';
    const overallAttendance = totalEmployees > 0 ? Math.round((totalPresent / totalEmployees) * 100) : 100;
    const avgFcr = totalEggs > 0 ? ((totalFeedKg / (totalEggs / 10))).toFixed(2) : '1.23';

    return {
      totalBirds,
      totalCapacity,
      totalEggs,
      totalFeedKg,
      totalEmployees,
      totalPresent,
      totalSubstitutions,
      totalMortality,
      avgLayingRate,
      overallAttendance,
      avgFcr,
    };
  }, [sortedBranches]);

  // Active branch for detailed view
  const activeDetail = useMemo(() => {
    if (selectedBranchId === 'all') return null;
    return sortedBranches.find((b) => b.branch.id === selectedBranchId) || sortedBranches[0];
  }, [selectedBranchId, sortedBranches]);

  // Filtered branches for list
  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return sortedBranches;
    const q = searchQuery.toLowerCase();
    return sortedBranches.filter(
      (b) =>
        b.branch.name.toLowerCase().includes(q) ||
        b.branch.code.toLowerCase().includes(q) ||
        b.branch.location.toLowerCase().includes(q) ||
        b.branch.managerName.toLowerCase().includes(q)
    );
  }, [sortedBranches, searchQuery]);

  // Open edit modal for quick adjustments by manager
  const handleOpenEdit = (branch: EnterpriseBranch, metric: any) => {
    setEditingBranchId(branch.id);
    setEditFormData({
      eggsCollected: metric.eggsCollected,
      layingRatePercent: metric.layingRatePercent,
      feedConsumedKg: metric.feedConsumedKg,
      mortalityCount: metric.mortalityCount,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranchId) return;
    updateBranchMetrics(editingBranchId, {
      eggsCollected: Number(editFormData.eggsCollected),
      layingRatePercent: Number(editFormData.layingRatePercent),
      feedConsumedKg: Number(editFormData.feedConsumedKg),
      mortalityCount: Number(editFormData.mortalityCount),
    });
    setEditingBranchId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Control Center */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
              <Building2 className="w-3.5 h-3.5" />
              <span>5 ta Filial Bo'yicha Boshqaruv & Tahlil Paneli</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              «UYCHI PARRANDA» Filiallar Analitikasi
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl mt-1.5 leading-relaxed font-normal">
              Har bir filialning umumiy ish faoliyati, xodimlar davomati intizomi, tuxum yetishtirish mahsuldorligi,
              ozuqaviy konversiya va topshiriqlar unumdorligini qiyosiy solishtirish tizimi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Period Switcher */}
            <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs">
              <button
                onClick={() => setPeriod('today')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  period === 'today'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bugun
              </button>
              <button
                onClick={() => setPeriod('week')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  period === 'week'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Haftalik
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  period === 'month'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Oylik
              </button>
            </div>

            {/* Print / Export report */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:border-slate-600"
              title="Analitika hisobotini chop etish yoki PDF shaklida saqlash"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Hisobot (PDF)</span>
            </button>
          </div>
        </div>

        {/* Enterprise KPI Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          {/* 1. Branches Count */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Jami Filiallar</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">5 ta</div>
            <div className="text-[10px] text-amber-400 font-medium mt-1">Uychi, Chortoq, Pop...</div>
          </div>

          {/* 2. Overall Attendance */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Umumiy Davomat</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {enterpriseTotals.overallAttendance}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {enterpriseTotals.totalPresent}/{enterpriseTotals.totalEmployees} xodim ishda
            </div>
          </div>

          {/* 3. Total Birds */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Parrandalar</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {(enterpriseTotals.totalBirds / 1000).toFixed(0)}k
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Sig'im: {(enterpriseTotals.totalCapacity / 1000).toFixed(0)}k bosh
            </div>
          </div>

          {/* 4. Daily Total Eggs */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Kunlik Tuxum</span>
              <Egg className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400">
              {enterpriseTotals.totalEggs.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400 font-medium mt-1">
              Mahsuldorlik: {enterpriseTotals.avgLayingRate}%
            </div>
          </div>

          {/* 5. Daily Total Feed */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Kunlik Yem</span>
              <Wheat className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {(enterpriseTotals.totalFeedKg / 1000).toFixed(1)} tn
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              FCR: {enterpriseTotals.avgFcr} kg/10 tuxum
            </div>
          </div>

          {/* 6. Overall Performance Grade */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Korxona Holati</span>
              <Award className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-400">A'lo (96%)</div>
            <div className="text-[10px] text-emerald-400 font-medium mt-1">Yuqori rentabellik</div>
          </div>
        </div>
      </div>

      {/* Branch Selector Tabs (Barcha Filiallar Taqqoslami vs Alohida Filial) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedBranchId('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
            selectedBranchId === 'all'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Barcha Filiallar Taqqoslami (5 ta)</span>
        </button>

        {branches.map((b) => {
          const isSelected = selectedBranchId === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setSelectedBranchId(b.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{b.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {b.code}
              </span>
            </button>
          );
        })}
      </div>

      {/* VIEW MODE 1: COMPARISON OF ALL BRANCHES (Taqqoslama tahlil) */}
      {selectedBranchId === 'all' ? (
        <div className="space-y-6">
          {/* Controls Bar: Sort, Search, Filter */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                Saralash:
              </span>
              <button
                onClick={() => setSortBy('layingRate')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                  sortBy === 'layingRate'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Mahsuldorlik bo'yicha
              </button>
              <button
                onClick={() => setSortBy('attendance')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                  sortBy === 'attendance'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Davomat bo'yicha
              </button>
              <button
                onClick={() => setSortBy('totalEggs')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                  sortBy === 'totalEggs'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Tuxum hajmi bo'yicha
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filial yoki rahbar nomi..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Visual Comparison Grid (Cards for each of the 5 branches) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredBranches.map((item) => {
              const { branch, metric, totalEmployees, presentCount, substitutionCount, attendancePercent, rank } = item;

              // Rank medal colors
              const isFirst = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;

              return (
                <div
                  key={branch.id}
                  className={`bg-slate-900 border rounded-3xl p-5 sm:p-6 transition-all relative overflow-hidden flex flex-col justify-between hover:shadow-2xl hover:border-slate-700 ${
                    isFirst
                      ? 'border-amber-500/40 shadow-lg shadow-amber-500/5 bg-gradient-to-b from-amber-500/5 to-slate-900'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Top Bar: Code, Name, Rank Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                            {branch.code}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {branch.buildingsCount} ta bino
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white mt-1.5 tracking-tight">
                          {branch.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                          <span>Rahbar:</span>
                          <strong className="text-slate-300 font-semibold">{branch.managerName}</strong>
                        </p>
                      </div>

                      {/* Rank Medal Badge */}
                      <div
                        className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center shrink-0 border font-black shadow-md ${
                          isFirst
                            ? 'bg-amber-500 text-slate-950 border-yellow-300 shadow-amber-500/30'
                            : isSecond
                            ? 'bg-slate-300 text-slate-950 border-white'
                            : isThird
                            ? 'bg-amber-700 text-white border-amber-600'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <span className="text-[9px] uppercase leading-none font-bold">O'rin</span>
                        <span className="text-sm font-black leading-none mt-0.5">#{rank}</span>
                      </div>
                    </div>

                    {/* Progress Metrics: Davomat vs Mahsuldorlik */}
                    <div className="space-y-4 my-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-750">
                      {/* Metric 1: DAVOMAT KO'RSATKICHI */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-400 font-medium flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            Davomat Ko'rsatkichi:
                          </span>
                          <span className="font-extrabold text-emerald-400 font-mono text-sm">
                            {attendancePercent}%
                          </span>
                        </div>
                        {/* Visual Progress Bar */}
                        <div className="w-full h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              attendancePercent >= 90
                                ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                : attendancePercent >= 75
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                : 'bg-gradient-to-r from-rose-500 to-red-400'
                            }`}
                            style={{ width: `${attendancePercent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                          <span>Bugun kelgan: {presentCount}/{totalEmployees} xodim</span>
                          {substitutionCount > 0 && (
                            <span className="text-purple-300 font-medium font-mono">
                              ({substitutionCount} o'rinbosar)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metric 2: MAHSULDORLIK (TUXUM BERISH DARAJASI) */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-400 font-medium flex items-center gap-1.5">
                            <Egg className="w-3.5 h-3.5 text-amber-400" />
                            Tuxum Mahsuldorligi:
                          </span>
                          <span className="font-extrabold text-amber-400 font-mono text-sm">
                            {metric.layingRatePercent}%
                          </span>
                        </div>
                        {/* Visual Progress Bar */}
                        <div className="w-full h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500"
                            style={{ width: `${Math.min(100, metric.layingRatePercent)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                          <span>Kunlik yig'im: <strong className="text-slate-200">{metric.eggsCollected.toLocaleString()}</strong> dona</span>
                          <span>{metric.totalBirds.toLocaleString()} qush</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats Grid for Branch */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-medium">Kunlik Yem Sarfi</div>
                        <div className="font-bold text-white mt-0.5">{metric.feedConsumedKg.toLocaleString()} kg</div>
                        <div className="text-[10px] text-slate-400">FCR: {metric.feedConversionFcr} kg/10t</div>
                      </div>

                      <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-medium">Nobud Bo'lish (O'lim)</div>
                        <div className="font-bold text-slate-200 mt-0.5">{metric.mortalityCount} ta ({metric.mortalityRatePercent}%)</div>
                        <div className="text-[10px] text-emerald-400">Me'yor darajasida</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedBranchId(branch.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <span>Alohida Chuqur Tahlil</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(branch, metric)}
                      title="Bugungi ko'rsatkichlarni tahrirlash"
                      className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700/80 rounded-xl transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side-by-Side Detailed Comparative Table (Solishtirma Tahlil Jadvali) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  Filiallar Ish Faoliyati Solishtirma Jadvali
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Har bir filialning barcha asosiy parametrlarini bitta jadvalda solishtirish
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800/30">
                    <th className="py-3 px-3">O'rni</th>
                    <th className="py-3 px-4">Filial & Rahbari</th>
                    <th className="py-3 px-4 text-center">Xodimlar / Davomat</th>
                    <th className="py-3 px-4 text-center">Qushlar Soni</th>
                    <th className="py-3 px-4 text-center">Kunlik Tuxum</th>
                    <th className="py-3 px-4 text-center">Mahsuldorlik %</th>
                    <th className="py-3 px-4 text-center">Yem (FCR)</th>
                    <th className="py-3 px-4 text-center">Holati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedBranches.map((item) => {
                    const { branch, metric, totalEmployees, presentCount, attendancePercent, rank } = item;
                    return (
                      <tr
                        key={branch.id}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedBranchId(branch.id)}
                      >
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                            rank === 1
                              ? 'bg-amber-500 text-slate-950'
                              : rank === 2
                              ? 'bg-slate-300 text-slate-950'
                              : rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-white text-sm">{branch.name}</div>
                          <div className="text-[11px] text-slate-400">{branch.managerName} ({branch.code})</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-bold text-emerald-400 text-sm">{attendancePercent}%</div>
                          <div className="text-[11px] text-slate-400">{presentCount}/{totalEmployees} nafar</div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-200">
                          {metric.totalBirds.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-300">
                          {metric.eggsCollected.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg font-black text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            {metric.layingRatePercent}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                          <div>{(metric.feedConsumedKg / 1000).toFixed(1)} tn</div>
                          <div className="text-[10px] text-slate-500">{metric.feedConversionFcr} kg/10t</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            rank === 1
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {rank === 1 ? 'Yetakchi' : 'Barqaror'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeDetail ? (
        /* VIEW MODE 2: SINGLE BRANCH DEEP-DIVE ANALYSIS */
        <div className="space-y-6">
          {/* Back button & Branch Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => setSelectedBranchId('all')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 mb-2 cursor-pointer"
                >
                  <span>← Barcha Filiallar Solishtirmasiga Qaytish</span>
                </button>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-white">{activeDetail.branch.name}</h2>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
                    {activeDetail.branch.code}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                    Reyting: #{activeDetail.rank}-o'rin
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>📍 {activeDetail.branch.location}</span>
                  <span>•</span>
                  <span>📞 {activeDetail.branch.phone}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTab('operational_plan')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Kundalik Operativ Rejani Ochish</span>
                </button>

                <button
                  onClick={() => handleOpenEdit(activeDetail.branch, activeDetail.metric)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ko'rsatkichlarni Yangilash</span>
                </button>
              </div>
            </div>

            {/* Individual Branch Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800">
              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750">
                <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Davomat Intizomi
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {activeDetail.attendancePercent}%
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {activeDetail.presentCount}/{activeDetail.totalEmployees} xodim kelgan
                </div>
              </div>

              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750">
                <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Egg className="w-3.5 h-3.5 text-amber-400" />
                  Tuxum Mahsuldorligi
                </div>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {activeDetail.metric.layingRatePercent}%
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {activeDetail.metric.eggsCollected.toLocaleString()} dona / kun
                </div>
              </div>

              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750">
                <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Wheat className="w-3.5 h-3.5 text-yellow-400" />
                  Yem Konversiyasi
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {activeDetail.metric.feedConversionFcr}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Jami yem: {(activeDetail.metric.feedConsumedKg / 1000).toFixed(1)} tonna
                </div>
              </div>

              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750">
                <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                  Mikroiqlim Harorati
                </div>
                <div className="text-2xl font-black text-cyan-400 mt-1">
                  {activeDetail.metric.avgTemperature}°C
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Namlik: {activeDetail.metric.avgHumidity}%
                </div>
              </div>
            </div>
          </div>

          {/* Section: Filial Xodimlari va Bugungi Davomati (Attendance & Staff Detail) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Filial Xodimlari va Bugungi Davomat Holati ({activeDetail.totalEmployees} nafar)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ushbu filialga biriktirilgan xodimlarning ishga kelish va o'rinbosarlik qaydlari
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                Davomat: {activeDetail.attendancePercent}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeDetail.employees.map((emp) => {
                const roleConfig = ROLE_LABELS[emp.role];
                const empAtt = attendanceRecords.find((a) => a.userId === emp.id);
                const isPresent = empAtt && (empAtt.status === 'keldi' || empAtt.status === 'orinbosar_bilan');

                return (
                  <div
                    key={emp.id}
                    className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-750 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                        {emp.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{emp.fullName}</div>
                        <div className="text-[10px] text-amber-400 font-medium">
                          {roleConfig?.short || emp.role}
                        </div>
                        <div className="text-[10px] text-slate-400">{emp.phone || 'Telefon yo‘q'}</div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isPresent ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{empAtt.checkInTime.slice(0, 5)}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Kelmagan</span>
                        </div>
                      )}
                      {empAtt?.isSubstitution && (
                        <div className="text-[9px] text-purple-300 font-bold mt-0.5">O'rinbosar</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Quick Edit Modal for Branch Metrics */}
      {editingBranchId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Filial Ko'rsatkichlarini Tahrirlash
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Bugungi operativ ishlab chiqarish parametrlarini yangilang:
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Kunlik Tuxum Yig'imi (dona):
                </label>
                <input
                  type="number"
                  value={editFormData.eggsCollected}
                  onChange={(e) => setEditFormData({ ...editFormData, eggsCollected: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Mahsuldorlik Foizi (Tuxum qo'yish %):
                </label>
                <input
                  type="number"
                  step="0.1"
                  max="100"
                  value={editFormData.layingRatePercent}
                  onChange={(e) => setEditFormData({ ...editFormData, layingRatePercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Kunlik Yem Sarfi (kg):
                </label>
                <input
                  type="number"
                  value={editFormData.feedConsumedKg}
                  onChange={(e) => setEditFormData({ ...editFormData, feedConsumedKg: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Nobud Bo'lish (bosh):
                </label>
                <input
                  type="number"
                  value={editFormData.mortalityCount}
                  onChange={(e) => setEditFormData({ ...editFormData, mortalityCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBranchId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
