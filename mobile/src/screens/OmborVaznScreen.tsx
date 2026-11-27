import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
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
import { Boxes, Scale, Plus, Search, Trash2, Edit2 } from 'lucide-react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { InventoryItem, ChickenWeightRecord } from '../types';
import { COLORS, CONTAINER_MAX, CARD_SHADOW } from '../theme';

const BRANCH_OPTIONS = [
  { id: 'all', label: 'Barcha Filiallar' },
  { id: 'chortoq', label: 'Chortoq' },
  { id: 'pop', label: 'Pop' },
  { id: 'yangiqorgon', label: 'Yangiqo‘rg‘on' },
  { id: 'kosonsoy', label: 'Kosonsoy' },
  { id: 'norin', label: 'Norin' },
];

export const OmborVaznScreen: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'inventory' | 'weights'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [weights, setWeights] = useState<ChickenWeightRecord[]>([]);
  const [branchFilter, setBranchFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [invModal, setInvModal] = useState(false);
  const [invName, setInvName] = useState('');
  const [invCategory, setInvCategory] = useState('yem');
  const [invQty, setInvQty] = useState('');
  const [invUnit, setInvUnit] = useState('kg');
  const [invMin, setInvMin] = useState('500');

  const [editInv, setEditInv] = useState<InventoryItem | null>(null);
  const [editQty, setEditQty] = useState('');

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
        branchId: branchFilter !== 'all' ? branchFilter : user?.branchId || 'chortoq',
        name: invName.trim(),
        category: invCategory,
        quantity: Number(invQty) || 0,
        unit: invUnit.trim() || 'kg',
        minThreshold: Number(invMin) || 100,
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

  const handleDeleteInventory = async (id: number | string) => {
    const go = async () => {
      try {
        await api.delete(`/api/inventory/${id}`);
        await loadData();
      } catch {
        Alert.alert('Xatolik', 'Mahsulot o‘chirilmadi');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Ushbu mahsulotni o‘chirmoqchimisiz?')) go();
    } else {
      Alert.alert('O‘chirish', 'Ushbu mahsulotni o‘chirmoqchimisiz?', [
        { text: 'Bekor', style: 'cancel' },
        { text: 'O‘chirish', style: 'destructive', onPress: go },
      ]);
    }
  };

  const handleAddWeight = async () => {
    if (!wAvg.trim()) {
      Alert.alert('Diqqat', 'O‘rtacha vaznni (gramm) kiriting');
      return;
    }
    try {
      await api.post('/api/weights', {
        branchId: branchFilter !== 'all' ? branchFilter : user?.branchId || 'chortoq',
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

  const filteredInventory = inventory.filter((item) => {
    if (branchFilter !== 'all' && item.branchId !== branchFilter) return false;
    if (catFilter !== 'all' && item.category !== catFilter) return false;
    if (searchText.trim() && !item.name.toLowerCase().includes(searchText.trim().toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredWeights = weights.filter((w) => {
    if (branchFilter !== 'all' && w.branchId !== branchFilter) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.topWrap}>
        <View style={styles.topRow}>
          <View style={styles.switchRow}>
            <TouchableOpacity
              style={[styles.switchBtn, tab === 'inventory' && styles.switchActive]}
              onPress={() => setTab('inventory')}
            >
              <Boxes size={16} color={tab === 'inventory' ? '#090E1A' : COLORS.textMuted} />
              <Text style={[styles.switchText, tab === 'inventory' && styles.switchTextActive]}>
                Ombor ({filteredInventory.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switchBtn, tab === 'weights' && styles.switchActive]}
              onPress={() => setTab('weights')}
            >
              <Scale size={16} color={tab === 'weights' ? '#090E1A' : COLORS.textMuted} />
              <Text style={[styles.switchText, tab === 'weights' && styles.switchTextActive]}>
                Vazn ({filteredWeights.length})
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => (tab === 'inventory' ? setInvModal(true) : setWeightModal(true))}
          >
            <Plus size={18} color="#090E1A" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Branch filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          <View style={styles.filterRow}>
            {BRANCH_OPTIONS.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[styles.filterChip, branchFilter === b.id && styles.filterChipActive]}
                onPress={() => setBranchFilter(b.id)}
              >
                <Text style={[styles.filterText, branchFilter === b.id && styles.filterTextActive]}>
                  {b.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {tab === 'inventory' && (
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Search size={14} color={COLORS.textDim} />
              <TextInput
                style={styles.searchInput}
                placeholder="Zahira nomi bo‘yicha qidirish..."
                placeholderTextColor={COLORS.textDim}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                {['all', 'yem', 'dori', 'ehtiyot_qismlar', 'tara'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.catChip, catFilter === c && styles.catChipActive]}
                    onPress={() => setCatFilter(c)}
                  >
                    <Text style={[styles.filterText, catFilter === c && { color: COLORS.sky }]}>
                      {c === 'all' ? 'Barcha toifa' : c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {tab === 'inventory' ? (
        <FlatList
          data={filteredInventory}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[CONTAINER_MAX, { padding: 16, paddingBottom: 32 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          renderItem={({ item }) => {
            const low = item.minThreshold != null && item.quantity <= item.minThreshold;
            return (
              <View style={[styles.card, CARD_SHADOW, low && { borderColor: COLORS.danger }]}>
                <View style={styles.rowBetween}>
                  <Text style={styles.branchTag}>{item.branchId.toUpperCase()}</Text>
                  <View style={[styles.statusBadge, low ? styles.statusLow : styles.statusOk]}>
                    <Text style={[styles.statusText, { color: low ? COLORS.danger : COLORS.primary }]}>
                      {low ? 'Kam qoldi' : 'Yetarli'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemTitle}>{item.name}</Text>

                <View style={styles.qtyBox}>
                  <View>
                    <Text style={styles.qtyLabel}>Joriy Zahira Miqdori:</Text>
                    <Text style={[styles.qty, low && { color: COLORS.danger }]}>
                      {item.quantity.toLocaleString()} {item.unit}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.qtyLabel}>Min. Chegara:</Text>
                    <Text style={styles.minVal}>
                      {item.minThreshold ?? 0} {item.unit}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <Text style={styles.sub}>{item.lastUpdated || item.category}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => {
                        setEditInv(item);
                        setEditQty(String(item.quantity));
                      }}
                    >
                      <Edit2 size={12} color={COLORS.textMuted} />
                      <Text style={styles.editBtnText}>O‘zgartirish</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteInventory(item.id)}>
                      <Trash2 size={14} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>Ombor ma’lumotlari yo‘q</Text>}
        />
      ) : (
        <FlatList
          data={filteredWeights}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[CONTAINER_MAX, { padding: 16, paddingBottom: 32 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          renderItem={({ item }) => {
            const diff = Math.round(item.avgWeightGrams - item.targetWeightGrams);
            return (
              <View style={[styles.card, CARD_SHADOW]}>
                <View style={styles.rowBetween}>
                  <Text style={styles.itemTitle}>
                    {item.building} • {item.cageNumber}
                  </Text>
                  <View style={styles.statusOk}>
                    <Text style={styles.qty}>{item.avgWeightGrams} g</Text>
                  </View>
                </View>
                <Text style={styles.sub}>
                  Yosh: {item.birdAgeDays} kun • Me’yor: {item.targetWeightGrams} g ({diff >= 0 ? `+${diff}g` : `${diff}g`})
                </Text>
                <Text style={[styles.sub, { color: COLORS.textDim }]}>
                  {item.measuredBy} • {item.measuredDate}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>Vazn o‘lchovlari yo‘q</Text>}
        />
      )}

      {/* Modals */}
      <Modal visible={invModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Omborga Yangi Zahira Qo‘shish</Text>
            <TextInput
              style={styles.input}
              placeholder="Mahsulot nomi (masalan: Kombikorm PK-1)"
              placeholderTextColor={COLORS.textDim}
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
                  <Text style={[styles.chipText, invCategory === c && { color: '#090E1A' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Miqdor"
                placeholderTextColor={COLORS.textDim}
                keyboardType="numeric"
                value={invQty}
                onChangeText={setInvQty}
              />
              <TextInput
                style={[styles.input, { width: 85 }]}
                placeholder="Birlik"
                placeholderTextColor={COLORS.textDim}
                value={invUnit}
                onChangeText={setInvUnit}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Min. chegara (masalan: 500)"
              placeholderTextColor={COLORS.textDim}
              keyboardType="numeric"
              value={invMin}
              onChangeText={setInvMin}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setInvModal(false)}>
                <Text style={{ color: COLORS.textMuted, fontWeight: '600' }}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddInventory}>
                <Text style={{ color: '#090E1A', fontWeight: '800' }}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              placeholderTextColor={COLORS.textDim}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditInv(null)}>
                <Text style={{ color: COLORS.textMuted, fontWeight: '600' }}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateQty}>
                <Text style={{ color: '#090E1A', fontWeight: '800' }}>Yangilash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={weightModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Yangi Vazn O‘lchovi</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Bino (1-Bino)"
                placeholderTextColor={COLORS.textDim}
                value={wBuilding}
                onChangeText={setWBuilding}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Qafas (Qafas-A1)"
                placeholderTextColor={COLORS.textDim}
                value={wCage}
                onChangeText={setWCage}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Yoshi (kun)"
                placeholderTextColor={COLORS.textDim}
                keyboardType="numeric"
                value={wAge}
                onChangeText={setWAge}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="O‘rtacha vazn (g)"
                placeholderTextColor={COLORS.textDim}
                keyboardType="numeric"
                value={wAvg}
                onChangeText={setWAvg}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Me’yor vazn (g)"
              placeholderTextColor={COLORS.textDim}
              keyboardType="numeric"
              value={wTarget}
              onChangeText={setWTarget}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setWeightModal(false)}>
                <Text style={{ color: COLORS.textMuted, fontWeight: '600' }}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddWeight}>
                <Text style={{ color: '#090E1A', fontWeight: '800' }}>Saqlash</Text>
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
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchRow: { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 4, borderRadius: 12 },
  switchBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 9 },
  switchActive: { backgroundColor: COLORS.primary },
  switchText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 13 },
  switchTextActive: { color: '#090E1A' },
  addBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: COLORS.amber, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', gap: 6 },
  filterChip: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  filterChipActive: { backgroundColor: COLORS.amber, borderColor: COLORS.amber },
  filterText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#090E1A', fontWeight: '800' },
  searchRow: { marginTop: 8, gap: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12 },
  searchInput: { flex: 1, color: COLORS.text, paddingVertical: 9, fontSize: 13 },
  catChip: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  catChipActive: { backgroundColor: COLORS.skySoft, borderColor: COLORS.sky },
  card: { backgroundColor: COLORS.surface, borderRadius: 15, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  branchTag: { color: COLORS.textDim, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  statusOk: { backgroundColor: COLORS.primarySoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  statusLow: { backgroundColor: COLORS.dangerSoft },
  statusText: { fontSize: 11, fontWeight: '700' },
  itemTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  qtyBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.bg, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  qtyLabel: { color: COLORS.textDim, fontSize: 10, marginBottom: 2 },
  qty: { color: COLORS.amber, fontSize: 15, fontWeight: '800' },
  minVal: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sub: { color: COLORS.textDim, fontSize: 11 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.borderStrong, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  delBtn: { padding: 6 },
  empty: { color: COLORS.textDim, textAlign: 'center', marginTop: 40 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 20 },
  modalCard: { ...CONTAINER_MAX, maxWidth: 460, backgroundColor: COLORS.surface, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: COLORS.borderStrong },
  modalTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: 14 },
  input: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.borderStrong, borderRadius: 10, padding: 12, color: COLORS.text, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.borderStrong, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
});
