import { useState, useEffect } from 'react';
import { authAPI, capturesAPI, resourcesAPI } from '../api/client';
import { API_BASE_URL, WEB_APP_URL } from '../config.js';

const Popup = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Topics
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', description: '', color: '#8B5CF6' });

  // Capture form
  const [captureType, setCaptureType] = useState('note');
  const [captureTitle, setCaptureTitle] = useState('');
  const [captureContent, setCaptureContent] = useState('');
  const [captureUrl, setCaptureUrl] = useState('');
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const [todoItems, setTodoItems] = useState([]);
  const [newTodoItem, setNewTodoItem] = useState('');

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
    getCurrentPageInfo();

    // Listen for OAuth token from web app
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  const handleAuthMessage = async (event) => {
    // Security: verify message is from our web app
    if (event.data && event.data.type === 'CONTEXT_HUB_AUTH' && event.data.token) {
      // Store token
      await new Promise((resolve) => {
        chrome.storage.local.set({ token: event.data.token }, resolve);
      });
      // Check auth again
      await checkAuth();
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Check if Google OAuth is available
      const response = await fetch(`${API_BASE_URL}/api/auth/google?from=extension`, {
        method: 'GET',
      });

      // If we get a JSON error response
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        if (!data.success) {
          setLoginError(data.message || 'Google Sign-In is not available. Please use email/password to sign in.');
          return;
        }
      }

      // Otherwise, open OAuth flow in new tab
      chrome.tabs.create({
        url: `${API_BASE_URL}/api/auth/google?from=extension`
      });
    } catch (err) {
      setLoginError('Google Sign-In is not available. Please use email/password to sign in.');
    }
  };

  const checkAuth = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
      setIsAuthenticated(true);
      await fetchTopics();
    } catch (err) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const token = await new Promise((resolve) => {
        chrome.storage.local.get(['token'], (result) => {
          resolve(result.token);
        });
      });
      const response = await fetch(`${API_BASE_URL}/api/topics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTopics(data.data.topics);
      }
    } catch (err) {
      console.error('Failed to fetch topics:', err);
    }
  };

  const getCurrentPageInfo = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const tab = tabs[0];
        setCaptureTitle(tab.title || '');
        if (tab.url) {
          setCaptureUrl(tab.url);
        }
      }
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await authAPI.login(email, password);
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (err) {
      setLoginError(err.message || 'Failed to login');
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    try {
      const token = await new Promise((resolve) => {
        chrome.storage.local.get(['token'], (result) => {
          resolve(result.token);
        });
      });
      const response = await fetch(`${API_BASE_URL}/api/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newTopic),
      });
      const data = await response.json();
      if (data.success) {
        await fetchTopics();
        setSelectedTopicId(data.data.topic.id);
        setShowCreateTopic(false);
        setNewTopic({ title: '', description: '', color: '#8B5CF6' });
      }
    } catch (err) {
      console.error('Failed to create topic:', err);
    }
  };

  const handleCapture = async (e) => {
    e.preventDefault();
    setCaptureError('');
    setCaptureSuccess(false);

    try {
      // Get current tab info
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      // Prepare capture data
      const captureData = {
        type: captureType,
        title: captureTitle,
        tags: [],
      };

      // Only add source for link type
      if (captureType === 'link') {
        captureData.source = currentTab?.url || captureUrl || '';
      }

      // Add content based on type
      if (captureType === 'todo') {
        if (todoItems.length === 0) {
          setCaptureError('Please add at least one todo item');
          return;
        }
        captureData.content = JSON.stringify(todoItems);
      } else {
        // Content is optional for link and note types
        if (captureContent.trim()) {
          captureData.content = captureContent;
        }
      }

      // Create capture
      const captureResponse = await capturesAPI.create(captureData);

      // If topic is selected, create a resource linked to this capture
      if (selectedTopicId && captureResponse.data?.capture) {
        const resourceData = {
          title: captureTitle || 'Untitled Capture',
          type: 'capture',
          captureId: captureResponse.data.capture.id,
          description: captureContent.substring(0, 100),
        };

        try {
          await resourcesAPI.create(selectedTopicId, resourceData);

          // Notify web app to refresh data immediately
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              if (tab.url && (tab.url.includes('localhost:5173') || tab.url.includes(WEB_APP_URL))) {
                chrome.tabs.sendMessage(tab.id, {
                  type: 'CONTEXT_HUB_REFRESH',
                  action: 'resource_created',
                  topicId: selectedTopicId
                }, () => {
                  // Ignore errors if web app isn't loaded
                  if (chrome.runtime.lastError) {
                    console.log('Web app not available for refresh notification');
                  }
                });
              }
            });
          });
        } catch (resourceError) {
          console.error('Failed to add to topic:', resourceError);
          // Don't fail the whole capture if adding to topic fails
        }
      }

      setCaptureSuccess(true);
      setCaptureTitle('');
      setCaptureContent('');
      setTodoItems([]);
      setNewTodoItem('');
      setSelectedTopicId('');

      // Reset success message after 2 seconds
      setTimeout(() => {
        setCaptureSuccess(false);
      }, 2000);
    } catch (err) {
      setCaptureError(err.message || 'Failed to save capture');
    }
  };

  const handleAddTodoItem = () => {
    if (!newTodoItem.trim()) return;
    setTodoItems([...todoItems, { text: newTodoItem.trim(), completed: false }]);
    setNewTodoItem('');
  };

  const handleRemoveTodoItem = (index) => {
    setTodoItems(todoItems.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="p-5 flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-lg ai-gradient-bg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L11.5 6.5L16 8L11.5 9.5L10 14L8.5 9.5L4 8L8.5 6.5L10 2Z"/>
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-5 min-w-[350px]">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl ai-gradient-bg flex items-center justify-center shadow-lg shadow-primary/20">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L11.5 6.5L16 8L11.5 9.5L10 14L8.5 9.5L4 8L8.5 6.5L10 2Z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">youtopical</h2>
            <p className="text-xs text-muted-foreground">your personal context hub</p>
          </div>
        </div>

        {loginError && (
          <div className="error-message">
            {loginError}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="btn w-full mb-3 bg-white hover:bg-gray-50 text-gray-900 border border-border flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full">
            Sign In with Email
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
          <a
            href="http://localhost:5173/register"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline text-center"
          >
            Create an account →
          </a>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
          >
            Open Web App
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 min-w-[350px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg ai-gradient-bg flex items-center justify-center shadow-lg shadow-primary/20">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L11.5 6.5L16 8L11.5 9.5L10 14L8.5 9.5L4 8L8.5 6.5L10 2Z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Quick Capture</h2>
            <p className="text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary text-xs px-3 py-1.5">
          Logout
        </button>
      </div>

      {captureSuccess && (
        <div className="success-message">
          Capture saved successfully!
        </div>
      )}

      {captureError && (
        <div className="error-message">
          {captureError}
        </div>
      )}

      <form onSubmit={handleCapture} className="space-y-3">
        <div>
          <label htmlFor="type" className="label">
            Type
          </label>
          <select
            id="type"
            className="input"
            value={captureType}
            onChange={(e) => {
              setCaptureType(e.target.value);
              setTodoItems([]);
              setNewTodoItem('');
            }}
          >
            <option value="note">Note</option>
            <option value="link">Link</option>
            <option value="todo">Todo List</option>
          </select>
        </div>

        <div>
          <label htmlFor="topic" className="label">
            Topic (optional)
          </label>
          <div className="flex gap-2">
            <select
              id="topic"
              className="input flex-1"
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
            >
              <option value="">No Topic</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCreateTopic(true)}
              className="btn btn-secondary px-3"
              title="Create new topic"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="label">
            Title (optional)
          </label>
          <input
            id="title"
            type="text"
            className="input"
            value={captureTitle}
            onChange={(e) => setCaptureTitle(e.target.value)}
            placeholder="Enter a title"
          />
        </div>

        {captureType === 'todo' ? (
          <div>
            <label className="label">
              Todo Items
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                className="input flex-1"
                value={newTodoItem}
                onChange={(e) => setNewTodoItem(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTodoItem();
                  }
                }}
                placeholder="Add a todo item"
              />
              <button
                type="button"
                onClick={handleAddTodoItem}
                className="btn btn-secondary px-3"
              >
                +
              </button>
            </div>
            {todoItems.length > 0 && (
              <div className="space-y-1.5 p-2 rounded border border-border bg-background/50 max-h-32 overflow-y-auto">
                {todoItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                    <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                    <span className="flex-1 text-xs text-foreground">{item.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTodoItem(index)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="content" className="label">
              Content
            </label>
            <textarea
              id="content"
              className="textarea"
              rows="4"
              value={captureContent}
              onChange={(e) => setCaptureContent(e.target.value)}
              placeholder={captureType === 'link' ? 'Add notes about this link (optional)' : 'Enter content to capture'}
            />
          </div>
        )}

        <button type="submit" className="btn btn-primary w-full">
          Save Capture
        </button>
      </form>

      <div className="mt-4 pt-3 border-t border-border">
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline block text-center"
        >
          Open Web App →
        </a>
      </div>

      {/* Create Topic Modal */}
      {showCreateTopic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass-card p-5 w-full max-w-md">
            <h3 className="text-base font-semibold text-foreground mb-4">Create New Topic</h3>
            <form onSubmit={handleCreateTopic} className="space-y-3">
              <div>
                <label htmlFor="newTopicTitle" className="label">
                  Title
                </label>
                <input
                  id="newTopicTitle"
                  type="text"
                  className="input"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  placeholder="e.g. AI Research"
                  required
                />
              </div>

              <div>
                <label htmlFor="newTopicDescription" className="label">
                  Description (optional)
                </label>
                <textarea
                  id="newTopicDescription"
                  className="textarea"
                  rows="2"
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                  placeholder="What will you store here?"
                />
              </div>

              <div>
                <label htmlFor="newTopicColor" className="label">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="newTopicColor"
                    type="color"
                    value={newTopic.color}
                    onChange={(e) => setNewTopic({ ...newTopic, color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer border border-border"
                  />
                  <span className="text-xs text-muted-foreground">{newTopic.color}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTopic(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Popup;
