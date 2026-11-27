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
  Platform,
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
  Bell,
} from 'lucide-react-native';
import { api } from '../services/api';
import {
  getPushDiagnostics,
  registerForPushNotificationsAsync,
  sendLocalTestNotification,
} from '../services/notifications';
import { useAuth } from '../context/AuthContext';
import {
  AttendanceRecord,
  PersonalNote,
  PhotoReport,
  DailyFactoryReport,
  BranchInfo,
  ROLE_LABELS,
} from '../types';
import { COLORS, CONTAINER_MAX, CARD_SHADOW } from '../theme';

export const KoproqScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [photos, setPhotos] = useState<PhotoReport[]>([]);
  const [reports, setReports] = useState<DailyFactoryReport[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [noteText, setNoteText] = useState('');

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

  const handleTestPush = async () => {
    const diag = await getPushDiagnostics();
    await sendLocalTestNotification();
    if (diag.token) {
      await registerForPushNotificationsAsync();
    }
    try {
      const res = await api.post('/api/push/send-test', { role: user?.role });
      const sent = res.data?.sentCount ?? 0;
      const msg = diag.token
        ? `Ruxsat: OK\nToken saqlandi!\nServer yubordi: ${sent} ta qurilma.`
        : `Lokal signal yuborildi.\nPush token xatosi: ${diag.error || 'noma’lum'}`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Bildirishnoma Holati', msg);
    } catch {
      const msg = diag.error || 'Server test so‘rovida xatolik';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Bildirishnoma Holati', msg);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Tizimdan chiqishni xohlaysizmi?')) logout();
      return;
    }
    logout();
  };

  const initials = (user?.fullName || 'U')
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={[CONTAINER_MAX, { padding: 16, paddingBottom: 36 }]}>
      {/* Foto-Hisobot (Kamera + Galereya) */}
      <View style={styles.photoBtnRow}>
        <TouchableOpacity style={[styles.photoCard, CARD_SHADOW, { flex: 1 }]} onPress={handleCameraUpload}>
          <View style={styles.photoIconWrap}>
            <Camera size={20} color="#090E1A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.photoTitle}>Kamera</Text>
            <Text style={styles.photoSub}>Suratga olish</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.photoCard, CARD_SHADOW, { flex: 1, backgroundColor: COLORS.sky }]}
          onPress={handleGalleryUpload}
        >
          <View style={styles.photoIconWrap}>
            <ImageIcon size={20} color="#090E1A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.photoTitle}>Galereya</Text>
            <Text style={styles.photoSub}>Rasm tanlash</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Oxirgi Foto-Hisobotlar */}
      {photos.length > 0 && (
        <View style={[styles.section, CARD_SHADOW]}>
          <View style={styles.secHeader}>
            <ImageIcon size={16} color={COLORS.sky} />
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
      <View style={[styles.section, CARD_SHADOW]}>
        <View style={[styles.secHeader, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <CalendarCheck2 size={16} color={COLORS.primary} />
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
      <View style={[styles.section, CARD_SHADOW]}>
        <View style={styles.secHeader}>
          <ClipboardList size={16} color={COLORS.sky} />
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
      <View style={[styles.section, CARD_SHADOW]}>
        <View style={styles.secHeader}>
          <Building2 size={16} color={COLORS.purple} />
          <Text style={styles.secTitle}>FILIALLAR HOLATI ({branches.length})</Text>
        </View>
        {branches.map((b) => (
          <View key={b.branchId} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>{b.name}</Text>
              <Text style={styles.rowTime}>{b.managerName}</Text>
            </View>
            <View style={styles.birdPill}>
              <Text style={styles.birdPillText}>{b.currentBirds.toLocaleString()} qush</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Shaxsiy Zametkalar */}
      <View style={[styles.section, CARD_SHADOW]}>
        <View style={styles.secHeader}>
          <StickyNote size={16} color={COLORS.amber} />
          <Text style={styles.secTitle}>SHAXSIY ZAMETKALAR</Text>
        </View>
        <View style={styles.noteInputRow}>
          <TextInput
            style={styles.noteInput}
            placeholder="Yangi zametka..."
            placeholderTextColor={COLORS.textDim}
            value={noteText}
            onChangeText={setNoteText}
          />
          <TouchableOpacity style={styles.noteAddBtn} onPress={handleAddNote}>
            <Text style={{ color: '#090E1A', fontWeight: '800', fontSize: 18 }}>+</Text>
          </TouchableOpacity>
        </View>
        {notes.map((n) => (
          <View key={String(n.id)} style={styles.noteRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.noteText}>{n.content}</Text>
              <Text style={styles.rowTime}>{n.createdAt}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteNote(n.id)} style={{ padding: 6 }}>
              <Trash2 size={16} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Profil, Parol & Chiqish */}
      <View style={[styles.profileCard, CARD_SHADOW]}>
        <View style={styles.profileTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.fullName}</Text>
            <Text style={styles.profileRole}>
              {user ? ROLE_LABELS[user.role] || user.role : ''} • @{user?.username}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <TouchableOpacity style={styles.pwBtn} onPress={handleTestPush}>
            <Bell size={16} color={COLORS.amber} />
            <Text style={[styles.pwText, { color: COLORS.amber }]}>Signal / Push Testi</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <TouchableOpacity style={styles.pwBtn} onPress={() => setPwModal(true)}>
            <KeyRound size={16} color={COLORS.textMuted} />
            <Text style={styles.pwText}>Parolni o‘zgartirish</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={16} color={COLORS.danger} />
            <Text style={styles.logoutText}>Chiqish</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={pwModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Parolni O‘zgartirish</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Hozirgi parol"
              placeholderTextColor={COLORS.textDim}
              secureTextEntry
              value={oldPw}
              onChangeText={setOldPw}
            />
            <View style={{ height: 10 }} />
            <TextInput
              style={styles.noteInput}
              placeholder="Yangi parol"
              placeholderTextColor={COLORS.textDim}
              secureTextEntry
              value={newPw}
              onChangeText={setNewPw}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <TouchableOpacity onPress={() => setPwModal(false)} style={{ padding: 10 }}>
                <Text style={{ color: COLORS.textMuted, fontWeight: '600' }}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleChangePassword}
                style={{ backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 }}
              >
                <Text style={{ color: '#090E1A', fontWeight: '800' }}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  photoBtnRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    padding: 14,
  },
  photoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(9, 14, 26, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTitle: { color: '#090E1A', fontSize: 15, fontWeight: '800' },
  photoSub: { color: '#090E1A', fontSize: 11, opacity: 0.8 },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  thumb: { width: 46, height: 46, borderRadius: 9, backgroundColor: COLORS.bg },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  secTitle: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  miniActionBtn: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniActionText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rowText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  rowTime: { color: COLORS.textMuted, fontSize: 12 },
  birdPill: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  birdPillText: { color: COLORS.primary, fontWeight: '700', fontSize: 11 },
  emptyText: { color: COLORS.textDim, fontSize: 12 },
  noteInputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  noteInput: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
  },
  noteAddBtn: {
    backgroundColor: COLORS.amber,
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
    borderTopColor: COLORS.border,
  },
  noteText: { color: COLORS.text, fontSize: 13 },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.primary, fontSize: 16, fontWeight: '800' },
  profileName: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  profileRole: { color: COLORS.primary, fontSize: 12, marginTop: 2 },
  pwBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 10,
    paddingVertical: 12,
  },
  pwText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 12 },
  logoutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 10,
    paddingVertical: 12,
  },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 20 },
  modalCard: {
    ...CONTAINER_MAX,
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  modalTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: 14 },
});
