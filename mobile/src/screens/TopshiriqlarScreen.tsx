import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, CheckCircle2, Clock, Star } from 'lucide-react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TaskItem, ROLE_LABELS } from '../types';

export const TopshiriqlarScreen: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [building, setBuilding] = useState('1-Bino');
  const [role, setRole] = useState('slesar');

  // Evaluate modal
  const [evalTask, setEvalTask] = useState<TaskItem | null>(null);
  const [score, setScore] = useState(5);
  const [evalNote, setEvalNote] = useState('');

  const loadTasks = async () => {
    try {
      const res = await api.get('/api/tasks');
      if (Array.isArray(res.data)) setTasks(res.data);
    } catch (e) {
      console.warn('Topshiriqlar yuklashda xatolik:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleComplete = async (id: number | string) => {
    try {
      await api.put(`/api/tasks/${id}/status`, { status: 'bajarildi' });
      await loadTasks();
    } catch {
      Alert.alert('Xatolik', 'Topshiriqni yangilab bo‘lmadi');
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Diqqat', 'Topshiriq sarlavhasini kiriting');
      return;
    }
    try {
      await api.post('/api/tasks', {
        title: title.trim(),
        description: desc.trim(),
        assignedToRole: role,
        assignedToName: ROLE_LABELS[role] || role,
        assignedByName: user?.fullName || 'Mobil ilova',
        assignedByRole: user?.role || 'ish_boshqaruvchi',
        building: building.trim() || '1-Bino',
        priority: 'yuqori',
      });
      setTitle('');
      setDesc('');
      setModalOpen(false);
      await loadTasks();
    } catch {
      Alert.alert('Xatolik', 'Topshiriq yaratishda xatolik');
    }
  };

  const handleEvaluate = async () => {
    if (!evalTask) return;
    try {
      await api.post(`/api/tasks/${evalTask.id}/evaluate`, {
        score,
        note: evalNote.trim(),
        evaluatedByName: user?.fullName || 'Direktor',
      });
      setEvalTask(null);
      setEvalNote('');
      await loadTasks();
    } catch {
      Alert.alert('Xatolik', 'Baholash saqlanmadi');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Topshiriqlar ({tasks.length})</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
          <Plus size={16} color="#0F172A" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Yangi</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
        renderItem={({ item }) => {
          const done = item.status === 'bajarildi' || item.status === 'tasdiqlandi';
          const rated = item.status === 'tasdiqlandi';
          return (
            <View style={[styles.card, done && styles.cardDone]}>
              <View style={styles.cardTop}>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>
                    {ROLE_LABELS[item.assignedToRole] || item.assignedToRole}
                  </Text>
                </View>
                {rated ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 12 }}>
                      {item.evaluationScore || 5}/5
                    </Text>
                  </View>
                ) : done ? (
                  <CheckCircle2 size={18} color="#22C55E" />
                ) : (
                  <Clock size={16} color="#F59E0B" />
                )}
              </View>

              <Text style={[styles.cardTitle, done && { color: '#94A3B8' }]}>{item.title}</Text>
              {!!item.description && <Text style={styles.cardDesc}>{item.description}</Text>}
              {!!item.building && (
                <Text style={styles.metaText}>
                  {item.building} • Mas’ul: {item.assignedByName || 'Rahbar'}
                </Text>
              )}

              {!done && (
                <TouchableOpacity style={styles.doneBtn} onPress={() => handleComplete(item.id)}>
                  <Text style={styles.doneBtnText}>Bajarildi deb belgilash</Text>
                </TouchableOpacity>
              )}

              {done && !rated && (
                <TouchableOpacity
                  style={styles.evalBtn}
                  onPress={() => {
                    setEvalTask(item);
                    setScore(5);
                  }}
                >
                  <Star size={14} color="#F59E0B" />
                  <Text style={styles.evalBtnText}>Baholash (1–5 yulduz)</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Hozircha topshiriqlar yo‘q</Text>}
      />

      {/* Create Task Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Yangi Topshiriq</Text>
            <TextInput
              style={styles.input}
              placeholder="Topshiriq sarlavhasi"
              placeholderTextColor="#64748B"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, { height: 75 }]}
              placeholder="Tavsif (ixtiyoriy)"
              placeholderTextColor="#64748B"
              multiline
              value={desc}
              onChangeText={setDesc}
            />
            <TextInput
              style={styles.input}
              placeholder="Bino (masalan: 1-Bino)"
              placeholderTextColor="#64748B"
              value={building}
              onChangeText={setBuilding}
            />
            <Text style={styles.label}>Kimga biriktiriladi:</Text>
            <View style={styles.rolesWrap}>
              {['slesar', 'veterinar', 'elektrik', 'ish_boshqaruvchi', 'qorovul'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, role === r && styles.roleChipActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleChipText, role === r && { color: '#0F172A' }]}>
                    {ROLE_LABELS[r] || r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={{ color: '#94A3B8', fontWeight: '600' }}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                <Text style={{ color: '#0F172A', fontWeight: '700' }}>Yaratish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Evaluate Task Modal */}
      <Modal visible={!!evalTask} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ishni Baholash</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setScore(s)}>
                  <Star
                    size={30}
                    color="#F59E0B"
                    fill={s <= score ? '#F59E0B' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Izoh (ixtiyoriy)"
              placeholderTextColor="#64748B"
              value={evalNote}
              onChangeText={setEvalNote}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEvalTask(null)}>
                <Text style={{ color: '#94A3B8', fontWeight: '600' }}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleEvaluate}>
                <Text style={{ color: '#0F172A', fontWeight: '700' }}>Tasdiqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardDone: { opacity: 0.72 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  roleTag: {
    backgroundColor: 'rgba(56,189,248,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTagText: { color: '#38BDF8', fontSize: 11, fontWeight: '700' },
  cardTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardDesc: { color: '#94A3B8', fontSize: 13, marginBottom: 8 },
  metaText: { color: '#64748B', fontSize: 12, marginBottom: 8 },
  doneBtn: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  doneBtnText: { color: '#22C55E', fontWeight: '700', fontSize: 13 },
  evalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 8,
    marginTop: 4,
  },
  evalBtnText: { color: '#F59E0B', fontWeight: '700', fontSize: 12 },
  empty: { color: '#64748B', textAlign: 'center', marginTop: 40 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    color: '#F8FAFC',
    marginBottom: 10,
  },
  label: { color: '#94A3B8', fontSize: 12, marginBottom: 8 },
  rolesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleChip: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleChipActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  roleChipText: { color: '#CBD5E1', fontSize: 12, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  saveBtn: { backgroundColor: '#22C55E', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
});
