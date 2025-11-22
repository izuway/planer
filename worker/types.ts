// D1 Database types - using official types from @cloudflare/workers-types
import type { D1Database } from '@cloudflare/workers-types';

// App version interface
export interface AppVersion {
  id: number;
  version: string;
  description: string | null;
  released_at: string;
  created_at: string;
  updated_at: string;
}

// Environment bindings
export interface Env {
  DB: D1Database;
  My_NAME: string;
  PUBLIC_JWK_CACHE_KEY: string;
  PUBLIC_JWK_CACHE_KV: KVNamespace;
}

// Firebase user token interface (from JWT claims)
// This matches the structure returned by getFirebaseToken()
export interface FirebaseUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  auth_time?: number;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

// Hono context variables
export interface Variables {
  user?: FirebaseUser;
  requestId?: string;
}

