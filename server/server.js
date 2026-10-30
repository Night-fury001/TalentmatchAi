require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const { connectDatabase, disconnectDatabase } = require('./utils/prismaClient');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiters');
const ApiResponse = require('./utils/ApiResponse');

const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const recruiterRoutes = require('./routes/recruiter.routes');
const adminRoutes = require('./routes/admin.routes');
const taxonomyRoutes = require('./routes/taxonomy.routes');
const notificationRoutes = require('./routes/notification.routes');

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'COOKIE_SECRET',
];

function assertRequiredEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `\n[startup] Missing required environment variables: ${missing.join(', ')}\n` +
        'Copy .env.example to server/.env and fill in real values before starting the server.\n'
    );
    process.exit(1);
  }
}

assertRequiredEnv();

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

// ----------------------------------------------------------------------------
// Security & core middleware
// ----------------------------------------------------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(compression());
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Static file serving for uploaded resumes/avatars/logos.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// General API rate limiting (auth routes carry their own stricter limiter).
app.use('/api', apiLimiter);

// ----------------------------------------------------------------------------
// Health check
// ----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  return new ApiResponse(200, {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  }, 'Job Portal API is healthy.').send(res);
});

// ----------------------------------------------------------------------------
// Route mounting
// ----------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/taxonomy', taxonomyRoutes);
app.use('/api/notifications', notificationRoutes);

// ----------------------------------------------------------------------------
// Production static hosting (single-service deployment)
// Optional: if client/dist exists (i.e. `npm run build` was run in /client),
// serve the built React app from this same Node process and fall back to
// index.html for any non-API route so client-side routing works on refresh.
// If you deploy the frontend separately (Vercel/Netlify/a CDN), this block
// simply never finds the directory and is a no-op.
// ----------------------------------------------------------------------------
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const clientDistExists = fs.existsSync(path.join(clientDistPath, 'index.html'));

if (isProduction && clientDistExists) {
  app.use(express.static(clientDistPath, { maxAge: '1y', index: false }));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  });

  // eslint-disable-next-line no-console
  console.log('[startup] Serving built frontend from client/dist alongside the API.');
}

// ----------------------------------------------------------------------------
// 404 + centralized error handling (must be registered last)
// ----------------------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

// ----------------------------------------------------------------------------
// Server bootstrap
// ----------------------------------------------------------------------------
let server;

async function startServer() {
  try {
    await connectDatabase();
    // eslint-disable-next-line no-console
    console.log('[startup] Database connection established.');

    server = app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`[startup] Job Portal API listening on http://localhost:${PORT}`);
      // eslint-disable-next-line no-console
      console.log(`[startup] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[startup] Failed to start server:', err);
    process.exit(1);
  }
}

async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n[shutdown] Received ${signal}. Closing server gracefully...`);
  if (server) {
    server.close(async () => {
      await disconnectDatabase();
      // eslint-disable-next-line no-console
      console.log('[shutdown] Server closed. Database disconnected.');
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    process.exit(0);
  }

  // Force-exit if shutdown hangs for more than 10 seconds.
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[fatal] Unhandled promise rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('[fatal] Uncaught exception:', err);
  process.exit(1);
});

startServer();

module.exports = app;
