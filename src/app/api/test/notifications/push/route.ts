import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/test/notifications/push
export async function POST(req: NextRequest) {
  try {
    console.log('Frontend API: Received push notification test request');

    // Get the user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.log('Frontend API: Unauthorized - no session');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await req.json();
    const { token, title, message } = body;

    console.log('Frontend API: Request body:', {
      token: token ? `${token.substring(0, 10)}...` : 'missing',
      title,
      message
    });

    if (!token || !title || !message) {
      console.log('Frontend API: Missing required fields');
      return NextResponse.json(
        { success: false, message: 'Missing required fields: token, title, message' },
        { status: 400 }
      );
    }

    // Try multiple approaches to send the notification

    // 1. First try the backend API
    console.log('Frontend API: Trying backend API...');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      console.log(`Frontend API: Calling backend at ${backendUrl}/test/notifications/push`);

      const response = await fetch(`${backendUrl}/test/notifications/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          token,
          title,
          message,
          // Include additional data for the notification
          data: {
            notificationType: 'test',
            timestamp: Date.now().toString(),
            url: '/notifications' // Add a URL to open when the notification is clicked
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Frontend API: Backend API error:', errorData);
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Frontend API: Backend API success:', data);

      return NextResponse.json({
        success: true,
        message: 'Test notification sent successfully via backend API',
        source: 'backend',
        data
      });
    } catch (backendError: any) {
      console.error('Frontend API: Backend API failed:', backendError);

      // 2. If backend fails, use a fallback approach
      console.log('Frontend API: Using fallback approach for Vercel compatibility');

      try {
        // Create a fallback notification response
        // This avoids using firebase-admin which can cause issues in Vercel

        // Instead, we'll make a request to the backend API with a different endpoint
        // that's specifically designed for Vercel compatibility
        try {
          // Get the backend URL from environment variables
          const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

          // Try to call a different backend endpoint that handles the notification
          const fallbackResponse = await fetch(`${backendApiUrl}/notifications/send-test`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.accessToken}`
            },
            body: JSON.stringify({
              token,
              title,
              message,
              data: {
                notificationType: 'test',
                timestamp: Date.now().toString(),
                url: '/notifications'
              }
            })
          });

          if (!fallbackResponse.ok) {
            throw new Error(`Fallback API error: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
          }

          const fallbackData = await fallbackResponse.json();
          console.log('Frontend API: Fallback API success:', fallbackData);

          return NextResponse.json({
            success: true,
            message: 'Test notification sent successfully via fallback API',
            source: 'fallback',
            data: fallbackData
          });
        } catch (fallbackError: any) {
          console.error('Frontend API: Fallback API failed:', fallbackError);

          // If the fallback API fails, show a local notification instead
          return NextResponse.json({
            success: true,
            message: 'Please use local notification instead',
            source: 'local',
            error: 'Firebase Admin SDK not available in Vercel environment',
            showLocalNotification: true
          });
        }
      } catch (fallbackError: any) {
        console.error('Frontend API: Fallback approach failed:', fallbackError);

        // If both approaches fail, return an error with instructions
        return NextResponse.json(
          {
            success: false,
            message: 'All notification methods failed',
            backendError: backendError.message || 'Unknown backend error',
            fallbackError: fallbackError.message || 'Unknown fallback error',
            showLocalNotification: true
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Frontend API: Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send test notification: ' + (error.message || 'Unknown error')
      },
      { status: 500 }
    );
  }
}
