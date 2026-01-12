/**
 * Background service worker for Chrome Extension
 * Handles context menus and background tasks
 */

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'captureText',
    title: 'Capture to Personal Context Hub',
    contexts: ['selection'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'captureText') {
    // Send selected text to popup or directly to API
    chrome.storage.local.set({
      pendingCapture: {
        type: 'text',
        content: info.selectionText,
        source: tab.url,
        title: tab.title,
      },
    });

    // Open popup
    chrome.action.openPopup();
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_CONTENT') {
    // Handle content capture from content script
    chrome.storage.local.set({
      pendingCapture: message.data,
    });
  }

  return true;
});

console.log('Personal Context Hub extension loaded');
