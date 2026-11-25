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
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
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
              <Text style={styles.sender}>
                {item.senderName} • {ROLE_LABELS[item.senderRole] || item.senderRole}
              </Text>
              <Text style={styles.msgText}>{item.message}</Text>
            </View>
          );
        }}
      />

      <View style={styles.inputBar}>
        <TouchableOpacity
          style={[styles.announceBtn, isAnnouncement && styles.announceActive]}
          onPress={() => setIsAnnouncement(!isAnnouncement)}
        >
          <Megaphone size={18} color={isAnnouncement ? '#0F172A' : '#F59E0B'} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder={isAnnouncement ? "E'lon matnini yozing..." : 'Xabar yozing...'}
          placeholderTextColor="#64748B"
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Send size={18} color="#0F172A" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  msgBox: { padding: 12, borderRadius: 14, marginBottom: 10, maxWidth: '85%' },
  msgMine: { alignSelf: 'flex-end', backgroundColor: '#1E293B', borderColor: '#22C55E', borderWidth: 1 },
  msgOther: { alignSelf: 'flex-start', backgroundColor: '#1E293B' },
  msgAlert: { borderColor: '#F59E0B', borderWidth: 1.5, backgroundColor: 'rgba(245,158,11,0.12)' },
  sender: { color: '#94A3B8', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  msgText: { color: '#F8FAFC', fontSize: 14 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1E293B',
    gap: 8,
  },
  announceBtn: { padding: 10, borderRadius: 12, backgroundColor: '#0F172A' },
  announceActive: { backgroundColor: '#F59E0B' },
  input: { flex: 1, backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  sendBtn: { backgroundColor: '#22C55E', padding: 11, borderRadius: 12 },
});
