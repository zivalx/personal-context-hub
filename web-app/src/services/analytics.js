/**
 * Analytics Service - Frontend event tracking
 * Tracks user actions and sends them to the backend analytics API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Event types matching backend EventTypes
 */
export const EventTypes = {
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

  // Todo events
  TODO_ITEM_CHECKED: 'todo_item_checked',
  TODO_ITEM_UNCHECKED: 'todo_item_unchecked',
  TODO_ITEM_ADDED: 'todo_item_added',
  TODO_ITEM_DELETED: 'todo_item_deleted',

  // Settings events
  SETTINGS_VIEWED: 'settings_viewed',
  SETTINGS_UPDATED: 'settings_updated',
  PROFILE_UPDATED: 'profile_updated',
};

/**
 * Event names for human-readable display
 */
const EventNames = {
  [EventTypes.CAPTURE_CREATED]: 'Capture Created',
  [EventTypes.CAPTURE_VIEWED]: 'Capture Viewed',
  [EventTypes.CAPTURE_OPENED]: 'Capture Opened',
  [EventTypes.CAPTURE_CLOSED]: 'Capture Closed',
  [EventTypes.CAPTURE_UPDATED]: 'Capture Updated',
  [EventTypes.CAPTURE_DELETED]: 'Capture Deleted',
  [EventTypes.CAPTURE_BOOKMARKED]: 'Capture Bookmarked',
  [EventTypes.CAPTURE_UNBOOKMARKED]: 'Capture Unbookmarked',
  [EventTypes.CAPTURE_COPIED]: 'Capture Copied',

  [EventTypes.TOPIC_CREATED]: 'Topic Created',
  [EventTypes.TOPIC_VIEWED]: 'Topic Viewed',
  [EventTypes.TOPIC_OPENED]: 'Topic Opened',
  [EventTypes.TOPIC_CLOSED]: 'Topic Closed',
  [EventTypes.TOPIC_UPDATED]: 'Topic Updated',
  [EventTypes.TOPIC_DELETED]: 'Topic Deleted',
  [EventTypes.TOPIC_BOOKMARKED]: 'Topic Bookmarked',
  [EventTypes.TOPIC_UNBOOKMARKED]: 'Topic Unbookmarked',

  [EventTypes.RESOURCE_CREATED]: 'Resource Created',
  [EventTypes.RESOURCE_VIEWED]: 'Resource Viewed',
  [EventTypes.RESOURCE_OPENED]: 'Resource Opened',
  [EventTypes.RESOURCE_CLOSED]: 'Resource Closed',
  [EventTypes.RESOURCE_UPDATED]: 'Resource Updated',
  [EventTypes.RESOURCE_DELETED]: 'Resource Deleted',
  [EventTypes.RESOURCE_ADDED_TO_TOPIC]: 'Resource Added to Topic',
  [EventTypes.RESOURCE_REMOVED_FROM_TOPIC]: 'Resource Removed from Topic',
  [EventTypes.RESOURCE_BOOKMARKED]: 'Resource Bookmarked',
  [EventTypes.RESOURCE_UNBOOKMARKED]: 'Resource Unbookmarked',

  [EventTypes.MODAL_OPENED]: 'Modal Opened',
  [EventTypes.MODAL_CLOSED]: 'Modal Closed',
  [EventTypes.MODAL_SUBMITTED]: 'Modal Submitted',
  [EventTypes.MODAL_CANCELLED]: 'Modal Cancelled',

  [EventTypes.PAGE_VIEWED]: 'Page Viewed',
  [EventTypes.NAVBAR_ITEM_CLICKED]: 'Navbar Item Clicked',
  [EventTypes.SIDEBAR_OPENED]: 'Sidebar Opened',
  [EventTypes.SIDEBAR_CLOSED]: 'Sidebar Closed',
  [EventTypes.SIDEBAR_ITEM_CLICKED]: 'Sidebar Item Clicked',

  [EventTypes.SEARCH_PERFORMED]: 'Search Performed',
  [EventTypes.SEARCH_RESULT_CLICKED]: 'Search Result Clicked',
  [EventTypes.SEARCH_QUERY_CLEARED]: 'Search Query Cleared',

  [EventTypes.TODO_ITEM_CHECKED]: 'Todo Item Checked',
  [EventTypes.TODO_ITEM_UNCHECKED]: 'Todo Item Unchecked',
  [EventTypes.TODO_ITEM_ADDED]: 'Todo Item Added',
  [EventTypes.TODO_ITEM_DELETED]: 'Todo Item Deleted',

  [EventTypes.SETTINGS_VIEWED]: 'Settings Viewed',
  [EventTypes.SETTINGS_UPDATED]: 'Settings Updated',
  [EventTypes.PROFILE_UPDATED]: 'Profile Updated',
};

// Session ID for tracking user sessions
let sessionId = null;

/**
 * Get or create session ID
 */
function getSessionId() {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
  return sessionId;
}

/**
 * Track an analytics event
 * @param {string} eventType - Event type from EventTypes
 * @param {object} properties - Additional event properties
 * @param {string} source - Event source (defaults to 'web_app')
 */
