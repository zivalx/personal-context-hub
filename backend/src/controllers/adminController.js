import { prisma } from '../utils/prisma.js';
import logger from '../utils/logger.js';

/**
 * Get all users with stats
 */
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, sortBy = 'createdAt', order = 'desc' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build orderBy object
    const orderBy = {};
    orderBy[sortBy] = order;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          lastSeenAt: true,
          authProvider: true,
          _count: {
            select: {
              captures: true,
              topics: true,
              resources: true,
              analyticsEvents: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

/**
 * Get all analytics events with user info
 */
export const getAllEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      userId,
      eventType,
      days = 30,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const where = {
      createdAt: { gte: startDate },
    };

    if (userId) {
      where.userId = userId;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    // Build orderBy object
    const orderBy = {};
    orderBy[sortBy] = order;

    const [events, total] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.analyticsEvent.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / take),
          hasMore: total > skip + take,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
    });
  }
};

/**
 * Get platform-wide analytics overview
 */
export const getPlatformAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get total counts
    const [
      totalUsers,
      totalCaptures,
      totalTopics,
      totalResources,
      totalEvents,
      newUsers,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.capture.count(),
      prisma.topic.count(),
      prisma.resource.count(),
      prisma.analyticsEvent.count(),
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.user.count({
        where: { lastSeenAt: { gte: startDate } },
      }),
    ]);

    // Get event type breakdown
    const eventsByType = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      _count: {
        id: true,
      },
      where: {
        createdAt: { gte: startDate },
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Get daily new users
    const dailyUsers = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get daily activity
    const dailyActivity = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get top users by activity
    const topUsers = await prisma.analyticsEvent.groupBy({
      by: ['userId'],
      _count: {
        id: true,
      },
      where: {
        createdAt: { gte: startDate },
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Get user details for top users
    const topUserIds = topUsers.map((u) => u.userId);
    const topUserDetails = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Merge top users with their event counts
    const topUsersWithDetails = topUsers.map((user) => {
      const details = topUserDetails.find((u) => u.id === user.userId);
      return {
        userId: user.userId,
        email: details?.email,
        name: details?.name,
        eventCount: user._count.id,
      };
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalCaptures,
          totalTopics,
          totalResources,
          totalEvents,
          newUsers,
          activeUsers,
        },
        eventsByType: eventsByType.map((e) => ({
          eventType: e.eventType,
          count: e._count.id,
        })),
        dailyUsers,
        dailyActivity,
        topUsers: topUsersWithDetails,
        period: {
          days: parseInt(days),
          startDate,
          endDate: new Date(),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching platform analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform analytics',
    });
  }
};

/**
 * Get detailed user info with activity
 */
export const getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastSeenAt: true,
        authProvider: true,
        emailVerified: true,
        _count: {
          select: {
            captures: true,
            topics: true,
            resources: true,
            analyticsEvents: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get recent events
    const recentEvents = await prisma.analyticsEvent.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Get event type breakdown
    const eventsByType = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      _count: { id: true },
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: {
        _count: { id: 'desc' },
      },
    });

    res.json({
      success: true,
      data: {
        user,
        recentEvents,
        eventsByType: eventsByType.map((e) => ({
          eventType: e.eventType,
          count: e._count.id,
        })),
      },
    });
  } catch (error) {
    logger.error('Error fetching user detail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user detail',
    });
  }
};
