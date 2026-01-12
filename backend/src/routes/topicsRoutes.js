import express from 'express';
import { body } from 'express-validator';
import {
  getAllTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
} from '../controllers/topicsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/topics
 * @desc    Get all topics for authenticated user
 * @access  Private
 */
router.get('/', getAllTopics);

/**
 * @route   GET /api/topics/:id
 * @desc    Get a single topic by ID
 * @access  Private
 */
router.get('/:id', getTopicById);

/**
 * @route   POST /api/topics
 * @desc    Create a new topic
 * @access  Private
 */
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('color').optional().trim(),
    body('icon').optional().trim(),
  ],
  createTopic
);

/**
 * @route   PUT /api/topics/:id
 * @desc    Update a topic
 * @access  Private
 */
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim(),
    body('color').optional().trim(),
    body('icon').optional().trim(),
  ],
  updateTopic
);

/**
 * @route   DELETE /api/topics/:id
 * @desc    Delete a topic
 * @access  Private
 */
router.delete('/:id', deleteTopic);

export default router;
