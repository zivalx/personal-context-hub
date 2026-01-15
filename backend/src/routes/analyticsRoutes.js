import express from 'express';
import {
  trackEvent,
  getUserAnalytics,
  getEventHistory,
  getUserStats,
} from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Track analytics event
router.post('/events', trackEvent);

// Get user analytics overview
router.get('/overview', getUserAnalytics);

// Get event history
router.get('/events', getEventHistory);

// Get user stats summary
router.get('/stats', getUserStats);

export default router;
