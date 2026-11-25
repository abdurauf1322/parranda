import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LogOut, Egg } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../types';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Chiqish', 'Tizimdan chiqishni xohlaysizmi?', [
      { text: 'Bekor qilish', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <View style={styles.logoBox}>
          <Egg size={18} color="#0F172A" strokeWidth={2.5} />
        </View>
        <Text style={styles.title}>UYCHI PARRANDA</Text>
      </View>

      {user && (
        <View style={styles.right}>
          <View style={styles.badge}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.fullName.split(' ')[0]}
            </Text>
            <Text style={styles.roleText}>
              {ROLE_LABELS[user.role] || user.role}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: 'flex-end',
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 110,
  },
  roleText: {
    color: '#22C55E',
    fontSize: 10,
    fontWeight: '600',
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#1E293B',
    borderRadius: 10,
  },
});
