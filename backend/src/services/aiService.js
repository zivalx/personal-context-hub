import OpenAI from 'openai';
import logger from '../utils/logger.js';

/**
 * Multi-Provider AI Service
 * Supports: Groq (FREE), OpenRouter, Grok, OpenAI
 *
 * Priority Order (first configured wins):
 * 1. Groq (FREE, fastest)
 * 2. OpenRouter (cheapest paid)
 * 3. Grok (X.AI)
 * 4. OpenAI (fallback)
 */

// Provider configurations
const PROVIDERS = {
  groq: {
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile', // Updated to newest production model
    envKey: 'GROQ_API_KEY',
    cost: 'FREE',
  },
  openrouter: {
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.1-8b-instruct', // Cheapest option
    envKey: 'OPENROUTER_API_KEY',
    cost: '$0.06 per 1M tokens',
  },
  grok: {
    name: 'Grok',
    baseURL: 'https://api.x.ai/v1',
    model: 'grok-beta',
    envKey: 'GROK_API_KEY',
    cost: '$8/month + $25 credits',
  },
  openai: {
    name: 'OpenAI',
    baseURL: undefined, // Use default
    model: 'gpt-4o-mini', // Most cost-effective OpenAI model
    envKey: 'OPENAI_API_KEY',
    cost: '$0.15 per 1M tokens',
  },
};

let aiClient = null;
let activeProvider = null;

/**
 * Detect and initialize AI provider
 * Returns first available provider in priority order
 */
function initializeAIProvider() {
  if (aiClient) return { client: aiClient, provider: activeProvider };

  // Try providers in priority order
  for (const [key, config] of Object.entries(PROVIDERS)) {
    const apiKey = process.env[config.envKey];

    if (apiKey && apiKey.trim()) {
      try {
        aiClient = new OpenAI({
          apiKey,
          baseURL: config.baseURL,
          defaultHeaders: key === 'openrouter' ? {
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
            'X-Title': 'Personal Context Hub',
          } : undefined,
        });

        activeProvider = {
          key,
          ...config,
        };

        logger.info(`AI Provider initialized: ${config.name} (${config.cost})`);
        return { client: aiClient, provider: activeProvider };
      } catch (error) {
        logger.error(`Failed to initialize ${config.name}:`, error);
        continue;
      }
    }
  }

  throw new Error('No AI provider configured. Set GROQ_API_KEY, OPENROUTER_API_KEY, GROK_API_KEY, or OPENAI_API_KEY');
}

/**
 * Get active AI client and provider info
 */
function getAIClient() {
  const { client, provider } = initializeAIProvider();
  return { client, provider };
}

/**
 * Ask AI a question with context from user's captures
 * @param {string} question - User's question
 * @param {Array} captures - User's relevant captures for context
 * @returns {Promise<string>} - AI response
 */
export async function askAIWithContext(question, captures = []) {
  try {
    const { client, provider } = getAIClient();

    // Build context from captures
    let contextText = '';
    if (captures.length > 0) {
      contextText = '\n\nHere is relevant information from your saved captures:\n\n';
      captures.forEach((capture, index) => {
        contextText += `[${index + 1}] ${capture.title || 'Untitled'}\n`;
        contextText += `Type: ${capture.type}\n`;
        contextText += `${capture.content.substring(0, 500)}\n`; // Limit content length
        if (capture.source) {
          contextText += `Source: ${capture.source}\n`;
        }
        contextText += `Created: ${new Date(capture.createdAt).toLocaleDateString()}\n`;
        contextText += '\n';
      });
    } else {
      contextText = '\n\nNote: The user has not saved any captures yet, or no captures match this question. Let them know they should save some content first to get personalized answers.\n';
    }

    const systemPrompt = `You are a helpful AI assistant that answers questions based on the user's personal knowledge base.
The user has saved various captures (notes, links, quotes, etc.) and is asking you questions about them.

When answering:
- Be concise and direct
- Reference specific captures when relevant (e.g., "According to capture [2]...")
- When asked about recent topics, patterns, or themes, analyze the captures provided
- If asked about topics and captures are provided, summarize what topics appear in them
- If no relevant information is in the captures, say so clearly
- Use markdown formatting for better readability
- Be conversational and helpful
- IMPORTANT: You have access to the user's captures below. Always check them before saying you don't have information.`;

    const userPrompt = question + contextText;

    // Get model override from env or use provider default
    const model = process.env.AI_MODEL || provider.model;

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const answer = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    logger.info(`AI question answered successfully via ${provider.name}`);
    return answer;
  } catch (error) {
    logger.error('Error in askAIWithContext:', error);

    if (error.status === 401) {
      throw new Error(`Invalid API key for ${activeProvider?.name || 'AI provider'}. Please check your configuration.`);
    }

    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }

    throw new Error(`AI service error: ${error.message}`);
  }
}

