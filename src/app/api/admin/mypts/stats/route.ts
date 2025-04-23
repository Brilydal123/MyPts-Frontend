import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Define API URL directly in this file
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Forward request to backend
    console.log(`Forwarding request to ${API_URL}/my-pts/admin/stats`);
    const response = await fetch(`${API_URL}/my-pts/admin/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to fetch MyPts statistics',
          error: data.error
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching MyPts statistics:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'An error occurred while fetching MyPts statistics'
      },
      { status: 500 }
    );
  }
}
