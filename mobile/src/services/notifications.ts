import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';
import { SlesarMilestone } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupAndroidNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('uychi_parranda_urgent_channel', {
      name: 'Uychi Parranda Tezkor Signallar',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [300, 150, 300, 150, 450],
      lightColor: '#22C55E',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
      enableVibrate: true,
    });
  }
}

export async function getPushDiagnostics(): Promise<{
  granted: boolean;
  token: string | null;
  error?: string;
}> {
  if (Platform.OS === 'web') {
    return { granted: false, token: null, error: 'Web brauzerda Expo Push ishlamaydi' };
  }

  await setupAndroidNotificationChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { granted: false, token: null, error: 'Telefon sozlamalaridan bildirishnoma ruxsati berilmagan' };
  }

  if (!Device.isDevice) {
    return { granted: true, token: null, error: 'Push token faqat haqiqiy telefonda olinadi (emulatorda emas)' };
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return { granted: true, token: tokenData.data };
  } catch (err: any) {
    return {
      granted: true,
      token: null,
      error: err?.message || 'Push token olishda xatolik (FCM sozlanmagan bo‘lishi mumkin)',
    };
  }
}

export async function registerForPushNotificationsAsync(
  username?: string,
  password?: string
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const diag = await getPushDiagnostics();
  if (!diag.token) {
    if (diag.error) console.warn('Push diag:', diag.error);
    return null;
  }

  try {
    const payload: Record<string, any> = {
      token: diag.token,
      deviceName: `${Device.manufacturer || 'Android'} ${Device.modelName || 'Device'}`,
    };
    if (username && password) {
      payload.username = username;
      payload.password = password;
    }
    await api.post('/api/fcm/register', payload);
    return diag.token;
  } catch (error) {
    console.warn('Push tokenni serverga saqlashda xatolik:', error);
    return diag.token;
  }
}

export async function scheduleLocalMilestoneNotifications(milestones: SlesarMilestone[]) {
  if (Platform.OS === 'web') return;
  try {
    await setupAndroidNotificationChannel();
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.cancelAllScheduledNotificationsAsync();
    const now = new Date();

    for (const m of milestones) {
      if (m.status === 'bajarildi') continue;
      const targetTime = m.alertTime || m.time;
      const parts = targetTime.split(':').map(Number);
      if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) continue;

      const triggerDate = new Date();
      triggerDate.setHours(parts[0], parts[1], 0, 0);
      if (triggerDate <= now) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ 3 daqiqadan so‘ng (${m.time}): ${m.title}`,
          body: m.description || 'Texnologik bosqichga tayyorlaning!',
          sound: 'default',
          data: { milestoneId: m.id, url: '/' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: 'uychi_parranda_urgent_channel',
        },
      });
    }
  } catch (e) {
    console.warn('Lokal signal rejalashda xatolik:', e);
  }
}

export async function sendLocalTestNotification() {
  if (Platform.OS === 'web') return;
  await setupAndroidNotificationChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Uychi Parranda — Signal Testi',
      body: 'Telefoningizda bildirishnoma, ovoz va tebranish to‘liq ishlayapti!',
      sound: 'default',
    },
    trigger: null,
  });
}

export async function unregisterPushToken(token: string, username?: string) {
  try {
    await api.post('/api/fcm/unregister', { token, username });
  } catch (e) {
    console.warn('Tokenni o‘chirishda xatolik:', e);
  }
}
