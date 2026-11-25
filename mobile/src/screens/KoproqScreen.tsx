import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Camera, CalendarCheck2, StickyNote, LogOut } from 'lucide-react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AttendanceRecord, PersonalNote, ROLE_LABELS } from '../types';

export const KoproqScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [noteText, setNoteText] = useState('');

  const loadData = async () => {
    try {
      const [aRes, nRes] = await Promise.all([
        api.get('/api/attendance'),
        api.get('/api/notes'),
      ]);
      if (Array.isArray(aRes.data)) setAttendance(aRes.data.slice(0, 5));
      if (Array.isArray(nRes.data)) setNotes(nRes.data);
    } catch (e) {
      console.warn('Ma’lumot yuklashda xatolik:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handlePhotoUpload = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Ruxsat kerak', 'Kamera ruxsatini yoqing');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        await api.post('/api/photos', {
          userId: user?.id,
          userName: user?.fullName,
          role: user?.role,
          category: 'kunlik_hisobot',
          caption: 'Mobil ilovadan foto-hisobot',
          imageUrl: `data:image/jpeg;base64,${result.assets[0].base64}`,
        });
        Alert.alert('Yuklandi', 'Foto-hisobot muvaffaqiyatli yuborildi!');
      } catch {
        Alert.alert('Xatolik', 'Rasmni yuklab bo‘lmadi');
      }
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !user) return;
    try {
      await api.post('/api/notes', {
        userId: user.id,
        title: 'Zametka',
        content: noteText.trim(),
      });
      setNoteText('');
      await loadData();
    } catch {
      Alert.alert('Xatolik', 'Zametka saqlanmadi');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* Foto-Hisobot */}
      <TouchableOpacity style={styles.photoCard} onPress={handlePhotoUpload}>
        <Camera size={24} color="#0F172A" />
        <View style={{ flex: 1 }}>
          <Text style={styles.photoTitle}>Foto-Hisobot Yuborish</Text>
          <Text style={styles.photoSub}>Kamera orqali suratga olib serverga yuklash</Text>
        </View>
      </TouchableOpacity>

      {/* Davomat Jurnali */}
      <View style={styles.section}>
        <View style={styles.secHeader}>
          <CalendarCheck2 size={16} color="#22C55E" />
          <Text style={styles.secTitle}>DAVOMAT JURNALI (OXIRGI)</Text>
        </View>
        {attendance.map((a) => (
          <View key={a.id} style={styles.row}>
            <Text style={styles.rowText}>{a.userName}</Text>
            <Text style={styles.rowTime}>{a.date} • {a.checkInTime?.slice(0, 5)}</Text>
          </View>
        ))}
      </View>

      {/* Shaxsiy Zametkalar */}
      <View style={styles.section}>
        <View style={styles.secHeader}>
          <StickyNote size={16} color="#F59E0B" />
          <Text style={styles.secTitle}>SHAXSIY ZAMETKALAR</Text>
        </View>
        <View style={styles.noteInputRow}>
          <TextInput
            style={styles.noteInput}
            placeholder="Yangi zametka..."
            placeholderTextColor="#64748B"
            value={noteText}
            onChangeText={setNoteText}
          />
          <TouchableOpacity style={styles.noteBtn} onPress={handleAddNote}>
            <Text style={styles.noteBtnText}>Saqlash</Text>
          </TouchableOpacity>
        </View>
        {notes.map((n) => (
          <View key={n.id} style={styles.noteItem}>
            <Text style={styles.noteContent}>{n.content}</Text>
          </View>
        ))}
      </View>

      {/* Profil va Chiqish */}
      <View style={styles.section}>
        <Text style={styles.profileName}>{user?.fullName}</Text>
        <Text style={styles.profileRole}>{user ? ROLE_LABELS[user.role] || user.role : ''}</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={18} color="#FCA5A5" />
          <Text style={styles.logoutText}>Hisobdan Chiqish</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#22C55E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  photoTitle: { color: '#0F172A', fontSize: 16, fontWeight: '900' },
  photoSub: { color: '#0F172A', fontSize: 12, opacity: 0.8 },
  section: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 16 },
  secHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  secTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#0F172A' },
  rowText: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  rowTime: { color: '#22C55E', fontSize: 12, fontWeight: '700' },
  noteInputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  noteInput: { flex: 1, backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  noteBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 14, justifyContent: 'center', borderRadius: 10 },
  noteBtnText: { color: '#0F172A', fontWeight: '800', fontSize: 12 },
  noteItem: { backgroundColor: '#0F172A', padding: 10, borderRadius: 10, marginBottom: 6 },
  noteContent: { color: '#E2E8F0', fontSize: 13 },
  profileName: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  profileRole: { color: '#94A3B8', fontSize: 13, marginBottom: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.15)', paddingVertical: 12, borderRadius: 12 },
  logoutText: { color: '#FCA5A5', fontWeight: '800', fontSize: 14 },
});
