import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Send, Megaphone } from 'lucide-react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChatMessage, ROLE_LABELS } from '../types';
import { COLORS, CONTAINER_MAX } from '../theme';

export const ChatScreen: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);

  const loadChat = async () => {
    try {
      const res = await api.get('/api/chat');
      if (Array.isArray(res.data)) setMessages(res.data);
    } catch (e) {
      console.warn('Chat yuklashda xatolik:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadChat();
    }, [])
  );

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const msgText = text.trim();
    setText('');
    try {
      await api.post('/api/chat', {
        senderId: user.id,
        senderName: user.fullName,
        senderRole: user.role,
        message: msgText,
        isAnnouncement,
      });
      if (isAnnouncement) {
        await api.post('/api/push/broadcast', {
          title: `DIQQAT E'LON (${user.fullName})`,
          body: msgText,
          url: '/chat',
        });
      }
      setIsAnnouncement(false);
      await loadChat();
    } catch (e) {
      console.warn('Xabar yuborishda xatolik:', e);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[CONTAINER_MAX, { padding: 16, paddingBottom: 24 }]}
        renderItem={({ item }) => {
          const mine = item.senderName === user?.fullName;
          return (
            <View
              style={[
                styles.msgBox,
                mine ? styles.msgMine : styles.msgOther,
                item.isAnnouncement && styles.msgAlert,
              ]}
            >
              <View style={styles.msgHeader}>
                <Text style={styles.sender}>
                  {item.senderName} • {ROLE_LABELS[item.senderRole] || item.senderRole}
                </Text>
                {item.isAnnouncement && (
                  <View style={styles.alertTag}>
                    <Megaphone size={10} color={COLORS.amber} />
                    <Text style={styles.alertTagText}>E’LON</Text>
                  </View>
                )}
              </View>
              <Text style={styles.msgText}>{item.message}</Text>
              <Text style={styles.time}>{item.timestamp?.slice(11, 16) || item.timestamp}</Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Hozircha xabarlar yo‘q</Text>}
      />

      <View style={styles.inputOuter}>
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.alertBtn, isAnnouncement && styles.alertBtnActive]}
            onPress={() => setIsAnnouncement(!isAnnouncement)}
          >
            <Megaphone size={18} color={isAnnouncement ? '#090E1A' : COLORS.amber} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={isAnnouncement ? 'Muhim e’lon yozing...' : 'Xabar yozing...'}
            placeholderTextColor={COLORS.textDim}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Send size={18} color="#090E1A" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  msgBox: {
    maxWidth: '84%',
    padding: 13,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
  },
  msgMine: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderColor: 'rgba(34, 197, 94, 0.45)',
    borderBottomRightRadius: 4,
  },
  msgOther: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  msgAlert: {
    borderColor: COLORS.amber,
    backgroundColor: COLORS.amberSoft,
  },
  msgHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sender: { color: COLORS.sky, fontSize: 11, fontWeight: '700' },
  alertTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.amberSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  alertTagText: { color: COLORS.amber, fontSize: 9, fontWeight: '800' },
  msgText: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  time: { color: COLORS.textDim, fontSize: 10, marginTop: 5, textAlign: 'right' },
  empty: { color: COLORS.textDim, textAlign: 'center', marginTop: 40 },
  inputOuter: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputBar: {
    ...CONTAINER_MAX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  alertBtn: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBtnActive: { backgroundColor: COLORS.amber, borderColor: COLORS.amber },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.text,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
