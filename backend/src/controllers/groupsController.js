import { validationResult } from 'express-validator';
import { prisma } from '../utils/prisma.js';

/**
 * Get all groups for a specific topic
 * GET /api/topics/:topicId/groups
 */
export const getGroupsByTopic = async (req, res) => {
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

    const groups = await prisma.group.findMany({
      where: {
        topicId,
      },
      include: {
        _count: {
          select: { resources: true },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        groups,
        count: groups.length,
      },
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching groups',
      error: error.message,
    });
  }
};

/**
 * Create a new group in a topic
 * POST /api/topics/:topicId/groups
 */
export const createGroup = async (req, res) => {
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

    const { name, color, order } = req.body;

    // Get the highest order number if order not provided
    let groupOrder = order;
    if (groupOrder === undefined) {
      const maxOrderGroup = await prisma.group.findFirst({
        where: { topicId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      groupOrder = maxOrderGroup ? maxOrderGroup.order + 1 : 0;
    }

    const group = await prisma.group.create({
      data: {
        name,
        color: color || '#8B5CF6',
        order: groupOrder,
        topicId,
        userId: req.user.id,
      },
      include: {
        _count: {
          select: { resources: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: { group },
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating group',
      error: error.message,
    });
  }
};

/**
 * Update a group
 * PUT /api/groups/:id
 */
export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, order } = req.body;

    // Check if group exists and belongs to user
    const existingGroup = await prisma.group.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    const group = await prisma.group.update({
      where: { id },
      data: {
        name,
        color,
        order,
      },
      include: {
        _count: {
          select: { resources: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Group updated successfully',
      data: { group },
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating group',
      error: error.message,
    });
  }
};

/**
 * Delete a group
 * DELETE /api/groups/:id
 */
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if group exists and belongs to user
    const existingGroup = await prisma.group.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Delete group (resources will have groupId set to null due to onDelete: SetNull)
    await prisma.group.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting group',
      error: error.message,
    });
  }
};

/**
 * Reorder groups within a topic
 * PUT /api/topics/:topicId/groups/reorder
 */
export const reorderGroups = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { groupOrders } = req.body; // Array of { id, order }

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

    // Update all groups in a transaction
    await prisma.$transaction(
      groupOrders.map(({ id, order }) =>
        prisma.group.update({
          where: { id },
          data: { order },
        })
      )
    );

    res.status(200).json({
      success: true,
      message: 'Groups reordered successfully',
    });
  } catch (error) {
    console.error('Reorder groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering groups',
      error: error.message,
    });
  }
};
