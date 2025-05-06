import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.EXCHANGERATE_API_KEY;
    
    if (!apiKey) {
      console.error('[TEST] ExchangeRate API key is missing');
      return NextResponse.json(
        { success: false, message: 'API key is missing' },
        { status: 500 }
      );
    }
    
    console.log('[TEST] API Key being used:', apiKey);
    
    // Make a direct call to the ExchangeRate API
    const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
    console.log('[TEST] Making direct API call to:', apiUrl);
    
    // Add a unique identifier to help track this specific request
    const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    console.log('[TEST] Request ID for tracking:', requestId);
    
    // Log the exact moment we're making the request
    console.log('[TEST] Sending request at:', new Date().toISOString());
    
    // Make the request with no caching
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
      cache: 'no-store',
    });
    
    console.log('[TEST] Response received at:', new Date().toISOString());
    console.log('[TEST] Response status:', response.status, response.statusText);
    
    // Log response headers
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('[TEST] Response headers:', headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TEST] API error:', errorText);
      return NextResponse.json(
        { success: false, message: `API error: ${response.status}`, error: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('[TEST] API response data:', {
      result: data.result,
      base_code: data.base_code,
      time_last_update_utc: data.time_last_update_utc,
      rates_count: Object.keys(data.conversion_rates || {}).length,
    });
    
    // Return the full response for inspection
    return NextResponse.json({
      success: true,
      message: 'Direct API test completed successfully',
      data: data,
      requestId: requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[TEST] Error testing ExchangeRate API:', error);
    return NextResponse.json(
      { success: false, message: 'Error testing API', error: String(error) },
      { status: 500 }
    );
  }
}
