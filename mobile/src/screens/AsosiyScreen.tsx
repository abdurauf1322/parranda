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
import { Clock, CheckCircle2, CalendarCheck2, ClipboardList, Edit2 } from 'lucide-react-native';
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

  const handleComplete = async (id: string) => {
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
          onPress={() => navigation.navigate('Koproq')}
        >
          <CalendarCheck2 size={15} color={attendanceToday ? '#22C55E' : '#F59E0B'} />
          <Text style={[styles.pillText, { color: attendanceToday ? '#22C55E' : '#F59E0B' }]}>
            {attendanceToday ? `Kelgan: ${attendanceToday}` : 'Davomat belgilash'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pill}
          onPress={() => navigation.navigate('Topshiriqlar')}
        >
          <ClipboardList size={15} color="#38BDF8" />
          <Text style={[styles.pillText, { color: '#E2E8F0' }]}>Kunlik Reja</Text>
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
            <Text style={styles.alertTime}>Signal: {nextStep.alertTime}</Text>
          </View>

          <Text style={styles.heroTitle}>
            {nextStep.time} — {nextStep.title}
          </Text>
          <Text style={styles.heroDesc}>{nextStep.description}</Text>

          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                setEditingItem(nextStep);
                setEditTime(nextStep.time);
              }}
            >
              <Edit2 size={16} color="#CBD5E1" />
              <Text style={styles.editBtnText}>Vaqt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => handleComplete(nextStep.id)}
            >
              <CheckCircle2 size={20} color="#0F172A" strokeWidth={2.5} />
              <Text style={styles.doneBtnText}>Bajarildi</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.allDoneCard}>
          <CheckCircle2 size={36} color="#22C55E" />
          <Text style={styles.allDoneTitle}>Barcha bosqichlar bajarildi!</Text>
          <Text style={styles.allDoneSub}>Bugungi texnologik grafik yakunlandi.</Text>
        </View>
      )}

      {/* Upcoming Steps List */}
      <Text style={styles.sectionTitle}>TEXNOLOGIK ISH GRAFIGI ({milestones.length})</Text>
      {milestones.map((item) => {
        const isDone = item.status === 'bajarildi';
        return (
          <View key={item.id} style={[styles.stepRow, isDone && styles.stepRowDone]}>
            <View style={styles.stepLeft}>
              <Text style={[styles.stepTime, isDone && styles.textMuted]}>{item.time}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, isDone && styles.textMuted]}>{item.title}</Text>
                <Text style={styles.stepSub} numberOfLines={1}>{item.description}</Text>
              </View>
            </View>
            {isDone ? (
              <CheckCircle2 size={20} color="#22C55E" />
            ) : (
              <TouchableOpacity
                style={styles.miniDoneBtn}
                onPress={() => handleComplete(item.id)}
              >
                <Text style={styles.miniDoneText}>Bajarildi</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* Time Edit Modal */}
      <Modal visible={!!editingItem} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Vaqtni o‘zgartirish</Text>
            <TextInput
              style={styles.modalInput}
              value={editTime}
              onChangeText={setEditTime}
              placeholder="HH:MM (masalan: 08:30)"
              placeholderTextColor="#64748B"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditingItem(null)}>
                <Text style={styles.modalCancelText}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveTime}>
                <Text style={styles.modalSaveText}>Saqlash</Text>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pillSuccess: { borderWidth: 1, borderColor: 'rgba(34,197,94,0.35)' },
  pillWarn: { borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)' },
  pillText: { fontSize: 12, fontWeight: '700' },
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    marginBottom: 22,
  },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroBadgeText: { color: '#F59E0B', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  alertTime: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  heroTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '900', marginBottom: 6 },
  heroDesc: { color: '#CBD5E1', fontSize: 14, lineHeight: 20, marginBottom: 18 },
  heroActions: { flexDirection: 'row', gap: 10 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  editBtnText: { color: '#CBD5E1', fontSize: 14, fontWeight: '700' },
  doneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 14,
  },
  doneBtnText: { color: '#0F172A', fontSize: 16, fontWeight: '900' },
  allDoneCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 22,
  },
  allDoneTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '800', marginTop: 10 },
  allDoneSub: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  sectionTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '800', letterSpacing: 0.6, marginBottom: 10 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  stepRowDone: { opacity: 0.55 },
  stepLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 10 },
  stepTime: { color: '#F59E0B', fontSize: 14, fontWeight: '800', width: 46 },
  stepTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  stepSub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  textMuted: { textDecorationLine: 'line-through', color: '#94A3B8' },
  miniDoneBtn: { backgroundColor: 'rgba(34,197,94,0.18)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  miniDoneText: { color: '#22C55E', fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20 },
  modalTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  modalInput: { backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalCancel: { paddingHorizontal: 16, paddingVertical: 10 },
  modalCancelText: { color: '#94A3B8', fontWeight: '700' },
  modalSave: { backgroundColor: '#22C55E', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  modalSaveText: { color: '#0F172A', fontWeight: '800' },
});
