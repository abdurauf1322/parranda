import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Egg, Lock, User as UserIcon } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <Egg size={32} color="#0F172A" strokeWidth={2.5} />
        </View>
        <Text style={styles.title}>UYCHI PARRANDA</Text>
        <Text style={styles.subtitle}>Mobil Boshqaruv Tizimi</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputWrap}>
          <UserIcon size={18} color="#94A3B8" />
          <TextInput
            style={styles.input}
            placeholder="Login (username)"
            placeholderTextColor="#64748B"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View style={styles.inputWrap}>
          <Lock size={18} color="#94A3B8" />
          <TextInput
            style={styles.input}
            placeholder="Parol"
            placeholderTextColor="#64748B"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0F172A" />
          ) : (
            <Text style={styles.btnText}>Tizimga Kirish</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 24,
  },
  errorBox: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    textAlign: 'center',
  },
  inputWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    paddingVertical: 14,
    paddingLeft: 10,
    fontSize: 15,
  },
  btn: {
    width: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
});
