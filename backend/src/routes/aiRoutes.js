import express from 'express';
import { body } from 'express-validator';
import { askAI, getAIStatus, aiSearch } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Ask AI a question
router.post(
  '/ask',
  [body('question').trim().notEmpty().withMessage('Question is required')],
  askAI
);

// AI-enhanced search
router.post(
  '/search',
  [body('query').trim().notEmpty().withMessage('Search query is required')],
  aiSearch
);

// Get AI service status
router.get('/status', getAIStatus);

export default router;
