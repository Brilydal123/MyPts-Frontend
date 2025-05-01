import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/user/notification-preferences
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

    // In a real implementation, you would fetch the user's notification preferences from your database
    // For now, we'll return default preferences
    const preferences = {
      email: {
        transactions: true,
        transactionUpdates: true,
        purchaseConfirmations: true,
        saleConfirmations: true,
        security: true,
        marketing: false,
      },
      push: {
        transactions: true,
        transactionUpdates: true,
        purchaseConfirmations: true,
        saleConfirmations: true,
        security: true,
      },
      telegram: {
        enabled: false,
        username: '',
        telegramId: '', // Use the telegramId from the user's document
        transactions: true,
        transactionUpdates: true,
        purchaseConfirmations: true,
        saleConfirmations: true,
        security: true,
      }
    };

    return NextResponse.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/user/notification-preferences
export async function PUT(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the preferences from the request body
    const preferences = await req.json();

    // In a real implementation, you would save the user's notification preferences to your database
    // For now, we'll just return success

    // Validate the preferences (basic validation)
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid preferences format' },
        { status: 400 }
      );
    }

    // Here you would save the preferences to your database
    // Example: await db.user.update({ where: { id: session.user.id }, data: { notificationPreferences: preferences } });

    return NextResponse.json({
      success: true,
      message: 'Notification preferences saved successfully',
      data: preferences
    });
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save notification preferences' },
      { status: 500 }
    );
  }
}
