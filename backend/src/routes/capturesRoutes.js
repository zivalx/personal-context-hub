import express from 'express';
import { body } from 'express-validator';
import {
  getAllCaptures,
  getCaptureById,
  createCapture,
  updateCapture,
  deleteCapture,
  markCaptureAsRead,
} from '../controllers/capturesController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/captures
 * @desc    Get all captures for authenticated user
 * @access  Private
 * @query   type - Filter by capture type
 * @query   search - Search in title, content, or tags
 * @query   limit - Number of results (default: 50)
 * @query   offset - Pagination offset (default: 0)
 */
router.get('/', getAllCaptures);

/**
 * @route   GET /api/captures/:id
 * @desc    Get a single capture by ID
 * @access  Private
 */
router.get('/:id', getCaptureById);

/**
 * @route   POST /api/captures
 * @desc    Create a new capture
 * @access  Private
 */
router.post(
  '/',
  [
    body('type')
      .isIn(['text', 'link', 'note', 'quote', 'todo'])
      .withMessage('Type must be one of: text, link, note, quote, todo'),
    body('title').optional().trim(),
    body('content').optional().trim(),
    body('source').optional().trim(),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  ],
  createCapture
);

/**
 * @route   PUT /api/captures/:id
 * @desc    Update a capture
 * @access  Private
 */
router.put(
  '/:id',
  [
    body('type')
      .optional()
      .isIn(['text', 'link', 'note', 'quote', 'todo'])
      .withMessage('Type must be one of: text, link, note, quote, todo'),
    body('title').optional().trim(),
    body('content').optional().trim().notEmpty().withMessage('Content cannot be empty'),
    body('source').optional().trim(),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object'),
    body('summary').optional().trim(),
  ],
  updateCapture
);

/**
 * @route   DELETE /api/captures/:id
 * @desc    Delete a capture
 * @access  Private
 */
router.delete('/:id', deleteCapture);

/**
 * @route   PUT /api/captures/:id/read
 * @desc    Mark a capture as read
 * @access  Private
 */
router.put('/:id/read', markCaptureAsRead);

export default router;
