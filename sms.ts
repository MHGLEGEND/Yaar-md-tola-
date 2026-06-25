import { logger } from '../utils/logger';

export const sendSMS = async (to: string, message: string): Promise<boolean> => {
  try {
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[DEV SMS] To: ${to} | Message: ${message}`);
      return true;
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    logger.info(`SMS sent to ${to}`);
    return true;
  } catch (error) {
    logger.error('SMS send error:', error);
    return false;
  }
};
