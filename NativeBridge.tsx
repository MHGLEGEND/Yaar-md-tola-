'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

/**
 * NativeBridge mounts once at the root of the app (see layout.tsx) and:
 *  1. Detects whether we're running inside the Capacitor Android shell vs. a normal browser.
 *  2. Sets the native status bar color to match the app's indigo theme.
 *  3. Registers for push notifications and forwards the FCM token to the backend.
 *  4. Hides the splash screen once the app has mounted.
 *
 * It's a no-op (and safe to import) when running as a plain PWA in a browser —
 * all Capacitor calls are dynamically imported and guarded behind a platform check.
 */
export default function NativeBridge() {
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    let isNative = false;

    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        isNative = Capacitor.isNativePlatform();
        if (!isNative) return;

        // Status bar styling
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setBackgroundColor({ color: '#1e1b4b' });
        await StatusBar.setStyle({ style: Style.Dark });

        // Hide splash screen once React has mounted
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide();

        // Push notifications
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') {
          await PushNotifications.requestPermissions();
        }
        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token) => {
          if (user?.id) {
            try {
              await api.post('/api/auth/fcm-token', { userId: user.id, fcmToken: token.value });
            } catch {
              // Non-fatal — user can still use the app without push notifications.
            }
          }
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.warn('Push registration failed:', err);
        });

        // Network status — surface offline state via a custom event the UI can listen to
        const { Network } = await import('@capacitor/network');
        Network.addListener('networkStatusChange', (status) => {
          window.dispatchEvent(new CustomEvent('ymt:network-change', { detail: status }));
        });
      } catch {
        // Not running inside Capacitor (plain web/PWA) — nothing to do.
      }
    })();
  }, [user?.id]);

  return null;
}
