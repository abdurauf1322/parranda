import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Clock,
  CheckCircle2,
  CalendarCheck2,
  ClipboardList,
  Edit2,
  Plus,
  Bell,
  Camera,
  CheckSquare,
  RotateCcw,
  Trash2,
  Volume2,
  Users,
  BarChart3,
  Building2,
  AlertTriangle,
} from 'lucide-react-native';
import { api } from '../services/api';
import {
  scheduleLocalMilestoneNotifications,
  sendLocalTestNotification,
} from '../services/notifications';
import { useAuth } from '../context/AuthContext';
import { getRoleConfig } from '../config/roleConfig';
import {
  SlesarMilestone,
  AttendanceRecord,
  DailyFactoryReport,
  BranchInfo,
  User,
  ROLE_LABELS,
} from '../types';
import { COLORS, CONTAINER_MAX, CARD_SHADOW } from '../theme';

export const AsosiyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const rc = getRoleConfig(user?.role);

  const [milestones, setMilestones] = useState<SlesarMilestone[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<DailyFactoryReport[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [avgWeightGrams, setAvgWeightGrams] = useState(0);
  const [attendanceToday, setAttendanceToday] = useState<string | null>(null);
  const [pendingTaskCount, setPendingTaskCount] = useState<number>(0);
  const [clockText, setClockText] = useState<string>(new Date().toTimeString().slice(0, 8));
  const [refreshing, setRefreshing] = useState(false);

  const [editingItem, setEditingItem] = useState<SlesarMilestone | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const [reportOpen, setReportOpen] = useState(false);
  const [repBuilding, setRepBuilding] = useState('1-Bino');
  const [repEggs, setRepEggs] = useState('');
  const [repFeed, setRepFeed] = useState('');
  const [repMortality, setRepMortality] = useState('0');
  const [repTemp, setRepTemp] = useState('22');
  const [repNotes, setRepNotes] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setClockText(new Date().toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const reqs: Promise<any>[] = [
        api.get(`/api/attendance`),
        api.get(`/api/tasks?viewerRole=${user.role}`),
      ];

      if (rc.dashboardMode === 'checklist') {
        reqs.push(api.get(`/api/slesar/milestones?role=${user.role}`));
      } else {
        reqs.push(Promise.resolve({ data: [] }));
      }

      if (rc.dashboardMode === 'executive' || rc.dashboardMode === 'analytics') {
        reqs.push(api.get('/api/daily-reports'));
        reqs.push(api.get('/api/branches'));
        reqs.push(api.get('/api/inventory'));
        reqs.push(api.get('/api/weights'));
      } else if (rc.dashboardMode === 'hr') {
        reqs.push(Promise.resolve({ data: [] }));
        reqs.push(Promise.resolve({ data: [] }));
        reqs.push(Promise.resolve({ data: [] }));
        reqs.push(Promise.resolve({ data: [] }));
        reqs.push(api.get('/api/auth/users'));
      }

      const results = await Promise.all(reqs);
      const aRes = results[0];
      const tRes = results[1];
      const mRes = results[2];

      if (Array.isArray(aRes.data)) {
        setAttendanceList(aRes.data.filter((a: any) => a.date === today));
        const mine = aRes.data.find((a: any) => a.userId === user.id && a.date === today);
        setAttendanceToday(mine ? mine.checkInTime?.slice(0, 5) : null);
      }

      if (Array.isArray(tRes.data)) {
        const pending = tRes.data.filter(
          (t: any) => t.status !== 'bajarildi' && t.status !== 'tasdiqlandi'
        ).length;
        setPendingTaskCount(pending);
      }

      if (rc.dashboardMode === 'checklist' && Array.isArray(mRes.data)) {
        setMilestones(mRes.data);
        scheduleLocalMilestoneNotifications(mRes.data);
      }

      if (rc.dashboardMode === 'executive' || rc.dashboardMode === 'analytics') {
        const rRes = results[3];
        const bRes = results[4];
        const iRes = results[5];
        const wRes = results[6];
        if (Array.isArray(rRes.data)) setReports(rRes.data);
        if (Array.isArray(bRes.data)) setBranches(bRes.data);
        if (Array.isArray(iRes.data)) {
          setLowStockCount(
            iRes.data.filter((i: any) => i.minThreshold != null && i.quantity <= i.minThreshold).length
          );
        }
        if (Array.isArray(wRes.data) && wRes.data.length > 0) {
          const sum = wRes.data.reduce((acc: number, w: any) => acc + (Number(w.avgWeightGrams) || 0), 0);
          setAvgWeightGrams(Math.round(sum / wRes.data.length));
        }
      }

      if (rc.dashboardMode === 'hr' && Array.isArray(results[7]?.data)) {
        setAllUsers(results[7].data);
      }
    } catch (e) {
      console.warn('Ma’lumot yuklashda xatolik:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.role])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n${msg}`);
    else Alert.alert(title, msg);
  };

  const handleCheckIn = async () => {
    if (!user) return;
    if (attendanceToday) {
      navigation.navigate('Koproq');
      return;
    }
    try {
      const res = await api.post('/api/attendance/check-in', { userId: user.id });
      const checkTime = res.data?.attendance?.checkInTime?.slice(0, 5) || 'Hozir';
      setAttendanceToday(checkTime);
      await loadData();
      notify('Davomat belgilandi', `Kelgan vaqtingiz: ${checkTime}`);
    } catch {
      notify('Xatolik', 'Davomatni belgilab bo‘lmadi');
    }
  };

  const handleComplete = async (id: number | string) => {
    try {
      await api.post(`/api/slesar/milestones/${id}/complete`, {
        notes: 'Vaqtidan kechikmay bajarildi',
      });
      await loadData();
    } catch {
      notify('Xatolik', 'Bosqichni saqlashda muammo yuz berdi');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editTime.trim()) return;
    try {
      await api.put(`/api/slesar/milestones/${editingItem.id}`, {
        time: editTime.trim(),
        title: editTitle.trim() || editingItem.title,
        description: editDesc.trim(),
      });
      setEditingItem(null);
      await loadData();
    } catch {
      notify('Xatolik', 'Bosqichni o‘zgartirib bo‘lmadi');
    }
  };

  const handleDeleteMilestone = async (id: number | string) => {
    const go = async () => {
      try {
        await api.delete(`/api/slesar/milestones/${id}`);
        await loadData();
      } catch {
        notify('Xatolik', 'Bosqichni o‘chirib bo‘lmadi');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Ushbu bosqichni o‘chirmoqchimisiz?')) go();
    } else {
      Alert.alert('O‘chirish', 'Ushbu bosqichni o‘chirmoqchimisiz?', [
        { text: 'Bekor', style: 'cancel' },
        { text: 'O‘chirish', style: 'destructive', onPress: go },
      ]);
    }
  };

  const handleResetMilestones = async () => {
    const go = async () => {
      try {
        await api.post('/api/slesar/milestones/reset', { role: user?.role || 'slesar' });
        await loadData();
      } catch {
        notify('Xatolik', 'Grafikni tiklab bo‘lmadi');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Barcha bosqichlarni "Kutilmoqda" holatiga qaytarmoqchimisiz?')) go();
    } else {
      Alert.alert('Standart holat', 'Barcha bosqichlarni qayta boshlashni xohlaysizmi?', [
        { text: 'Bekor', style: 'cancel' },
        { text: 'Ha, tiklash', onPress: go },
      ]);
    }
  };

  const handleTestSignal = async (m?: SlesarMilestone) => {
    await sendLocalTestNotification(
      m ? `⏰ Signal: ${m.time} — ${m.title}` : `🔔 ${rc.title} — Signal Testi`,
      m ? m.description || '3 daqiqadan so‘ng bosqich boshlanadi!' : 'Ovozli va push signal tizimi faol!'
    );
    notify('Signal yuborildi', m ? `${m.time} — ${m.title}` : 'Test signali chalindi!');
  };

  const handleAddMilestone = async () => {
    if (!newTime.trim() || !newTitle.trim()) {
      notify('Diqqat', 'Vaqt va bosqich nomini kiriting');
      return;
    }
    try {
      await api.post('/api/slesar/milestones', {
        role: user?.role || 'slesar',
        time: newTime.trim(),
        title: newTitle.trim(),
        description: newDesc.trim(),
      });
      setNewTime('');
      setNewTitle('');
      setNewDesc('');
      setAddOpen(false);
      await loadData();
    } catch {
      notify('Xatolik', 'Yangi bosqich qo‘shilmadi');
    }
  };

  const handleSubmitDailyReport = async () => {
    try {
      await api.post('/api/daily-reports', {
        building: repBuilding.trim() || '1-Bino',
        eggsCollectedTotal: Number(repEggs) || 0,
        feedConsumedKg: Number(repFeed) || 0,
        mortalityCount: Number(repMortality) || 0,
        avgTemperature: Number(repTemp) || 22,
        submittedByName: user?.fullName || 'Xodim',
        notes: repNotes.trim(),
      });
      setRepEggs('');
      setRepFeed('');
      setRepNotes('');
      setReportOpen(false);
      await loadData();
      notify('Saqlandi', 'Kunlik hisobot serverga yuborildi!');
    } catch (e: any) {
      notify('Xatolik', e?.response?.data?.message || 'Hisobot yuborilmadi');
    }
  };

  const doneCount = milestones.filter((m) => m.status === 'bajarildi').length;
  const totalCount = milestones.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const nextStep = milestones.find((m) => m.status === 'kutilmoqda' || m.status === 'ogohlantirildi');

  const totalEggs = reports.reduce((acc, r) => acc + (r.eggsCollectedTotal || 0), 0);
  const totalFeed = reports.reduce((acc, r) => acc + (r.feedConsumedKg || 0), 0);
  const totalMortality = reports.reduce((acc, r) => acc + (r.mortalityCount || 0), 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Role Header Banner */}
      <View style={[styles.roleBanner, { borderLeftColor: rc.accentColor }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.roleBannerTitle, { color: rc.accentColor }]}>{rc.title}</Text>
          <Text style={styles.roleBannerSub}>{rc.subtitle}</Text>
        </View>
        <Text style={styles.clockText}>{clockText}</Text>
      </View>

      {/* Top Status Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        <View style={styles.pillsRow}>
          <TouchableOpacity
            style={[styles.pill, attendanceToday ? styles.pillSuccess : styles.pillWarn]}
            onPress={handleCheckIn}
          >
            <CalendarCheck2 size={14} color={attendanceToday ? COLORS.primary : COLORS.amber} />
            <Text style={[styles.pillText, { color: attendanceToday ? COLORS.primary : COLORS.amber }]}>
              {attendanceToday ? `Kelgan: ${attendanceToday}` : 'Davomat belgilash'}
            </Text>
          </TouchableOpacity>

          {(rc.showDailyReportsInMore || rc.dashboardMode === 'analytics' || rc.dashboardMode === 'executive') && (
            <TouchableOpacity style={styles.pill} onPress={() => setReportOpen(true)}>
              <ClipboardList size={14} color={COLORS.sky} />
              <Text style={styles.pillText}>Kunlik Hisobot</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.pill} onPress={() => navigation.navigate('Koproq')}>
            <Camera size={14} color={COLORS.purple} />
            <Text style={styles.pillText}>Foto-Hisobot</Text>
          </TouchableOpacity>

          {rc.allowedTabs.includes('Topshiriqlar') && (
            <TouchableOpacity
              style={[styles.pill, pendingTaskCount > 0 && styles.pillWarn]}
              onPress={() => navigation.navigate('Topshiriqlar')}
            >
              <CheckSquare size={14} color={COLORS.amber} />
              <Text style={[styles.pillText, { color: COLORS.amber }]}>
                Vazifalar: {pendingTaskCount} ›
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* MODE 1: EXECUTIVE (Direktor & Ish Boshqaruvchi) */}
      {rc.dashboardMode === 'executive' && (
        <View style={{ gap: 12 }}>
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, CARD_SHADOW]}>
              <Users size={18} color={COLORS.primary} />
              <Text style={styles.kpiValue}>{attendanceList.length} / 12</Text>
              <Text style={styles.kpiLabel}>Bugungi Davomat</Text>
            </View>
            <View style={[styles.kpiCard, CARD_SHADOW]}>
              <CheckSquare size={18} color={COLORS.amber} />
              <Text style={styles.kpiValue}>{pendingTaskCount}</Text>
              <Text style={styles.kpiLabel}>Faol Topshiriqlar</Text>
            </View>
            <View style={[styles.kpiCard, CARD_SHADOW]}>
              <AlertTriangle size={18} color={lowStockCount > 0 ? COLORS.danger : COLORS.primary} />
              <Text style={[styles.kpiValue, lowStockCount > 0 && { color: COLORS.danger }]}>
                {lowStockCount}
              </Text>
              <Text style={styles.kpiLabel}>Kam Qolgan Zahira</Text>
            </View>
            <View style={[styles.kpiCard, CARD_SHADOW]}>
              <BarChart3 size={18} color={COLORS.sky} />
              <Text style={styles.kpiValue}>{totalEggs.toLocaleString()}</Text>
              <Text style={styles.kpiLabel}>Hisobotdagi Tuxum</Text>
            </View>
          </View>

          <View style={[styles.sectionCard, CARD_SHADOW]}>
            <View style={styles.secHeader}>
              <Building2 size={16} color={COLORS.purple} />
              <Text style={styles.sectionTitle}>FILIALLAR HOLATI ({branches.length})</Text>
            </View>
            {branches.map((b) => (
              <View key={b.branchId} style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{b.name}</Text>
                  <Text style={styles.listSub}>Rahbar: {b.managerName}</Text>
                </View>
                <View style={styles.greenPill}>
                  <Text style={styles.greenPillText}>{b.currentBirds.toLocaleString()} qush</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* MODE 2: HR (Kadrlar) */}
      {rc.dashboardMode === 'hr' && (
        <View style={{ gap: 12 }}>
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, CARD_SHADOW]}>
              <Users size={18} color={COLORS.primary} />
              <Text style={styles.kpiValue}>{attendanceList.length}</Text>
              <Text style={styles.kpiLabel}>Bugun Kelganlar</Text>
            </View>
            <View style={[styles.kpiCard, CARD_SHADOW]}>
              <Clock size={18} color={COLORS.amber} />
              <Text style={styles.kpiValue}>{Math.max(0, allUsers.length - attendanceList.length)}</Text>
              <Text style={styles.kpiLabel}>Belgilanmaganlar</Text>
            </View>
          </View>

          <View style={[styles.sectionCard, CARD_SHADOW]}>
            <View style={styles.secHeader}>
              <CalendarCheck2 size={16} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>XODIMLAR DAVOMAT RO‘YXATI ({allUsers.length})</Text>
            </View>
            {allUsers.map((u) => {
              const att = attendanceList.find((a) => a.userId === u.id);
              return (
                <View key={u.id} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{u.fullName}</Text>
                    <Text style={styles.listSub}>{ROLE_LABELS[u.role] || u.role}</Text>
                  </View>
                  {att ? (
                    <View style={styles.greenPill}>
                      <Text style={styles.greenPillText}>Keldi {att.checkInTime?.slice(0, 5)}</Text>
                    </View>
                  ) : (
                    <View style={styles.amberPill}>
                      <Text style={styles.amberPillText}>Kutilmoqda</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* MODE 3: ANALYTICS (Statistikachi) */}
      {rc.dashboardMode === 'analytics' && (
        <View style={{ gap: 12 }}>
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, CARD_SHADOW]}>
              <BarChart3 size={18} color={COLORS.sky} />
              <Text style={styles.kpiValue}>{totalEggs.toLocaleString()}</Text>
              <Text style={styles.kpiLabel}>Jami Tuxum (dona)</Text>
            </View>
            <View style={[styles.kpiCard, CARD_SHADOW]}>
              <ClipboardList size={18} color={COLORS.amber} />
              <Text style={styles.kpiValue}>{totalFeed.toLocaleString()} kg</Text>
              <Text style={styles.kpiLabel}>Yem Sarfi</Text>
            </View>
            <View style={[styles.kpiCard, CARD_SHADOW]}>
              <AlertTriangle size={18} color={COLORS.danger} />
              <Text style={styles.kpiValue}>{totalMortality}</Text>
              <Text style={styles.kpiLabel}>Nobudlik (dona)</Text>
            </View>
            <View style={[styles.kpiCard, CARD_SHADOW]}>
              <CheckCircle2 size={18} color={COLORS.primary} />
              <Text style={styles.kpiValue}>{avgWeightGrams} g</Text>
              <Text style={styles.kpiLabel}>O‘rtacha Qush Vazni</Text>
            </View>
          </View>

          <View style={[styles.sectionCard, CARD_SHADOW]}>
            <View style={[styles.secHeader, { justifyContent: 'space-between' }]}>
              <Text style={styles.sectionTitle}>KUNLIK HISOBOTLAR ({reports.length})</Text>
              <TouchableOpacity style={styles.addStepBtn} onPress={() => setReportOpen(true)}>
                <Plus size={13} color="#090E1A" strokeWidth={2.5} />
                <Text style={styles.addStepText}>Hisobot</Text>
              </TouchableOpacity>
            </View>
            {reports.length === 0 ? (
              <Text style={styles.listSub}>Hozircha kunlik hisobotlar yo‘q</Text>
            ) : (
              reports.slice(0, 8).map((r) => (
                <View key={r.id} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{r.building} • {r.date}</Text>
                    <Text style={styles.listSub}>Topshirdi: {r.submittedByName}</Text>
                  </View>
                  <Text style={{ color: COLORS.sky, fontWeight: '700', fontSize: 12 }}>
                    🥚 {r.eggsCollectedTotal} | 🌾 {r.feedConsumedKg}kg
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* MODE 4: ROLE CHECKLIST (8 Operational Roles) */}
      {rc.dashboardMode === 'checklist' && (
        <>
          <View style={styles.progressBox}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Bugungi grafik bajarilishi</Text>
              <Text style={styles.progressPct}>
                {doneCount}/{totalCount} ({progressPct}%)
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
            </View>
          </View>

          {nextStep ? (
            <View style={[styles.heroCard, CARD_SHADOW]}>
              <View style={[styles.heroAccentStrip, { backgroundColor: rc.accentColor }]} />
              <View style={styles.heroBody}>
                <View style={styles.heroHeader}>
                  <View style={styles.heroBadge}>
                    <Clock size={13} color={rc.accentColor} />
                    <Text style={[styles.heroBadgeText, { color: rc.accentColor }]}>NAVBATDAGI BOSQICH</Text>
                  </View>
                  <View style={styles.signalPill}>
                    <Bell size={11} color={COLORS.amber} />
                    <Text style={styles.heroAlertTime}>Signal: {nextStep.alertTime} (-3 daq)</Text>
                  </View>
                </View>

                <View style={styles.heroTitleRow}>
                  <View style={styles.heroTimeTag}>
                    <Text style={styles.heroTimeText}>{nextStep.time}</Text>
                  </View>
                  <Text style={styles.heroTitle}>{nextStep.title}</Text>
                </View>

                {!!nextStep.description && <Text style={styles.heroDesc}>{nextStep.description}</Text>}

                <View style={styles.heroActions}>
                  <TouchableOpacity
                    style={styles.editTimeBtn}
                    onPress={() => {
                      setEditingItem(nextStep);
                      setEditTime(nextStep.time);
                      setEditTitle(nextStep.title);
                      setEditDesc(nextStep.description || '');
                    }}
                  >
                    <Edit2 size={15} color={COLORS.textMuted} />
                    <Text style={styles.editTimeText}>O‘zgartirish</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.completeBtn} onPress={() => handleComplete(nextStep.id)}>
                    <CheckCircle2 size={20} color="#090E1A" strokeWidth={2.5} />
                    <Text style={styles.completeBtnText}>Bajarildi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.heroCard, { borderColor: COLORS.primary }]}>
              <View style={[styles.heroAccentStrip, { backgroundColor: COLORS.primary }]} />
              <View style={styles.heroBody}>
                <Text style={[styles.heroTitle, { color: COLORS.primary }]}>Barcha bosqichlar bajarildi!</Text>
                <Text style={styles.heroDesc}>Bugungi ish grafigi to‘liq yakunlandi.</Text>
              </View>
            </View>
          )}

          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionTitle}>
              {rc.scheduleTitle} ({milestones.length} TA BOSQICH)
            </Text>
            <View style={styles.toolbarRow}>
              <TouchableOpacity style={styles.addStepBtn} onPress={() => setAddOpen(true)}>
                <Plus size={14} color="#090E1A" strokeWidth={2.5} />
                <Text style={styles.addStepText}>Bosqich Qo‘shish</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.toolBtn} onPress={() => handleTestSignal()}>
                <Bell size={13} color={COLORS.textMuted} />
                <Text style={styles.toolBtnText}>Signalni Sinash</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.toolBtn} onPress={handleResetMilestones}>
                <RotateCcw size={13} color={COLORS.textMuted} />
                <Text style={styles.toolBtnText}>Standart</Text>
              </TouchableOpacity>
            </View>
          </View>

          {milestones.map((m, idx) => {
            const done = m.status === 'bajarildi';
            const isNext = nextStep?.id === m.id;
            return (
              <View
                key={String(m.id)}
                style={[styles.stepCard, done && styles.stepRowDone, isNext && styles.stepRowActive]}
              >
                <View style={styles.stepTopRow}>
                  <View style={styles.indexCircle}>
                    <Text style={styles.indexText}>{idx + 1}</Text>
                  </View>
                  <Text style={[styles.stepTime, done && { color: COLORS.textDim }]}>{m.time}</Text>
                  <View style={styles.alertMiniPill}>
                    <Text style={styles.alertMiniText}>Ogohlantirish: {m.alertTime} (-3 daqiqa)</Text>
                  </View>
                </View>

                <Text style={[styles.stepTitle, done && styles.stepTitleDone]}>{m.title}</Text>
                {!!m.description && <Text style={styles.stepDesc}>{m.description}</Text>}
                {done && !!m.notes && <Text style={styles.doneNoteText}>✓ Izoh: {m.notes}</Text>}

                <View style={styles.stepBtnRow}>
                  <TouchableOpacity
                    style={styles.rowActionBtn}
                    onPress={() => {
                      setEditingItem(m);
                      setEditTime(m.time);
                      setEditTitle(m.title);
                      setEditDesc(m.description || '');
                    }}
                  >
                    <Edit2 size={12} color={COLORS.textMuted} />
                    <Text style={styles.rowActionText}>Vaqtni o‘zgartirish</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.rowActionBtn} onPress={() => handleTestSignal(m)}>
                    <Volume2 size={12} color={COLORS.amber} />
                    <Text style={[styles.rowActionText, { color: COLORS.amber }]}>Signal</Text>
                  </TouchableOpacity>

                  {!done ? (
                    <TouchableOpacity style={styles.miniDoneBtn} onPress={() => handleComplete(m.id)}>
                      <CheckCircle2 size={12} color="#090E1A" />
                      <Text style={styles.miniDoneText}>Bajarildi</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.donePill}>
                      <CheckCircle2 size={12} color={COLORS.primary} />
                      <Text style={{ color: COLORS.primary, fontSize: 11, fontWeight: '700' }}>Bajarildi</Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteMilestone(m.id)}>
                    <Trash2 size={14} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* Modals */}
      <Modal visible={!!editingItem} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Bosqichni O‘zgartirish</Text>
            <TextInput
              style={styles.modalInput}
              value={editTime}
              onChangeText={setEditTime}
              placeholder="Vaqt (masalan: 07:30)"
              placeholderTextColor={COLORS.textDim}
            />
            <TextInput
              style={styles.modalInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Bosqich nomi"
              placeholderTextColor={COLORS.textDim}
            />
            <TextInput
              style={styles.modalInput}
              value={editDesc}
              onChangeText={setEditDesc}
              placeholder="Izoh"
              placeholderTextColor={COLORS.textDim}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingItem(null)}>
                <Text style={styles.cancelBtnText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                <Text style={styles.saveBtnText}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={addOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Yangi Bosqich Qo‘shish</Text>
            <TextInput
              style={styles.modalInput}
              value={newTime}
              onChangeText={setNewTime}
              placeholder="Vaqt (masalan: 16:30)"
              placeholderTextColor={COLORS.textDim}
            />
            <TextInput
              style={styles.modalInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Bosqich nomi"
              placeholderTextColor={COLORS.textDim}
            />
            <TextInput
              style={styles.modalInput}
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="Izoh (ixtiyoriy)"
              placeholderTextColor={COLORS.textDim}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddOpen(false)}>
                <Text style={styles.cancelBtnText}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddMilestone}>
                <Text style={styles.saveBtnText}>Qo‘shish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={reportOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Kunlik Ishlab Chiqarish Hisoboti</Text>
            <TextInput
              style={styles.modalInput}
              value={repBuilding}
              onChangeText={setRepBuilding}
              placeholder="Bino (masalan: 1-Bino)"
              placeholderTextColor={COLORS.textDim}
            />
            <TextInput
              style={styles.modalInput}
              value={repEggs}
              onChangeText={setRepEggs}
              keyboardType="numeric"
              placeholder="Yig‘ilgan tuxum (dona)"
              placeholderTextColor={COLORS.textDim}
            />
            <TextInput
              style={styles.modalInput}
              value={repFeed}
              onChangeText={setRepFeed}
              keyboardType="numeric"
              placeholder="Sarflangan yem (kg)"
              placeholderTextColor={COLORS.textDim}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                value={repMortality}
                onChangeText={setRepMortality}
                keyboardType="numeric"
                placeholder="Nobud (dona)"
                placeholderTextColor={COLORS.textDim}
              />
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                value={repTemp}
                onChangeText={setRepTemp}
                keyboardType="numeric"
                placeholder="Harorat (°C)"
                placeholderTextColor={COLORS.textDim}
              />
            </View>
            <TextInput
              style={styles.modalInput}
              value={repNotes}
              onChangeText={setRepNotes}
              placeholder="Izoh (ixtiyoriy)"
              placeholderTextColor={COLORS.textDim}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setReportOpen(false)}>
                <Text style={styles.cancelBtnText}>Yopish</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmitDailyReport}>
                <Text style={styles.saveBtnText}>Yuborish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { ...CONTAINER_MAX, padding: 16, paddingBottom: 36 },
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    marginBottom: 12,
    gap: 10,
  },
  roleBannerTitle: { fontSize: 15, fontWeight: '800' },
  roleBannerSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  clockText: { color: COLORS.amber, fontSize: 12, fontWeight: '800' },
  pillsRow: { flexDirection: 'row', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pillSuccess: { borderColor: 'rgba(34,197,94,0.4)', backgroundColor: COLORS.primarySoft },
  pillWarn: { borderColor: 'rgba(245,158,11,0.4)', backgroundColor: COLORS.amberSoft },
  pillText: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  kpiValue: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  kpiLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  listTitle: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  listSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  greenPill: { backgroundColor: COLORS.primarySoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  greenPillText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  amberPill: { backgroundColor: COLORS.amberSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  amberPillText: { color: COLORS.amber, fontSize: 11, fontWeight: '700' },
  progressBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  progressLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  progressPct: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 6, backgroundColor: COLORS.surfaceAlt, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroAccentStrip: { width: 5, backgroundColor: COLORS.amber },
  heroBody: { flex: 1, padding: 16 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroBadgeText: { color: COLORS.amber, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  signalPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.amberSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  heroAlertTime: { color: COLORS.amber, fontSize: 11, fontWeight: '700' },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  heroTimeTag: { backgroundColor: COLORS.amberSoft, borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  heroTimeText: { color: COLORS.amber, fontSize: 15, fontWeight: '800' },
  heroTitle: { flex: 1, color: COLORS.text, fontSize: 17, fontWeight: '800' },
  heroDesc: { color: COLORS.textMuted, fontSize: 13, marginBottom: 14 },
  heroActions: { flexDirection: 'row', gap: 10 },
  editTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  editTimeText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 13 },
  completeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 46,
  },
  completeBtnText: { color: '#090E1A', fontWeight: '800', fontSize: 15 },
  sectionHeaderWrap: { marginBottom: 12, gap: 8 },
  sectionTitle: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.9 },
  toolbarRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.amber,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
  },
  addStepText: { color: '#090E1A', fontWeight: '800', fontSize: 12 },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
  },
  toolBtnText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  stepCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepRowActive: { borderColor: 'rgba(245, 158, 11, 0.45)', backgroundColor: COLORS.surfaceAlt },
  stepRowDone: { opacity: 0.78 },
  stepTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  indexCircle: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  stepTime: { color: COLORS.amber, fontWeight: '800', fontSize: 14 },
  alertMiniPill: { backgroundColor: COLORS.amberSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  alertMiniText: { color: COLORS.amber, fontSize: 10, fontWeight: '700' },
  stepTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  stepTitleDone: { color: COLORS.textMuted },
  stepDesc: { color: COLORS.textDim, fontSize: 12, marginTop: 3 },
  doneNoteText: { color: COLORS.primary, fontSize: 11, marginTop: 4, fontWeight: '600' },
  stepBtnRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 10 },
  rowActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rowActionText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  miniDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  miniDoneText: { color: '#090E1A', fontSize: 11, fontWeight: '800' },
  donePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  delBtn: { padding: 6, marginLeft: 'auto' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 20 },
  modalCard: {
    ...CONTAINER_MAX,
    maxWidth: 460,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  modalTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: 14 },
  modalInput: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 10,
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: '600' },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  saveBtnText: { color: '#090E1A', fontWeight: '800' },
});
