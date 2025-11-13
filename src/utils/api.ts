/**
 * API utility functions with Firebase Auth integration
 */

/**
 * Get the Firebase auth token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('firebaseToken');
};

/**
 * Make an authenticated API request
 * @param endpoint - API endpoint (e.g., '/api/profile')
 * @param options - Fetch options
 */
export const authenticatedFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('No authentication token found');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // If unauthorized, token might be expired
  if (response.status === 401) {
    localStorage.removeItem('firebaseToken');
    throw new Error('Authentication expired. Please sign in again.');
  }

  return response;
};

/**
 * Make a public API request (no auth required)
 * @param endpoint - API endpoint
 * @param options - Fetch options
 */
export const publicFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(endpoint, {
    ...options,
    headers,
  });
};

/**
 * Example: Get user profile (protected endpoint)
 */
export const getUserProfile = async () => {
  const response = await authenticatedFetch('/api/profile');
  
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  
  return response.json();
};

/**
 * Example: Get app versions (public endpoint)
 */
export const getAppVersions = async () => {
  const response = await publicFetch('/api/versions');
  
  if (!response.ok) {
    throw new Error('Failed to fetch app versions');
  }
  
  return response.json();
};

