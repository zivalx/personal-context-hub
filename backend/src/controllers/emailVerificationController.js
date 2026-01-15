import { validationResult } from 'express-validator';
import crypto from 'crypto';
import { prisma } from '../utils/prisma.js';
import { sendEmailVerification } from '../utils/emailService.js';
import logger from '../utils/logger.js';

/**
 * Send or resend email verification
 * POST /api/auth/send-verification
 */
export const sendVerification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a verification email has been sent.',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified.',
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Save verification token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
      },
    });

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    try {
      await sendEmailVerification(user.email, verificationToken, frontendUrl);
    } catch (emailError) {
      logger.error(`Failed to send verification email to ${email}: ${emailError.message}`);
      // Continue anyway - token is saved in database
    }

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a verification email has been sent.',
      // Include token in development mode only
      ...(process.env.NODE_ENV === 'development' && { verificationToken }),
    });
  } catch (error) {
    logger.error('Send verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification email',
      error: error.message,
    });
  }
};

/**
 * Verify email with token
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { token } = req.body;

    // Find user with verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified.',
      });
    }

    // Verify email and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Email has been verified successfully.',
    });
  } catch (error) {
    logger.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: error.message,
    });
  }
};

/**
 * Check email verification status
 * GET /api/auth/verification-status
 * Requires authentication
 */
export const checkVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailVerified: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        emailVerified: user.emailVerified,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error('Check verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking verification status',
      error: error.message,
    });
  }
};
