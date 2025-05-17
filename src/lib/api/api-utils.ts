import { getAuthToken } from './auth-helper';

/**
 * Fetch with authentication
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise with fetch response
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Get authentication token
    const token = await getAuthToken();
    
    // Create headers with authentication
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      // Add header to indicate token is verified by client
      headers.set('x-token-verified', 'true');
    }
    
    // Add profile token if available
    if (typeof window !== 'undefined') {
      const profileToken = localStorage.getItem('selectedProfileToken');
      if (profileToken) {
        headers.set('X-Profile-Token', profileToken);
      }
    }
    
    // Create fetch options with authentication
    const fetchOptions: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Include cookies for authentication
    };
    
    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout
    
    fetchOptions.signal = controller.signal;
    
    // Perform fetch
    const response = await fetch(url, fetchOptions);
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    return response;
  } catch (error) {
    console.error('Error in fetchWithAuth:', error);
    
    // Check if it's an abort error (timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    
    throw error;
  }
}

/**
 * Fetch with authentication (POST method)
 * @param url - The URL to fetch
 * @param data - The data to send
 * @param options - Additional fetch options
 * @returns Promise with fetch response
 */
export async function postWithAuth(
  url: string,
  data: any,
  options: RequestInit = {}
): Promise<Response> {
  return fetchWithAuth(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Fetch with authentication (PUT method)
 * @param url - The URL to fetch
 * @param data - The data to send
 * @param options - Additional fetch options
 * @returns Promise with fetch response
 */
export async function putWithAuth(
  url: string,
  data: any,
  options: RequestInit = {}
): Promise<Response> {
  return fetchWithAuth(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Fetch with authentication (DELETE method)
 * @param url - The URL to fetch
 * @param options - Additional fetch options
 * @returns Promise with fetch response
 */
export async function deleteWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetchWithAuth(url, {
    ...options,
    method: 'DELETE',
  });
}
