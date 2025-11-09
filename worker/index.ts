import type { Env, AppVersion } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API Routes
      if (url.pathname === '/api/versions' && request.method === 'GET') {
        return await getAllVersions(env, corsHeaders);
      }

      if (url.pathname === '/api/versions/latest' && request.method === 'GET') {
        return await getLatestVersion(env, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/versions\/[^/]+$/) && request.method === 'GET') {
        const version = url.pathname.split('/').pop();
        return await getVersionByName(env, version!, corsHeaders);
      }

      // Legacy test endpoint
      if (url.pathname.startsWith('/api/')) {
        return Response.json(
          { name: env.My_NAME },
          { headers: corsHeaders }
        );
      }

      // Not found
      return new Response(
        JSON.stringify({ error: 'Not Found' }),
        { status: 404, headers: corsHeaders }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  },
} satisfies ExportedHandler<Env>;

/**
 * Get all app versions
 */
async function getAllVersions(env: Env, headers: Record<string, string>): Promise<Response> {
  const result = await env.DB.prepare(
    'SELECT * FROM app_versions ORDER BY released_at DESC'
  ).all<AppVersion>();

  if (!result.success) {
    return new Response(
      JSON.stringify({ error: 'Database query failed', details: result.error }),
      { status: 500, headers }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: result.results || [],
      count: result.results?.length || 0,
      meta: result.meta,
    }),
    { status: 200, headers }
  );
}

/**
 * Get latest app version
 */
async function getLatestVersion(env: Env, headers: Record<string, string>): Promise<Response> {
  const result = await env.DB.prepare(
    'SELECT * FROM app_versions ORDER BY released_at DESC LIMIT 1'
  ).first<AppVersion>();

  if (!result) {
    return new Response(
      JSON.stringify({ error: 'No versions found' }),
      { status: 404, headers }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: result,
    }),
    { status: 200, headers }
  );
}

/**
 * Get specific version by version string
 */
async function getVersionByName(
  env: Env,
  version: string,
  headers: Record<string, string>
): Promise<Response> {
  const result = await env.DB.prepare(
    'SELECT * FROM app_versions WHERE version = ?'
  )
    .bind(version)
    .first<AppVersion>();

  if (!result) {
    return new Response(
      JSON.stringify({ error: 'Version not found', version }),
      { status: 404, headers }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: result,
    }),
    { status: 200, headers }
  );
}
