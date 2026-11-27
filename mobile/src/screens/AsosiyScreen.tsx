import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Clock, CheckCircle2, CalendarCheck2, ClipboardList, Edit2, Plus, Bell } from 'lucide-react-native';
import { api } from '../services/api';
import { scheduleLocalMilestoneNotifications } from '../services/notifications';
import { useAuth } from '../context/AuthContext';
import { SlesarMilestone } from '../types';
import { COLORS, CONTAINER_MAX, CARD_SHADOW } from '../theme';

export const AsosiyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<SlesarMilestone[]>([]);
  const [attendanceToday, setAttendanceToday] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [editingItem, setEditingItem] = useState<SlesarMilestone | null>(null);
  const [editTime, setEditTime] = useState('');

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

  const loadData = async () => {
    try {
      const [mRes, aRes] = await Promise.all([
        api.get('/api/slesar/milestones'),
        api.get('/api/attendance'),
      ]);
      if (Array.isArray(mRes.data)) {
        setMilestones(mRes.data);
        scheduleLocalMilestoneNotifications(mRes.data);
      }
      if (Array.isArray(aRes.data) && user) {
        const today = new Date().toISOString().slice(0, 10);
        const mine = aRes.data.find(
          (a: any) => a.userId === user.id && a.date === today
        );
        setAttendanceToday(mine ? mine.checkInTime?.slice(0, 5) : null);
      }
    } catch (e) {
      console.warn('Ma’lumot yuklashda xatolik:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const doneCount = milestones.filter((m) => m.status === 'bajarildi').length;
  const totalCount = milestones.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const nextStep = milestones.find(
    (m) => m.status === 'kutilmoqda' || m.status === 'ogohlantirildi'
  );

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
      Alert.alert('Davomat belgilandi', `Kelgan vaqtingiz: ${checkTime}`);
    } catch {
      Alert.alert('Xatolik', 'Davomatni belgilab bo‘lmadi');
    }
  };

  const handleComplete = async (id: number | string) => {
    try {
      await api.post(`/api/slesar/milestones/${id}/complete`, {
        notes: 'Mobil ilovadan bajarildi',
      });
      await loadData();
    } catch {
      Alert.alert('Xatolik', 'Bosqichni saqlashda muammo yuz berdi');
    }
  };

  const handleSaveTime = async () => {
    if (!editingItem || !editTime.trim()) return;
    try {
      await api.put(`/api/slesar/milestones/${editingItem.id}`, {
        time: editTime.trim(),
      });
      setEditingItem(null);
      await loadData();
    } catch {
      Alert.alert('Xatolik', 'Vaqtni o‘zgartirib bo‘lmadi');
    }
  };

  const handleAddMilestone = async () => {
    if (!newTime.trim() || !newTitle.trim()) {
      Alert.alert('Diqqat', 'Vaqt va bosqich nomini kiriting');
      return;
    }
    try {
      await api.post('/api/slesar/milestones', {
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
      Alert.alert('Xatolik', 'Yangi bosqich qo‘shilmadi');
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
      Alert.alert('Saqlandi', 'Kunlik hisobot serverga yuborildi!');
    } catch (e: any) {
      Alert.alert('Xatolik', e?.response?.data?.message || 'Hisobot yuborilmadi');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Quick Actions + Progress Bar */}
      <View style={styles.topActionsRow}>
        <TouchableOpacity
          style={[styles.actionCard, attendanceToday ? styles.actionCardSuccess : styles.actionCardWarn]}
          onPress={handleCheckIn}
        >
          <View style={[styles.actionIconBox, { backgroundColor: attendanceToday ? COLORS.primarySoft : COLORS.amberSoft }]}>
            <CalendarCheck2 size={18} color={attendanceToday ? COLORS.primary : COLORS.amber} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionLabel}>Davomat</Text>
            <Text style={[styles.actionValue, { color: attendanceToday ? COLORS.primary : COLORS.amber }]}>
              {attendanceToday ? `Kelgan: ${attendanceToday}` : 'Belgilash'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => setReportOpen(true)}>
          <View style={[styles.actionIconBox, { backgroundColor: COLORS.skySoft }]}>
            <ClipboardList size={18} color={COLORS.sky} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionLabel}>Kunlik Reja</Text>
            <Text style={[styles.actionValue, { color: COLORS.sky }]}>Hisobot kiritish</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Progress Strip */}
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

      {/* Hero Card: NAVBATDAGI TEXNOLOGIK BOSQICH */}
      {nextStep ? (
        <View style={[styles.heroCard, CARD_SHADOW]}>
          <View style={styles.heroAccentStrip} />
          <View style={styles.heroBody}>
            <View style={styles.heroHeader}>
              <View style={styles.heroBadge}>
                <Clock size={13} color={COLORS.amber} />
                <Text style={styles.heroBadgeText}>NAVBATDAGI BOSQICH</Text>
              </View>
              <View style={styles.signalPill}>
                <Bell size={11} color={COLORS.amber} />
                <Text style={styles.heroAlertTime}>{nextStep.alertTime}</Text>
              </View>
            </View>

            <View style={styles.heroTitleRow}>
              <View style={styles.heroTimeTag}>
                <Text style={styles.heroTimeText}>{nextStep.time}</Text>
              </View>
              <Text style={styles.heroTitle}>{nextStep.title}</Text>
            </View>

            {!!nextStep.description && (
              <Text style={styles.heroDesc}>{nextStep.description}</Text>
            )}

            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.editTimeBtn}
                onPress={() => {
                  setEditingItem(nextStep);
                  setEditTime(nextStep.time);
                }}
              >
                <Edit2 size={15} color={COLORS.textMuted} />
                <Text style={styles.editTimeText}>Vaqt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.completeBtn}
                onPress={() => handleComplete(nextStep.id)}
              >
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
            <Text style={[styles.heroTitle, { color: COLORS.primary }]}>
              Barcha bosqichlar bajarildi!
            </Text>
            <Text style={styles.heroDesc}>Bugungi texnologik grafik to‘liq yakunlandi.</Text>
          </View>
        </View>
      )}

      {/* Milestones List Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>TEXNOLOGIK ISH GRAFIGI ({milestones.length})</Text>
        <TouchableOpacity style={styles.addStepBtn} onPress={() => setAddOpen(true)}>
          <Plus size={14} color="#090E1A" strokeWidth={2.5} />
          <Text style={styles.addStepText}>Bosqich</Text>
        </TouchableOpacity>
      </View>

      {milestones.map((m) => {
        const done = m.status === 'bajarildi';
        const isNext = nextStep?.id === m.id;
        return (
          <View
            key={String(m.id)}
            style={[
              styles.stepRow,
              done && styles.stepRowDone,
              isNext && styles.stepRowActive,
            ]}
          >
            <View style={[styles.stepTimeBox, isNext && styles.stepTimeBoxActive]}>
              <Text style={[styles.stepTime, done && { color: COLORS.textDim }]}>{m.time}</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={[styles.stepTitle, done && styles.stepTitleDone]}>{m.title}</Text>
              {!!m.description && <Text style={styles.stepDesc}>{m.description}</Text>}
            </View>
            {done ? (
              <View style={styles.doneIconWrap}>
                <CheckCircle2 size={18} color={COLORS.primary} />
              </View>
            ) : (
              <TouchableOpacity style={styles.miniDoneBtn} onPress={() => handleComplete(m.id)}>
                <Text style={styles.miniDoneText}>Bajarildi</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* Modals */}
      <Modal visible={!!editingItem} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Bosqich vaqtini o‘zgartirish</Text>
            <TextInput
              style={styles.modalInput}
              value={editTime}
              onChangeText={setEditTime}
              placeholder="Masalan: 07:30"
              placeholderTextColor={COLORS.textDim}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingItem(null)}>
                <Text style={styles.cancelBtnText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveTime}>
                <Text style={styles.saveBtnText}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={addOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Yangi Texnologik Bosqich</Text>
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
  topActionsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 14,
  },
  actionCardSuccess: { borderColor: 'rgba(34,197,94,0.35)' },
  actionCardWarn: { borderColor: 'rgba(245,158,11,0.35)' },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  actionValue: { fontSize: 13, fontWeight: '700', marginTop: 1 },
  progressBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  progressPct: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    marginBottom: 22,
    overflow: 'hidden',
  },
  heroAccentStrip: { width: 5, backgroundColor: COLORS.amber },
  heroBody: { flex: 1, padding: 16 },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroBadgeText: { color: COLORS.amber, fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  signalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.amberSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroAlertTime: { color: COLORS.amber, fontSize: 11, fontWeight: '700' },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  heroTimeTag: {
    backgroundColor: COLORS.amberSoft,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addStepText: { color: '#090E1A', fontWeight: '800', fontSize: 12 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  stepRowActive: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: COLORS.surfaceAlt,
  },
  stepRowDone: { opacity: 0.55 },
  stepTimeBox: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepTimeBoxActive: { borderColor: 'rgba(245,158,11,0.4)' },
  stepTime: { color: COLORS.amber, fontWeight: '800', fontSize: 13 },
  stepInfo: { flex: 1 },
  stepTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  stepTitleDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  stepDesc: { color: COLORS.textDim, fontSize: 12, marginTop: 2 },
  doneIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniDoneBtn: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
  },
  miniDoneText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    padding: 20,
  },
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
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: { color: '#090E1A', fontWeight: '800' },
});
