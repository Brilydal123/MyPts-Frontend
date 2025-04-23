import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const amount = parseFloat(searchParams.get('amount') || '0');
    const currency = searchParams.get('currency') || 'USD';
    
    // Mock exchange rates
    const exchangeRates = {
      USD: { rate: 1, symbol: '$' },
      EUR: { rate: 0.92, symbol: '€' },
      GBP: { rate: 0.79, symbol: '£' },
      XAF: { rate: 603.45, symbol: 'FCFA' },
      NGN: { rate: 1550.75, symbol: '₦' },
      PKR: { rate: 278.65, symbol: '₨' }
    };
    
    // Get the exchange rate for the requested currency
    const exchangeRate = exchangeRates[currency as keyof typeof exchangeRates] || exchangeRates.USD;
    
    // Calculate value
    const valuePerMyPt = 0.024 * exchangeRate.rate;
    const myPtsAmount = amount / valuePerMyPt;
    
    // Format the values
    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    const myPtsFormatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    const formattedCurrencyValue = currencyFormatter.format(amount);
    const formattedMyPtsValue = myPtsFormatter.format(myPtsAmount) + ' MyPts';
    
    return NextResponse.json({
      success: true,
      data: {
        currencyAmount: amount,
        currency,
        symbol: exchangeRate.symbol,
        valuePerMyPt,
        myPtsAmount,
        formattedCurrencyValue,
        formattedMyPtsValue
      }
    });
  } catch (error) {
    console.error('Error in convert to MyPts API route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
