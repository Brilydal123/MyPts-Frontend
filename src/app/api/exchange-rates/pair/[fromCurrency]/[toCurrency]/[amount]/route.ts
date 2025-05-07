import { NextRequest, NextResponse } from 'next/server';

/**
 * API route handler for converting a specific amount between currency pairs
 * This acts as a proxy to the ExchangeRate-API to keep the API key secure
 *
 * @param req The incoming request
 * @param params Route parameters including the from and to currencies and amount
 * @returns JSON response with conversion data
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fromCurrency: string; toCurrency: string; amount: string }> }
) {
  try {
    // In Next.js 14, params need to be awaited
    const paramsData = await Promise.resolve(params);
    const fromCurrencyCode = paramsData.fromCurrency.toUpperCase();
    const toCurrencyCode = paramsData.toCurrency.toUpperCase();
    const amount = parseFloat(paramsData.amount);

    // Validate the amount
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid amount. Amount must be a positive number.'
        },
        { status: 400 }
      );
    }

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
    const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrencyCode}/${toCurrencyCode}/${amount}`;

    console.log(`[BACKEND] Making direct API call to ExchangeRate API: ${apiUrl}`);

    // Add a unique identifier to help track this specific request
    const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2);

    // Check if we should use cache or make a fresh request
    const useCache = _req.nextUrl.searchParams.get('force') !== 'true';
    const cacheDuration = 86400; // Cache for 24 hours by default to conserve API quota

    console.log(`[BACKEND] Cache settings: useCache=${useCache}, cacheDuration=${cacheDuration} seconds`);

    type FallbackRates = {
      [key: string]: number;
    };

    const fallbackRates: FallbackRates = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      XAF: 603.45,
      NGN: 1550.75,
      PKR: 278.65
    };

    let response: Response;

    try {
      // Create an AbortController to handle timeouts
      const controller = new AbortController();

      // Set a shorter timeout for the fetch request
      const fetchTimeout = 5000; // 5 seconds timeout

      // Create a promise that rejects after the timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          controller.abort(); // Abort the fetch request
          reject(new Error(`Fetch timeout after ${fetchTimeout}ms`));
        }, fetchTimeout);
      });

      // Race the fetch request against the timeout
      const fetchPromise = fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId, // Add a custom header for tracking
        },
        signal: controller.signal,
        // Use caching based on the request parameter
        cache: useCache ? 'force-cache' : 'no-store',
        next: {
          revalidate: useCache ? cacheDuration : 0 // Cache for the specified duration or disable caching
        }
      });

      response = await Promise.race([
        fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId, // Add a custom header for tracking
          },
          signal: controller.signal,
          // Use caching based on the request parameter
          cache: useCache ? 'force-cache' : 'no-store',
          next: {
            revalidate: useCache ? cacheDuration : 0 // Cache for the specified duration or disable caching
          }
        }),
        timeoutPromise
      ]);
    } catch (error) {
      console.error(`Fetch timeout for ${fromCurrencyCode} to ${toCurrencyCode} amount ${amount}, using fallback`);

      // If we have both currencies in our fallback rates, calculate the conversion
      if (fallbackRates[fromCurrencyCode] && fallbackRates[toCurrencyCode]) {
        const fromRate = fallbackRates[fromCurrencyCode];
        const toRate = fallbackRates[toCurrencyCode];
        const conversionRate = toRate / fromRate;
        const convertedAmount = amount * conversionRate;

        return NextResponse.json({
          success: true,
          data: {
            base_code: fromCurrencyCode,
            target_code: toCurrencyCode,
            conversion_rate: conversionRate,
            conversion_result: convertedAmount,
            _isFallback: true
          }
        });
      }

      // If we don't have the rates, return an error
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch conversion rate and no fallback available'
      }, { status: 503 });
    }

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
        fromAmount: amount,
        toAmount: data.conversion_result
      }
    });
  } catch (error) {
    console.error('Error in currency conversion with amount API route:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
