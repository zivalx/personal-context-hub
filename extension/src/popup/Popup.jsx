import { useState, useEffect } from 'react';
import { authAPI, capturesAPI } from '../api/client';

const Popup = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Capture form
  const [captureType, setCaptureType] = useState('text');
  const [captureTitle, setCaptureTitle] = useState('');
  const [captureContent, setCaptureContent] = useState('');
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
    } catch (err) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPageInfo = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const tab = tabs[0];
        setCaptureTitle(tab.title || '');
        if (tab.url) {
          setCaptureContent(tab.url);
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

  const handleCapture = async (e) => {
    e.preventDefault();
    setCaptureError('');
    setCaptureSuccess(false);

    try {
      // Get current tab info
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      await capturesAPI.create({
        type: captureType,
        title: captureTitle,
        content: captureContent,
        source: currentTab?.url || '',
        tags: [],
      });

      setCaptureSuccess(true);
      setCaptureTitle('');
      setCaptureContent('');

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
      <div className="p-4 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Sign in to Personal Context Hub</h2>

        {loginError && (
          <div className="bg-red-50 text-red-800 text-xs p-2 rounded mb-3">
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
              placeholder="your@email.com"
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

        <p className="text-xs text-gray-600 text-center mt-4">
          Don't have an account? Visit the web app to register.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">Quick Capture</h2>
          <p className="text-xs text-gray-600">
            Signed in as {user?.email}
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary text-xs">
          Logout
        </button>
      </div>

      {captureSuccess && (
        <div className="bg-green-50 text-green-800 text-xs p-2 rounded mb-3">
          Capture saved successfully!
        </div>
      )}

      {captureError && (
        <div className="bg-red-50 text-red-800 text-xs p-2 rounded mb-3">
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

      <div className="mt-4 pt-3 border-t border-gray-200">
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          Open Web App →
        </a>
      </div>
    </div>
  );
};

export default Popup;
