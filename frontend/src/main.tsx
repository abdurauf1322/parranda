import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerWebPushSubscription } from './utils/webPushHelper';

// Register Service Worker for PWA & Background Web Push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Automatically check for SW updates
        reg.update().catch(() => {});
        // Automatically attempt to subscribe to Web Push if permission is granted
        if (Notification.permission === 'granted') {
          registerWebPushSubscription();
        }
      })
      .catch((err) => {
        console.warn('PWA Service Worker registration non-fatal:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
