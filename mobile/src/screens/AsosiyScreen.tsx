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
import { Clock, CheckCircle2, CalendarCheck2, ClipboardList, Edit2, Plus } from 'lucide-react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SlesarMilestone } from '../types';

export const AsosiyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<SlesarMilestone[]>([]);
  const [attendanceToday, setAttendanceToday] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Edit time modal
  const [editingItem, setEditingItem] = useState<SlesarMilestone | null>(null);
  const [editTime, setEditTime] = useState('');

  // Add milestone modal
  const [addOpen, setAddOpen] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Quick Daily Report modal
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
      if (Array.isArray(mRes.data)) setMilestones(mRes.data);
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
      Alert.alert('Bajarildi', 'Texnologik bosqich muvaffaqiyatli yakunlandi!');
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
    >
      {/* Quick Status Pills */}
      <View style={styles.pillsRow}>
        <TouchableOpacity
          style={[styles.pill, attendanceToday ? styles.pillSuccess : styles.pillWarn]}
          onPress={handleCheckIn}
        >
          <CalendarCheck2 size={15} color={attendanceToday ? '#22C55E' : '#F59E0B'} />
          <Text style={[styles.pillText, { color: attendanceToday ? '#22C55E' : '#F59E0B' }]}>
            {attendanceToday ? `Kelgan: ${attendanceToday}` : 'Davomat belgilash'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pill}
          onPress={() => setReportOpen(true)}
        >
          <ClipboardList size={15} color="#38BDF8" />
          <Text style={[styles.pillText, { color: '#E2E8F0' }]}>Kunlik Hisobot</Text>
        </TouchableOpacity>
      </View>

      {/* Main Card: NAVBATDAGI TEXNOLOGIK BOSQICH */}
      {nextStep ? (
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Clock size={14} color="#F59E0B" />
              <Text style={styles.heroBadgeText}>NAVBATDAGI BOSQICH</Text>
            </View>
            <Text style={styles.heroAlertTime}>Signal: {nextStep.alertTime}</Text>
          </View>

          <Text style={styles.heroTitle}>
            {nextStep.time} — {nextStep.title}
          </Text>
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
              <Edit2 size={16} color="#CBD5E1" />
              <Text style={styles.editTimeText}>Vaqt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => handleComplete(nextStep.id)}
            >
              <CheckCircle2 size={20} color="#0F172A" strokeWidth={2.5} />
              <Text style={styles.completeBtnText}>Bajarildi</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.heroCard, { borderColor: '#22C55E' }]}>
          <Text style={[styles.heroTitle, { color: '#22C55E' }]}>
            Barcha bosqichlar bajarildi!
          </Text>
          <Text style={styles.heroDesc}>Bugungi texnologik grafik to‘liq yakunlandi.</Text>
        </View>
      )}

      {/* Milestones List Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>TEXNOLOGIK ISH GRAFIGI ({milestones.length})</Text>
        <TouchableOpacity style={styles.addStepBtn} onPress={() => setAddOpen(true)}>
          <Plus size={14} color="#0F172A" strokeWidth={2.5} />
          <Text style={styles.addStepText}>Bosqich</Text>
        </TouchableOpacity>
      </View>

      {milestones.map((m) => {
        const done = m.status === 'bajarildi';
        return (
          <View key={String(m.id)} style={[styles.stepRow, done && styles.stepRowDone]}>
            <View style={styles.stepTimeBox}>
              <Text style={[styles.stepTime, done && { color: '#64748B' }]}>{m.time}</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={[styles.stepTitle, done && styles.stepTitleDone]}>{m.title}</Text>
              {!!m.description && <Text style={styles.stepDesc}>{m.description}</Text>}
            </View>
            {done ? (
              <CheckCircle2 size={20} color="#22C55E" />
            ) : (
              <TouchableOpacity style={styles.miniDoneBtn} onPress={() => handleComplete(m.id)}>
                <Text style={styles.miniDoneText}>Bajarildi</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* Edit Time Modal */}
      <Modal visible={!!editingItem} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Bosqich vaqtini o‘zgartirish</Text>
            <TextInput
              style={styles.modalInput}
              value={editTime}
              onChangeText={setEditTime}
              placeholder="Masalan: 07:30"
              placeholderTextColor="#64748B"
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

      {/* Add Milestone Modal */}
      <Modal visible={addOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Yangi Texnologik Bosqich</Text>
            <TextInput
              style={styles.modalInput}
              value={newTime}
              onChangeText={setNewTime}
              placeholder="Vaqt (masalan: 16:30)"
              placeholderTextColor="#64748B"
            />
            <TextInput
              style={styles.modalInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Bosqich nomi"
              placeholderTextColor="#64748B"
            />
            <TextInput
              style={styles.modalInput}
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="Izoh (ixtiyoriy)"
              placeholderTextColor="#64748B"
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

      {/* Quick Daily Report Modal */}
      <Modal visible={reportOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Kunlik Ishlab Chiqarish Hisoboti</Text>
            <TextInput
              style={styles.modalInput}
              value={repBuilding}
              onChangeText={setRepBuilding}
              placeholder="Bino (masalan: 1-Bino)"
              placeholderTextColor="#64748B"
            />
            <TextInput
              style={styles.modalInput}
              value={repEggs}
              onChangeText={setRepEggs}
              keyboardType="numeric"
              placeholder="Yig‘ilgan tuxum (dona)"
              placeholderTextColor="#64748B"
            />
            <TextInput
              style={styles.modalInput}
              value={repFeed}
              onChangeText={setRepFeed}
              keyboardType="numeric"
              placeholder="Sarflangan yem (kg)"
              placeholderTextColor="#64748B"
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                value={repMortality}
                onChangeText={setRepMortality}
                keyboardType="numeric"
                placeholder="Nobud (dona)"
                placeholderTextColor="#64748B"
              />
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                value={repTemp}
                onChangeText={setRepTemp}
                keyboardType="numeric"
                placeholder="Harorat (°C)"
                placeholderTextColor="#64748B"
              />
            </View>
            <TextInput
              style={styles.modalInput}
              value={repNotes}
              onChangeText={setRepNotes}
              placeholder="Izoh (ixtiyoriy)"
              placeholderTextColor="#64748B"
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
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 16, paddingBottom: 32 },
  pillsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pillSuccess: { borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)' },
  pillWarn: { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.1)' },
  pillText: { fontSize: 13, fontWeight: '600' },
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    marginBottom: 22,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroBadgeText: { color: '#F59E0B', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  heroAlertTime: { color: '#94A3B8', fontSize: 11 },
  heroTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  heroDesc: { color: '#94A3B8', fontSize: 14, marginBottom: 16 },
  heroActions: { flexDirection: 'row', gap: 10 },
  editTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  editTimeText: { color: '#CBD5E1', fontWeight: '600', fontSize: 14 },
  completeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    height: 48,
  },
  completeBtnText: { color: '#0F172A', fontWeight: '800', fontSize: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addStepText: { color: '#0F172A', fontWeight: '800', fontSize: 12 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  stepRowDone: { opacity: 0.55 },
  stepTimeBox: { width: 48 },
  stepTime: { color: '#F59E0B', fontWeight: '800', fontSize: 14 },
  stepInfo: { flex: 1 },
  stepTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  stepTitleDone: { textDecorationLine: 'line-through', color: '#94A3B8' },
  stepDesc: { color: '#64748B', fontSize: 12, marginTop: 2 },
  miniDoneBtn: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  miniDoneText: { color: '#22C55E', fontSize: 12, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '700', marginBottom: 14 },
  modalInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 15,
    marginBottom: 12,
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnText: { color: '#94A3B8', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: { color: '#0F172A', fontWeight: '700' },
});
