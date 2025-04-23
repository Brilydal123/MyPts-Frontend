import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Call the backend API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/mypts-hub/state`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching MyPts hub state:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch MyPts hub state',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
