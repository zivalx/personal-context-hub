import express from 'express';
import { body } from 'express-validator';
import {
  getResourcesByTopic,
  createResource,
  updateResource,
  deleteResource,
  markResourceAsRead,
  reorderResources,
} from '../controllers/resourcesController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/topics/:topicId/resources
 * @desc    Get all resources for a specific topic
 * @access  Private
 */
router.get('/topics/:topicId/resources', getResourcesByTopic);

/**
 * @route   POST /api/topics/:topicId/resources
 * @desc    Create a new resource in a topic
 * @access  Private
 */
router.post(
  '/topics/:topicId/resources',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('type')
      .isIn(['capture', 'note', 'external_link', 'todo'])
      .withMessage('Type must be one of: capture, note, external_link, todo'),
    body('captureId').optional().trim(),
    body('content').optional().trim(),
    body('url').optional().trim(),
    body('order').optional().isInt().withMessage('Order must be an integer'),
  ],
  createResource
);

/**
 * @route   PUT /api/resources/:id
 * @desc    Update a resource
 * @access  Private
 */
router.put(
  '/resources/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim(),
    body('type')
      .optional()
      .isIn(['capture', 'note', 'external_link'])
      .withMessage('Type must be one of: capture, note, external_link'),
    body('captureId').optional().trim(),
    body('content').optional().trim(),
    body('url').optional().trim(),
    body('order').optional().isInt().withMessage('Order must be an integer'),
  ],
  updateResource
);

/**
 * @route   DELETE /api/resources/:id
 * @desc    Delete a resource
 * @access  Private
 */
router.delete('/resources/:id', deleteResource);

/**
 * @route   PUT /api/resources/:id/read
 * @desc    Mark a resource as read
 * @access  Private
 */
router.put('/resources/:id/read', markResourceAsRead);

/**
 * @route   PUT /api/topics/:topicId/resources/reorder
 * @desc    Reorder resources within a topic
 * @access  Private
 */
router.put(
  '/topics/:topicId/resources/reorder',
  [
    body('resourceOrders')
      .isArray()
      .withMessage('resourceOrders must be an array')
      .notEmpty()
      .withMessage('resourceOrders cannot be empty'),
  ],
  reorderResources
);

export default router;
