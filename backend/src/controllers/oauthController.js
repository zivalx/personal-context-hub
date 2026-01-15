import { generateToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';
import { trackEvent, EventTypes } from '../services/analyticsService.js';

/**
 * Google OAuth callback handler
 * Called after successful Google authentication
 */
export const googleCallback = (req, res) => {
  try {
    // User is attached to req by passport
    const user = req.user;

    if (!user) {
      logger.error('No user found in Google OAuth callback');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
    }

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });

    logger.info(`Google OAuth success for user: ${user.email}`);

    // Check if request came from extension
    const state = req.query.state;
    const fromExtension = state && state.includes('extension');

    if (fromExtension) {
      // Redirect to extension activation page with token
      // Extension will capture this token and store it
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/extension-callback?token=${token}`
      );
    }

    // Regular web app login - redirect to app with token in URL
    // Frontend will capture this and store in localStorage
    return res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`
    );
  } catch (error) {
    logger.error('Google callback error:', error);
    return res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_error`
    );
  }
};

/**
 * Initiate Google OAuth flow
 * GET /api/auth/google
 */
export const googleAuth = (req, res, next) => {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    logger.warn('Google OAuth attempt but credentials not configured');
    return res.status(503).json({
      success: false,
      message: 'Google Sign-In is not configured on this server. Please use email/password registration or contact the administrator.',
      code: 'GOOGLE_OAUTH_NOT_CONFIGURED',
    });
  }

  // Pass state parameter to identify if request is from extension
  const state = req.query.from === 'extension' ? 'extension' : 'web';
  req.session.oauthState = state;
  next();
};

/**
 * Handle OAuth errors
 */
export const oauthError = (err, req, res, next) => {
  logger.error('OAuth error:', err);
  res.redirect(
    `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_error`
  );
};
