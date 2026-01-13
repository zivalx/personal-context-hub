import { prisma } from '../utils/prisma.js';

/**
 * Global search across topics, resources, and captures
 * GET /api/search
 */
export const globalSearch = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const searchTerm = q.trim();
    const userId = req.user.id;
    const limitNum = parseInt(limit);

    // Search topics
    const topics = await prisma.topic.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: limitNum,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Search resources
    const resources = await prisma.resource.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } },
          { url: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
        capture: {
          select: {
            id: true,
            source: true,
          },
        },
      },
      take: limitNum,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Search captures
    const captures = await prisma.capture.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } },
          { tags: { has: searchTerm } },
        ],
      },
      take: limitNum,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        topics,
        resources,
        captures,
        totalResults: topics.length + resources.length + captures.length,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing search',
      error: error.message,
    });
  }
};