/**
 * Generate a summary for a capture
 * @param {string} content - Content to summarize
 * @param {string} type - Type of capture (text, link, note, etc.)
 * @returns {Promise<string>} - Summary
 */
export async function generateSummary(content, type = 'text') {
  try {
    const { client, provider } = getAIClient();

    // Don't summarize if content is too short
    if (content.length < 200) {
      return null;
    }

    const systemPrompt = `You are a helpful assistant that creates concise summaries.
Generate a brief 1-2 sentence summary of the given content.
Focus on the main idea or key takeaway.`;

    const model = process.env.AI_MODEL || provider.model;

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Summarize this ${type}:\n\n${content.substring(0, 4000)}` },
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    const summary = response.choices[0]?.message?.content || null;

    logger.info(`Summary generated successfully via ${provider.name}`);
    return summary;
  } catch (error) {
    logger.error('Error generating summary:', error);
    // Don't throw - summarization is optional
    return null;
  }
}

/**
 * Generate embeddings for semantic search
 * Note: Only OpenAI supports embeddings API currently
 * For other providers, we use keyword-based search
 * @param {string} text - Text to generate embeddings for
 * @returns {Promise<Array<number>|null>} - Embedding vector or null
 */
export async function generateEmbedding(text) {
  try {
    // Only use OpenAI for embeddings since others don't support it
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      logger.info('OpenAI not configured - skipping embeddings');
      return null;
    }

    const openaiClient = new OpenAI({ apiKey: openaiKey });

    const response = await openaiClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // Limit input length
    });

    const embedding = response.data[0]?.embedding || null;

    logger.info('Embedding generated successfully via OpenAI');
    return embedding;
  } catch (error) {
    logger.error('Error generating embedding:', error);
    // Don't throw - embeddings are optional
    return null;
  }
}

/**
 * Search captures using semantic similarity (if embeddings available)
 * Falls back to keyword search if embeddings not available
 * @param {string} query - Search query
 * @param {Array} captures - All user captures
 * @returns {Array} - Relevant captures sorted by relevance
 */
export function searchCapturesByRelevance(query, captures) {
  // Simple keyword-based relevance scoring
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

  const scored = captures.map((capture) => {
    let score = 0;
    const title = (capture.title || '').toLowerCase();
    const content = (capture.content || '').toLowerCase();
    const combined = `${title} ${content}`;

    // Exact phrase match - highest score
    if (combined.includes(queryLower)) {
      score += 10;
    }

    // Word matches in title (high value)
    queryWords.forEach((word) => {
      const titleMatches = (title.match(new RegExp(word, 'g')) || []).length;
      score += titleMatches * 5;
    });

    // Word matches in content
    queryWords.forEach((word) => {
      const contentMatches = (content.match(new RegExp(word, 'g')) || []).length;
      score += contentMatches * 2;
    });

    // Boost recent captures slightly
    const daysSinceCreated = (Date.now() - new Date(capture.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 7) {
      score += 1;
    }

    return { ...capture, relevanceScore: score };
  });

  // Sort by relevance and return top results
  return scored
    .filter((c) => c.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10); // Top 10 most relevant
}

/**
 * Check if AI service is configured
 * @returns {boolean}
 */
export function isAIConfigured() {
  try {
    initializeAIProvider();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get active provider information
 * @returns {object|null}
 */
export function getActiveProvider() {
  try {
    const { provider } = getAIClient();
    return {
      name: provider.name,
      model: process.env.AI_MODEL || provider.model,
      cost: provider.cost,
      key: provider.key,
    };
  } catch (error) {
    return null;
  }
}

export default {
  askAIWithContext,
  generateSummary,
  generateEmbedding,
  searchCapturesByRelevance,
  isAIConfigured,
  getActiveProvider,
};
