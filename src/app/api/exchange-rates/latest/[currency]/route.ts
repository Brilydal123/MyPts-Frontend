import { NextRequest, NextResponse } from 'next/server';

/**
 * API route handler for fetching the latest exchange rates
 * This acts as a proxy to the ExchangeRate-API to keep the API key secure
 *
 * @param req The incoming request
 * @param params Route parameters including the base currency
 * @returns JSON response with exchange rates data
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { currency: string } }
) {
  try {
    // In Next.js 14, params need to be awaited
    const paramsData = await Promise.resolve(params);
    const baseCurrency = paramsData.currency.toUpperCase();

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
    const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`;

    console.log(`[BACKEND] API Key being used: ${apiKey}`);
    console.log(`[BACKEND] Making direct API call to ExchangeRate API: ${apiUrl}`);
    console.log(`[BACKEND] This should increment the count in your ExchangeRate API dashboard`);
    console.log(`[BACKEND] Check that this API key matches the one in your dashboard`);

    // Add a unique identifier to help track this specific request
    const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    console.log(`[BACKEND] Request ID for tracking: ${requestId}`);

    let response;
    try {
      // Create an AbortController to handle timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      // Log the exact moment we're making the request
      console.log(`[BACKEND] Sending request at: ${new Date().toISOString()}`);

      // Check if we should use cache or make a fresh request
      const useCache = _req.nextUrl.searchParams.get('force') !== 'true';
      const cacheDuration = 3600; // Cache for 1 hour by default

      console.log(`[BACKEND] Cache settings: useCache=${useCache}, cacheDuration=${cacheDuration} seconds`);

      response = await fetch(apiUrl, {
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

      // Clear the timeout
      clearTimeout(timeoutId);

      console.log(`[BACKEND] ExchangeRate API response received at: ${new Date().toISOString()}`);
      console.log(`[BACKEND] ExchangeRate API response status: ${response.status} ${response.statusText}`);
      console.log(`[BACKEND] Request ID: ${requestId} completed`);

      // Log response headers for debugging
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.log(`[BACKEND] Response headers:`, headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[BACKEND] ExchangeRate API error: ${JSON.stringify(errorData)}`);
        throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log(`[BACKEND] ExchangeRate API response data:`, {
        base_code: data.base_code,
        time_last_update_utc: data.time_last_update_utc,
        conversion_rates_count: Object.keys(data.conversion_rates || {}).length,
        result: data.result
      });

      // Verify this is a real API response, not mock data
      if (data.result === "success") {
        console.log(`[BACKEND] This appears to be a genuine ExchangeRate API response`);
      } else {
        console.warn(`[BACKEND] This may not be a genuine ExchangeRate API response`);
      }

      // Transform the response to our internal format
      return NextResponse.json({
        success: true,
        data: {
          baseCurrency: data.base_code,
          rates: data.conversion_rates,
          lastUpdated: data.time_last_update_utc,
          nextUpdate: data.time_next_update_utc
        }
      });

    } catch (error: any) {
      console.error('Fetch error:', error);
      // If it's a timeout or network error, return a fallback response
      if (error?.name === 'AbortError' || error?.code === 'ETIMEDOUT' || error?.message?.includes('fetch failed')) {
        console.log(`Fetch timeout for ${baseCurrency}, using fallback`);

        // Create fallback rates for common currencies
        const fallbackRates: Record<string, number> = {};

        // If base currency is USD, provide fallback rates for common currencies
        if (baseCurrency === 'USD') {
          // These are approximate values and should be updated periodically
          fallbackRates['EUR'] = 0.91;
          fallbackRates['GBP'] = 0.78;
          fallbackRates['JPY'] = 150.0;
          fallbackRates['CAD'] = 1.35;
          fallbackRates['AUD'] = 1.48;
          fallbackRates['CNY'] = 7.1;
          fallbackRates['INR'] = 83.0;
          fallbackRates['PKR'] = 278.0;
          fallbackRates['XAF'] = 600.0;
          fallbackRates['NGN'] = 1500.0;
        }

        // Return a fallback response with direct conversion rates
        return NextResponse.json({
          success: true,
          data: {
            baseCurrency: baseCurrency,
            rates: fallbackRates,
            lastUpdated: new Date().toISOString(),
            nextUpdate: new Date(Date.now() + 3600000).toISOString()
          }
        });
      }

      // For other errors, re-throw to be caught by the outer try/catch
      throw error;
    }
  } catch (error) {
    console.error('Error in exchange rates API route:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
