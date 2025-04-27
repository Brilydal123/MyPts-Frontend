import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/notifications
export async function GET(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In a real implementation, you would fetch the user's notifications from your database
    // For now, we'll return mock notifications
    const mockNotifications = [
      {
        _id: '1',
        type: 'system_notification',
        title: 'Purchase Successful',
        message: 'Your purchase of 100 MyPts has been completed successfully.',
        relatedTo: {
          model: 'Transaction',
          id: 'tx123456'
        },
        action: {
          text: 'View Transaction',
          url: '/dashboard/transactions/tx123456'
        },
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        metadata: {
          transactionType: 'BUY_MYPTS',
          amount: 100,
          balance: 250
        }
      },
      {
        _id: '2',
        type: 'system_notification',
        title: 'Sale Pending Approval',
        message: 'Your request to sell 50 MyPts is pending admin approval.',
        relatedTo: {
          model: 'Transaction',
          id: 'tx123457'
        },
        action: {
          text: 'View Transaction',
          url: '/dashboard/transactions/tx123457'
        },
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        metadata: {
          transactionType: 'SELL_MYPTS',
          amount: -50,
          balance: 150
        }
      },
      {
        _id: '3',
        type: 'security_alert',
        title: 'New Login Detected',
        message: 'A new login was detected from a new device. If this was not you, please secure your account.',
        action: {
          text: 'Review Activity',
          url: '/settings/security'
        },
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
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
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