export async function trackEvent(eventType, properties = {}, source = 'web_app') {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      // Don't track if user is not logged in
      return;
    }

    const eventName = EventNames[eventType] || eventType;

    await fetch(`${API_BASE_URL}/api/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        eventType,
        eventName,
        properties,
        source,
        sessionId: getSessionId(),
      }),
    });

    // Don't throw errors - analytics should be fire-and-forget
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Track page view
 * @param {string} pageName - Name of the page
 * @param {string} path - URL path
 */
export function trackPageView(pageName, path) {
  trackEvent(EventTypes.PAGE_VIEWED, {
    pageName,
    path,
    referrer: document.referrer,
  });
}

/**
 * Track modal interaction
 * @param {string} action - 'opened', 'closed', 'submitted', or 'cancelled'
 * @param {string} modalName - Name of the modal
 */
export function trackModal(action, modalName) {
  const eventMap = {
    opened: EventTypes.MODAL_OPENED,
    closed: EventTypes.MODAL_CLOSED,
    submitted: EventTypes.MODAL_SUBMITTED,
    cancelled: EventTypes.MODAL_CANCELLED,
  };

  const eventType = eventMap[action];
  if (eventType) {
    trackEvent(eventType, { modalName });
  }
}

/**
 * Track navigation/sidebar interaction
 * @param {string} action - 'sidebar_opened', 'sidebar_closed', 'item_clicked', 'navbar_clicked'
 * @param {string} itemName - Name of the clicked item
 */
export function trackNavigation(action, itemName) {
  const eventMap = {
    sidebar_opened: EventTypes.SIDEBAR_OPENED,
    sidebar_closed: EventTypes.SIDEBAR_CLOSED,
    sidebar_item: EventTypes.SIDEBAR_ITEM_CLICKED,
    navbar_item: EventTypes.NAVBAR_ITEM_CLICKED,
  };

  const eventType = eventMap[action];
  if (eventType) {
    trackEvent(eventType, { itemName });
  }
}

/**
 * Track capture interaction
 * @param {string} action - 'opened', 'closed', 'bookmarked', 'unbookmarked', 'copied'
 * @param {string} captureId - ID of the capture
 * @param {object} extraProps - Additional properties
 */
export function trackCapture(action, captureId, extraProps = {}) {
  const eventMap = {
    opened: EventTypes.CAPTURE_OPENED,
    closed: EventTypes.CAPTURE_CLOSED,
    bookmarked: EventTypes.CAPTURE_BOOKMARKED,
    unbookmarked: EventTypes.CAPTURE_UNBOOKMARKED,
    copied: EventTypes.CAPTURE_COPIED,
  };

  const eventType = eventMap[action];
  if (eventType) {
    trackEvent(eventType, { captureId, ...extraProps });
  }
}

/**
 * Track topic interaction
 * @param {string} action - 'opened', 'closed', 'bookmarked', 'unbookmarked'
 * @param {string} topicId - ID of the topic
 * @param {object} extraProps - Additional properties
 */
export function trackTopic(action, topicId, extraProps = {}) {
  const eventMap = {
    opened: EventTypes.TOPIC_OPENED,
    closed: EventTypes.TOPIC_CLOSED,
    bookmarked: EventTypes.TOPIC_BOOKMARKED,
    unbookmarked: EventTypes.TOPIC_UNBOOKMARKED,
  };

  const eventType = eventMap[action];
  if (eventType) {
    trackEvent(eventType, { topicId, ...extraProps });
  }
}

/**
 * Track search interaction
 * @param {string} action - 'performed', 'result_clicked', 'cleared'
 * @param {object} props - Search properties (query, resultCount, etc.)
 */
export function trackSearch(action, props = {}) {
  const eventMap = {
    performed: EventTypes.SEARCH_PERFORMED,
    result_clicked: EventTypes.SEARCH_RESULT_CLICKED,
    cleared: EventTypes.SEARCH_QUERY_CLEARED,
  };

  const eventType = eventMap[action];
  if (eventType) {
    trackEvent(eventType, props);
  }
}

/**
 * Track todo item interaction
 * @param {string} action - 'checked', 'unchecked', 'added', 'deleted'
 * @param {string} captureId - ID of the capture containing the todo
 * @param {object} extraProps - Additional properties
 */
export function trackTodo(action, captureId, extraProps = {}) {
  const eventMap = {
    checked: EventTypes.TODO_ITEM_CHECKED,
    unchecked: EventTypes.TODO_ITEM_UNCHECKED,
    added: EventTypes.TODO_ITEM_ADDED,
    deleted: EventTypes.TODO_ITEM_DELETED,
  };

  const eventType = eventMap[action];
  if (eventType) {
    trackEvent(eventType, { captureId, ...extraProps });
  }
}

export default {
  trackEvent,
  trackPageView,
  trackModal,
  trackNavigation,
  trackCapture,
  trackTopic,
  trackSearch,
  trackTodo,
  EventTypes,
};
