import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/admin/notifications
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

    // In a real implementation, you would fetch admin notifications from your database
    // For now, we'll return mock notifications
    const mockNotifications = [
      {
        _id: '1',
        type: 'transaction',
        title: 'New Sell Request',
        message: 'User John Doe has requested to sell 200 MyPts.',
        relatedTo: {
          model: 'Transaction',
          id: 'tx123456'
        },
        action: {
          text: 'Review Transaction',
          url: '/admin/transactions/tx123456'
        },
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        priority: 'high',
        user: {
          id: 'user123',
          name: 'John Doe',
          email: 'john@example.com'
        },
        metadata: {
          transactionType: 'SELL_MYPTS',
          amount: 200,
          status: 'PENDING'
        }
      },
      {
        _id: '2',
        type: 'transaction',
        title: 'New Purchase',
        message: 'User Jane Smith has purchased 50 MyPts.',
        relatedTo: {
          model: 'Transaction',
          id: 'tx123457'
        },
        action: {
          text: 'View Transaction',
          url: '/admin/transactions/tx123457'
        },
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        priority: 'medium',
        user: {
          id: 'user456',
          name: 'Jane Smith',
          email: 'jane@example.com'
        },
        metadata: {
          transactionType: 'BUY_MYPTS',
          amount: 50,
          status: 'COMPLETED'
        }
      },
      {
        _id: '3',
        type: 'user_activity',
        title: 'New User Registration',
        message: 'A new user has registered: Alex Johnson.',
        action: {
          text: 'View User',
          url: '/admin/users/user789'
        },
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
        priority: 'low',
        user: {
          id: 'user789',
          name: 'Alex Johnson',
          email: 'alex@example.com'
        }
      },
      {
        _id: '4',
        type: 'security_alert',
        title: 'Multiple Failed Login Attempts',
        message: 'Multiple failed login attempts detected for user account: mike@example.com.',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
        priority: 'high',
        user: {
          id: 'user101',
          name: 'Mike Wilson',
          email: 'mike@example.com'
        }
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        notifications: mockNotifications,
        pagination: {
          total: mockNotifications.length,
          limit: 10,
          page: 1,
          pages: 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch admin notifications' },
      { status: 500 }
    );
  }
}

// POST /api/admin/notifications
export async function POST(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the notification data from the request body
    const notificationData = await req.json();

    // In a real implementation, you would create a new notification in your database
    // For now, we'll just return success
    
    // Validate the notification data (basic validation)
    if (!notificationData || typeof notificationData !== 'object' || !notificationData.title || !notificationData.message) {
      return NextResponse.json(
        { success: false, message: 'Invalid notification data' },
        { status: 400 }
      );
    }

    // Here you would save the notification to your database
    // Example: await db.adminNotification.create({ data: notificationData });

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      data: {
        _id: 'new_notification_id',
        ...notificationData,
        createdAt: new Date().toISOString(),
        isRead: false
      }
    });
  } catch (error) {
    console.error('Error creating admin notification:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create admin notification' },
      { status: 500 }
    );
  }
}
