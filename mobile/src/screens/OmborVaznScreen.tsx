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
import { Boxes, Scale, Plus } from 'lucide-react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { InventoryItem, ChickenWeightRecord } from '../types';

export const OmborVaznScreen: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'inventory' | 'weights'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [weights, setWeights] = useState<ChickenWeightRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Add inventory modal
  const [invModal, setInvModal] = useState(false);
  const [invName, setInvName] = useState('');
  const [invCategory, setInvCategory] = useState('yem');
  const [invQty, setInvQty] = useState('');
  const [invUnit, setInvUnit] = useState('kg');

  // Edit quantity modal
  const [editInv, setEditInv] = useState<InventoryItem | null>(null);
  const [editQty, setEditQty] = useState('');

  // Add weight modal
  const [weightModal, setWeightModal] = useState(false);
  const [wBuilding, setWBuilding] = useState('1-Bino');
  const [wCage, setWCage] = useState('Qafas-A1');
  const [wAge, setWAge] = useState('30');
  const [wAvg, setWAvg] = useState('');
  const [wTarget, setWTarget] = useState('1800');

  const loadData = async () => {
    try {
      const [invRes, wRes] = await Promise.all([
        api.get('/api/inventory'),
        api.get('/api/weights'),
      ]);
      if (Array.isArray(invRes.data)) setInventory(invRes.data);
      if (Array.isArray(wRes.data)) setWeights(wRes.data);
    } catch (e) {
      console.warn('Ombor/Vazn yuklashda xatolik:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddInventory = async () => {
    if (!invName.trim() || !invQty.trim()) {
      Alert.alert('Diqqat', 'Mahsulot nomi va miqdorini kiriting');
      return;
    }
    try {
      await api.post('/api/inventory', {
        branchId: user?.branchId || 'chortoq',
        name: invName.trim(),
        category: invCategory,
        quantity: Number(invQty) || 0,
        unit: invUnit.trim() || 'kg',
      });
      setInvName('');
      setInvQty('');
      setInvModal(false);
      await loadData();
    } catch {
      Alert.alert('Xatolik', 'Mahsulot qo‘shilmadi');
    }
  };

  const handleUpdateQty = async () => {
    if (!editInv) return;
    try {
      await api.put(`/api/inventory/${editInv.id}`, {
        quantity: Number(editQty) || 0,
      });
      setEditInv(null);
      await loadData();
    } catch {
      Alert.alert('Xatolik', 'Miqdor yangilanmadi');
    }
  };

  const handleAddWeight = async () => {
    if (!wAvg.trim()) {
      Alert.alert('Diqqat', 'O‘rtacha vaznni (gramm) kiriting');
      return;
    }
    try {
      await api.post('/api/weights', {
        branchId: user?.branchId || 'chortoq',
        building: wBuilding.trim() || '1-Bino',
        cageNumber: wCage.trim() || 'Qafas-A1',
        birdAgeDays: Number(wAge) || 30,
        avgWeightGrams: Number(wAvg) || 0,
        targetWeightGrams: Number(wTarget) || 1800,
        measuredBy: user?.fullName || 'Xodim',
      });
      setWAvg('');
      setWeightModal(false);
      await loadData();
    } catch {
      Alert.alert('Xatolik', 'Vazn o‘lchovi saqlanmadi');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.switchRow}>
          <TouchableOpacity
            style={[styles.switchBtn, tab === 'inventory' && styles.switchActive]}
            onPress={() => setTab('inventory')}
          >
            <Boxes size={16} color={tab === 'inventory' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.switchText, tab === 'inventory' && styles.switchTextActive]}>
              Ombor ({inventory.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchBtn, tab === 'weights' && styles.switchActive]}
            onPress={() => setTab('weights')}
          >
            <Scale size={16} color={tab === 'weights' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.switchText, tab === 'weights' && styles.switchTextActive]}>
              Vazn ({weights.length})
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => (tab === 'inventory' ? setInvModal(true) : setWeightModal(true))}
        >
          <Plus size={18} color="#0F172A" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {tab === 'inventory' ? (
        <FlatList
          data={inventory}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
          renderItem={({ item }) => {
            const low = item.minThreshold != null && item.quantity <= item.minThreshold;
            return (
              <TouchableOpacity
                style={[styles.card, low && { borderColor: '#EF4444' }]}
                onPress={() => {
                  setEditInv(item);
                  setEditQty(String(item.quantity));
                }}
              >
                <View style={styles.rowBetween}>
                  <Text style={[styles.itemTitle, { flex: 1, marginRight: 8 }]}>{item.name}</Text>
                  <Text style={[styles.qty, low && { color: '#EF4444' }]}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
                <Text style={styles.sub}>
                  {item.category} • Filial: {item.branchId} • Tahrirlash uchun bosing
                </Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>Ombor ma’lumotlari yo‘q</Text>}
        />
      ) : (
        <FlatList
          data={weights}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.itemTitle}>
                  {item.building} • {item.cageNumber}
                </Text>
                <Text style={styles.qty}>{item.avgWeightGrams} g</Text>
              </View>
              <Text style={styles.sub}>
                Yosh: {item.birdAgeDays} kun • Me’yor: {item.targetWeightGrams} g • {item.measuredBy} • {item.measuredDate}
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Vazn o‘lchovlari yo‘q</Text>}
        />
      )}

      {/* Add Inventory Modal */}
      <Modal visible={invModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Omborga Mahsulot Qo‘shish</Text>
            <TextInput
              style={styles.input}
              placeholder="Mahsulot nomi (masalan: Kombikorm PK-1)"
              placeholderTextColor="#64748B"
              value={invName}
              onChangeText={setInvName}
            />
            <View style={styles.chipRow}>
              {['yem', 'dori', 'ehtiyot_qismlar', 'tara'].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, invCategory === c && styles.chipActive]}
                  onPress={() => setInvCategory(c)}
                >
                  <Text style={[styles.chipText, invCategory === c && { color: '#0F172A' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Miqdor"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={invQty}
                onChangeText={setInvQty}
              />
              <TextInput
                style={[styles.input, { width: 90 }]}
                placeholder="Birlik (kg)"
                placeholderTextColor="#64748B"
                value={invUnit}
                onChangeText={setInvUnit}
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setInvModal(false)}>
                <Text style={{ color: '#94A3B8', fontWeight: '600' }}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddInventory}>
                <Text style={{ color: '#0F172A', fontWeight: '700' }}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Inventory Quantity Modal */}
      <Modal visible={!!editInv} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editInv?.name} miqdorini yangilash</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={editQty}
              onChangeText={setEditQty}
              placeholder="Yangi miqdor"
              placeholderTextColor="#64748B"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditInv(null)}>
                <Text style={{ color: '#94A3B8', fontWeight: '600' }}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateQty}>
                <Text style={{ color: '#0F172A', fontWeight: '700' }}>Yangilash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Weight Modal */}
      <Modal visible={weightModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Yangi Vazn O‘lchovi</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Bino (1-Bino)"
                placeholderTextColor="#64748B"
                value={wBuilding}
                onChangeText={setWBuilding}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Qafas (Qafas-A1)"
                placeholderTextColor="#64748B"
                value={wCage}
                onChangeText={setWCage}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Yoshi (kun)"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={wAge}
                onChangeText={setWAge}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="O‘rtacha vazn (g)"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={wAvg}
                onChangeText={setWAvg}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Me’yor vazn (g)"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={wTarget}
              onChangeText={setWTarget}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setWeightModal(false)}>
                <Text style={{ color: '#94A3B8', fontWeight: '600' }}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddWeight}>
                <Text style={{ color: '#0F172A', fontWeight: '700' }}>Saqlash</Text>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
  },
  switchRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#1E293B',
    padding: 4,
    borderRadius: 12,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  switchActive: { backgroundColor: '#22C55E' },
  switchText: { color: '#94A3B8', fontWeight: '700', fontSize: 13 },
  switchTextActive: { color: '#0F172A' },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
  qty: { color: '#22C55E', fontSize: 15, fontWeight: '800' },
  sub: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  empty: { color: '#64748B', textAlign: 'center', marginTop: 40 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '700', marginBottom: 14 },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    color: '#F8FAFC',
    marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  chipText: { color: '#CBD5E1', fontSize: 12, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  saveBtn: { backgroundColor: '#22C55E', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
});
