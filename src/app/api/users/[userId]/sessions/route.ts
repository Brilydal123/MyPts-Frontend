import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

/**
 * GET /api/users/[userId]/sessions
 * Retrieves user login sessions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is requesting their own data or is an admin
    if (session.user.id !== params.userId && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Connect to database
    await connectToDatabase();

    // Find user and select sessions
    const user = await User.findById(params.userId).select('sessions lastLogin');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Process sessions data
    let sessions = user.sessions || [];
    
    // Sort sessions by lastUsed date (most recent first)
    sessions.sort((a: any, b: any) => 
      new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    );

    // Apply limit if specified
    if (limit && limit > 0) {
      sessions = sessions.slice(0, limit);
    }

    // Format response data
    const responseData = {
      sessions: sessions.map((session: any) => ({
        id: session._id,
        deviceInfo: session.deviceInfo,
        lastUsed: session.lastUsed,
        createdAt: session.createdAt,
        isActive: session.isActive
      })),
      lastLogin: user.lastLogin
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
