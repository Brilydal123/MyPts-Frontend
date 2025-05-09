import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie'; // Utility to parse cookies

/**
 * Next.js API route to proxy token refresh requests.
 * This route can access HttpOnly cookies (like refreshToken) and forward them to the backend.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    // 1. Extract refreshToken from various sources
    // Try cookies first (both camelCase and lowercase variants)
    const cookies = cookie.parse(req.headers.cookie || '');
    const refreshTokenFromCookie = cookies.refreshtoken || cookies.refreshToken;

    // Try body next (from client-side localStorage)
    const refreshTokenFromBody = req.body?.refreshToken;

    // Use the first available token
    const clientRefreshToken = refreshTokenFromCookie || refreshTokenFromBody;

    console.log('[Frontend Refresh API] Token sources:', {
      hasCookieToken: !!refreshTokenFromCookie,
      hasBodyToken: !!refreshTokenFromBody,
      finalToken: !!clientRefreshToken
    });

    if (!clientRefreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found in cookies or request body.'
      });
    }

    // 2. Forward the refresh token to your actual backend API
    const backendApiUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'; // Ensure this is your backend URL
    const backendRefreshUrl: string = `${backendApiUrl.replace(/\/$/, '')}/auth/refresh-token`;

    // console.log(`[Frontend Refresh API] Forwarding refresh request to: ${backendRefreshUrl}`);

    const backendResponse = await fetch(backendRefreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward any other necessary headers from the original client request if needed
      },
      body: JSON.stringify({ refreshToken: clientRefreshToken }),
      credentials: 'omit',
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok || !data.success) {
      console.error('[Frontend Refresh API] Backend refresh failed:', data);
      // Important: Do not send HttpOnly cookies back from here that were set by the backend.
      // Let the backend handle its own cookie setting if it does so on the /auth/refresh-token endpoint.
      return res.status(backendResponse.status).json(data);
    }

    // 3. If backend responds with new tokens and potentially sets new HttpOnly cookies,
    //    Next.js will automatically proxy those 'Set-Cookie' headers back to the client's browser
    //    if the backend sets them. We just need to return the JSON data.

    // Example: If your backend sets new HttpOnly cookies for tokens:
    // Copy Set-Cookie headers from the backend response to the frontend response
    const backendSetCookieHeader = backendResponse.headers.get('set-cookie');
    if (backendSetCookieHeader) {
      // If there are multiple Set-Cookie headers, they might be an array or comma-separated string
      // Ensure compatibility with how NextApiResponse handles setHeader for multiple cookies.
      // Typically, an array of strings is preferred.
      const cookiesToSet = Array.isArray(backendSetCookieHeader) ? backendSetCookieHeader : [backendSetCookieHeader];
      res.setHeader('Set-Cookie', cookiesToSet);
      console.log('[Frontend Refresh API] Proxied Set-Cookie headers from backend.');
    }

    console.log('[Frontend Refresh API] Backend refresh successful, returning tokens.');
    return res.status(200).json(data); // This should contain { success: true, tokens: { accessToken, refreshToken? } }

  } catch (error: any) {
    console.error('[Frontend Refresh API] Error during token refresh proxy:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error refreshing token.' });
  }
}
