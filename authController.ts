import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { setOTP, getOTP, deleteOTP } from '../config/redis';
import { generateAccessToken, generateRefreshToken, generateOTP, verifyRefreshToken } from '../utils/jwt';
import { sendSMS } from '../services/sms';
import { sendEmail } from '../services/email';
import { logger } from '../utils/logger';

export const sendPhoneOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) { res.status(400).json({ success: false, message: 'Phone number required' }); return; }

    const otp = generateOTP();
    await setOTP(`phone:${phone}`, otp, 300);
    await sendSMS(phone, `Your Yaar Mohammad Tola OTP is: ${otp}. Valid for 5 minutes.`);

    // Store in DB for audit
    await prisma.otpStore.create({ data: { contact: phone, otp: await bcrypt.hash(otp, 10), type: 'PHONE', expiresAt: new Date(Date.now() + 300000) } });

    logger.info(`OTP sent to phone: ${phone}`);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    logger.error('Send phone OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

export const sendEmailOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ success: false, message: 'Email required' }); return; }

    const otp = generateOTP();
    await setOTP(`email:${email}`, otp, 300);
    await sendEmail(email, 'Your Login OTP - Yaar Mohammad Tola', `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto">
        <h2 style="color:#1e40af">Yaar Mohammad Tola</h2>
        <p>Your OTP for login is:</p>
        <h1 style="color:#1e40af;letter-spacing:8px">${otp}</h1>
        <p>Valid for 5 minutes. Do not share this OTP.</p>
      </div>
    `);

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    logger.error('Send email OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

export const verifyPhoneOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) { res.status(400).json({ success: false, message: 'Phone and OTP required' }); return; }

    const storedOTP = await getOTP(`phone:${phone}`);
    if (!storedOTP || storedOTP !== otp) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      return;
    }

    await deleteOTP(`phone:${phone}`);

    let user = await prisma.user.findUnique({ where: { phone } });
    const isNewUser = !user;

    if (!user) {
      user = await prisma.user.create({
        data: { phone, name: 'New User', isApproved: false },
      });
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role, branch: user.branch });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role, branch: user.branch });

    res.json({
      success: true,
      isNewUser,
      needsProfileSetup: isNewUser || !user.name || user.name === 'New User',
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role, branch: user.branch, isApproved: user.isApproved },
    });
  } catch (error) {
    logger.error('Verify phone OTP error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

export const verifyEmailOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) { res.status(400).json({ success: false, message: 'Email and OTP required' }); return; }

    const storedOTP = await getOTP(`email:${email}`);
    if (!storedOTP || storedOTP !== otp) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      return;
    }

    await deleteOTP(`email:${email}`);

    let user = await prisma.user.findUnique({ where: { email } });
    const isNewUser = !user;

    if (!user) {
      user = await prisma.user.create({
        data: { email, name: 'New User', isApproved: false },
      });
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role, branch: user.branch });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role, branch: user.branch });

    res.json({
      success: true,
      isNewUser,
      needsProfileSetup: isNewUser,
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, branch: user.branch, isApproved: user.isApproved },
    });
  } catch (error) {
    logger.error('Verify email OTP error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

export const completeProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, name, role, branch, customRole, familyMemberId } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, role, branch, customRole, familyMemberId },
    });

    // Notify admins
    await prisma.auditLog.create({
      data: { userId: user.id, action: 'PROFILE_COMPLETED', resource: 'users', details: { role, branch } },
    });

    res.json({ success: true, message: 'Profile setup complete. Awaiting admin approval.', user });
  } catch (error) {
    logger.error('Complete profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete profile' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) { res.status(400).json({ success: false, message: 'Refresh token required' }); return; }

    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role, branch: user.branch });
    res.json({ success: true, accessToken });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

export const updateFCMToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, fcmToken } = req.body;
    await prisma.user.update({ where: { id: userId }, data: { fcmToken } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update FCM token' });
  }
};
