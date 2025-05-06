import { NextRequest, NextResponse } from 'next/server';

/**
 * API route handler for converting between currency pairs
 * This acts as a proxy to the ExchangeRate-API to keep the API key secure
 *
 * @param req The incoming request
 * @param params Route parameters including the from and to currencies
 * @returns JSON response with conversion data
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { fromCurrency: string; toCurrency: string } }
) {
  try {
    // In Next.js 14, params need to be awaited
    const paramsData = await Promise.resolve(params);
    const fromCurrencyCode = paramsData.fromCurrency.toUpperCase();
    const toCurrencyCode = paramsData.toCurrency.toUpperCase();

    // Get the API key from environment variables
    const apiKey = process.env.EXCHANGERATE_API_KEY;

    if (!apiKey) {
      console.error('ExchangeRate API key is not configured');
      return NextResponse.json(
        {
          success: false,
          message: 'API configuration error'
        },
        { status: 500 }
      );
    }

    // Call the ExchangeRate-API
    const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrencyCode}/${toCurrencyCode}`;

    console.log(`[BACKEND] Making direct API call to ExchangeRate API: ${apiUrl}`);

    // Add a unique identifier to help track this specific request
    const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2);

    // Check if we should use cache or make a fresh request
    const useCache = _req.nextUrl.searchParams.get('force') !== 'true';
    const cacheDuration = 3600; // Cache for 1 hour by default

    console.log(`[BACKEND] Cache settings: useCache=${useCache}, cacheDuration=${cacheDuration} seconds`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId, // Add a custom header for tracking
      },
      // Use caching based on the request parameter
      cache: useCache ? 'force-cache' : 'no-store',
      next: {
        revalidate: useCache ? cacheDuration : 0 // Cache for the specified duration or disable caching
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    // Transform the response to our internal format
    return NextResponse.json({
      success: true,
      data: {
        fromCurrency: data.base_code,
        toCurrency: data.target_code,
        rate: data.conversion_rate,
      }
    });
  } catch (error) {
    console.error('Error in currency pair conversion API route:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
