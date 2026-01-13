import express from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/search
 * @desc    Global search across topics, resources, and captures
 * @access  Private
 * @query   q - Search query
 * @query   limit - Number of results per category (default: 20)
 */
router.get('/', globalSearch);

export default router;
