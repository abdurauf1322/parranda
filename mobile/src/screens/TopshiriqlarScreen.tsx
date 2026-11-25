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
import { Plus, CheckCircle2, Clock } from 'lucide-react-native';
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
  const [role, setRole] = useState('slesar');

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

  const handleComplete = async (id: string) => {
    try {
      await api.put(`/api/tasks/${id}`, { status: 'bajarildi' });
      await loadTasks();
    } catch {
      Alert.alert('Xatolik', 'Topshiriqni yangilab bo‘lmadi');
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      await api.post('/api/tasks', {
        title: title.trim(),
        description: desc.trim(),
        assignedToRole: role,
        assignedBy: user?.fullName || 'Mobil ilova',
        status: 'kutilmoqda',
      });
      await api.post('/api/push/broadcast', {
        title: `Yangi Topshiriq: ${title.trim()}`,
        body: desc.trim() || 'Sizga yangi vazifa yuklatildi',
        role,
        url: '/tasks',
      });
      setTitle('');
      setDesc('');
      setModalOpen(false);
      await loadTasks();
    } catch {
      Alert.alert('Xatolik', 'Topshiriq yaratishda xatolik');
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
        renderItem={({ item }) => {
          const done = item.status === 'bajarildi';
          return (
            <View style={[styles.card, done && styles.cardDone]}>
              <View style={styles.cardTop}>
                <Text style={styles.roleTag}>{ROLE_LABELS[item.assignedToRole] || item.assignedToRole}</Text>
                {done ? (
                  <CheckCircle2 size={18} color="#22C55E" />
                ) : (
                  <Clock size={16} color="#F59E0B" />
                )}
              </View>
              <Text style={[styles.title, done && styles.muted]}>{item.title}</Text>
              {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
              {!done && (
                <TouchableOpacity style={styles.doneBtn} onPress={() => handleComplete(item.id)}>
                  <Text style={styles.doneBtnText}>Bajarildi</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Hozircha topshiriqlar yo‘q</Text>}
      />

      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Yangi Topshiriq</Text>
            <TextInput
              style={styles.input}
              placeholder="Topshiriq nomi"
              placeholderTextColor="#64748B"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Tavsif (ixtiyoriy)"
              placeholderTextColor="#64748B"
              multiline
              value={desc}
              onChangeText={setDesc}
            />
            <TextInput
              style={styles.input}
              placeholder="Rol (masalan: slesar, elektrik, veterinar)"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              value={role}
              onChangeText={setRole}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} style={styles.saveBtn}>
                <Text style={styles.saveText}>Yuborish</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  headerTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#22C55E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#0F172A', fontWeight: '800', fontSize: 13 },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 10 },
  cardDone: { opacity: 0.55 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  roleTag: { color: '#F59E0B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  desc: { color: '#94A3B8', fontSize: 13, marginBottom: 10 },
  muted: { textDecorationLine: 'line-through', color: '#94A3B8' },
  doneBtn: { alignSelf: 'flex-start', backgroundColor: 'rgba(34,197,94,0.18)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  doneBtnText: { color: '#22C55E', fontWeight: '700', fontSize: 12 },
  empty: { color: '#64748B', textAlign: 'center', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20 },
  modalTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '800', marginBottom: 14 },
  input: { backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { padding: 10 },
  cancelText: { color: '#94A3B8', fontWeight: '700' },
  saveBtn: { backgroundColor: '#22C55E', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  saveText: { color: '#0F172A', fontWeight: '800' },
});
