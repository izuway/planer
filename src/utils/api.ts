import { getCurrentUserToken } from '../firebase';

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://planer.m-k-mendykhan.workers.dev/api'
  : '/api';

/**
 * Make authenticated API request
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getCurrentUserToken();
  
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  headers.set('Content-Type', 'application/json');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  return response;
};

/**
 * GET request
 */
export const get = async (endpoint: string): Promise<any> => {
  const response = await apiRequest(endpoint, {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * POST request
 */
export const post = async (endpoint: string, data?: any): Promise<any> => {
  const response = await apiRequest(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * PUT request
 */
export const put = async (endpoint: string, data?: any): Promise<any> => {
  const response = await apiRequest(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * DELETE request
 */
export const del = async (endpoint: string): Promise<any> => {
  const response = await apiRequest(endpoint, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

