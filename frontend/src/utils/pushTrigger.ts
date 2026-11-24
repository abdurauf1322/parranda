import { apiUrl } from '../utils/apiConfig';

/**
 * Triggers backend Web Push notification to employees even when their app is closed.
 */
export async function triggerBackendPush(payload: {
  title: string;
  body: string;
  role?: string;
  userId?: number;
  url?: string;
}) {
  try {
    await fetch(apiUrl('/api/push/broadcast'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Backend push notification trigger ignored:', err);
  }
}
