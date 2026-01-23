import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/contexts/ThemeContext';
import App from './App.jsx';
import './index.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Listen for messages from the browser extension to refresh data immediately
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CONTEXT_HUB_REFRESH') {
      console.log('Received refresh request from extension:', message);

      // Invalidate queries based on the action
      if (message.action === 'resource_created') {
        // Invalidate both captures and topics to ensure UI updates everywhere
        queryClient.invalidateQueries(['captures']);
        queryClient.invalidateQueries(['topics']);

        // If a specific topic was updated, invalidate its detail query too
        if (message.topicId) {
          queryClient.invalidateQueries(['topic', message.topicId]);
        }
      }

      sendResponse({ success: true });
    }
    return true; // Keep message channel open for async response
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <App />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
