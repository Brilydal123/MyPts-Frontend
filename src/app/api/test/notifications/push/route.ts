import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/test/notifications/push
export async function POST(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await req.json();
    const { token, title, message } = body;

    if (!token || !title || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: token, title, message' },
        { status: 400 }
      );
    }

    // Forward the request to the backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
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
          timestamp: Date.now().toString()
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend API error:', errorData);
      
      // If the backend returns a 400 error, try to show a local notification
      if (response.status === 400) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Backend API error: ' + (errorData.message || 'Unknown error'),
            error: errorData
          },
          { status: 400 }
        );
      }
      
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully',
      data
    });
  } catch (error: any) {
    console.error('Error sending test notification:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send test notification: ' + (error.message || 'Unknown error')
      },
      { status: 500 }
    );
  }
}
