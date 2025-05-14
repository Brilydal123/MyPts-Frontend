import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * POST /api/auth/sync-admin
 * 
 * Synchronizes admin status across all storage mechanisms
 * Sets secure HttpOnly cookies for admin status
 */
export async function POST(req: NextRequest) {
  try {
    // Get the token from the request
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : token?.accessToken as string || '';

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'No access token available' },
        { status: 401 }
      );
    }

    // Verify admin status
    let isAdmin = false;

    // Check token claims for admin role
    if (token) {
      isAdmin = token.role === 'admin' || (token as any).isAdmin === true;
    }

    // If not found in token, check with backend API
    if (!isAdmin && accessToken) {
      try {
        // Decode the token to get the user ID
        let userId = '';
        try {
          const tokenParts = accessToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            userId = payload.userId || payload.sub;
          }
        } catch (error) {
          console.error('Error decoding token:', error);
        }

        if (userId) {
          // Make a request to the backend to check if the user is an admin
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
          const response = await fetch(`${apiUrl}/users/${userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
          });

          if (response.ok) {
            const data = await response.json();
            isAdmin = data.user?.role === 'admin' || data.user?.isAdmin === true;
          }
        }
      } catch (error) {
        console.error('Error verifying admin status with backend:', error);
      }
    }

    // If not admin, return error
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Create response with admin cookies
    const res = NextResponse.json({ success: true, isAdmin: true });
    
    // Set cookies for admin status
    res.cookies.set('isAdmin', 'true', {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    res.cookies.set('X-User-Role', 'admin', {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    res.cookies.set('X-User-Is-Admin', 'true', {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    res.cookies.set('X-Admin-Token', accessToken, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return res;
  } catch (error) {
    console.error('Error in sync-admin API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to sync admin status',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
