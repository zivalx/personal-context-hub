# Personal Context Hub

A dual-component system for capturing and organizing information with a Chrome Extension and Web App, powered by AI features for summarization and smart categorization.

## Project Structure

```
personal-context-hub/
├── backend/           # Node.js + Express API
├── web-app/          # React web application
├── extension/        # Chrome Extension
└── package.json      # Root monorepo configuration
```

## Tech Stack

### Backend
- Node.js with Express
- PostgreSQL database
- Prisma ORM
- JWT authentication
- OpenAI API integration

### Web App
- React 18 with Vite
- Tailwind CSS
- TanStack Query (React Query)
- React Router
- Tiptap (rich text editor - ready for integration)

### Chrome Extension
- React with Vite
- Chrome Extension Manifest V3
- Chrome Storage API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- OpenAI API key (for AI features)

### 1. Install Dependencies

From the root directory:

```bash
npm install
```

### 2. Set Up Backend

#### Create PostgreSQL Database

```sql
CREATE DATABASE personal_context_hub;
```

#### Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/personal_context_hub?schema=public"
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=your-openai-api-key
ALLOWED_ORIGINS=http://localhost:5173,chrome-extension://*
```

#### Run Database Migrations

```bash
cd backend
npm run prisma:migrate
```

This will create all necessary tables (users, topics, captures, resources).

#### Start Backend Server

```bash
# From root directory
npm run dev:backend

# Or from backend directory
cd backend
npm run dev
```

The API will be available at `http://localhost:3001`

### 3. Set Up Web App

#### Configure Environment Variables

```bash
cd web-app
cp .env.example .env
```

Edit `web-app/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001
```

#### Start Web App

```bash
# From root directory
npm run dev:web

# Or from web-app directory
cd web-app
npm run dev
```

The web app will be available at `http://localhost:5173`

### 4. Set Up Chrome Extension

#### Build Extension

```bash
cd extension
npm run build
```

#### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/dist` folder
5. The extension should now be loaded

#### Development Mode

For development with hot reload:

```bash
cd extension
npm run dev
```

Then reload the extension in Chrome after changes.

## Project Features

### Backend API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

#### Topics
- `GET /api/topics` - Get all topics
- `GET /api/topics/:id` - Get topic by ID
- `POST /api/topics` - Create new topic
- `PUT /api/topics/:id` - Update topic
- `DELETE /api/topics/:id` - Delete topic

#### Captures
- `GET /api/captures` - Get all captures (with filters)
- `GET /api/captures/:id` - Get capture by ID
- `POST /api/captures` - Create new capture
- `PUT /api/captures/:id` - Update capture
- `DELETE /api/captures/:id` - Delete capture

#### Resources
- `GET /api/topics/:topicId/resources` - Get resources for a topic
- `POST /api/topics/:topicId/resources` - Create resource in topic
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource
- `PUT /api/topics/:topicId/resources/reorder` - Reorder resources

### Web App Features

- User registration and login
- Topic management (create, edit, delete)
- Resource organization within topics
- Capture viewing and management
- Responsive design with Tailwind CSS

### Chrome Extension Features

- Quick capture popup
- Context menu integration (right-click selected text)
- Keyboard shortcut: `Ctrl/Cmd + Shift + C` to capture selected text
- Automatic page title and URL capture
- Synced authentication with web app

## Database Schema

### User
- id, email, password, name, timestamps

### Topic
- id, title, description, color, icon, userId, timestamps
- One-to-many relationship with Resources

### Capture
- id, type, title, content, source, summary, tags, metadata, embedding, userId, timestamps
- Types: text, link, note, quote
- One-to-many relationship with Resources

### Resource
- id, title, description, type, order, content, url, captureId, topicId, userId, timestamps
- Types: capture, note, external_link
- Belongs to Topic, optionally links to Capture

## Development Scripts

From root directory:

```bash
# Run backend and web app concurrently
npm run dev

# Run individual components
npm run dev:backend
npm run dev:web
npm run dev:extension

# Build all components
npm run build

# Prisma commands
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
```

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files. Always use `.env.example` templates.

2. **JWT Secret**: Use a strong, random secret in production:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Password Hashing**: Passwords are hashed using bcrypt with salt rounds of 10.

4. **CORS**: Configure `ALLOWED_ORIGINS` to restrict API access in production.

5. **Database**: Use connection pooling and SSL in production PostgreSQL.

## Future Enhancements

- [ ] AI summarization endpoint implementation
- [ ] Semantic search with vector embeddings
- [ ] Real-time sync with WebSockets
- [ ] Export/import functionality
- [ ] Rich text editing with Tiptap integration
- [ ] Mobile app (React Native)
- [ ] Collaborative topics/sharing

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env`
- Run migrations: `npm run prisma:migrate`

### Web app can't connect to API
- Verify backend is running on port 3001
- Check VITE_API_BASE_URL in `web-app/.env`
- Check CORS settings in backend

### Extension not working
- Rebuild extension: `cd extension && npm run build`
- Reload extension in Chrome
- Check console for errors in extension popup
- Verify backend API is accessible

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.
