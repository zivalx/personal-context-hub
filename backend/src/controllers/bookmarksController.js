import { prisma } from '../utils/prisma.js';

/**
 * Toggle bookmark on a topic
 * PUT /api/bookmarks/topic/:id
 */
export const toggleTopicBookmark = async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await prisma.topic.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
    }

    const updated = await prisma.topic.update({
      where: { id },
      data: {
        bookmarked: !topic.bookmarked,
      },
    });

    res.status(200).json({
      success: true,
      data: { bookmarked: updated.bookmarked },
    });
  } catch (error) {
    console.error('Toggle topic bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling bookmark',
      error: error.message,
    });
  }
};

/**
 * Toggle bookmark on a capture
 * PUT /api/bookmarks/capture/:id
 */
export const toggleCaptureBookmark = async (req, res) => {
  try {
    const { id } = req.params;

    const capture = await prisma.capture.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!capture) {
      return res.status(404).json({
        success: false,
        message: 'Capture not found',
      });
    }

    const updated = await prisma.capture.update({
      where: { id },
      data: {
        bookmarked: !capture.bookmarked,
      },
    });

    res.status(200).json({
      success: true,
      data: { bookmarked: updated.bookmarked },
    });
  } catch (error) {
    console.error('Toggle capture bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling bookmark',
      error: error.message,
    });
  }
};

/**
 * Toggle bookmark on a resource
 * PUT /api/bookmarks/resource/:id
 */
export const toggleResourceBookmark = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await prisma.resource.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: {
        bookmarked: !resource.bookmarked,
      },
    });

    res.status(200).json({
      success: true,
      data: { bookmarked: updated.bookmarked },
    });
  } catch (error) {
    console.error('Toggle resource bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling bookmark',
      error: error.message,
    });
  }
};

/**
 * Get all bookmarked items
 * GET /api/bookmarks
 */
export const getAllBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;

    const [topics, captures, resources] = await Promise.all([
      prisma.topic.findMany({
        where: {
          userId,
          bookmarked: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      prisma.capture.findMany({
        where: {
          userId,
          bookmarked: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.resource.findMany({
        where: {
          userId,
          bookmarked: true,
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
        orderBy: {
          updatedAt: 'desc',
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        topics,
        captures,
        resources,
        totalCount: topics.length + captures.length + resources.length,
      },
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookmarks',
      error: error.message,
    });
  }
};
