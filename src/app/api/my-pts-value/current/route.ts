import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);

    // Mock data for testing
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
      totalSupply: 50833912,
      totalValueUSD: 1220014.88
    };

    return NextResponse.json({
      success: true,
      data: mockValue
    });
  } catch (error) {
    console.error('Error in current value API route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
