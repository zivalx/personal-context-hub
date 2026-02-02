import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../utils/prisma.js';

/**
 * Authentication middleware to protect routes
 * Verifies JWT token and attaches user to request object
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please authenticate.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Check if user still exists and update lastSeenAt
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Update lastSeenAt asynchronously (don't block the request)
    prisma.user
      .update({
        where: { id: decoded.userId },
        data: { lastSeenAt: new Date() },
      })
      .catch(() => {}); // Silently fail if update fails

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      error: error.message,
    });
  }
};

/**
 * Authentication middleware for file routes that accepts token from query parameter
 * This is needed for iframe/image src attributes that can't set Authorization headers
 */
export const authenticateFileAccess = async (req, res, next) => {
  try {
    // Try to get token from Authorization header first, then query parameter
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please authenticate.',
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Update lastSeenAt asynchronously (don't block the request)
    prisma.user
      .update({
        where: { id: decoded.userId },
        data: { lastSeenAt: new Date() },
      })
      .catch(() => {}); // Silently fail if update fails

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      error: error.message,
    });
  }
};
