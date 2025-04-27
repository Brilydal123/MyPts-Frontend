import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/admin/notifications/unread-count
export async function GET(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In a real implementation, you would count the admin's unread notifications from your database
    // For now, we'll return a mock count
    const unreadCount = 3;

    return NextResponse.json({
      success: true,
      data: {
        count: unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching admin unread count:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch admin unread count' },
      { status: 500 }
    );
  }
}
