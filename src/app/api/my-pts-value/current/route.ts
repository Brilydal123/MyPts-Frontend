import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { API_URL } from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);

    // Fetch the real data from the backend
    const response = await fetch(`${API_URL}/my-pts-value/current`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': session?.accessToken ? `Bearer ${session.accessToken}` : ''
      },
      cache: 'no-store',
      next: { revalidate: 0 } // Disable caching
    });

    if (!response.ok) {
      // If the backend returns an error, log it and use mock data as fallback
      console.error(`Error fetching MyPts value: ${response.status} ${response.statusText}`);

      // Mock data for testing/fallback
      const mockValue = {
        valuePerPts: 0.024,
        baseCurrency: 'USD',
        baseSymbol: '$',
        lastUpdated: new Date().toISOString(),
        exchangeRates: [
          { currency: 'USD', rate: 1, symbol: '$' },
          { currency: 'EUR', rate: 0.92, symbol: '€' },
          { currency: 'GBP', rate: 0.79, symbol: '£' },
          { currency: 'XAF', rate: 603.45, symbol: 'FCFA' },
          { currency: 'NGN', rate: 1550.75, symbol: '₦' },
          { currency: 'PKR', rate: 278.65, symbol: '₨' }
        ],
        totalSupply: 1000000000, // 1 billion total supply
        totalValueUSD: 24000000 // 1 billion * 0.024
      };

      return NextResponse.json({
        success: true,
        data: mockValue,
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
    console.error('Error in current value API route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
