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
    const { title, description, type, captureId, content, url, order, groupId, orderInGroup } = req.body;

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

    // If groupId is provided, verify it exists and belongs to user
    if (groupId) {
      const group = await prisma.group.findFirst({
        where: {
          id: groupId,
          userId: req.user.id,
        },
      });

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found',
        });
      }
    }

    // Build update data object - only include fields that are provided
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (captureId !== undefined) updateData.captureId = captureId;
    if (content !== undefined) updateData.content = content;
    if (url !== undefined) updateData.url = url;
    if (order !== undefined) updateData.order = order;
    if (groupId !== undefined) updateData.groupId = groupId;
    if (orderInGroup !== undefined) updateData.orderInGroup = orderInGroup;

    const resource = await prisma.resource.update({
      where: { id },
      data: updateData,
      include: {
        capture: true,
        group: true,
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
 * Delete a resource (and associated capture if it exists)
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
      include: {
        capture: true,
      },
    });

    if (!existingResource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    // If resource is linked to a capture, delete the capture too
    if (existingResource.captureId) {
      await prisma.capture.delete({
        where: { id: existingResource.captureId },
      });
    }

    // Delete the resource (will cascade if capture wasn't deleted above)
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
 * Remove a resource from topic (but keep the capture)
 * DELETE /api/resources/:id/remove-from-topic
 */
export const removeResourceFromTopic = async (req, res) => {
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

    // Delete only the resource, not the capture
    await prisma.resource.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Resource removed from topic',
    });
  } catch (error) {
    console.error('Remove resource from topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing resource from topic',
      error: error.message,
    });
  }
};

/**
 * Copy a resource to another topic
 * POST /api/resources/:id/copy-to-topic
 */
export const copyResourceToTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { topicId } = req.body;

    if (!topicId) {
      return res.status(400).json({
        success: false,
        message: 'Topic ID is required',
      });
    }

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

    // Check if target topic exists and belongs to user
    const targetTopic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        userId: req.user.id,
      },
    });

    if (!targetTopic) {
      return res.status(404).json({
        success: false,
        message: 'Target topic not found',
      });
    }

    // Create a copy of the resource in the new topic
    const copiedResource = await prisma.resource.create({
      data: {
        title: existingResource.title,
        description: existingResource.description,
        type: existingResource.type,
        captureId: existingResource.captureId, // Link to same capture
        content: existingResource.content,
        url: existingResource.url,
        order: 0, // New resource goes to top
        topicId,
        userId: req.user.id,
        unread: true, // Mark as unread in new topic
      },
    });

    res.status(201).json({
      success: true,
      message: 'Resource copied to new topic',
      data: { resource: copiedResource },
    });
  } catch (error) {
    console.error('Copy resource to topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Error copying resource to topic',
      error: error.message,
    });
  }
};

/**
 * Move a resource to another topic
 * PUT /api/resources/:id/move-to-topic
 */
export const moveResourceToTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { topicId } = req.body;

    if (!topicId) {
      return res.status(400).json({
        success: false,
        message: 'Topic ID is required',
      });
    }

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

    // Check if target topic exists and belongs to user
    const targetTopic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        userId: req.user.id,
      },
    });

    if (!targetTopic) {
      return res.status(404).json({
        success: false,
        message: 'Target topic not found',
      });
    }

    // Move resource to new topic
    const updatedResource = await prisma.resource.update({
      where: { id },
      data: { topicId },
    });

    res.status(200).json({
      success: true,
      message: 'Resource moved to new topic',
      data: { resource: updatedResource },
    });
  } catch (error) {
    console.error('Move resource to topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Error moving resource to topic',
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
