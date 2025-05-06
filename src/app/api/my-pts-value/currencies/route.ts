import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { API_URL } from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    // Fetch the real data from the backend
    const response = await fetch(`${API_URL}/my-pts-value/currencies`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': session?.accessToken ? `Bearer ${session.accessToken}` : ''
      },
      cache: 'no-store',
      next: { revalidate: 0 } // Disable caching
    });
    
    if (!response.ok) {
      // If the backend returns an error, log it and use mock data as fallback
      console.error(`Error fetching supported currencies: ${response.status} ${response.statusText}`);
      
      // Mock data for testing/fallback
      const mockCurrencies = [
        { currency: 'USD', symbol: '$' },
        { currency: 'EUR', symbol: '€' },
        { currency: 'GBP', symbol: '£' },
        { currency: 'XAF', symbol: 'FCFA' },
        { currency: 'NGN', symbol: '₦' },
        { currency: 'PKR', symbol: '₨' }
      ];
      
      return NextResponse.json({
        success: true,
        data: mockCurrencies,
        _isMock: true // Flag to indicate this is mock data
      });
    }
    
    // Parse the response
    const data = await response.json();
    
    // Return the real data
    return NextResponse.json({
      success: true,
      data: data.data || data
    });
  } catch (error) {
    console.error('Error in supported currencies API route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
