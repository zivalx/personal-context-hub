# Quick Start Guide

Get your Personal Context Hub running in 5 minutes!

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 14+** - [Download here](https://www.postgresql.org/download/)

## Setup Steps

### 1. Install All Dependencies

From the root directory:

```bash
npm install
```

This installs dependencies for backend, web-app, and extension.

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Now edit `backend/.env` and update these values:

```env
# Change 'postgres' to your PostgreSQL username, and 'password' to your PostgreSQL password
DATABASE_URL="postgresql://postgres:password@localhost:5432/personal_context_hub?schema=public"

# Generate a random secret (or use any random string, at least 32 characters)
JWT_SECRET=abc123xyz789-this-is-my-secret-key-make-it-long-and-random

# Leave OpenAI empty for now - you'll add it later when you want AI features
OPENAI_API_KEY=
```

**About JWT_SECRET:**
- This is **NOT an API key** you get from a service
- It's a secret string **you create yourself** (like a password)
- It's used to sign authentication tokens securely
- Make it long and random (at least 32 characters)

To generate a secure random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Run Automated Setup

**Option A: Automatic Setup (Recommended)**

If you have `psql` installed:

```bash
cd backend
npm run setup
```

This will:
- Create the database automatically
- Run all migrations
- Generate Prisma client

**Option B: Manual Setup**

If automatic setup doesn't work:

```bash
# Create the database manually
psql -U postgres -c "CREATE DATABASE personal_context_hub;"

# Run migrations
cd backend
npm run prisma:migrate
```

### 4. Configure Web App

```bash
cd web-app
cp .env.example .env
```

The default configuration should work:
```env
VITE_API_BASE_URL=http://localhost:3001
```

### 5. Start Everything

From the **root directory**:

```bash
npm run dev
```

This starts:
- Backend API on `http://localhost:3001`
- Web App on `http://localhost:5173`

### 6. Create Your First User

1. Open `http://localhost:5173` in your browser
2. Click "create a new account"
3. Register with your email and password
4. You're in! Start creating topics and capturing content

## Optional: Chrome Extension

### Build the Extension

```bash
cd extension
npm run build
```

### Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/dist` folder
5. Done! Click the extension icon to capture content

## Common Issues

### "Cannot connect to database"

Make sure PostgreSQL is running:

```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it:
# Mac: brew services start postgresql
# Windows: Start from Services
# Linux: sudo systemctl start postgresql
```

### "Port 3001 already in use"

Another app is using that port. Either:
- Stop the other app, or
- Change `PORT=3001` to `PORT=3002` in `backend/.env`

### "Prisma migrations failed"

1. Make sure the database exists:
   ```bash
   psql -U postgres -l | grep personal_context_hub
   ```

2. If not, create it:
   ```bash
   psql -U postgres -c "CREATE DATABASE personal_context_hub;"
   ```

3. Run migrations again:
   ```bash
   cd backend
   npm run prisma:migrate
   ```

## What's Next?

Check out the full [README.md](README.md) for:
- Complete API documentation
- Database schema details
- Advanced features
- Deployment guide

## Environment Variables Explained

### Database URL Structure
```
postgresql://[username]:[password]@[host]:[port]/[database_name]
```

Example with default PostgreSQL:
```
postgresql://postgres:mypassword@localhost:5432/personal_context_hub
```

### JWT_SECRET
- **What it is:** A secret key for cryptographic signing of authentication tokens
- **Where to get it:** You generate it yourself (it's not from a service)
- **How to create:** Use any long random string, or generate with the command above
- **Example:** `my-super-secret-key-abc123xyz789-please-change-in-production`

### OPENAI_API_KEY (Optional)
- **What it is:** API key from OpenAI for AI features (summarization, embeddings)
- **Where to get it:** https://platform.openai.com/api-keys
- **When you need it:** Only when implementing AI features
- **For now:** Leave it empty - the app works fine without it!

## Need Help?

Open an issue on GitHub with:
- What you tried
- The error message
- Your operating system
