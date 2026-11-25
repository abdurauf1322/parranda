import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://web-production-29e4451d.up.railway.app';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const STORAGE_KEYS = {
  USER: '@uychi_user',
  PUSH_TOKEN: '@uychi_push_token',
};

export async function saveUserSession(user: any) {
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export async function getUserSession() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  return raw ? JSON.parse(raw) : null;
}

export async function clearUserSession() {
  await AsyncStorage.removeItem(STORAGE_KEYS.USER);
}
