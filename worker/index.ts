import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import versions from './routes/versions';
import auth from './routes/auth';
import { logger, requestId, verifyFirebaseAuth, type VerifyFirebaseAuthConfig } from './middleware';

// Create Hono app with typed environment
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('/*', logger);
app.use('/*', requestId);

// CORS middleware
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Global error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message || 'Unknown error',
  }, 500);
});

// Firebase Auth configuration
const firebaseConfig: VerifyFirebaseAuthConfig = {
  projectId: 'planer-246d3',
  disableErrorLog: false,
};

// Public routes (no auth required)
const publicApi = new Hono<{ Bindings: Env }>();
publicApi.route('/auth', auth);

// Protected API Routes (require Firebase auth)
const api = new Hono<{ Bindings: Env }>();

// Apply Firebase Auth middleware to all protected routes
api.use('*', verifyFirebaseAuth(firebaseConfig));

// Mount version routes
api.route('/versions', versions);

/**
 * Legacy test endpoint
 */
api.get('/*', async (c) => {
  return c.json({
    name: c.env.My_NAME,
  });
});

// Mount API routes
app.route('/api/public', publicApi);
app.route('/api', api);

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
  }, 404);
});

export default app;
