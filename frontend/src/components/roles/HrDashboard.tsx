import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/mockData';
import { Role, User, BranchId } from '../../types';
import {
  UserCheck,
  UserPlus,
  Users,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Phone,
  Calendar,
  Briefcase,
  Shield,
  Sparkles,
  UserCog,
  Building2,
  MapPin,
  Check,
  Building
} from 'lucide-react';

export const HrDashboard: React.FC = () => {
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    attendanceRecords,
    branches,
    assignUserBranch,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states for Add
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('slesar');
  const [phone, setPhone] = useState('+998 90 ');
  const [department, setDepartment] = useState('Ishlab chiqarish sexi');
  const [branchId, setBranchId] = useState<BranchId>('uychi_bosh');
  const [manualBranchName, setManualBranchName] = useState('');
  const [isManualBranch, setIsManualBranch] = useState(false);
  const [hireDate, setHireDate] = useState('2026-10-01');

  // Form states for Edit
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<Role>('slesar');
  const [editPhone, setEditPhone] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editBranchId, setEditBranchId] = useState<BranchId>('uychi_bosh');
  const [editManualBranchName, setEditManualBranchName] = useState('');
  const [editIsManualBranch, setEditIsManualBranch] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [resetPasswordToDefault, setResetPasswordToDefault] = useState(false);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesBranch = filterBranch === 'all' || u.branchId === filterBranch;
    return matchesSearch && matchesRole && matchesBranch;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const selectedBranch = branches.find((b) => b.id === branchId);

    addUser({
      username: fullName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16),
      fullName: fullName.trim(),
      role,
      phone,
      department,
      branchId,
      branchName: isManualBranch ? manualBranchName : (selectedBranch?.name || 'Bosh Filial (Uychi)'),
      hireDate,
      isActive: true,
    });

    setFullName('');
    setPhone('+998 90 ');
    setIsAddModalOpen(false);
    setIsManualBranch(false);
    setManualBranchName('');
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditUsername(user.username || '');
    setEditRole(user.role);
    setEditPhone(user.phone || '');
    setEditDepartment(user.department || '');
    setEditBranchId(user.branchId || 'uychi_bosh');
    setEditIsActive(user.isActive !== false);
    setResetPasswordToDefault(false);
    setEditIsManualBranch(false);
    setEditManualBranchName('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editFullName.trim()) return;

    const selectedBranch = branches.find((b) => b.id === editBranchId);
    const cleanUsername = editUsername.trim()
      ? editUsername.trim().toLowerCase().replace(/^@+/, '').replace(/\s+/g, '_')
      : editingUser.username;

    updateUser(editingUser.id, {
      fullName: editFullName.trim(),
      username: cleanUsername,
      role: editRole,
      phone: editPhone,
      department: editDepartment,
      branchId: editBranchId,
      branchName: editIsManualBranch ? editManualBranchName : (selectedBranch?.name || 'Bosh Filial'),
      isActive: editIsActive,
      ...(resetPasswordToDefault ? { password: '12345' } : {}),
    });

    setEditingUser(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Haqiqatan ham "${name}" xodimini kadrlar ro'yxatidan o'chirmoqchimisiz?`)) {
      deleteUser(id);
    }
  };

  // Quick branch reassignment direct from table
  const handleQuickBranchChange = (userId: string, newBranchId: BranchId) => {
    assignUserBranch(userId, newBranchId);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-teal-950/50 p-6 rounded-3xl border border-cyan-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <UserCog className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Kadrlar Bo'limi (HR Menejeri) Paneli
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Filiallar & Lavozimlar Boshqaruvi
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              "Uychi parranda" korxonasida 5 ta filial va ko‘p sonli lavozim egalari hisobini yuritish, xodimlarni filiallarga biriktirish
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start md:self-auto px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Yangi Xodim Qo'shish & Filial Belgilash</span>
        </button>
      </div>

      {/* Enterprise Branches Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>"Uychi parranda" Korxonasi Filiallari ({branches.length} ta):</span>
          </h2>
          <span className="text-xs text-slate-400">
            Filiallar bo‘yicha xodimlar taqsimoti
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {branches.map((branch) => {
            const branchWorkers = users.filter((u) => u.branchId === branch.id);
            const isSelected = filterBranch === branch.id;

            return (
              <div
                key={branch.id}
                onClick={() => setFilterBranch(filterBranch === branch.id ? 'all' : branch.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg'
                    : 'bg-slate-850 hover:bg-slate-800 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {branch.code}
                  </span>
                  <span className="text-xs font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-700/80">
                    {branchWorkers.length} xodim
                  </span>
                </div>

                <div className="font-bold text-xs text-white line-clamp-1 mb-1">
                  {branch.name}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="line-clamp-1">{branch.location}</span>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Binolar: {branch.buildingsCount} ta</span>
                  <span className="text-amber-400 font-medium">{(branch.capacityBirds / 1000).toFixed(0)}k qush</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block mb-1">Jami xodimlar:</span>
          <span className="text-2xl font-black text-white">{users.length} nafar</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">5 ta filial kesimida</span>
        </div>
        <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block mb-1">Faol xodimlar:</span>
          <span className="text-2xl font-black text-emerald-400">
            {users.filter((u) => u.isActive !== false).length} nafar
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Tizimga kirish huquqiga ega</span>
        </div>
        <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block mb-1">Bugungi davomat:</span>
          <span className="text-2xl font-black text-amber-400">
            {attendanceRecords.length} / {users.length}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Xodimlar ro'yxatdan o'tdi</span>
        </div>
        <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block mb-1">Lavozimlar soni:</span>
          <span className="text-2xl font-black text-cyan-400">
            {Object.keys(ROLE_LABELS).length} ta
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Bir nechta ishchi ega bo'lishi mumkin</span>
        </div>
      </div>

      {/* Employee List Section */}
      <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        {/* Filters: Search, Branch, Role */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Xodim ismi yoki telefoni bo'yicha..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Branch Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Filial:</span>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="all">Barcha filiallar ({users.length})</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Lavozim:</span>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="all">Barcha lavozimlar</option>
                {Object.keys(ROLE_LABELS).map((roleKey) => (
                  <option key={roleKey} value={roleKey}>
                    {ROLE_LABELS[roleKey as Role].title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Workers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700/80 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Xodim (Ism va Familiya)</th>
                <th className="py-3 px-3">Biriktirilgan Filial</th>
                <th className="py-3 px-3">Lavozimi (Rol)</th>
                <th className="py-3 px-3">Telefon</th>
                <th className="py-3 px-3">Bo'lim / Sex</th>
                <th className="py-3 px-3">Holati</th>
                <th className="py-3 px-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((user) => {
                const roleConfig = ROLE_LABELS[user.role];
                return (
                  <tr key={user.id} className="hover:bg-slate-800/60 transition-colors">
                    {/* Full Name & ID & Username */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-white text-sm">{user.fullName}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-amber-300 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-750">
                          @{user.username}
                        </span>
                        <span className="text-[10px] text-slate-500">ID: {user.id}</span>
                      </div>
                    </td>

                    {/* Branch Assignment with Quick Selector for HR */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.branchId || 'uychi_bosh'}
                          onChange={(e) => handleQuickBranchChange(user.id, e.target.value as BranchId)}
                          className="px-2.5 py-1 bg-slate-900 border border-cyan-500/30 rounded-lg text-xs font-semibold text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                          title="Kadrlar xodimi: Xodim qaysi filialda ishlashini to'g'ridan-to'g'ri o'zgartirish"
                        >
                          {branches.map((b) => (
                            <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${roleConfig?.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                        {roleConfig?.title || user.role}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-3 font-mono text-slate-300">
                      {user.phone || '—'}
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-3 text-slate-300">
                      {user.department || 'Ishlab chiqarish'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.isActive !== false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        {user.isActive !== false ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => startEdit(user)}
                          title="Xodim ma'lumotlarini o'zgartirish"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.fullName)}
                          title="Ro'yxatdan o'chirish"
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Worker Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span>Yangi Xodim Ro'yxatdan O'tkazish</span>
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
                  Ism va Familiya (To'liq):
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masalan: Aliyev Botir Anvarovich"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Branch Assignment Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Qaysi filial xodimi:</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-[10px] text-cyan-400 cursor-pointer">
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
                    className="w-full px-3 py-2 bg-slate-800 border border-cyan-500/40 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value as BranchId)}
                    className="w-full px-3 py-2 bg-slate-800 border border-cyan-500/40 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.location})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Role Selection (multiple staff allowed per role) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Lavozimi:
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {Object.keys(ROLE_LABELS).map((roleKey) => (
                    <option key={roleKey} value={roleKey}>
                      {ROLE_LABELS[roleKey as Role].title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Telefon raqami:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Bo'lim / Sex:
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Masalan: 1-Bino parrandachilik sexi"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Ishchini Qo'shish & Filialga Biriktirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Worker Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-cyan-400" />
                <span>Ishchi Ma'lumotlarini O'zgartirish</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Ism va Familiya:
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Shaxsiy Login (Username):</span>
                  <span className="text-[10px] text-amber-400">Kirish uchun login</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="xodim_logini"
                    className="w-full pl-7 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
                  />
                </div>
              </div>

              {/* Edit Branch Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Xodim ishlaydigan Filial:</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-[10px] text-cyan-400 cursor-pointer">
                    <input type="checkbox" checked={editIsManualBranch} onChange={(e) => setEditIsManualBranch(e.target.checked)} />
                    Qo'lda kiritish
                  </label>
                </label>
                {editIsManualBranch ? (
                  <input
                    type="text"
                    required
                    value={editManualBranchName}
                    onChange={(e) => setEditManualBranchName(e.target.value)}
                    placeholder="Filial nomini yozing"
                    className="w-full px-3 py-2 bg-slate-800 border border-cyan-500/40 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <select
                    value={editBranchId}
                    onChange={(e) => setEditBranchId(e.target.value as BranchId)}
                    className="w-full px-3 py-2 bg-slate-800 border border-cyan-500/40 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.location})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Lavozimi:
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {Object.keys(ROLE_LABELS).map((roleKey) => (
                    <option key={roleKey} value={roleKey}>
                      {ROLE_LABELS[roleKey as Role].title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Telefon raqami:
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Bo'lim / Sex:
                </label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-800/80 rounded-xl">
                <input
                  type="checkbox"
                  id="active_status"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500"
                />
                <label htmlFor="active_status" className="text-slate-200 font-semibold cursor-pointer">
                  Xodim faol holatda (Tizimga kirish huquqiga ega)
                </label>
              </div>

              <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <input
                  type="checkbox"
                  id="reset_pass"
                  checked={resetPasswordToDefault}
                  onChange={(e) => setResetPasswordToDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500"
                />
                <label htmlFor="reset_pass" className="text-amber-300 font-semibold cursor-pointer">
                  Parolni boshlang'ich holatga qaytarish (Standart: 12345)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  O'zgarishlarni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
