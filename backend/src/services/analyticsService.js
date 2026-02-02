import { prisma } from '../utils/prisma.js';
import logger from '../utils/logger.js';

/**
 * Analytics Service - Centralized event tracking
 * Use this service to track events throughout the application
 */

/**
 * Track an analytics event
 * @param {string} userId - User ID
 * @param {string} eventType - Event type (e.g., 'capture_created', 'topic_created')
 * @param {string} eventName - Human-readable event name
 * @param {object} properties - Additional event properties
 * @param {string} source - Event source ('web_app', 'extension', 'api')
 * @param {string} sessionId - Optional session ID
 * @param {string} ipAddress - User IP address
 * @param {string} userAgent - User agent string
 */
export async function trackEvent({
  userId,
  eventType,
  eventName,
  properties = {},
  source = 'web_app',
  sessionId = null,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventType,
        eventName,
        properties,
        source,
        sessionId,
        ipAddress,
        userAgent,
      },
    });

    logger.info(`Analytics event tracked: ${eventType} for user ${userId}`);
  } catch (error) {
    // Don't throw - analytics shouldn't break the app
    logger.error('Error tracking analytics event:', error);
  }
}

/**
 * Common event types for comprehensive user action tracking
 */
export const EventTypes = {
  // Authentication events
  USER_REGISTERED: 'user_registered',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  OAUTH_LOGIN: 'oauth_login',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',
  EMAIL_VERIFIED: 'email_verified',

  // Capture events
  CAPTURE_CREATED: 'capture_created',
  CAPTURE_VIEWED: 'capture_viewed',
  CAPTURE_OPENED: 'capture_opened',
  CAPTURE_CLOSED: 'capture_closed',
  CAPTURE_UPDATED: 'capture_updated',
  CAPTURE_DELETED: 'capture_deleted',
  CAPTURE_BOOKMARKED: 'capture_bookmarked',
  CAPTURE_UNBOOKMARKED: 'capture_unbookmarked',
  CAPTURE_COPIED: 'capture_copied',

  // Topic events
  TOPIC_CREATED: 'topic_created',
  TOPIC_VIEWED: 'topic_viewed',
  TOPIC_OPENED: 'topic_opened',
  TOPIC_CLOSED: 'topic_closed',
  TOPIC_UPDATED: 'topic_updated',
  TOPIC_DELETED: 'topic_deleted',
  TOPIC_BOOKMARKED: 'topic_bookmarked',
  TOPIC_UNBOOKMARKED: 'topic_unbookmarked',

  // Resource events
  RESOURCE_CREATED: 'resource_created',
  RESOURCE_VIEWED: 'resource_viewed',
  RESOURCE_OPENED: 'resource_opened',
  RESOURCE_CLOSED: 'resource_closed',
  RESOURCE_UPDATED: 'resource_updated',
  RESOURCE_DELETED: 'resource_deleted',
  RESOURCE_ADDED_TO_TOPIC: 'resource_added_to_topic',
  RESOURCE_REMOVED_FROM_TOPIC: 'resource_removed_from_topic',
  RESOURCE_BOOKMARKED: 'resource_bookmarked',
  RESOURCE_UNBOOKMARKED: 'resource_unbookmarked',

  // Modal events
  MODAL_OPENED: 'modal_opened',
  MODAL_CLOSED: 'modal_closed',
  MODAL_SUBMITTED: 'modal_submitted',
  MODAL_CANCELLED: 'modal_cancelled',

  // Navigation events
  PAGE_VIEWED: 'page_viewed',
  NAVBAR_ITEM_CLICKED: 'navbar_item_clicked',
  SIDEBAR_OPENED: 'sidebar_opened',
  SIDEBAR_CLOSED: 'sidebar_closed',
  SIDEBAR_ITEM_CLICKED: 'sidebar_item_clicked',

  // Search events
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',
  SEARCH_QUERY_CLEARED: 'search_query_cleared',

  // Extension events
  EXTENSION_OPENED: 'extension_opened',
  EXTENSION_CLOSED: 'extension_closed',
  EXTENSION_CAPTURE_CREATED: 'extension_capture_created',
  EXTENSION_POPUP_OPENED: 'extension_popup_opened',

  // Todo events
  TODO_ITEM_CHECKED: 'todo_item_checked',
  TODO_ITEM_UNCHECKED: 'todo_item_unchecked',
  TODO_ITEM_ADDED: 'todo_item_added',
  TODO_ITEM_DELETED: 'todo_item_deleted',

  // Export/Import events
  DATA_EXPORTED: 'data_exported',
  DATA_IMPORTED: 'data_imported',

  // Settings events
  SETTINGS_VIEWED: 'settings_viewed',
  SETTINGS_UPDATED: 'settings_updated',
  PROFILE_UPDATED: 'profile_updated',

  // Error events
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
};

/**
 * Helper to extract request metadata
 */
export function getRequestMetadata(req) {
  return {
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    sessionId: req.session?.id,
  };
}
