import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/mockData';
import {
  UserCheck,
  Clock,
  Users,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AttendanceView: React.FC<{ onOpenAttendanceModal: () => void }> = ({ onOpenAttendanceModal }) => {
  const { attendanceRecords, users } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = attendanceRecords.filter((a) =>
    a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.substituteWorkerName && a.substituteWorkerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-emerald-950/40 p-6 rounded-3xl border border-teal-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Kunlik Fabrika Davomat Jurnali
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Kelish vaqti, kechikishlar va xodimlarni almashtiruvchi (Substitution) qaydlari
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAttendanceModal}
          className="self-start md:self-auto px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all"
        >
          <UserCheck className="w-4 h-4" />
          <span>Kelishni Qayd Etish (Check-in)</span>
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block mb-1">Jami xodimlar:</span>
          <span className="text-2xl font-black text-white">{users.length} nafar</span>
        </div>
        <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block mb-1">Bugun kelganlar:</span>
          <span className="text-2xl font-black text-emerald-400">{attendanceRecords.length} nafar</span>
        </div>
        <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block mb-1">O'rinbosar bilan:</span>
          <span className="text-2xl font-black text-purple-400">
            {attendanceRecords.filter((a) => a.isSubstitution).length} nafar
          </span>
        </div>
        <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block mb-1">Davomat unumi:</span>
          <span className="text-2xl font-black text-amber-400">
            {((attendanceRecords.length / users.length) * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Xodim ismi bo'yicha qidirish..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <span className="text-xs text-slate-400">{filtered.length} ta yozuv</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700/80 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Xodim (Ism va Familiya)</th>
                <th className="py-3 px-3">Lavozim</th>
                <th className="py-3 px-3">Kelish vaqti</th>
                <th className="py-3 px-3">Rejim</th>
                <th className="py-3 px-3">Asl xodim / O'rinbosar</th>
                <th className="py-3 px-3">Izoh</th>
                <th className="py-3 px-3">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-white">{r.userName}</td>
                  <td className="py-3 px-3 text-slate-300">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-semibold border border-slate-700 text-amber-400">
                      {ROLE_LABELS[r.role]?.short || r.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-amber-400 font-bold">{r.checkInTime}</td>
                  <td className="py-3 px-3">
                    {r.isSubstitution ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        O'rinbosarlik (Almashuv)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                        Asl xodim
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-300 text-[11px]">
                    {r.isSubstitution ? (
                      <div>
                        <div>Asl: <span className="text-slate-400 font-medium">{r.originalWorkerName}</span></div>
                        <div className="text-purple-300 font-bold">O'rinbosar: {r.substituteWorkerName}</div>
                      </div>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-400 italic text-[11px]">{r.notes || '—'}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Keldi</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
