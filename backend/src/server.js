import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport.js';
import { configurePassport } from './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import topicsRoutes from './routes/topicsRoutes.js';
import capturesRoutes from './routes/capturesRoutes.js';
import resourcesRoutes from './routes/resourcesRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import bookmarksRoutes from './routes/bookmarksRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import { requestLogger, errorLogger } from './middleware/requestLogger.js';
import logger from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Session configuration (needed for OAuth state)
app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      maxAge: 10 * 60 * 1000, // 10 minutes (just for OAuth flow)
    },
  })
);

// Initialize Passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if origin matches allowed patterns (including chrome-extension://)
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin.includes('*')) {
          // Handle wildcard patterns like chrome-extension://*
          const pattern = allowedOrigin.replace(/\*/g, '.*');
          return new RegExp(`^${pattern}$`).test(origin);
        }
        return allowedOrigin === origin;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Apply rate limiting to API routes
app.use('/api/auth', authLimiter); // Strict rate limiting for auth
app.use('/api', generalLimiter); // General rate limiting for all other API routes

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/captures', capturesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', resourcesRoutes); // Resources routes include /topics/:topicId/resources

// 404 Handler
app.use(notFoundHandler);

// Error logging middleware
app.use(errorLogger);

// Global Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 API Base URL: http://localhost:${PORT}`);
  logger.info(`💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

export default app;
