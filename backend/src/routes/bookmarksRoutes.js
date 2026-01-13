import express from 'express';
import {
  toggleTopicBookmark,
  toggleCaptureBookmark,
  toggleResourceBookmark,
  getAllBookmarks,
} from '../controllers/bookmarksController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/bookmarks
 * @desc    Get all bookmarked items (topics, captures, resources)
 * @access  Private
 */
router.get('/', getAllBookmarks);

/**
 * @route   PUT /api/bookmarks/topic/:id
 * @desc    Toggle bookmark on a topic
 * @access  Private
 */
router.put('/topic/:id', toggleTopicBookmark);

/**
 * @route   PUT /api/bookmarks/capture/:id
 * @desc    Toggle bookmark on a capture
 * @access  Private
 */
router.put('/capture/:id', toggleCaptureBookmark);

/**
 * @route   PUT /api/bookmarks/resource/:id
 * @desc    Toggle bookmark on a resource
 * @access  Private
 */
router.put('/resource/:id', toggleResourceBookmark);

export default router;
