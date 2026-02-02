import { prisma } from '../utils/prisma.js';
import logger from '../utils/logger.js';

/**
 * Track an analytics event
 */
export const trackEvent = async (req, res) => {
  try {
    const { eventType, eventName, properties, source, sessionId } = req.body;
    const userId = req.user.userId;

    if (!eventType || !eventName) {
      return res.status(400).json({
        success: false,
        message: 'eventType and eventName are required',
      });
    }

    // Get IP and user agent from request
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Create analytics event
    const event = await prisma.analyticsEvent.create({
      data: {
        userId,
        eventType,
        eventName,
        properties: properties || {},
        source: source || 'web_app',
        sessionId,
        ipAddress,
        userAgent,
      },
    });

    // Update user stats asynchronously (don't block response)
    updateUserStats(userId, eventType, properties).catch((error) => {
      logger.error('Error updating user stats:', error);
    });

    res.json({
      success: true,
      data: { eventId: event.id },
    });
  } catch (error) {
    logger.error('Error tracking event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event',
    });
  }
};

/**
 * Get user analytics overview
 */
export const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get user stats
    let userStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    // Create stats if they don't exist
    if (!userStats) {
      userStats = await prisma.userStats.create({
        data: { userId },
      });
    }

    // Get recent events
    const recentEvents = await prisma.analyticsEvent.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Calculate activity by day
    const activityByDay = {};
    recentEvents.forEach((event) => {
      const date = event.createdAt.toISOString().split('T')[0];
      activityByDay[date] = (activityByDay[date] || 0) + 1;
    });

    // Calculate activity by event type
    const activityByType = {};
    recentEvents.forEach((event) => {
      activityByType[event.eventType] = (activityByType[event.eventType] || 0) + 1;
    });

    // Calculate activity by hour
    const activityByHour = Array(24).fill(0);
    recentEvents.forEach((event) => {
      const hour = event.createdAt.getHours();
      activityByHour[hour]++;
    });

    // Calculate activity by day of week
    const activityByDayOfWeek = Array(7).fill(0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    recentEvents.forEach((event) => {
      const day = event.createdAt.getDay();
      activityByDayOfWeek[day]++;
    });

    res.json({
      success: true,
      data: {
        stats: userStats,
        period: {
          days: parseInt(days),
          startDate,
          endDate: new Date(),
        },
        activity: {
          byDay: activityByDay,
          byType: activityByType,
          byHour: activityByHour,
          byDayOfWeek: activityByDayOfWeek.map((count, index) => ({
            day: dayNames[index],
            count,
          })),
        },
        totalEvents: recentEvents.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
    });
  }
};

/**
 * Get detailed event history
 */
export const getEventHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { eventType, limit = 50, offset = 0, days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const where = {
      userId,
      createdAt: { gte: startDate },
    };

    if (eventType) {
      where.eventType = eventType;
    }

    const [events, total] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.analyticsEvent.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching event history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event history',
    });
  }
};

/**
 * Get user stats summary
 */
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    let userStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (!userStats) {
      // Create initial stats
      userStats = await prisma.userStats.create({
        data: { userId },
      });
    }

    res.json({
      success: true,
      data: { stats: userStats },
    });
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user stats',
    });
  }
};

/**
 * Update user stats (internal function)
 */
async function updateUserStats(userId, eventType, properties) {
  try {
    // Get or create user stats
    let stats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      stats = await prisma.userStats.create({
        data: { userId },
      });
    }

    // Get actual counts from database
    const [capturesCount, topicsCount, resourcesCount] = await Promise.all([
      prisma.capture.count({ where: { userId } }),
      prisma.topic.count({ where: { userId } }),
      prisma.resource.count({ where: { userId } }),
    ]);

    // Get captures by type
    const captures = await prisma.capture.findMany({
      where: { userId },
      select: { type: true },
    });

    const capturesByType = {};
    captures.forEach((capture) => {
      capturesByType[capture.type] = (capturesByType[capture.type] || 0) + 1;
    });

    // Count total searches
    const searchCount = await prisma.analyticsEvent.count({
      where: {
        userId,
        eventType: 'search_performed',
      },
    });

    // Calculate average captures per day
    const firstCapture = await prisma.capture.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    let averageCapturesPerDay = 0;
    if (firstCapture) {
      const daysSinceFirst = Math.max(
        1,
        Math.floor((Date.now() - firstCapture.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      );
      averageCapturesPerDay = capturesCount / daysSinceFirst;
    }

    // Get most active hour
    const events = await prisma.analyticsEvent.findMany({
      where: { userId },
      select: { createdAt: true },
    });

    const hourCounts = Array(24).fill(0);
    events.forEach((event) => {
      hourCounts[event.createdAt.getHours()]++;
    });
    const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));

    // Get most active day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = Array(7).fill(0);
    events.forEach((event) => {
      dayCounts[event.createdAt.getDay()]++;
    });
    const mostActiveDay = dayNames[dayCounts.indexOf(Math.max(...dayCounts))];

    // Update stats
    await prisma.userStats.update({
      where: { userId },
      data: {
        totalCaptures: capturesCount,
        totalTopics: topicsCount,
        totalResources: resourcesCount,
        totalSearches: searchCount,
        capturesByType,
        mostActiveDay,
        mostActiveHour,
        averageCapturesPerDay,
        lastActiveAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('Error updating user stats:', error);
    throw error;
  }
}
