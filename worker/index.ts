import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { verifyFirebaseAuth } from '@hono/firebase-auth';
import type { VerifyFirebaseAuthConfig, VerifyFirebaseAuthEnv } from '@hono/firebase-auth';
import type { Env, FirebaseUser } from './types';
import versions from './routes/versions';
import auth from './routes/auth';
import { logger, requestId, requireAuth } from './middleware';

// Create Hono app with typed environment
type AppEnv = {
  Bindings: Env & VerifyFirebaseAuthEnv;
  Variables: {
    user?: FirebaseUser;
    requestId?: string;
  };
};

const app = new Hono<AppEnv>();

// Global middleware
app.use('/*', logger);
app.use('/*', requestId);

// CORS middleware
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Firebase Auth middleware for all routes
app.use('/*', async (c, next) => {
  // Skip auth for health check and public routes
  const path = c.req.path;
  if (path === '/' || path === '/health') {
    return next();
  }
  
  const config: VerifyFirebaseAuthConfig = {
    projectId: c.env.FIREBASE_PROJECT_ID || 'planer-97a3b',
    authorizationHeaderKey: 'Authorization',
    disableErrorLog: false,
  };
  
  return verifyFirebaseAuth(config)(c, next);
});

// Global error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message || 'Unknown error',
  }, 500);
});

// API Routes
const api = new Hono<AppEnv>();

// Auth routes (public)
api.route('/auth', auth);

// Protected routes - require email verification
api.use('/versions/*', requireAuth);
api.route('/versions', versions);

/**
 * Health check endpoint
 */
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Protected test endpoint
 */
api.get('/test', requireAuth, async (c) => {
  const user = c.get('user');
  return c.json({
    message: 'This is a protected endpoint',
    user: user,
    name: c.env.My_NAME,
  });
});

// Mount API routes
app.route('/api', api);

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
  }, 404);
});

export default app;
