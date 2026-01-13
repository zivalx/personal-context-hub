import { useState, useEffect } from 'react';
import { authAPI, capturesAPI } from '../api/client';

const API_BASE_URL = 'http://localhost:3001';

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
  const [captureType, setCaptureType] = useState('text');
  const [captureTitle, setCaptureTitle] = useState('');
  const [captureContent, setCaptureContent] = useState('');
  const [captureUrl, setCaptureUrl] = useState('');
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const [captureError, setCaptureError] = useState('');

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
    getCurrentPageInfo();
  }, []);

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
          setCaptureType('link');
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

      // Create capture
      const captureResponse = await capturesAPI.create({
        type: captureType,
        title: captureTitle,
        content: captureContent,
        source: currentTab?.url || '',
        tags: [],
      });

      // If topic is selected, create a resource linked to this capture
      if (selectedTopicId && captureResponse.data?.capture) {
        const token = await new Promise((resolve) => {
          chrome.storage.local.get(['token'], (result) => {
            resolve(result.token);
          });
        });
        await fetch(`${API_BASE_URL}/api/topics/${selectedTopicId}/resources`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: captureTitle || 'Untitled Capture',
            description: captureContent.substring(0, 100),
            type: 'capture',
            captureId: captureResponse.data.capture.id,
          }),
        });
      }

      setCaptureSuccess(true);
      setCaptureTitle('');
      setCaptureContent('');
      setSelectedTopicId('');

      // Reset success message after 2 seconds
      setTimeout(() => {
        setCaptureSuccess(false);
      }, 2000);
    } catch (err) {
      setCaptureError(err.message || 'Failed to save capture');
    }
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
            <h2 className="text-base font-semibold text-foreground">Context Hub</h2>
            <p className="text-xs text-muted-foreground">Sign in to continue</p>
          </div>
        </div>

        {loginError && (
          <div className="error-message">
            {loginError}
          </div>
        )}

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
            Sign In
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
            onChange={(e) => setCaptureType(e.target.value)}
          >
            <option value="text">Text</option>
            <option value="link">Link</option>
            <option value="note">Note</option>
            <option value="quote">Quote</option>
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

        <div>
          <label htmlFor="content" className="label">
            Content
          </label>
          <textarea
            id="content"
            className="textarea"
            rows="4"
            required
            value={captureContent}
            onChange={(e) => setCaptureContent(e.target.value)}
            placeholder="Enter content to capture"
          />
        </div>

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
