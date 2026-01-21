import express from 'express';
import {
  getUsers,
  getAllEvents,
  getPlatformAnalytics,
  getUserDetail,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Get all users
router.get('/users', getUsers);

// Get user detail
router.get('/users/:userId', getUserDetail);

// Get all analytics events
router.get('/events', getAllEvents);

// Get platform analytics overview
router.get('/analytics', getPlatformAnalytics);

export default router;
