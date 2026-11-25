import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  api,
  STORAGE_KEYS,
  saveUserSession,
  getUserSession,
  clearUserSession,
} from '../services/api';
import {
  registerForPushNotificationsAsync,
  unregisterPushToken,
} from '../services/notifications';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await getUserSession();
        if (saved) setUser(saved);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await api.post('/api/auth/login', { username, password });
      if (res.data?.success && res.data?.user) {
        const loggedUser: User = res.data.user;
        setUser(loggedUser);
        await saveUserSession(loggedUser);

        // Register Expo Push Token with Flask backend
        const token = await registerForPushNotificationsAsync(username, password);
        if (token) {
          await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
        }
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Login yoki parol xato' };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Serverga ulanib bo‘lmadi',
      };
    }
  };

  const logout = async () => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
    if (token && user) {
      await unregisterPushToken(token, user.username);
      await AsyncStorage.removeItem(STORAGE_KEYS.PUSH_TOKEN);
    }
    await clearUserSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
