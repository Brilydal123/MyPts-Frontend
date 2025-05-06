import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { API_URL } from '@/lib/constants';

/**
 * API route handler for initializing the MyPts value system
 * This is used when no MyPts value data exists in the database
 *
 * @param req The incoming request
 * @returns JSON response with the initialization result
 */
export async function POST(req: NextRequest) {
  try {
    // Check if the user is authenticated and is an admin
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    // Check if the user is an admin
    const userRole = session.user.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden: Admin access required'
        },
        { status: 403 }
      );
    }

    // Get the initialization data from the request body
    const data = await req.json();

    // Validate the required fields
    if (!data.baseValue || !data.baseCurrency || !data.baseSymbol || !data.totalSupply) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields'
        },
        { status: 400 }
      );
    }

    // Call the backend API to initialize the MyPts value system
    console.log(`Initializing MyPts value system with API URL: ${API_URL}/my-pts-value/initialize`);
    const response = await fetch(`${API_URL}/my-pts-value/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
      body: JSON.stringify({
        baseValue: data.baseValue,
        baseCurrency: data.baseCurrency,
        baseSymbol: data.baseSymbol,
        totalSupply: data.totalSupply,
        exchangeRates: data.exchangeRates || []
      })
    });

    if (!response.ok) {
      let errorMessage = `API returned ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response from API:', errorData);
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const responseData = await response.json();

    return NextResponse.json({
      success: true,
      data: responseData.data,
      message: 'MyPts value system initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing MyPts value system:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
