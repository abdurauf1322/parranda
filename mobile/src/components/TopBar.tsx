import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { LogOut, Egg } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../types';
import { COLORS, CONTAINER_MAX } from '../theme';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Tizimdan chiqishni xohlaysizmi?')) {
        logout();
      }
      return;
    }
    Alert.alert('Chiqish', 'Tizimdan chiqishni xohlaysizmi?', [
      { text: 'Bekor qilish', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Egg size={18} color="#090E1A" strokeWidth={2.5} />
          </View>
          <View>
            <Text style={styles.title}>UYCHI PARRANDA</Text>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Jonli boshqaruv</Text>
            </View>
          </View>
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
              <LogOut size={17} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  inner: {
    ...CONTAINER_MAX,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  liveText: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: '600',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: 'flex-end',
  },
  userName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 120,
  },
  roleText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  logoutBtn: {
    padding: 9,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
  },
});
