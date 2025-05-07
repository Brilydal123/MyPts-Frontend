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
  { params: paramsPromise }: { params: Promise<{ fromCurrency: string; toCurrency: string }> }
) {
  try {
    // Get the currency codes from params
    const params = await paramsPromise;
    const fromCurrencyCode = params.fromCurrency.toUpperCase();
    const toCurrencyCode = params.toCurrency.toUpperCase();

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
    const cacheDuration = 86400; // Cache for 24 hours by default to conserve API quota

    console.log(`[BACKEND] Cache settings: useCache=${useCache}, cacheDuration=${cacheDuration} seconds`);

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
      response = await Promise.race<Response>([
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
      console.error(`Fetch timeout for ${fromCurrencyCode} to ${toCurrencyCode}, using fallback`);

      // Calculate a fallback conversion rate based on common rates
      // This is just an approximation for when the API is unavailable
      const fallbackRates = {
        USD: 1.0,
        EUR: 0.92,
        GBP: 0.79,
        XAF: 603.45,
        NGN: 1550.75,
        PKR: 278.65
      };

      // Define a type for the supported currencies
      type SupportedCurrency = keyof typeof fallbackRates;

      // Check if the currencies are supported in our fallback rates
      const isSupported = (currency: string): currency is SupportedCurrency =>
        Object.keys(fallbackRates).includes(currency);

      // If we have both currencies in our fallback rates, calculate the conversion
      if (isSupported(fromCurrencyCode) && isSupported(toCurrencyCode)) {
        const fromRate = fallbackRates[fromCurrencyCode];
        const toRate = fallbackRates[toCurrencyCode];
        const conversionRate = toRate / fromRate;

        return NextResponse.json({
          success: true,
          data: {
            base_code: fromCurrencyCode,
            target_code: toCurrencyCode,
            conversion_rate: conversionRate,
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
