import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import {
  Camera,
  Image as ImageIcon,
  CalendarCheck2,
  StickyNote,
  LogOut,
  Building2,
  ClipboardList,
  Trash2,
  KeyRound,
} from 'lucide-react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  AttendanceRecord,
  PersonalNote,
  PhotoReport,
  DailyFactoryReport,
  BranchInfo,
  ROLE_LABELS,
} from '../types';

export const KoproqScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [photos, setPhotos] = useState<PhotoReport[]>([]);
  const [reports, setReports] = useState<DailyFactoryReport[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [noteText, setNoteText] = useState('');

  // Change password modal
  const [pwModal, setPwModal] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');

  const loadData = async () => {
    try {
      const [aRes, nRes, pRes, rRes, bRes] = await Promise.all([
        api.get('/api/attendance'),
        api.get(`/api/notes?userId=${user?.id || 1}`),
        api.get('/api/photos'),
        api.get('/api/daily-reports'),
        api.get('/api/branches'),
      ]);
      if (Array.isArray(aRes.data)) setAttendance(aRes.data.slice(0, 6));
      if (Array.isArray(nRes.data)) setNotes(nRes.data);
      if (Array.isArray(pRes.data)) setPhotos(pRes.data.slice(0, 5));
      if (Array.isArray(rRes.data)) setReports(rRes.data.slice(0, 5));
      if (Array.isArray(bRes.data)) setBranches(bRes.data);
    } catch (e) {
      console.warn('Ma’lumot yuklashda xatolik:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const handleCheckIn = async () => {
    if (!user) return;
    try {
      const res = await api.post('/api/attendance/check-in', { userId: user.id });
      const t = res.data?.attendance?.checkInTime?.slice(0, 5) || 'Hozir';
      Alert.alert('Davomat belgilandi', `Kelgan vaqtingiz: ${t}`);
      await loadData();
    } catch {
      Alert.alert('Xatolik', 'Davomat belgilashda xatolik');
    }
  };

  const uploadPhotoAsset = async (base64?: string | null) => {
    if (!base64) return;
    try {
      await api.post('/api/photos', {
        uploaderName: user?.fullName || 'Xodim',
        uploaderRole: user?.role || 'slesar',
        title: 'Mobil foto-hisobot',
        category: 'sanitariya',
        building: '1-Bino',
        imageUrl: `data:image/jpeg;base64,${base64}`,
        notes: 'Mobil ilovadan yuborildi',
      });
      Alert.alert('Yuklandi', 'Foto-hisobot muvaffaqiyatli yuborildi!');
      await loadData();
    } catch {
      Alert.alert('Xatolik', 'Rasmni yuklab bo‘lmadi');
    }
  };

  const handleCameraUpload = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Ruxsat kerak', 'Kamera ruxsatini yoqing');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadPhotoAsset(result.assets[0].base64);
    }
  };

  const handleGalleryUpload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Ruxsat kerak', 'Galereya ruxsatini yoqing');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadPhotoAsset(result.assets[0].base64);
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

  const handleDeleteNote = async (id: number | string) => {
    try {
      await api.delete(`/api/notes/${id}`);
      await loadData();
    } catch {
      Alert.alert('Xatolik', 'Zametkani o‘chirib bo‘lmadi');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPw || !newPw || !user) return;
    try {
      await api.post('/api/auth/change-password', {
        userId: user.id,
        oldPassword: oldPw,
        newPassword: newPw,
      });
      setOldPw('');
      setNewPw('');
      setPwModal(false);
      Alert.alert('Tayyor', 'Parol muvaffaqiyatli o‘zgartirildi');
    } catch (e: any) {
      Alert.alert('Xatolik', e?.response?.data?.message || 'Parol o‘zgartirilmadi');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* Foto-Hisobot (Kamera + Galereya) */}
      <View style={styles.photoBtnRow}>
        <TouchableOpacity style={[styles.photoCard, { flex: 1 }]} onPress={handleCameraUpload}>
          <Camera size={22} color="#0F172A" />
          <View style={{ flex: 1 }}>
            <Text style={styles.photoTitle}>Kamera</Text>
            <Text style={styles.photoSub}>Suratga olish</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.photoCard, { flex: 1, backgroundColor: '#38BDF8' }]}
          onPress={handleGalleryUpload}
        >
          <ImageIcon size={22} color="#0F172A" />
          <View style={{ flex: 1 }}>
            <Text style={styles.photoTitle}>Galereya</Text>
            <Text style={styles.photoSub}>Rasm tanlash</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Oxirgi Foto-Hisobotlar */}
      {photos.length > 0 && (
        <View style={styles.section}>
          <View style={styles.secHeader}>
            <ImageIcon size={16} color="#38BDF8" />
            <Text style={styles.secTitle}>OXIRGI FOTO-HISOBOTLAR ({photos.length})</Text>
          </View>
          {photos.map((p) => (
            <View key={String(p.id)} style={styles.photoItem}>
              <Image source={{ uri: p.imageUrl }} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowText}>{p.title}</Text>
                <Text style={styles.rowTime}>
                  {p.uploaderName} • {p.timestamp}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Davomat Jurnali + Check-in */}
      <View style={styles.section}>
        <View style={[styles.secHeader, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <CalendarCheck2 size={16} color="#22C55E" />
            <Text style={styles.secTitle}>DAVOMAT JURNALI</Text>
          </View>
          <TouchableOpacity style={styles.miniActionBtn} onPress={handleCheckIn}>
            <Text style={styles.miniActionText}>Keldim ✓</Text>
          </TouchableOpacity>
        </View>
        {attendance.length === 0 ? (
          <Text style={styles.emptyText}>Bugun davomat yozuvlari yo‘q</Text>
        ) : (
          attendance.map((a) => (
            <View key={a.id} style={styles.row}>
              <Text style={styles.rowText}>{a.userName}</Text>
              <Text style={styles.rowTime}>
                {a.date} • {a.checkInTime?.slice(0, 5)}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Kunlik Hisobotlar */}
      <View style={styles.section}>
        <View style={styles.secHeader}>
          <ClipboardList size={16} color="#38BDF8" />
          <Text style={styles.secTitle}>KUNLIK HISOBOTLAR ({reports.length})</Text>
        </View>
        {reports.length === 0 ? (
          <Text style={styles.emptyText}>Hozircha kunlik hisobotlar yo‘q</Text>
        ) : (
          reports.map((r) => (
            <View key={r.id} style={styles.row}>
              <Text style={styles.rowText}>
                {r.building} ({r.date})
              </Text>
              <Text style={styles.rowTime}>
                🥚 {r.eggsCollectedTotal} • 🌾 {r.feedConsumedKg}kg
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Filiallar */}
      <View style={styles.section}>
        <View style={styles.secHeader}>
          <Building2 size={16} color="#A78BFA" />
          <Text style={styles.secTitle}>FILIALLAR HOLATI ({branches.length})</Text>
        </View>
        {branches.map((b) => (
          <View key={b.branchId} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>{b.name}</Text>
              <Text style={styles.rowTime}>{b.managerName}</Text>
            </View>
            <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 12 }}>
              {b.currentBirds.toLocaleString()} qush
            </Text>
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
          <TouchableOpacity style={styles.noteAddBtn} onPress={handleAddNote}>
            <Text style={{ color: '#0F172A', fontWeight: '800' }}>+</Text>
          </TouchableOpacity>
        </View>
        {notes.map((n) => (
          <View key={String(n.id)} style={styles.noteRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.noteText}>{n.content}</Text>
              <Text style={styles.rowTime}>{n.createdAt}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteNote(n.id)}>
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Profil, Parol & Chiqish */}
      <View style={styles.profileCard}>
        <Text style={styles.profileName}>{user?.fullName}</Text>
        <Text style={styles.profileRole}>
          {user ? ROLE_LABELS[user.role] || user.role : ''} • @{user?.username}
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <TouchableOpacity style={styles.pwBtn} onPress={() => setPwModal(true)}>
            <KeyRound size={16} color="#CBD5E1" />
            <Text style={styles.pwText}>Parol</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <LogOut size={16} color="#EF4444" />
            <Text style={styles.logoutText}>Chiqish</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Change Password Modal */}
      <Modal visible={pwModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Parolni O‘zgartirish</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Hozirgi parol"
              placeholderTextColor="#64748B"
              secureTextEntry
              value={oldPw}
              onChangeText={setOldPw}
            />
            <View style={{ height: 10 }} />
            <TextInput
              style={styles.noteInput}
              placeholder="Yangi parol"
              placeholderTextColor="#64748B"
              secureTextEntry
              value={newPw}
              onChangeText={setNewPw}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <TouchableOpacity onPress={() => setPwModal(false)} style={{ padding: 10 }}>
                <Text style={{ color: '#94A3B8', fontWeight: '600' }}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleChangePassword}
                style={{ backgroundColor: '#22C55E', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 }}
              >
                <Text style={{ color: '#0F172A', fontWeight: '700' }}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  photoBtnRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#22C55E',
    borderRadius: 14,
    padding: 14,
  },
  photoTitle: { color: '#0F172A', fontSize: 15, fontWeight: '800' },
  photoSub: { color: '#0F172A', fontSize: 11, opacity: 0.8 },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#0F172A',
  },
  thumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#0F172A' },
  section: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  secTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  miniActionBtn: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniActionText: { color: '#22C55E', fontSize: 11, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#0F172A',
  },
  rowText: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  rowTime: { color: '#94A3B8', fontSize: 12 },
  emptyText: { color: '#64748B', fontSize: 12 },
  noteInputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  noteInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
  },
  noteAddBtn: {
    backgroundColor: '#F59E0B',
    width: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#0F172A',
  },
  noteText: { color: '#E2E8F0', fontSize: 13 },
  profileCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  profileName: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  profileRole: { color: '#22C55E', fontSize: 12, marginTop: 2 },
  pwBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
  },
  pwText: { color: '#CBD5E1', fontWeight: '700' },
  logoutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 12,
  },
  logoutText: { color: '#EF4444', fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '700', marginBottom: 14 },
});
