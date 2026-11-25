import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Boxes, Scale } from 'lucide-react-native';
import { api } from '../services/api';
import { InventoryItem, ChickenWeightRecord } from '../types';

export const OmborVaznScreen: React.FC = () => {
  const [tab, setTab] = useState<'inventory' | 'weights'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [weights, setWeights] = useState<ChickenWeightRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <View style={styles.container}>
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

      {tab === 'inventory' ? (
        <FlatList
          data={inventory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.itemTitle}>{item.itemName}</Text>
                <Text style={styles.qty}>
                  {item.quantity} {item.unit}
                </Text>
              </View>
              <Text style={styles.sub}>{item.category} • Filial: {item.branchId}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Ombor ma’lumotlari yo‘q</Text>}
        />
      ) : (
        <FlatList
          data={weights}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.itemTitle}>{item.houseName}</Text>
                <Text style={styles.qty}>{item.averageWeightGrams} g</Text>
              </View>
              <Text style={styles.sub}>
                Yoshi: {item.ageDays} kun • Namuna: {item.sampleCount} ta • {item.date}
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Vazn qaydnomalari yo‘q</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  switchRow: { flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 10 },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 12,
  },
  switchActive: { backgroundColor: '#22C55E' },
  switchText: { color: '#94A3B8', fontWeight: '700', fontSize: 13 },
  switchTextActive: { color: '#0F172A', fontWeight: '800' },
  card: { backgroundColor: '#1E293B', borderRadius: 14, padding: 14, marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
  qty: { color: '#22C55E', fontSize: 15, fontWeight: '800' },
  sub: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  empty: { color: '#64748B', textAlign: 'center', marginTop: 40 },
});
