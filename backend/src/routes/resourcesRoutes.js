import express from 'express';
import { body } from 'express-validator';
import {
  getResourcesByTopic,
  createResource,
  updateResource,
  deleteResource,
  removeResourceFromTopic,
  copyResourceToTopic,
  moveResourceToTopic,
  markResourceAsRead,
  reorderResources,
  uploadFileResource,
  downloadFileResource,
  viewFileResource,
} from '../controllers/resourcesController.js';
import { authenticate, authenticateFileAccess } from '../middleware/auth.js';
import { upload, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

/**
 * @route   GET /api/topics/:topicId/resources
 * @desc    Get all resources for a specific topic
 * @access  Private
 */
router.get('/topics/:topicId/resources', authenticate, getResourcesByTopic);

/**
 * @route   POST /api/topics/:topicId/resources
 * @desc    Create a new resource in a topic
 * @access  Private
 */
router.post(
  '/topics/:topicId/resources',
  authenticate,
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
  authenticate,
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
 * @desc    Delete a resource (and associated capture if exists)
 * @access  Private
 */
router.delete('/resources/:id', authenticate, deleteResource);

/**
 * @route   DELETE /api/resources/:id/remove-from-topic
 * @desc    Remove a resource from topic (keep the capture)
 * @access  Private
 */
router.delete('/resources/:id/remove-from-topic', authenticate, removeResourceFromTopic);

/**
 * @route   POST /api/resources/:id/copy-to-topic
 * @desc    Copy a resource to another topic
 * @access  Private
 */
router.post(
  '/resources/:id/copy-to-topic',
  authenticate,
  [body('topicId').trim().notEmpty().withMessage('Topic ID is required')],
  copyResourceToTopic
);

/**
 * @route   PUT /api/resources/:id/move-to-topic
 * @desc    Move a resource to another topic
 * @access  Private
 */
router.put(
  '/resources/:id/move-to-topic',
  authenticate,
  [body('topicId').trim().notEmpty().withMessage('Topic ID is required')],
  moveResourceToTopic
);

/**
 * @route   PUT /api/resources/:id/read
 * @desc    Mark a resource as read
 * @access  Private
 */
router.put('/resources/:id/read', authenticate, markResourceAsRead);

/**
 * @route   PUT /api/topics/:topicId/resources/reorder
 * @desc    Reorder resources within a topic
 * @access  Private
 */
router.put(
  '/topics/:topicId/resources/reorder',
  authenticate,
  [
    body('resourceOrders')
      .isArray()
      .withMessage('resourceOrders must be an array')
      .notEmpty()
      .withMessage('resourceOrders cannot be empty'),
  ],
  reorderResources
);

/**
 * @route   POST /api/topics/:topicId/resources/upload
 * @desc    Upload a file resource to a topic
 * @access  Private
 */
router.post(
  '/topics/:topicId/resources/upload',
  authenticate,
  upload.single('file'),
  handleUploadError,
  uploadFileResource
);

/**
 * @route   GET /api/resources/:id/download
 * @desc    Download a file resource (accepts token in query param for direct links)
 * @access  Private
 */
router.get('/resources/:id/download', authenticateFileAccess, downloadFileResource);

/**
 * @route   GET /api/resources/:id/view
 * @desc    View a file resource inline (accepts token in query param for iframes/images)
 * @access  Private
 */
router.get('/resources/:id/view', authenticateFileAccess, viewFileResource);

export default router;
