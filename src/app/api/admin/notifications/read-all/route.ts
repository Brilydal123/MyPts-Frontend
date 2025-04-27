import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT /api/admin/notifications/read-all
export async function PUT(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In a real implementation, you would mark all admin notifications as read in your database
    // For now, we'll just return success
    
    return NextResponse.json({
      success: true,
      message: 'All admin notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all admin notifications as read:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to mark all admin notifications as read' },
      { status: 500 }
    );
  }
}
