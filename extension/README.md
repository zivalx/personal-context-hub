# Personal Context Hub - Chrome Extension

Chrome extension for capturing content and syncing with your Personal Context Hub.

## Development

```bash
# Install dependencies (from root)
npm install

# Build for development
npm run dev:extension

# Load in Chrome
1. Go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/dist` folder
```

## Production Build

```bash
# Build for production (uses production API URLs)
npm run build:extension

# The extension will automatically use:
# - API: https://api.youtipical.com
# - Web App: https://youtipical.com
```

## Publishing to Chrome Web Store

1. Build for production
2. Zip the `extension/dist` folder
3. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Upload the zip file
5. Fill in store listing details
6. Submit for review

## Configuration

The extension automatically detects the environment:
- **Development**: Uses `localhost:3001` and `localhost:5173`
- **Production**: Uses `api.youtipical.com` and `youtipical.com`

Configuration is managed in `extension/src/config.js`.
