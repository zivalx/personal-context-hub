import express from 'express';
import { body } from 'express-validator';
import {
  getGroupsByTopic,
  createGroup,
  updateGroup,
  deleteGroup,
  reorderGroups,
} from '../controllers/groupsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Topic-specific group routes
router.get('/topics/:topicId/groups', getGroupsByTopic);

router.post(
  '/topics/:topicId/groups',
  [
    body('name').trim().notEmpty().withMessage('Group name is required'),
    body('color').optional().isString(),
    body('order').optional().isInt(),
  ],
  createGroup
);

router.put('/topics/:topicId/groups/reorder', reorderGroups);

// Individual group routes
router.put(
  '/groups/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('color').optional().isString(),
    body('order').optional().isInt(),
  ],
  updateGroup
);

router.delete('/groups/:id', deleteGroup);

export default router;
