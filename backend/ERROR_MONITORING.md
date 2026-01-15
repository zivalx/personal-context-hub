# 🔍 Error Monitoring Setup Guide

This guide covers setting up error monitoring and tracking for production deployment.

---

## Option 1: Sentry (Recommended)

Sentry is a powerful error tracking and performance monitoring platform with a generous free tier.

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io/)
2. Sign up for free account
3. Create a new project
4. Select "Node.js" as platform

### 2. Install Sentry SDK

```bash
cd backend
npm install @sentry/node @sentry/profiling-node
```

### 3. Configure Sentry

Create `backend/src/utils/sentry.js`:

```javascript
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export const initSentry = (app) => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 1.0, // Adjust in production (0.1 = 10%)
      profilesSampleRate: 1.0, // Adjust in production
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        new ProfilingIntegration(),
      ],
    });
  }
};

export default Sentry;
```

### 4. Update server.js

Add to `backend/src/server.js`:

```javascript
import Sentry from './utils/sentry.js';
import { initSentry } from './utils/sentry.js';

const app = express();

// Initialize Sentry FIRST (before any other middleware)
initSentry(app);

// Sentry request handler (must be first middleware)
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... your other middleware ...

// Sentry error handler (must be before other error handlers)
app.use(Sentry.Handlers.errorHandler());

// Your error handlers
app.use(errorLogger);
app.use(errorHandler);
```

### 5. Add Environment Variable

Add to your `.env` and hosting provider:

```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
```

### 6. Test Sentry

Add a test endpoint (remove after testing):

```javascript
app.get('/debug-sentry', (req, res) => {
  throw new Error('Test Sentry error!');
});
```

Visit the endpoint and check your Sentry dashboard for the error.

---

## Option 2: LogRocket

LogRocket provides session replay along with error tracking.

### Install LogRocket

```bash
cd backend
npm install logrocket
```

### Configure LogRocket

```javascript
import LogRocket from 'logrocket';

if (process.env.LOGROCKET_APP_ID) {
  LogRocket.init(process.env.LOGROCKET_APP_ID);
}

// In your error handler
LogRocket.captureException(error);
```

---

## Option 3: Custom Error Tracking

If you prefer not to use third-party services, you can log errors to a database.

### Create Error Log Model

Add to `backend/prisma/schema.prisma`:

```prisma
model ErrorLog {
  id          String   @id @default(uuid())
  message     String
  stack       String?  @db.Text
  context     Json?
  requestId   String?
  userId      String?
  url         String?
  method      String?
  statusCode  Int?
  userAgent   String?
  ip          String?
  createdAt   DateTime @default(now())

  @@map("error_logs")
  @@index([createdAt])
  @@index([requestId])
}
```

### Create Error Logger Function

```javascript
import { prisma } from './prisma.js';

export const logErrorToDatabase = async (error, req) => {
  try {
    await prisma.errorLog.create({
      data: {
        message: error.message,
        stack: error.stack,
        requestId: req.requestId,
        userId: req.user?.id,
        url: req.originalUrl,
        method: req.method,
        statusCode: error.statusCode || 500,
        userAgent: req.get('user-agent'),
        ip: req.ip,
        context: {
          body: req.body,
          query: req.query,
          params: req.params,
        },
      },
    });
  } catch (logError) {
    logger.error('Failed to log error to database:', logError);
  }
};
```

---

## Error Alerting

### Email Alerts (Simple)

Add to your error handler:

```javascript
import { sendEmail } from '../utils/emailService.js';

// In error handler
if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `Server Error: ${error.message}`,
    text: `Error: ${error.message}\n\nStack: ${error.stack}\n\nRequest: ${req.method} ${req.originalUrl}`,
  });
}
```

### Slack Alerts

```bash
npm install @slack/webhook
```

```javascript
import { IncomingWebhook } from '@slack/webhook';

const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);

// In error handler
if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
  await webhook.send({
    text: `🚨 Server Error: ${error.message}`,
    attachments: [{
      color: 'danger',
      fields: [
        { title: 'Error', value: error.message, short: false },
        { title: 'URL', value: `${req.method} ${req.originalUrl}`, short: true },
        { title: 'Status', value: statusCode.toString(), short: true },
      ],
    }],
  });
}
```

---

## Performance Monitoring

### Application Performance Monitoring (APM)

1. **Sentry Performance**: Already included with Sentry setup above
2. **New Relic**: Comprehensive APM with free tier
3. **DataDog**: Enterprise-grade monitoring

### Basic Performance Tracking

Already implemented in `requestLogger.js`:
- Request/response times
- Status codes
- Request IDs for tracing

### Database Query Monitoring

Add Prisma query logging:

```javascript
// backend/src/utils/prisma.js
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// Log slow queries
prisma.$on('query', (e) => {
  if (e.duration > 1000) { // Queries taking > 1 second
    logger.warn(`Slow query detected: ${e.duration}ms - ${e.query}`);
  }
});
```

---

## Monitoring Best Practices

### 1. Set Up Alerts

Configure alerts for:
- Error rate spikes (>10 errors/minute)
- Server response time (>2 seconds)
- High memory usage (>80%)
- Database connection failures
- Rate limit violations

### 2. Error Grouping

Group similar errors to avoid alert fatigue:
- By error message
- By stack trace
- By endpoint

### 3. Context Enrichment

Always include:
- Request ID for tracing
- User ID (if authenticated)
- Request details (URL, method, body)
- Environment information

### 4. Privacy Considerations

Never log:
- Passwords or tokens
- Credit card numbers
- Personal identification numbers
- API keys

Already handled in `requestLogger.js` - sensitive fields are filtered.

### 5. Regular Review

- Review error logs weekly
- Track error trends over time
- Fix recurring issues
- Update error handling as needed

---

## Testing Error Monitoring

### Test Error Scenarios

```bash
# Test 500 errors
curl https://your-api.com/api/test-error

# Test validation errors
curl -X POST https://your-api.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid"}'

# Test rate limiting
for i in {1..10}; do
  curl https://your-api.com/api/auth/login
done
```

### Verify Monitoring

1. Check Sentry dashboard for captured errors
2. Check log files: `backend/logs/error.log`
3. Verify request IDs are present in logs
4. Test email/Slack alerts if configured

---

## Environment Variables Summary

Add to `.env` and hosting provider:

```env
# Sentry (Option 1)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# LogRocket (Option 2)
LOGROCKET_APP_ID=your-app-id

# Email alerts
ADMIN_EMAIL=admin@yourapp.com

# Slack alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## Cost Estimates

### Free Tiers:

- **Sentry**: 5,000 errors/month, 10,000 performance units
- **LogRocket**: 1,000 sessions/month
- **New Relic**: 100GB data/month

### Recommendations:

- **Startup/Side Project**: Sentry free tier + built-in logging
- **Small Business**: Sentry Pro ($26/month) or LogRocket ($99/month)
- **Enterprise**: DataDog or New Relic (custom pricing)

---

**Last Updated:** 2026-01-13
