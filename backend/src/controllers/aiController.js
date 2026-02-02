import { prisma } from '../utils/prisma.js';
import logger from '../utils/logger.js';
import {
  askAIWithContext,
  searchCapturesByRelevance,
  isAIConfigured,
  getActiveProvider,
} from '../services/aiService.js';
import { trackEvent, EventTypes, getRequestMetadata } from '../services/analyticsService.js';

/**
 * Ask AI a question with context from user's captures
 * POST /api/ai/ask
 */
export const askAI = async (req, res) => {
  try {
    // Check if AI is configured
    if (!isAIConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Please add GROK_API_KEY to environment variables.',
      });
    }

    const { question } = req.body;
    const userId = req.user.id;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question is required',
      });
    }

    // Get all user's captures for context
    const allCaptures = await prisma.capture.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        source: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to most recent 100 captures for performance
    });

    // Log for debugging
    logger.info(`Found ${allCaptures.length} total captures for user ${userId}`);

    // Find most relevant captures for the question
    let relevantCaptures = searchCapturesByRelevance(question, allCaptures);

    // If no relevant captures found, use the most recent ones as fallback
    if (relevantCaptures.length === 0 && allCaptures.length > 0) {
      logger.info('No relevant captures found by search, using most recent captures as fallback');
      relevantCaptures = allCaptures.slice(0, 10);
    }

    logger.info(`Using ${relevantCaptures.length} captures for AI context`);

    // Ask AI with relevant context
    const answer = await askAIWithContext(question, relevantCaptures);

    // Track AI usage
    const metadata = getRequestMetadata(req);
    trackEvent({
      userId,
      eventType: 'ai_question_asked',
      eventName: 'AI Question Asked',
      properties: {
        questionLength: question.length,
        capturesUsed: relevantCaptures.length,
        totalCaptures: allCaptures.length,
      },
      source: 'web_app',
      ...metadata,
    });

    res.json({
      success: true,
      data: {
        answer,
        capturesUsed: relevantCaptures.length,
        sources: relevantCaptures.slice(0, 5).map((c) => ({
          id: c.id,
          title: c.title,
          type: c.type,
        })),
      },
    });
  } catch (error) {
    logger.error('Error in askAI:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get AI response',
    });
  }
};

/**
 * Get AI service status
 * GET /api/ai/status
 */
export const getAIStatus = async (req, res) => {
  try {
    const configured = isAIConfigured();
    const provider = configured ? getActiveProvider() : null;

    res.json({
      success: true,
      data: {
        configured,
        provider: provider ? {
          name: provider.name,
          model: provider.model,
          cost: provider.cost,
        } : null,
      },
    });
  } catch (error) {
    logger.error('Error getting AI status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI status',
    });
  }
};

/**
 * Search captures with AI-enhanced relevance
 * POST /api/ai/search
 */
export const aiSearch = async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user.id;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // Get all user's captures
    const captures = await prisma.capture.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Search with relevance scoring
    const results = searchCapturesByRelevance(query, captures);

    // Track search
    const metadata = getRequestMetadata(req);
    trackEvent({
      userId,
      eventType: EventTypes.SEARCH_PERFORMED,
      eventName: 'AI Search Performed',
      properties: {
        query,
        resultsCount: results.length,
      },
      source: 'web_app',
      ...metadata,
    });

    res.json({
      success: true,
      data: {
        results,
        total: results.length,
      },
    });
  } catch (error) {
    logger.error('Error in aiSearch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform AI search',
    });
  }
};
