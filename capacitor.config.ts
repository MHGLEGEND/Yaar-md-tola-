import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yaarmohammadtola.app',
  appName: 'Yaar Mohammad Tola',
  webDir: 'out',

  // Point at your deployed backend+frontend domain in production.
  // Remove the `server` block entirely to ship the app fully offline-bundled
  // (i.e. serve the static `out/` build from inside the APK instead of a live URL).
  server: {
    url: 'https://yourdomain.com',
    cleartext: false,
    androidScheme: 'https',
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1e1b4b',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#f59e0b',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1e1b4b',
    },
  },
};

export default config;
