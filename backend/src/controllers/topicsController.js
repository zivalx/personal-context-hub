import { validationResult } from 'express-validator';
import { prisma } from '../utils/prisma.js';

/**
 * Get all topics for the authenticated user
 * GET /api/topics
 */
export const getAllTopics = async (req, res) => {
  try {
    const topics = await prisma.topic.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        _count: {
          select: { resources: true },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        topics,
        count: topics.length,
      },
    });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching topics',
      error: error.message,
    });
  }
};

/**
 * Get a single topic by ID
 * GET /api/topics/:id
 */
export const getTopicById = async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await prisma.topic.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        resources: {
          include: {
            capture: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { topic },
    });
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching topic',
      error: error.message,
    });
  }
};

/**
 * Create a new topic
 * POST /api/topics
 */
export const createTopic = async (req, res) => {
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

    const { title, description, color, icon } = req.body;

    const topic = await prisma.topic.create({
      data: {
        title,
        description,
        color,
        icon,
        userId: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      data: { topic },
    });
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating topic',
      error: error.message,
    });
  }
};

/**
 * Update a topic
 * PUT /api/topics/:id
 */
export const updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, color, icon } = req.body;

    // Check if topic exists and belongs to user
    const existingTopic = await prisma.topic.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingTopic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
    }

    const topic = await prisma.topic.update({
      where: { id },
      data: {
        title,
        description,
        color,
        icon,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Topic updated successfully',
      data: { topic },
    });
  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating topic',
      error: error.message,
    });
  }
};

/**
 * Delete a topic
 * DELETE /api/topics/:id
 */
export const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if topic exists and belongs to user
    const existingTopic = await prisma.topic.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingTopic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
    }

    // Delete topic (cascade will delete associated resources)
    await prisma.topic.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Topic deleted successfully',
    });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting topic',
      error: error.message,
    });
  }
};
