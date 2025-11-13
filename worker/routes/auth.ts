import { Hono } from 'hono';
import { getFirebaseToken } from '@hono/firebase-auth';
import type { Env, FirebaseUser } from '../types';

const auth = new Hono<{ Bindings: Env }>();

/**
 * Verify token endpoint
 * Checks if the provided token is valid and returns user info
 */
auth.post('/verify', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    
    if (!idToken) {
      return c.json({ 
        error: 'Invalid token',
        message: 'No valid token found'
      }, 401);
    }

    const user: FirebaseUser = {
      uid: idToken.uid,
      email: idToken.email || null,
      email_verified: idToken.email_verified,
      name: idToken.name,
      picture: idToken.picture,
    };

    return c.json({ 
      success: true,
      user,
      emailVerified: idToken.email_verified
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return c.json({ 
      error: 'Verification failed',
      message: 'Failed to verify token'
    }, 401);
  }
});

/**
 * Get current user endpoint
 * Returns the current authenticated user's information
 */
auth.get('/me', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    
    if (!idToken) {
      return c.json({ 
        error: 'Not authenticated',
        message: 'User not authenticated'
      }, 401);
    }

    if (!idToken.email_verified) {
      return c.json({ 
        error: 'Email not verified',
        message: 'Please verify your email',
        user: {
          uid: idToken.uid,
          email: idToken.email || null,
          email_verified: false,
        }
      }, 403);
    }

    const user: FirebaseUser = {
      uid: idToken.uid,
      email: idToken.email || null,
      email_verified: idToken.email_verified,
      name: idToken.name,
      picture: idToken.picture,
    };

    return c.json({ 
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ 
      error: 'Failed to get user',
      message: 'Failed to retrieve user information'
    }, 500);
  }
});

/**
 * Check email verification status
 */
auth.get('/email-status', async (c) => {
  try {
    const idToken = getFirebaseToken(c);
    
    if (!idToken) {
      return c.json({ 
        error: 'Not authenticated'
      }, 401);
    }

    return c.json({ 
      success: true,
      emailVerified: idToken.email_verified,
      email: idToken.email
    });
  } catch (error) {
    return c.json({ 
      error: 'Failed to check email status'
    }, 500);
  }
});

export default auth;

