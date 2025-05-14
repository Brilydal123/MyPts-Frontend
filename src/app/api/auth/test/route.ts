import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/auth/test
 * 
 * Test endpoint to verify authentication
 */
export async function GET(req: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    // Get tokens from cookies
    const cookieStore = req.cookies;
    const accessToken = 
      cookieStore.get('accessToken')?.value || 
      cookieStore.get('accesstoken')?.value ||
      cookieStore.get('client-accessToken')?.value;
    
    const profileId = 
      cookieStore.get('profileId')?.value || 
      cookieStore.get('selectedProfileId')?.value;
    
    // Return authentication status
    return NextResponse.json({
      success: true,
      authenticated: !!session || !!accessToken,
      session: session ? {
        user: session.user,
        hasAccessToken: !!session.accessToken,
        hasProfileId: !!session.profileId,
        hasProfileToken: !!session.profileToken,
      } : null,
      cookies: {
        hasAccessToken: !!accessToken,
        hasProfileId: !!profileId,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
