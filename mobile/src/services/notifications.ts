import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

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

export async function registerForPushNotificationsAsync(username?: string, password?: string): Promise<string | null> {
  await setupAndroidNotificationChannel();

  if (!Device.isDevice) {
    console.log('Push bildirishnomalar faqat real qurilmada ishlaydi.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Bildirishnoma ruxsati berilmadi.');
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenData.data;

    if (token && username && password) {
      await api.post('/api/fcm/register', {
        token,
        username,
        password,
        deviceName: `${Device.manufacturer || 'Android'} ${Device.modelName || 'Device'}`,
      });
    }
    return token;
  } catch (error) {
    console.warn('Push token olishda xatolik:', error);
    return null;
  }
}

export async function unregisterPushToken(token: string, username?: string) {
  try {
    await api.post('/api/fcm/unregister', { token, username });
  } catch (e) {
    console.warn('Tokenni o‘chirishda xatolik:', e);
  }
}
