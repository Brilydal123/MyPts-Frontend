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

      // 2. If backend fails, try the direct Firebase approach
      console.log('Frontend API: Trying direct Firebase approach...');

      try {
        // Import Firebase admin SDK dynamically
        const admin = require('firebase-admin');

        // Initialize Firebase admin if not already initialized
        if (!admin.apps.length) {
          console.log('Frontend API: Initializing Firebase admin...');

          // Get Firebase service account from environment variables
          const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

          if (serviceAccount) {
            try {
              const parsedServiceAccount = JSON.parse(serviceAccount);

              admin.initializeApp({
                credential: admin.credential.cert(parsedServiceAccount)
              });

              console.log('Frontend API: Firebase admin initialized with service account');
            } catch (parseError) {
              console.error('Frontend API: Error parsing service account:', parseError);
              throw new Error('Invalid Firebase service account format');
            }
          } else {
            // Try with individual credentials
            const projectId = process.env.FIREBASE_PROJECT_ID;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            const privateKey = process.env.FIREBASE_PRIVATE_KEY;

            if (projectId && clientEmail && privateKey) {
              admin.initializeApp({
                credential: admin.credential.cert({
                  projectId,
                  clientEmail,
                  privateKey: privateKey.replace(/\\n/g, '\n')
                })
              });

              console.log('Frontend API: Firebase admin initialized with individual credentials');
            } else {
              throw new Error('Firebase credentials not found in environment variables');
            }
          }
        }

        // Send the notification
        console.log('Frontend API: Sending Firebase message...');
        const notificationMessage = {
          token,
          notification: {
            title,
            body: message // Using the message parameter from the function
          },
          data: {
            notificationType: 'test',
            timestamp: Date.now().toString(),
            url: '/notifications'
          },
          android: {
            notification: {
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
              sound: 'default'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default'
              }
            }
          }
        };

        const response = await admin.messaging().send(notificationMessage);
        console.log('Frontend API: Firebase message sent:', response);

        return NextResponse.json({
          success: true,
          message: 'Test notification sent successfully via direct Firebase',
          source: 'firebase',
          messageId: response
        });
      } catch (firebaseError: any) {
        console.error('Frontend API: Firebase approach failed:', firebaseError);

        // If both approaches fail, return an error
        return NextResponse.json(
          {
            success: false,
            message: 'All notification methods failed',
            backendError: backendError.message || 'Unknown backend error',
            firebaseError: firebaseError.message || 'Unknown Firebase error'
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
