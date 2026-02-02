import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

/**
 * Request logging middleware
 * Logs all incoming requests with unique request IDs
 */
export const requestLogger = (req, res, next) => {
  // Generate unique request ID
  const requestId = uuidv4();
  req.requestId = requestId;

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  // Start timer
  const startTime = Date.now();

  // Log request
  logger.http(`[${requestId}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);

  // Log request body for non-GET requests (excluding sensitive fields)
  if (req.method !== 'GET' && req.body) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    delete sanitizedBody.password;
    delete sanitizedBody.newPassword;
    delete sanitizedBody.token;

    if (Object.keys(sanitizedBody).length > 0) {
      logger.debug(`[${requestId}] Request body: ${JSON.stringify(sanitizedBody)}`);
    }
  }

  // Capture the original end function
  const originalEnd = res.end;

  // Override res.end to log response
  res.end = function (chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Log response
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';

    logger[level](
      `[${requestId}] ${req.method} ${req.originalUrl} - Status: ${statusCode} - ${responseTime}ms`
    );

    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Error logging middleware
 * Should be added after all routes and before final error handler
 */
export const errorLogger = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';

  logger.error(
    `[${requestId}] Error: ${err.message}\nStack: ${err.stack}\nPath: ${req.method} ${req.originalUrl}`
  );

  next(err);
};
