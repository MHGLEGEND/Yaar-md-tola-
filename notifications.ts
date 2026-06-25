import { logger } from '../utils/logger';

let firebaseAdmin: any = null;

const getFirebaseAdmin = () => {
  if (!firebaseAdmin && process.env.FIREBASE_PROJECT_ID) {
    try {
      const admin = require('firebase-admin');
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
      }
      firebaseAdmin = admin;
    } catch (e) {
      logger.error('Firebase init error:', e);
    }
  }
  return firebaseAdmin;
};

export const sendPushNotification = async (
  token: string | null,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> => {
  try {
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[DEV PUSH] Title: ${title} | Body: ${body}`);
      return true;
    }

    const admin = getFirebaseAdmin();
    if (!admin) return false;

    if (token) {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data: data || {},
        android: { notification: { clickAction: 'FLUTTER_NOTIFICATION_CLICK', sound: 'default' } },
      });
    } else {
      // Broadcast to topic
      await admin.messaging().send({
        topic: 'all_users',
        notification: { title, body },
        data: data || {},
      });
    }

    return true;
  } catch (error) {
    logger.error('Push notification error:', error);
    return false;
  }
};

export const subscribeToTopic = async (token: string, topic: string): Promise<void> => {
  const admin = getFirebaseAdmin();
  if (!admin) return;
  await admin.messaging().subscribeToTopic(token, topic);
};
