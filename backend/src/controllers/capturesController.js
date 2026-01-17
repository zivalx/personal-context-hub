import { validationResult } from 'express-validator';
import { prisma } from '../utils/prisma.js';
import { trackEvent, EventTypes, getRequestMetadata } from '../services/analyticsService.js';

/**
 * Get all captures for the authenticated user
 * GET /api/captures
 */
export const getAllCaptures = async (req, res) => {
  try {
    const { type, search, limit = 50, offset = 0 } = req.query;

    // Build query filters
    const where = {
      userId: req.user.id,
    };

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const captures = await prisma.capture.findMany({
      where,
      orderBy: [
        { unread: 'desc' },      // Unread items first
        { createdAt: 'desc' },   // Then by most recent
      ],
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.capture.count({ where });

    res.status(200).json({
      success: true,
      data: {
        captures,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + captures.length,
        },
      },
    });
  } catch (error) {
    console.error('Get captures error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching captures',
      error: error.message,
    });
  }
};

/**
 * Get a single capture by ID
 * GET /api/captures/:id
 */
export const getCaptureById = async (req, res) => {
  try {
    const { id } = req.params;

    const capture = await prisma.capture.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        resources: {
          include: {
            topic: true,
          },
        },
      },
    });

    if (!capture) {
      return res.status(404).json({
        success: false,
        message: 'Capture not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { capture },
    });
  } catch (error) {
    console.error('Get capture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching capture',
      error: error.message,
    });
  }
};

/**
 * Create a new capture
 * POST /api/captures
 */
export const createCapture = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { type, title, content, source, tags, metadata } = req.body;

    // Ensure either content or source is provided
    if (!content && !source) {
      return res.status(400).json({
        success: false,
        message: 'Either content or source must be provided',
      });
    }

    const capture = await prisma.capture.create({
      data: {
        type,
        title,
        content: content || '',
        source,
        tags: tags || [],
        metadata,
        userId: req.user.id,
      },
    });

    // Track capture creation event
    const reqMetadata = getRequestMetadata(req);
    trackEvent({
      userId: req.user.id,
      eventType: EventTypes.CAPTURE_CREATED,
      eventName: 'Capture Created',
      properties: {
        captureType: type,
        hasTitle: !!title,
        hasSource: !!source,
        tagCount: tags ? tags.length : 0,
      },
      ...reqMetadata,
    });

    res.status(201).json({
      success: true,
      message: 'Capture created successfully',
      data: { capture },
    });
  } catch (error) {
    console.error('Create capture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating capture',
      error: error.message,
    });
  }
};

/**
 * Update a capture
 * PUT /api/captures/:id
 */
export const updateCapture = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, content, source, tags, metadata, summary } = req.body;

    // Check if capture exists and belongs to user
    const existingCapture = await prisma.capture.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingCapture) {
      return res.status(404).json({
        success: false,
        message: 'Capture not found',
      });
    }

    const capture = await prisma.capture.update({
      where: { id },
      data: {
        type,
        title,
        content,
        source,
        tags,
        metadata,
        summary,
      },
    });

    // Track capture update event
    const reqMetadata = getRequestMetadata(req);
    trackEvent({
      userId: req.user.id,
      eventType: EventTypes.CAPTURE_UPDATED,
      eventName: 'Capture Updated',
      properties: {
        captureType: type || existingCapture.type,
        fieldsUpdated: Object.keys(req.body).filter(k => req.body[k] !== undefined),
      },
      ...reqMetadata,
    });

    res.status(200).json({
      success: true,
      message: 'Capture updated successfully',
      data: { capture },
    });
  } catch (error) {
    console.error('Update capture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating capture',
      error: error.message,
    });
  }
};

/**
 * Delete a capture
 * DELETE /api/captures/:id
 */
export const deleteCapture = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if capture exists and belongs to user
    const existingCapture = await prisma.capture.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingCapture) {
      return res.status(404).json({
        success: false,
        message: 'Capture not found',
      });
    }

    await prisma.capture.delete({
      where: { id },
    });

    // Track capture deletion event
    const reqMetadata = getRequestMetadata(req);
    trackEvent({
      userId: req.user.id,
      eventType: EventTypes.CAPTURE_DELETED,
      eventName: 'Capture Deleted',
      properties: {
        captureType: existingCapture.type,
        hadTitle: !!existingCapture.title,
      },
      ...reqMetadata,
    });

    res.status(200).json({
      success: true,
      message: 'Capture deleted successfully',
    });
  } catch (error) {
    console.error('Delete capture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting capture',
      error: error.message,
    });
  }
};

/**
 * Mark capture as read
 * PUT /api/captures/:id/read
 */
export const markCaptureAsRead = async (req, res) => {
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

    const updatedCapture = await prisma.capture.update({
      where: { id },
      data: { unread: false },
    });

    res.status(200).json({
      success: true,
      data: { capture: updatedCapture },
    });
  } catch (error) {
    console.error('Mark capture as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking capture as read',
      error: error.message,
    });
  }
};
