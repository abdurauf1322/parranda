/**
 * Web Push Subscription Helper for UYCHI PARRANDA
 * Manages VAPID Public Key subscription via ServiceWorker & syncs with Flask backend.
 */

import { apiUrl } from './apiConfig';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerWebPushSubscription(user?: { id?: number; username?: string; role?: string }): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.info('Push notification is not supported in this browser.');
    return false;
  }

  try {
    // 1. Check or request notification permission
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      console.warn('Push notification permission denied by user.');
      return false;
    }

    // 2. Fetch VAPID public key from Flask backend
    const vapidRes = await fetch(apiUrl('/api/push/vapid-public-key')).catch(() => null);
    if (!vapidRes || !vapidRes.ok) {
      console.warn('Could not fetch VAPID public key from backend.');
      return false;
    }
    const { publicKey } = await vapidRes.json();
    if (!publicKey) return false;

    // 3. Ensure Service Worker is ready
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    // If subscription doesn't exist, create a new one with Uint8Array Buffer
    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey.buffer as ArrayBuffer,
      });
    }

    // 4. Safely extract subscription JSON or raw keys
    const subJson = subscription.toJSON();
    const endpoint = subscription.endpoint || subJson.endpoint;

    // Safely get p256dh and auth keys
    let p256dh = subJson.keys?.p256dh;
    let auth = subJson.keys?.auth;

    if (!p256dh && subscription.getKey) {
      const rawKey = subscription.getKey('p256dh');
      if (rawKey) {
        p256dh = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
      }
    }

    if (!auth && subscription.getKey) {
      const rawAuth = subscription.getKey('auth');
      if (rawAuth) {
        auth = btoa(String.fromCharCode(...new Uint8Array(rawAuth)));
      }
    }

    if (!endpoint || !p256dh || !auth) {
      console.warn('Web push subscription keys are incomplete.');
      return false;
    }

    await fetch(apiUrl('/api/push/subscribe'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint,
        keys: {
          p256dh,
          auth,
        },
        username: user?.username,
        role: user?.role,
        userId: user?.id,
      }),
    });

    console.info('✅ Web Push Subscription successfully registered and synced with backend.');
    return true;
  } catch (error) {
    console.warn('Error during Web Push subscription registration:', error);
    return false;
  }
}
