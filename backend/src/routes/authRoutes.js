import express from 'express';
import { body } from 'express-validator';
import passport from 'passport';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { forgotPassword, resetPassword, verifyResetToken } from '../controllers/passwordResetController.js';
import { sendVerification, verifyEmail, checkVerificationStatus } from '../controllers/emailVerificationController.js';
import { googleAuth, googleCallback, oauthError } from '../controllers/oauthController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('name').optional().trim(),
  ],
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
  ],
  forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  resetPassword
);

/**
 * @route   GET /api/auth/verify-reset-token/:token
 * @desc    Verify if reset token is valid
 * @access  Public
 */
router.get('/verify-reset-token/:token', verifyResetToken);

/**
 * @route   POST /api/auth/send-verification
 * @desc    Send or resend email verification
 * @access  Public
 */
router.post(
  '/send-verification',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
  ],
  sendVerification
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post(
  '/verify-email',
  [
    body('token').notEmpty().withMessage('Verification token is required'),
  ],
  verifyEmail
);

/**
 * @route   GET /api/auth/verification-status
 * @desc    Check email verification status
 * @access  Protected
 */
router.get('/verification-status', authenticate, checkVerificationStatus);

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get(
  '/google',
  googleAuth,
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false // We use JWT, not sessions
  }),
  googleCallback
);

export default router;
