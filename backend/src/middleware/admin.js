import logger from '../utils/logger.js';

/**
 * Middleware to check if user is an admin
 * Must be used after authenticate middleware
 */
export const requireAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated (should be done by authenticate middleware first)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      logger.warn(`Unauthorized admin access attempt by user ${req.user.userId}`);
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    next();
  } catch (error) {
    logger.error('Error in admin middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
