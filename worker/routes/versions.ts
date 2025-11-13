import { Hono } from 'hono';
import { getFirebaseToken } from '@hono/firebase-auth';
import type { Env, AppVersion } from '../types';

// Create versions route
// Note: These routes are protected by Firebase Auth middleware (configured in main index.ts)
const versions = new Hono<{ Bindings: Env }>();

/**
 * Get all app versions
 * Requires authentication - token is validated by Firebase middleware
 */
versions.get('/', async (c) => {
  // Get authenticated user info from Firebase token
  const token = getFirebaseToken(c);
  if (token) {
    console.log('Authenticated user:', token.uid, token.email);
  }
  
  const result = await c.env.DB.prepare(
    'SELECT * FROM app_versions ORDER BY released_at DESC'
  ).all<AppVersion>();

  if (!result.success) {
    return c.json({
      error: 'Database query failed',
      details: result.error,
    }, 500);
  }

  return c.json({
    success: true,
    data: result.results || [],
    count: result.results?.length || 0,
    meta: result.meta,
  });
});

/**
 * Get latest app version
 */
versions.get('/latest', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT * FROM app_versions ORDER BY released_at DESC LIMIT 1'
  ).first<AppVersion>();

  if (!result) {
    return c.json({
      error: 'No versions found',
    }, 404);
  }

  return c.json({
    success: true,
    data: result,
  });
});

/**
 * Get specific version by version string
 */
versions.get('/:version', async (c) => {
  const version = c.req.param('version');
  
  const result = await c.env.DB.prepare(
    'SELECT * FROM app_versions WHERE version = ?'
  )
    .bind(version)
    .first<AppVersion>();

  if (!result) {
    return c.json({
      error: 'Version not found',
      version,
    }, 404);
  }

  return c.json({
    success: true,
    data: result,
  });
});

export default versions;



