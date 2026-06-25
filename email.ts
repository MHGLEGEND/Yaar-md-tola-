import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
      return true;
    }

    await transporter.sendMail({
      from: `"Yaar Mohammad Tola" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });

    logger.info(`Email sent to ${to}`);
    return true;
  } catch (error) {
    logger.error('Email send error:', error);
    return false;
  }
};
