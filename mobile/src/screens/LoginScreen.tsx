import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { Egg, Lock, User as UserIcon, Eye, EyeOff, Users, ChevronDown, Wifi } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ROLE_LABELS, User } from '../types';
import { COLORS, CARD_SHADOW } from '../theme';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [usersList, setUsersList] = useState<User[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [hRes, uRes] = await Promise.all([
          api.get('/api/health', { timeout: 6000 }),
          api.get('/api/auth/users', { timeout: 6000 }),
        ]);
        setServerOnline(hRes.status === 200);
        if (Array.isArray(uRes.data)) setUsersList(uRes.data);
      } catch {
        setServerOnline(false);
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Login va parolni kiriting');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await login(username.trim(), password);
    setLoading(false);
    if (!res.success) {
      setError(res.message || 'Kirishda xatolik');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, CARD_SHADOW]}>
          <View style={styles.logoWrap}>
            <Egg size={32} color="#090E1A" strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>UYCHI PARRANDA</Text>
          <Text style={styles.subtitle}>Parrandachilik Boshqaruv Tizimi</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {usersList.length > 0 && (
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickerOpen(true)}>
              <Users size={16} color={COLORS.sky} />
              <Text style={styles.pickerBtnText}>
                {username
                  ? `Tanlangan: @${username}`
                  : 'Xodimlar ro‘yxatidan tanlash'}
              </Text>
              <ChevronDown size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}

          <View style={styles.inputWrap}>
            <UserIcon size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Login (masalan: slesar)"
              placeholderTextColor={COLORS.textDim}
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.inputWrap}>
            <Lock size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Parol"
              placeholderTextColor={COLORS.textDim}
              secureTextEntry={!showPw}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
              {showPw ? (
                <EyeOff size={18} color={COLORS.textMuted} />
              ) : (
                <Eye size={18} color={COLORS.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#090E1A" />
            ) : (
              <Text style={styles.btnText}>Tizimga Kirish</Text>
            )}
          </TouchableOpacity>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    serverOnline === true
                      ? COLORS.primary
                      : serverOnline === false
                      ? COLORS.danger
                      : COLORS.amber,
                },
              ]}
            />
            <Wifi size={12} color={COLORS.textDim} />
            <Text style={styles.statusText}>
              {serverOnline === true
                ? 'Server: Onlayn'
                : serverOnline === false
                ? 'Serverga ulanib bo‘lmadi'
                : 'Server tekshirilmoqda...'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Xodim tanlash modal */}
      <Modal visible={pickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Xodimni tanlang</Text>
            <FlatList
              data={usersList}
              keyExtractor={(item) => String(item.id)}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userRow}
                  onPress={() => {
                    setUsername(item.username);
                    setPickerOpen(false);
                    setError(null);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userFull}>{item.fullName}</Text>
                    <Text style={styles.userRole}>
                      {ROLE_LABELS[item.role] || item.role} • @{item.username}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setPickerOpen(false)}>
              <Text style={{ color: COLORS.textMuted, fontWeight: '700' }}>Yopish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 22,
  },
  errorBox: {
    width: '100%',
    backgroundColor: COLORS.dangerSoft,
    borderColor: COLORS.danger,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  pickerBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.skySoft,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
  },
  pickerBtnText: {
    flex: 1,
    color: COLORS.sky,
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    paddingVertical: 14,
    paddingLeft: 10,
    fontSize: 15,
  },
  eyeBtn: {
    padding: 6,
  },
  btn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#090E1A',
    fontSize: 16,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  userRow: {
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  userFull: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  userRole: {
    color: COLORS.primary,
    fontSize: 12,
    marginTop: 2,
  },
  closeModalBtn: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
