/**
 * Content script for Chrome Extension
 * Runs on all web pages to enable content capture
 */

// Listen for keyboard shortcuts or user actions
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Shift + C to capture selected text
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
    e.preventDefault();

    const selectedText = window.getSelection().toString().trim();

    if (selectedText) {
      // Send message to background script
      chrome.runtime.sendMessage({
        type: 'CAPTURE_CONTENT',
        data: {
          type: 'text',
          content: selectedText,
          source: window.location.href,
          title: document.title,
        },
      });

      // Show notification
      showNotification('Text captured! Open extension to save.');
    }
  }
});

// Show temporary notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #3B82F6;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 999999;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

console.log('Personal Context Hub content script loaded');
