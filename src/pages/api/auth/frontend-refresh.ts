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
    // 1. Extract refreshToken from various sources with detailed logging
    // Try cookies first (both camelCase and lowercase variants)
    const cookies = cookie.parse(req.headers.cookie || '');
    const refreshTokenFromCookie = cookies.refreshtoken || cookies.refreshToken;

    // Try body next (from client-side localStorage)
    const refreshTokenFromBody = req.body?.refreshToken;

    // Try NextAuth cookies
    const nextAuthToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];

    // Use the first available token
    const clientRefreshToken = refreshTokenFromCookie || refreshTokenFromBody;

    console.log('[Frontend Refresh API] Token sources:', {
      hasCookieToken: !!refreshTokenFromCookie,
      hasBodyToken: !!refreshTokenFromBody,
      hasNextAuthToken: !!nextAuthToken,
      finalToken: !!clientRefreshToken,
      availableCookies: Object.keys(cookies)
    });

    if (!clientRefreshToken) {
      console.log('[Frontend Refresh API] No refresh token found in any source');
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found in cookies or request body.'
      });
    }

    // Log the first few characters of the token for debugging (don't log the full token for security)
    if (clientRefreshToken) {
      const tokenPreview = clientRefreshToken.substring(0, 10) + '...';
      console.log(`[Frontend Refresh API] Using token: ${tokenPreview}`);
    }

    // 2. Forward the refresh token to your actual backend API
    const backendApiUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'; // Ensure this is your backend URL
    const backendRefreshUrl: string = `${backendApiUrl.replace(/\/$/, '')}/auth/refresh-token`;

    // console.log(`[Frontend Refresh API] Forwarding refresh request to: ${backendRefreshUrl}`);

    console.log(`[Frontend Refresh API] Forwarding refresh request to: ${backendRefreshUrl}`);

    const backendResponse = await fetch(backendRefreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward any other necessary headers from the original client request if needed
      },
      body: JSON.stringify({ refreshToken: clientRefreshToken }),
      credentials: 'include', // Changed from 'omit' to 'include' to send cookies
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

    // Also set our own cookies for better compatibility
    if (data.success && data.tokens) {
      // Determine if we're in production for secure cookie setting
      const isProduction = process.env.NODE_ENV === 'production';
      const secure = isProduction ? 'Secure; ' : '';
      const sameSite = isProduction ? 'None' : 'Lax';

      // Set access token cookie (both camelCase and lowercase for compatibility)
      res.setHeader('Set-Cookie', [
        // Access token cookies
        `accessToken=${data.tokens.accessToken}; Path=/; HttpOnly; ${secure}Max-Age=3600; SameSite=${sameSite}`,
        `accesstoken=${data.tokens.accessToken}; Path=/; HttpOnly; ${secure}Max-Age=3600; SameSite=${sameSite}`,

        // Refresh token cookies
        `refreshToken=${data.tokens.refreshToken}; Path=/; HttpOnly; ${secure}Max-Age=2592000; SameSite=${sameSite}`,
        `refreshtoken=${data.tokens.refreshToken}; Path=/; HttpOnly; ${secure}Max-Age=2592000; SameSite=${sameSite}`,

        // NextAuth compatible cookie
        `__Secure-next-auth.session-token=${data.tokens.accessToken}; Path=/; HttpOnly; ${secure}Max-Age=3600; SameSite=${sameSite}`,

        // Also set non-HttpOnly versions for client-side access
        `client-accessToken=${data.tokens.accessToken}; Path=/; ${secure}Max-Age=3600; SameSite=${sameSite}`,
        `client-refreshToken=${data.tokens.refreshToken}; Path=/; ${secure}Max-Age=2592000; SameSite=${sameSite}`
      ]);

      console.log('[Frontend Refresh API] Set additional cookies for better compatibility');
    }

    console.log('[Frontend Refresh API] Backend refresh successful, returning tokens.');
    return res.status(200).json(data); // This should contain { success: true, tokens: { accessToken, refreshToken? } }

  } catch (error: any) {
    console.error('[Frontend Refresh API] Error during token refresh proxy:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error refreshing token.' });
  }
}
