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
import { COLORS, CONTAINER_MAX, CARD_SHADOW } from '../theme';

export const TopshiriqlarScreen: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [building, setBuilding] = useState('1-Bino');
  const [role, setRole] = useState('slesar');

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

  const filtered = tasks.filter((t) => {
    const isDone = t.status === 'bajarildi' || t.status === 'tasdiqlandi';
    if (filter === 'pending') return !isDone;
    if (filter === 'done') return isDone;
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.topWrap}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Topshiriqlar ({filtered.length})</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
            <Plus size={16} color="#090E1A" strokeWidth={2.5} />
            <Text style={styles.addBtnText}>Yangi</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {[
            { id: 'all', label: 'Hammasi' },
            { id: 'pending', label: 'Faol' },
            { id: 'done', label: 'Bajarilgan' },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
              onPress={() => setFilter(f.id as any)}
            >
              <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[CONTAINER_MAX, { padding: 16, paddingBottom: 32 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => {
          const done = item.status === 'bajarildi' || item.status === 'tasdiqlandi';
          const rated = item.status === 'tasdiqlandi';
          return (
            <View style={[styles.card, CARD_SHADOW, done && styles.cardDone]}>
              <View style={styles.cardTop}>
                <View style={styles.badgesRow}>
                  <View style={styles.roleTag}>
                    <Text style={styles.roleTagText}>
                      {ROLE_LABELS[item.assignedToRole] || item.assignedToRole}
                    </Text>
                  </View>
                  {!!item.building && (
                    <View style={styles.bldgTag}>
                      <Text style={styles.bldgTagText}>{item.building}</Text>
                    </View>
                  )}
                </View>

                {rated ? (
                  <View style={styles.starBadge}>
                    <Star size={13} color={COLORS.amber} fill={COLORS.amber} />
                    <Text style={styles.starText}>{item.evaluationScore || 5}/5</Text>
                  </View>
                ) : done ? (
                  <CheckCircle2 size={18} color={COLORS.primary} />
                ) : (
                  <Clock size={16} color={COLORS.amber} />
                )}
              </View>

              <Text style={[styles.cardTitle, done && { color: COLORS.textMuted }]}>{item.title}</Text>
              {!!item.description && <Text style={styles.cardDesc}>{item.description}</Text>}
              <Text style={styles.metaText}>Beruvchi: {item.assignedByName || 'Rahbar'}</Text>

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
                  <Star size={14} color={COLORS.amber} />
                  <Text style={styles.evalBtnText}>Baholash (1–5 yulduz)</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Topshiriqlar topilmadi</Text>}
      />

      {/* Modals */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Yangi Topshiriq</Text>
            <TextInput
              style={styles.input}
              placeholder="Topshiriq sarlavhasi"
              placeholderTextColor={COLORS.textDim}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, { height: 75 }]}
              placeholder="Tavsif (ixtiyoriy)"
              placeholderTextColor={COLORS.textDim}
              multiline
              value={desc}
              onChangeText={setDesc}
            />
            <TextInput
              style={styles.input}
              placeholder="Bino (masalan: 1-Bino)"
              placeholderTextColor={COLORS.textDim}
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
                  <Text style={[styles.roleChipText, role === r && { color: '#090E1A' }]}>
                    {ROLE_LABELS[r] || r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={{ color: COLORS.textMuted, fontWeight: '600' }}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                <Text style={{ color: '#090E1A', fontWeight: '800' }}>Yaratish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!evalTask} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ishni Baholash</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setScore(s)}>
                  <Star
                    size={30}
                    color={COLORS.amber}
                    fill={s <= score ? COLORS.amber : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Izoh (ixtiyoriy)"
              placeholderTextColor={COLORS.textDim}
              value={evalNote}
              onChangeText={setEvalNote}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEvalTask(null)}>
                <Text style={{ color: COLORS.textMuted, fontWeight: '600' }}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleEvaluate}>
                <Text style={{ color: '#090E1A', fontWeight: '800' }}>Tasdiqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topWrap: { ...CONTAINER_MAX, paddingHorizontal: 16, paddingTop: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: '#090E1A', fontWeight: '800', fontSize: 13 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  filterChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
  },
  filterChipActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
  filterText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: COLORS.primary, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardDone: { opacity: 0.72 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badgesRow: { flexDirection: 'row', gap: 6 },
  roleTag: {
    backgroundColor: COLORS.skySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTagText: { color: COLORS.sky, fontSize: 11, fontWeight: '700' },
  bldgTag: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bldgTagText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  starBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.amberSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  starText: { color: COLORS.amber, fontWeight: '700', fontSize: 12 },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardDesc: { color: COLORS.textMuted, fontSize: 13, marginBottom: 8 },
  metaText: { color: COLORS.textDim, fontSize: 11, marginBottom: 8 },
  doneBtn: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  doneBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  evalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.amberSoft,
    borderWidth: 1,
    borderColor: COLORS.amber,
    borderRadius: 10,
    paddingVertical: 9,
    marginTop: 4,
  },
  evalBtnText: { color: COLORS.amber, fontWeight: '700', fontSize: 12 },
  empty: { color: COLORS.textDim, textAlign: 'center', marginTop: 40 },
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
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    marginBottom: 10,
  },
  label: { color: COLORS.textMuted, fontSize: 12, marginBottom: 8 },
  rolesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleChip: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleChipText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
});
