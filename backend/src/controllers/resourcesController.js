import { validationResult } from 'express-validator';
import { prisma } from '../utils/prisma.js';

/**
 * Get all resources for a specific topic
 * GET /api/topics/:topicId/resources
 */
export const getResourcesByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;

    // Verify topic exists and belongs to user
    const topic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        userId: req.user.id,
      },
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
    }

    const resources = await prisma.resource.findMany({
      where: {
        topicId,
      },
      include: {
        capture: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        resources,
        count: resources.length,
      },
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resources',
      error: error.message,
    });
  }
};

/**
 * Create a new resource in a topic
 * POST /api/topics/:topicId/resources
 */
export const createResource = async (req, res) => {
  try {
    const { topicId } = req.params;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    // Verify topic exists and belongs to user
    const topic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        userId: req.user.id,
      },
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
    }

    const { title, description, type, captureId, content, url, order } = req.body;

    // If linking to a capture, verify it exists and belongs to user
    if (captureId) {
      const capture = await prisma.capture.findFirst({
        where: {
          id: captureId,
          userId: req.user.id,
        },
      });

      if (!capture) {
        return res.status(404).json({
          success: false,
          message: 'Capture not found',
        });
      }
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        description,
        type,
        captureId,
        content,
        url,
        order: order || 0,
        topicId,
        userId: req.user.id,
      },
      include: {
        capture: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: { resource },
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating resource',
      error: error.message,
    });
  }
};

/**
 * Update a resource
 * PUT /api/resources/:id
 */
export const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, captureId, content, url, order } = req.body;

    // Check if resource exists and belongs to user
    const existingResource = await prisma.resource.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingResource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        title,
        description,
        type,
        captureId,
        content,
        url,
        order,
      },
      include: {
        capture: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      data: { resource },
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating resource',
      error: error.message,
    });
  }
};

/**
 * Delete a resource
 * DELETE /api/resources/:id
 */
export const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if resource exists and belongs to user
    const existingResource = await prisma.resource.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingResource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    await prisma.resource.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting resource',
      error: error.message,
    });
  }
};

/**
 * Mark resource as read
 * PUT /api/resources/:id/read
 */
export const markResourceAsRead = async (req, res) => {
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

    const updatedResource = await prisma.resource.update({
      where: { id },
      data: { unread: false },
    });

    res.status(200).json({
      success: true,
      data: { resource: updatedResource },
    });
  } catch (error) {
    console.error('Mark resource as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking resource as read',
      error: error.message,
    });
  }
};

/**
 * Reorder resources within a topic
 * PUT /api/topics/:topicId/resources/reorder
 */
export const reorderResources = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { resourceOrders } = req.body; // Array of { id, order }

    // Verify topic exists and belongs to user
    const topic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        userId: req.user.id,
      },
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
    }

    // Update all resources in a transaction
    await prisma.$transaction(
      resourceOrders.map(({ id, order }) =>
        prisma.resource.update({
          where: { id },
          data: { order },
        })
      )
    );

    res.status(200).json({
      success: true,
      message: 'Resources reordered successfully',
    });
  } catch (error) {
    console.error('Reorder resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering resources',
      error: error.message,
    });
  }
};
