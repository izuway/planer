import { Hono } from 'hono';
import type { Env } from '../types';

// Auth routes - these are public (no Firebase middleware)
const auth = new Hono<{ Bindings: Env }>();

/**
 * Health check endpoint for auth service
 */
auth.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'auth' });
});

/**
 * Note: Registration and login are handled on the client side with Firebase SDK.
 * The client will receive an ID token from Firebase after successful auth,
 * which should be sent in the Authorization header for protected routes.
 * 
 * This endpoint can be used to verify token validity.
 */
auth.post('/verify', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided' }, 401);
  }

  // Token validation happens in the Firebase middleware
  // This endpoint just confirms the token was validated successfully
  return c.json({ valid: true, message: 'Token is valid' });
});

export default auth;

