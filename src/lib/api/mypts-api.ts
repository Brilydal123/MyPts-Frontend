import { ApiResponse } from '@/types/api';
import {
  MyPtsBalance,
  MyPtsTransaction,
  MyPtsHubState,
  MyPtsValue,
} from '@/types/mypts';
import { API_URL, REQUEST_TIMEOUT, TransactionType } from '@/lib/constants';
// No longer using getSession

/**
 * Base API client with authentication handling
 */
class ApiClient {
  // Custom token for authentication
  private customToken: string | null = null;

  /**
   * Set a custom token to use for authentication
   * @param token The token to use for authentication
   */
  setToken(token: string): void {
    console.log('Setting custom token for API client');
    this.customToken = token;
  }

  protected getHeaders(): HeadersInit {
    // Create headers with content type
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // If we have a custom token, use it (highest priority)
    if (this.customToken) {
      headers['Authorization'] = `Bearer ${this.customToken}`;
      console.log('Using custom token for authorization');
      return headers;
    }

    // Only run this code in browser environment
    if (typeof window !== 'undefined') {
      // Check for authentication tokens in localStorage
      const storedAccessToken = localStorage.getItem('accessToken');
      const nextAuthToken = localStorage.getItem('next-auth.session-token');
      const storedProfileToken = localStorage.getItem('selectedProfileToken');
      const storedProfileId = localStorage.getItem('selectedProfileId');

      // Log available tokens for debugging
      console.log('Available tokens:', {
        hasAccessToken: !!storedAccessToken,
        hasNextAuthToken: !!nextAuthToken,
        hasProfileToken: !!storedProfileToken,
        hasProfileId: !!storedProfileId
      });

      // Priority order for authorization:
      // 1. Access token from localStorage
      // 2. Profile token from localStorage
      // 3. NextAuth session token
      if (storedAccessToken) {
        headers['Authorization'] = `Bearer ${storedAccessToken}`;
        console.log('Using stored access token for authorization');
      } else if (storedProfileToken) {
        headers['Authorization'] = `Bearer ${storedProfileToken}`;
        console.log('Using stored profile token for authorization');
      } else if (nextAuthToken) {
        headers['Authorization'] = `Bearer ${nextAuthToken}`;
        console.log('Using NextAuth session token for authorization');
      } else {
        console.warn('No authentication token found in localStorage');
      }

      // Always include profile information in cookies if available
      if (storedProfileId) {
        console.log('Profile info will be sent via cookies:', { profileId: storedProfileId });

        // Set cookies for the profile information
        document.cookie = `profileId=${storedProfileId}; path=/`;

        // Only set profile token if it exists
        if (storedProfileToken) {
          document.cookie = `profileToken=${storedProfileToken}; path=/`;
        }
      } else {
        console.warn('No profile ID found in localStorage for API request');

        // Check if we're in a redirect loop
        const redirectAttempts = parseInt(localStorage.getItem('redirectAttempts') || '0');
        if (redirectAttempts > 2) {
          console.warn('Multiple redirect attempts detected, trying to continue without profile ID');
        }
      }

      return headers;
    }

    // If we get here, we don't have profile info
    console.warn('No authentication information found for API request');
    return headers;
  }

  // No longer using request cache

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = this.getHeaders();

      // Make sure we're using the profileId as a query parameter
      let url = `${API_URL}${endpoint}`;

      // If the URL doesn't already have a profileId parameter, add it
      if (!url.includes('profileId=') && typeof window !== 'undefined') {
        const profileId = localStorage.getItem('selectedProfileId');
        if (profileId) {
          url += url.includes('?') ? `&profileId=${profileId}` : `?profileId=${profileId}`;
        }
      }

      console.log(`Making GET request to ${url}`, { headers });

      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      // Add a timestamp to the URL to prevent caching
      const urlWithTimestamp = url.includes('?')
        ? `${url}&_t=${Date.now()}`
        : `${url}?_t=${Date.now()}`;

      console.log(`Adding cache-busting timestamp to URL: ${urlWithTimestamp}`);

      const response = await fetch(urlWithTimestamp, {
        method: 'GET',
        headers,
        credentials: 'include', // This is crucial for sending cookies
        cache: 'no-cache', // Disable caching
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      // Log response status only in development or for non-200 responses
      if (process.env.NODE_ENV === 'development' || response.status !== 200) {
        console.debug(`Response status for ${endpoint}:`, response.status);
      }

      // If we get a 401 or 403, the profile might be invalid
      if (response.status === 401 || response.status === 403) {
        console.warn(`Authentication error (${response.status}) for ${endpoint}. Profile might be invalid.`);
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`Error in GET request to ${endpoint}:`, error);

      // Check if it's an abort error (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Request timed out. Please try again.',
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const headers = this.getHeaders();

      // Make sure we're using the profileId as a query parameter
      let url = `${API_URL}${endpoint}`;

      // If the URL doesn't already have a profileId parameter, add it
      if (!url.includes('profileId=') && typeof window !== 'undefined') {
        const profileId = localStorage.getItem('selectedProfileId');
        if (profileId) {
          url += url.includes('?') ? `&profileId=${profileId}` : `?profileId=${profileId}`;
          // Also include profileId in the data if it's not already there
          if (data && typeof data === 'object' && !data.profileId) {
            data.profileId = profileId;
          }
        }
      }

      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.debug(`Making POST request to ${url}`);
      }

      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include', // Include cookies for authentication
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      // Log response status only in development or for non-200 responses
      if (process.env.NODE_ENV === 'development' || response.status !== 200) {
        console.debug(`Response from ${endpoint}:`, { status: response.status, statusText: response.statusText });
      }

      // If we get a 401 or 403, the profile might be invalid
      if (response.status === 401 || response.status === 403) {
        console.warn(`Authentication error (${response.status}) for ${endpoint}. Profile might be invalid.`);
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`Error in POST request to ${endpoint}:`, error);

      // Check if it's an abort error (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Request timed out. Please try again.',
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  protected async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'An error occurred',
          error: data.error,
          errors: data.errors || undefined,
        };
      }

      // Handle both formats: { success: true, data: {...} } and { success: true, ...data }
      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error('API response handling error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to parse API response',
      };
    }
  }
}

/**
 * MyPts API service for profile users
 */
export class MyPtsApi extends ApiClient {
  /**
   * Force refresh the MyPts balance from the backend
   * This is useful after a payment to ensure the balance is up-to-date
   * @param currency The currency to use for value calculation (default: USD)
   * @param specificProfileId Optional profile ID to fetch balance for (overrides localStorage)
   */
  async refreshBalance(currency: string = 'USD', specificProfileId?: string): Promise<ApiResponse<MyPtsBalance>> {
    try {
      // Get profile ID from parameter or localStorage
      const profileId = specificProfileId || (typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null);
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.debug("MyPtsApi ~ refreshBalance ~ profileId:", profileId);
      }

      // Include profileId as a query parameter
      const response = await this.get<MyPtsBalance>(`/my-pts/refresh-balance?currency=${currency}${profileId ? `&profileId=${profileId}` : ''}`);

      console.log("Balance refreshed from backend:", response);
      return response;
    } catch (error) {
      console.error('Error refreshing balance:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to refresh balance'
      };
    }
  }

  /**
   * Get the current user's MyPts balance
   * @param currency The currency to use for value calculation (default: USD)
   * @param specificProfileId Optional profile ID to fetch balance for (overrides localStorage)
   */
  async getBalance(currency: string = 'USD', specificProfileId?: string): Promise<ApiResponse<MyPtsBalance>> {
    try {
      // Get profile ID from parameter or localStorage
      const profileId = specificProfileId || (typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null);
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.debug("MyPtsApi ~ getBalance ~ profileId:", profileId);
      }

      // Include profileId as a query parameter
      const response = await this.get<MyPtsBalance>(`/my-pts/balance?currency=${currency}${profileId ? `&profileId=${profileId}` : ''}`);

      if (response.success && response.data) {
        // Now we'll use the ExchangeRate API to get the latest rates
        try {
          console.log(`[FRONTEND] Fetching exchange rates from ExchangeRate API for ${currency}...`);

          // Fetch the exchange rates from our API endpoint
          const exchangeRateResponse = await fetch(`/api/exchange-rates/latest/USD?_t=${Date.now()}`);

          if (exchangeRateResponse.ok) {
            const exchangeRateData = await exchangeRateResponse.json();

            if (exchangeRateData.success && exchangeRateData.data && exchangeRateData.data.rates) {
              // Get the rate for the requested currency
              const rate = exchangeRateData.data.rates[currency];

              if (rate) {
                // Base value of MyPts in USD
                const baseValueInUsd = 0.024; // 1 MyPt = 0.024 USD

                // Calculate the value in the requested currency
                const valuePerMyPt = baseValueInUsd * rate;

                // Only log in development mode
                if (process.env.NODE_ENV === 'development') {
                  console.debug(`[FRONTEND] Successfully got rate from ExchangeRate API: 1 USD = ${rate} ${currency}`);
                  console.debug(`[FRONTEND] Calculated value: 1 MyPt = ${valuePerMyPt} ${currency} (based on 1 MyPt = ${baseValueInUsd} USD)`);
                }

                // Update the response with the API value
                response.data.value.valuePerMyPt = valuePerMyPt;
                response.data.value.totalValue = response.data.balance * valuePerMyPt;
                response.data.value.formattedValue = `${response.data.value.symbol}${response.data.value.totalValue.toFixed(2)}`;

                return response;
              } else {
                console.warn(`[FRONTEND] ExchangeRate API doesn't have a rate for ${currency}, falling back to backend value`);
              }
            } else {
              console.warn(`[FRONTEND] Invalid response from ExchangeRate API, falling back to backend value`);
            }
          } else {
            console.warn(`[FRONTEND] Failed to fetch from ExchangeRate API (${exchangeRateResponse.status}), falling back to backend value`);
          }
        } catch (apiError) {
          console.error(`[FRONTEND] Error fetching from ExchangeRate API:`, apiError);
          console.log(`[FRONTEND] Falling back to backend value for ${currency}: ${response.data.value.valuePerMyPt}`);
        }

        // If we get here, we're using the backend value
        console.log(`[FRONTEND] Using backend value for ${currency}: ${response.data.value.valuePerMyPt}`);
      } else {
        console.log(`[FRONTEND] No valid response from backend for ${currency}`);
      }

      // If the response is successful but the value is missing, provide a fallback
      if (response.success && response.data && (!response.data.value.valuePerMyPt || response.data.value.valuePerMyPt === 0)) {
        console.warn(`[FRONTEND] Backend returned zero or missing value for ${currency}, using fallback`);

        // Fallback values for direct conversion if needed
        const fallbackValues: Record<string, { value: number, symbol: string }> = {
          'XAF': { value: 13.61, symbol: 'FCFA' },
          'EUR': { value: 0.0208, symbol: '€' },
          'GBP': { value: 0.0179, symbol: '£' },
          'NGN': { value: 38.26, symbol: '₦' },
          'PKR': { value: 6.74, symbol: '₨' },
          'USD': { value: 0.024, symbol: '$' }
        };

        if (fallbackValues[currency]) {
          const fallbackValue = fallbackValues[currency].value;
          const symbol = fallbackValues[currency].symbol;

          console.log(`[FRONTEND] Using fallback value for ${currency}: ${fallbackValue}`);

          // Update the value in the response as a last resort
          response.data.value.valuePerMyPt = fallbackValue;
          response.data.value.symbol = symbol;
          response.data.value.totalValue = response.data.balance * fallbackValue;
          response.data.value.formattedValue = `${symbol}${response.data.value.totalValue.toFixed(2)}`;
        }
      }

      return response;
    } catch (error) {
      console.error('Error getting balance:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get balance'
      };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(limit: number = 20, offset: number = 0): Promise<ApiResponse<{
    transactions: MyPtsTransaction[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    }
  }>> {
    // Get profile ID from localStorage
    const profileId = typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null;

    // Include profileId as a query parameter
    return this.get<any>(`/my-pts/transactions?limit=${limit}&offset=${offset}${profileId ? `&profileId=${profileId}` : ''}`);
  }

  /**
   * Get a single transaction by ID
   */
  async getTransaction(transactionId: string): Promise<ApiResponse<MyPtsTransaction>> {
    // Get profile ID from localStorage
    const profileId = typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null;

    // Add a cache-busting parameter to prevent caching issues
    const cacheBuster = `_cb=${Date.now()}`;

    // Include profileId as a query parameter
    const queryParams = profileId ? `?profileId=${profileId}&${cacheBuster}` : `?${cacheBuster}`;

    console.log(`Fetching transaction ${transactionId} with profileId: ${profileId}`);

    return this.get<any>(`/my-pts/transactions/${transactionId}${queryParams}`);
  }

  /**
   * Get transactions by type
   */
  async getTransactionsByType(
    type: TransactionType,
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<{
    transactions: MyPtsTransaction[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    }
  }>> {
    // Get profile ID from localStorage
    const profileId = typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null;

    // Include profileId as a query parameter
    return this.get<any>(`/my-pts/transactions/type/${type}?limit=${limit}&offset=${offset}${profileId ? `&profileId=${profileId}` : ''}`);
  }

  /**
   * Get transaction by reference ID (e.g., payment intent ID)
   */
  async getTransactionByReference(referenceId: string): Promise<ApiResponse<MyPtsTransaction>> {
    // Get profile ID from localStorage
    const profileId = typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null;

    // Include profileId as a query parameter
    return this.get<any>(`/my-pts/transactions/reference/${referenceId}${profileId ? `?profileId=${profileId}` : ''}`);
  }

  /**
   * Buy MyPts with Stripe
   */
  async buyMyPts(amount: number, paymentMethod: string, paymentMethodId?: string): Promise<ApiResponse<{
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    transactionId: string;
    transaction?: MyPtsTransaction;
    newBalance?: number;
    requiresAction?: boolean;
  }>> {
    return this.post<any>('/my-pts/buy', {
      amount,
      paymentMethod,
      paymentMethodId
    });
  }

  /**
   * Sell MyPts
   */
  async sellMyPts(amount: number, paymentMethod: string, accountDetails: any): Promise<ApiResponse<{
    transaction: MyPtsTransaction;
    newBalance: number;
  }>> {
    return this.post<any>('/my-pts/sell', {
      amount,
      paymentMethod,
      accountDetails
    });
  }

  /**
   * Get local payment transactions (admin only)
   */
  async getLocalTransactions(
    params: {
      limit?: number;
      offset?: number;
      sort?: 'asc' | 'desc';
      status?: string;
      paymentMethod?: string;
    } = {}
  ): Promise<ApiResponse<MyPtsTransaction[]>> {
    try {
      console.log('Fetching local payment transactions...');

      // Build query parameters for the backend API
      const queryParams = new URLSearchParams();

      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      } else {
        queryParams.append('limit', '100'); // Default to a higher limit to get all transactions
      }

      if (params.offset) {
        queryParams.append('offset', params.offset.toString());
      }

      if (params.sort) {
        queryParams.append('sort', params.sort);
      }

      if (params.status) {
        queryParams.append('status', params.status);
      }

      // Always filter for local payment methods
      queryParams.append('paymentMethod', 'mobile_money,pakistani_local,local');

      // Add a timestamp to prevent caching
      queryParams.append('_t', Date.now().toString());

      // Log the URL we're calling
      console.log(`Calling backend API: /my-pts/admin/transactions?${queryParams.toString()}`);

      // Call the regular transactions endpoint with filters
      const response = await this.get<any>(`/my-pts/admin/transactions?${queryParams.toString()}`);

      console.log('Response status for /my-pts/admin/transactions?:', response.success ? 'Success' : 'Failed');
      console.log('Response from /my-pts/admin/transactions?:', response);

      // If the response is successful, filter the transactions to only include those with local payment methods
      if (response.success && response.data && response.data.transactions) {
        const localTransactions = response.data.transactions.filter((transaction: any) => {
          const paymentMethod = transaction.metadata?.paymentMethod;
          return paymentMethod === 'mobile_money' ||
                 paymentMethod === 'pakistani_local' ||
                 paymentMethod === 'local';
        });

        console.log(`Filtered ${response.data.transactions.length} transactions to ${localTransactions.length} local transactions`);

        // Fetch profile details for each transaction to get secondary IDs
        try {
          // Create a map of profile IDs to avoid duplicate requests
          const profileIds = new Set(localTransactions.map((t: any) => t.profileId));

          // For each unique profile ID, fetch the profile details
          for (const profileId of profileIds) {
            try {
              const profileResponse = await this.get<any>(`/profiles/${profileId}`);

              if (profileResponse.success && profileResponse.data) {
                const secondaryId = profileResponse.data.secondaryId || profileResponse.data.profile?.secondaryId;

                // Update all transactions with this profile ID
                localTransactions.forEach((transaction: any) => {
                  if (transaction.profileId === profileId) {
                    if (!transaction.metadata) {
                      transaction.metadata = {};
                    }
                    transaction.metadata.profileSecondaryId = secondaryId;
                  }
                });
              }
            } catch (profileError) {
              console.warn(`Could not fetch profile details for ${profileId}:`, profileError);
            }
          }
        } catch (error) {
          console.warn('Error fetching profile details for secondary IDs:', error);
        }

        // Return the filtered transactions with secondary IDs
        return {
          success: true,
          data: localTransactions
        };
      }

      // If we couldn't filter, return the response as is
      return response;
    } catch (error) {
      console.error('Error fetching local transactions:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch local transactions'
      };
    }
  }

  /**
   * Process a local payment transaction (admin only)
   */
  async processLocalTransaction(
    transactionId: string,
    paymentReference: string,
    adminNotes?: string
  ): Promise<ApiResponse<{
    transaction: MyPtsTransaction;
    message: string;
  }>> {
    try {
      console.log(`Processing local transaction: ${transactionId}`);

      // Call the backend API directly to process the sell transaction
      const response = await this.post<any>(`/my-pts/admin/process-sell`, {
        transactionId,
        paymentReference,
        notes: adminNotes // Backend expects 'notes' instead of 'adminNotes'
      });

      console.log('Process transaction response:', response);

      return response;
    } catch (error) {
      console.error('Error processing local transaction:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process local transaction'
      };
    }
  }

  /**
   * Donate MyPts to another profile
   */
  async donateMyPts(amount: number, toProfileId: string, message?: string): Promise<ApiResponse<{
    transaction: MyPtsTransaction;
    newBalance: number;
  }>> {
    return this.post<any>('/my-pts/donate', {
      amount,
      toProfileId,
      message
    });
  }

  /**
   * Purchase a product for another profile
   */
  async purchaseProduct(
    amount: number,
    toProfileId: string,
    productId: string,
    productName: string
  ): Promise<ApiResponse<{
    transaction: MyPtsTransaction;
    newBalance: number;
  }>> {
    return this.post<any>('/my-pts/purchase-product', {
      amount,
      toProfileId,
      productId,
      productName
    });
  }

  /**
   * Get profile MyPts balance directly (admin only)
   * This is useful for debugging and troubleshooting
   */
  async getProfileBalance(profileId: string): Promise<ApiResponse<{
    balance: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
    lastTransaction: string;
  }>> {
    // Clean and validate the ObjectId
    const idString = profileId.trim();

    // Ensure it's a valid MongoDB ObjectId (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(idString)) {
      console.error(`Invalid profile ID format: ${idString}`);
      return {
        success: false,
        message: 'Invalid profile ID format. Must be a 24-character hex string.'
      };
    }

    try {
      console.log(`Fetching MyPts balance for profile ID: ${idString}`);

      // Make a direct API call to the backend
      const response = await fetch(`${API_URL}/my-pts/balance?profileId=${idString}`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || `Failed to fetch MyPts balance for profile ${idString}`
        };
      }

      const data = await response.json();
      console.log(`MyPts balance for profile ${idString}:`, data);

      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      console.error(`Error fetching MyPts balance for profile ${idString}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch MyPts balance'
      };
    }
  }

  /**
   * Award MyPts to a profile (admin only)
   */
  async awardMyPts(
    profileId: string,
    amount: number,
    reason: string
  ): Promise<ApiResponse<{
    transaction: MyPtsTransaction;
    newBalance: number;
  }>> {
    // Clean and validate the ObjectId
    const idString = profileId.trim();

    // Ensure it's a valid MongoDB ObjectId (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(idString)) {
      console.error(`Invalid profile ID format: ${idString}`);
      return {
        success: false,
        message: 'Invalid profile ID format. Must be a 24-character hex string.'
      };
    }

    // Admin award request using standard API endpoint
    try {
      console.log(`Sending award request for profile ID: ${idString}, amount: ${amount}`);

      return this.post<any>('/my-pts/award', {
        profileId: idString, // Use the cleaned ID
        amount: Number(amount),
        reason: reason || 'Admin reward'
      });
    } catch (error) {
      console.error('Error in award MyPts:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to award MyPts'
      };
    }
  }

  /**
   * Get MyPts statistics (admin only)
   */
  async getMyPtsStats(): Promise<ApiResponse<{
    hubState: {
      totalSupply: number;
      circulatingSupply: number;
      reserveSupply: number;
      maxSupply: number;
      valuePerMyPt: number;
    };
    totalAwarded: number;
    totalPurchased: number;
    totalSold: number;
    totalEarned: number;
    totalInCirculation: number;
    transactionCountsByType: Record<string, number>;
    monthlyStats: Array<{
      year: number;
      month: number;
      label: string;
      transactions: Record<string, { total: number; count: number }>;
    }>;
  }>> {
    // Use the correct API endpoint path
    return this.get<any>('/my-pts/admin/stats');
  }
}

/**
 * MyPts Value API service
 */
export class MyPtsValueApi extends ApiClient {
  /**
   * Get current MyPts value
   */
  async getCurrentValue(): Promise<ApiResponse<MyPtsValue>> {
    try {
      // Get profile ID from localStorage
      const profileId = typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null;
      console.log('Getting current MyPts value with profileId:', profileId);

      // Include profileId as a query parameter for consistency with other endpoints
      const response = await this.get<MyPtsValue>(`/my-pts-value/current${profileId ? `?profileId=${profileId}` : ''}`);

      // Log the response for debugging
      console.log('MyPts value response:', response);

      // If the response is successful, map the backend response to the frontend interface
      if (response.success && response.data) {
        // Use type assertion to access backend model properties
        const backendData = response.data as any;

        // Map backend model to frontend interface if needed
        if (backendData.baseValue !== undefined) {
          console.log('Mapping backend response to frontend interface');

          // Map baseValue to valuePerPts and valuePerMyPt for frontend compatibility
          response.data.valuePerPts = backendData.baseValue;
          response.data.valuePerMyPt = backendData.baseValue;
          response.data.symbol = backendData.baseSymbol || '$';
          response.data.lastUpdated = backendData.effectiveDate || backendData.updatedAt || new Date().toISOString();

          console.log('Using current MyPts value from API:', backendData.baseValue);
        }

        // Log the value being used
        console.log('MyPts value being used:', response.data.valuePerPts || response.data.valuePerMyPt);
      }

      return response;
    } catch (error) {
      console.error('Error getting MyPts value:', error);
      // Instead of using hardcoded fallbacks, try to fetch from a different endpoint
      try {
        console.log('Attempting to fetch MyPts value from alternative endpoint...');

        // Try the direct API endpoint as a fallback
        const fallbackResponse = await fetch(`${API_URL}/my-pts-value/current`);

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log('Successfully fetched from alternative endpoint:', fallbackData);

          if (fallbackData.success && fallbackData.data) {
            return fallbackData;
          }
        }
      } catch (fallbackError) {
        console.error('Error fetching from alternative endpoint:', fallbackError);
      }

      // If all else fails, throw an error to trigger a retry
      throw new Error('Failed to get MyPts value. Please try again later.');
    }
  }

  /**
   * Calculate value of MyPts
   */
  async calculateValue(amount: number, currency: string = 'USD'): Promise<ApiResponse<{
    myPts: number;
    valuePerMyPt: number;
    currency: string;
    symbol: string;
    totalValue: number;
    formattedValue: string;
  }>> {
    try {
      // First, try to use the ExchangeRate API
      console.log(`[FRONTEND] Calculating value of ${amount} MyPts in ${currency} using ExchangeRate API...`);

      try {
        // Fetch the exchange rates from our API endpoint
        const exchangeRateResponse = await fetch(`/api/exchange-rates/latest/USD?_t=${Date.now()}`);

        if (exchangeRateResponse.ok) {
          const exchangeRateData = await exchangeRateResponse.json();

          if (exchangeRateData.success && exchangeRateData.data && exchangeRateData.data.rates) {
            // Get the rate for the requested currency
            const rate = exchangeRateData.data.rates[currency];

            if (rate) {
              // Base value of MyPts in USD
              const baseValueInUsd = 0.024; // 1 MyPt = 0.024 USD

              // Calculate the value in the requested currency
              const valuePerMyPt = baseValueInUsd * rate;
              const totalValue = amount * valuePerMyPt;

              console.log(`[FRONTEND] Successfully got rate from ExchangeRate API: 1 USD = ${rate} ${currency}`);
              console.log(`[FRONTEND] Calculated value: ${amount} MyPts × ${valuePerMyPt} = ${totalValue} ${currency}`);

              // Get the currency symbol
              const currencySymbols: Record<string, string> = {
                'XAF': 'FCFA',
                'EUR': '€',
                'GBP': '£',
                'NGN': '₦',
                'PKR': '₨',
                'USD': '$',
                'CAD': 'CA$',
                'AUD': 'A$',
                'JPY': '¥',
                'CNY': '¥',
                'INR': '₹'
              };

              const symbol = currencySymbols[currency] || currency;

              return {
                success: true,
                data: {
                  myPts: amount,
                  valuePerMyPt: valuePerMyPt,
                  currency: currency,
                  symbol: symbol,
                  totalValue: totalValue,
                  formattedValue: `${symbol}${totalValue.toFixed(2)}`
                }
              };
            } else {
              console.warn(`[FRONTEND] ExchangeRate API doesn't have a rate for ${currency}, trying backend API`);
            }
          } else {
            console.warn(`[FRONTEND] Invalid response from ExchangeRate API, trying backend API`);
          }
        } else {
          console.warn(`[FRONTEND] Failed to fetch from ExchangeRate API (${exchangeRateResponse.status}), trying backend API`);
        }
      } catch (apiError) {
        console.error(`[FRONTEND] Error fetching from ExchangeRate API:`, apiError);
      }

      // If ExchangeRate API fails, try the backend API
      console.log(`[FRONTEND] Trying backend API for ${currency} calculation`);

      try {
        const response = await this.get<any>(`/my-pts-value/calculate?amount=${amount}&currency=${currency}`);

        // If the backend API call is successful, return the response
        if (response.success && response.data) {
          console.log(`[FRONTEND] Successfully got value from backend API: ${amount} MyPts = ${response.data.totalValue} ${currency}`);
          return response;
        }

        // If the backend API call fails, fall back to direct conversion
        console.warn(`[FRONTEND] Backend API call failed for ${currency}, using fallback`);
      } catch (apiError) {
        console.error(`[FRONTEND] Error calling backend API for ${currency}:`, apiError);
      }

      // Fallback to direct conversion if both APIs fail
      const fallbackValues: Record<string, { value: number, symbol: string }> = {
        'XAF': { value: 13.61, symbol: 'FCFA' },
        'EUR': { value: 0.0208, symbol: '€' },
        'GBP': { value: 0.0179, symbol: '£' },
        'NGN': { value: 38.26, symbol: '₦' },
        'PKR': { value: 6.74, symbol: '₨' },
        'USD': { value: 0.024, symbol: '$' }
      };

      if (fallbackValues[currency]) {
        const fallbackValue = fallbackValues[currency].value;
        const totalValue = amount * fallbackValue;

        console.log(`[FRONTEND] Using fallback for ${currency}: ${amount} MyPts × ${fallbackValue} = ${totalValue}`);

        return {
          success: true,
          data: {
            myPts: amount,
            valuePerMyPt: fallbackValue,
            currency: currency,
            symbol: fallbackValues[currency].symbol,
            totalValue: totalValue,
            formattedValue: `${fallbackValues[currency].symbol}${totalValue.toFixed(2)}`
          }
        };
      }

      // For other currencies, use the API
      return this.get<any>(`/my-pts-value/calculate?amount=${amount}&currency=${currency}`);
    } catch (error) {
      console.error('Error calculating MyPts value:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to calculate MyPts value'
      };
    }
  }

  /**
   * Convert currency to MyPts
   */
  async convertToMyPts(amount: number, currency: string = 'USD'): Promise<ApiResponse<{
    currencyAmount: number;
    currency: string;
    symbol: string;
    valuePerMyPt: number;
    myPtsAmount: number;
    formattedCurrencyValue: string;
    formattedMyPtsValue: string;
  }>> {
    try {
      // First, try to use the ExchangeRate API
      console.log(`[FRONTEND] Converting ${amount} ${currency} to MyPts using ExchangeRate API...`);

      try {
        // Fetch the exchange rates from our API endpoint
        const exchangeRateResponse = await fetch(`/api/exchange-rates/latest/USD?_t=${Date.now()}`);

        if (exchangeRateResponse.ok) {
          const exchangeRateData = await exchangeRateResponse.json();

          if (exchangeRateData.success && exchangeRateData.data && exchangeRateData.data.rates) {
            // Get the rate for the requested currency
            const rate = exchangeRateData.data.rates[currency];

            if (rate) {
              // Base value of MyPts in USD
              const baseValueInUsd = 0.024; // 1 MyPt = 0.024 USD

              // Calculate the value in the requested currency
              const valuePerMyPt = baseValueInUsd * rate;
              const myPtsAmount = amount / valuePerMyPt;

              console.log(`[FRONTEND] Successfully got rate from ExchangeRate API: 1 USD = ${rate} ${currency}`);
              console.log(`[FRONTEND] Calculated conversion: ${amount} ${currency} ÷ ${valuePerMyPt} = ${myPtsAmount} MyPts`);

              // Get the currency symbol
              const currencySymbols: Record<string, string> = {
                'XAF': 'FCFA',
                'EUR': '€',
                'GBP': '£',
                'NGN': '₦',
                'PKR': '₨',
                'USD': '$',
                'CAD': 'CA$',
                'AUD': 'A$',
                'JPY': '¥',
                'CNY': '¥',
                'INR': '₹'
              };

              const symbol = currencySymbols[currency] || currency;

              return {
                success: true,
                data: {
                  currencyAmount: amount,
                  currency: currency,
                  symbol: symbol,
                  valuePerMyPt: valuePerMyPt,
                  myPtsAmount: myPtsAmount,
                  formattedCurrencyValue: `${symbol}${amount.toFixed(2)}`,
                  formattedMyPtsValue: `${myPtsAmount.toFixed(2)} MyPts`
                }
              };
            } else {
              console.warn(`[FRONTEND] ExchangeRate API doesn't have a rate for ${currency}, trying backend API`);
            }
          } else {
            console.warn(`[FRONTEND] Invalid response from ExchangeRate API, trying backend API`);
          }
        } else {
          console.warn(`[FRONTEND] Failed to fetch from ExchangeRate API (${exchangeRateResponse.status}), trying backend API`);
        }
      } catch (apiError) {
        console.error(`[FRONTEND] Error fetching from ExchangeRate API:`, apiError);
      }

      // If ExchangeRate API fails, try the backend API
      console.log(`[FRONTEND] Trying backend API for converting ${currency} to MyPts`);

      try {
        const response = await this.get<any>(`/my-pts-value/convert?amount=${amount}&currency=${currency}`);

        // If the backend API call is successful, return the response
        if (response.success && response.data) {
          console.log(`[FRONTEND] Successfully got conversion from backend API: ${amount} ${currency} = ${response.data.myPtsAmount} MyPts`);
          return response;
        }

        // If the backend API call fails, fall back to direct conversion
        console.warn(`[FRONTEND] Backend API call failed for ${currency}, using fallback`);
      } catch (apiError) {
        console.error(`[FRONTEND] Error calling backend API for ${currency}:`, apiError);
      }

      // Fallback to direct conversion if both APIs fail
      const fallbackValues: Record<string, { value: number, symbol: string }> = {
        'XAF': { value: 13.61, symbol: 'FCFA' },
        'EUR': { value: 0.0208, symbol: '€' },
        'GBP': { value: 0.0179, symbol: '£' },
        'NGN': { value: 38.26, symbol: '₦' },
        'PKR': { value: 6.74, symbol: '₨' },
        'USD': { value: 0.024, symbol: '$' }
      };

      if (fallbackValues[currency]) {
        const fallbackValue = fallbackValues[currency].value;
        const myPtsAmount = amount / fallbackValue;

        console.log(`[FRONTEND] Using fallback for ${currency}: ${amount} ${currency} ÷ ${fallbackValue} = ${myPtsAmount} MyPts`);

        return {
          success: true,
          data: {
            currencyAmount: amount,
            currency: currency,
            symbol: fallbackValues[currency].symbol,
            valuePerMyPt: fallbackValue,
            myPtsAmount: myPtsAmount,
            formattedCurrencyValue: `${fallbackValues[currency].symbol}${amount.toFixed(2)}`,
            formattedMyPtsValue: `${myPtsAmount.toFixed(2)} MyPts`
          }
        };
      }

      // For other currencies, use the API
      return this.get<any>(`/my-pts-value/convert?amount=${amount}&currency=${currency}`);
    } catch (error) {
      console.error('Error converting to MyPts:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to convert to MyPts'
      };
    }
  }

  /**
   * Get total MyPts supply
   */
  async getTotalSupply(currency: string = 'USD'): Promise<ApiResponse<{
    totalSupply: number;
    valuePerMyPt: number;
    currency: string;
    symbol: string;
    totalValue: number;
    formattedValue: string;
  }>> {
    return this.get<any>(`/my-pts-value/total-supply?currency=${currency}`);
  }

  /**
   * Get supported currencies
   */
  async getSupportedCurrencies(): Promise<ApiResponse<{
    currencies: Array<{
      code: string;
      symbol: string;
      isBase: boolean;
    }>;
    baseCurrency: string;
  }>> {
    return this.get<any>('/my-pts-value/currencies');
  }

  /**
   * Update exchange rates (admin only)
   */
  async updateExchangeRates(exchangeRates: Array<{
    currency: string;
    rate: number;
    symbol: string;
  }>): Promise<ApiResponse<{
    value: any;
    message: string;
  }>> {
    return this.post<any>('/my-pts-value/exchange-rates', {
      exchangeRates
    });
  }
}

/**
 * MyPts Hub API service for admins
 */
export class MyPtsHubApi extends ApiClient {
  // Override the get method to prevent adding profileId for admin endpoints
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = this.getHeaders();

      // For admin endpoints, don't automatically add profileId
      const url = `${API_URL}${endpoint}`;

      console.log(`Making admin GET request to ${url}`, { headers });

      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include', // This is crucial for sending cookies
        cache: 'no-cache', // Disable caching
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      // Log response status
      console.log(`Response status for ${endpoint}:`, response.status);
      console.log(`Response from ${endpoint}:`, { status: response.status, statusText: response.statusText });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`Error in admin GET request to ${endpoint}:`, error);

      // Check if it's an abort error (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Request timed out. Please try again.',
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  /**
   * Get hub state
   */
  async getHubState(): Promise<ApiResponse<MyPtsHubState>> {
    return this.get<MyPtsHubState>('/my-pts-hub/state');
  }

  /**
   * Get supply logs
   */
  async getSupplyLogs(
    filter: {
      action?: string;
      startDate?: Date;
      endDate?: Date;
      adminId?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {},
    pagination: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ApiResponse<{
    logs: any[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    }
  }>> {
    const params = new URLSearchParams();

    if (filter.action) params.append('action', filter.action);
    if (filter.startDate) params.append('startDate', filter.startDate.toISOString());
    if (filter.endDate) params.append('endDate', filter.endDate.toISOString());
    if (filter.adminId) params.append('adminId', filter.adminId);
    if (filter.sortBy) params.append('sortBy', filter.sortBy);
    if (filter.sortOrder) params.append('sortOrder', filter.sortOrder);

    if (pagination.limit) params.append('limit', pagination.limit.toString());
    if (pagination.offset) params.append('offset', pagination.offset.toString());

    return this.get<any>(`/my-pts-hub/logs?${params.toString()}`);
  }

  /**
   * Issue new MyPts
   */
  async issueMyPts(amount: number, reason: string, metadata?: any): Promise<ApiResponse<{
    message: string;
    totalSupply: number;
    reserveSupply: number;
    circulatingSupply: number;
  }>> {
    return this.post<any>('/my-pts-hub/issue', {
      amount,
      reason,
      metadata
    });
  }

  /**
   * Move MyPts from reserve to circulation
   */
  async moveToCirculation(amount: number, reason: string, metadata?: any): Promise<ApiResponse<{
    message: string;
    reserveSupply: number;
    circulatingSupply: number;
  }>> {
    return this.post<any>('/my-pts-hub/move-to-circulation', {
      amount,
      reason,
      metadata
    });
  }

  /**
   * Move MyPts from circulation to reserve
   */
  async moveToReserve(amount: number, reason: string, metadata?: any): Promise<ApiResponse<{
    message: string;
    reserveSupply: number;
    circulatingSupply: number;
  }>> {
    return this.post<any>('/my-pts-hub/move-to-reserve', {
      amount,
      reason,
      metadata
    });
  }

  /**
   * Adjust maximum supply
   */
  async adjustMaxSupply(maxSupply: number | null, reason: string): Promise<ApiResponse<{
    message: string;
    maxSupply: number | null;
    totalSupply: number;
  }>> {
    return this.post<any>('/my-pts-hub/adjust-max-supply', {
      maxSupply,
      reason
    });
  }

  /**
   * Update value per MyPt
   */
  async updateValuePerMyPt(value: number): Promise<ApiResponse<{
    message: string;
    valuePerMyPt: number;
    totalValueUSD: number;
  }>> {
    return this.post<any>('/my-pts-hub/update-value', {
      value
    });
  }

  /**
   * Initialize MyPts value system
   */
  async initialize(data: {
    baseValue: number;
    baseCurrency: string;
    baseSymbol: string;
    totalSupply: number;
    exchangeRates?: Array<{
      currency: string;
      rate: number;
      symbol: string;
    }>;
  }): Promise<ApiResponse<{
    message: string;
    valuePerMyPt: number;
    totalSupply: number;
    exchangeRates: Array<{
      currency: string;
      rate: number;
      symbol: string;
    }>;
  }>> {
    // Use the my-pts-value/initialize endpoint which exists in the backend
    return this.post<any>('/my-pts-value/initialize', data);
  }

  /**
   * Verify system consistency
   */
  async verifySystemConsistency(): Promise<ApiResponse<{
    hubCirculatingSupply: number;
    actualCirculatingSupply: number;
    difference: number;
    isConsistent: boolean;
    message: string;
  }>> {
    return this.get<any>('/my-pts-hub/verify-consistency');
  }

  /**
   * Reconcile supply
   */
  async reconcileSupply(reason: string): Promise<ApiResponse<{
    message: string;
    previousCirculating: number;
    actualCirculating: number;
    difference: number;
    action: string;
  }>> {
    return this.post<any>('/my-pts-hub/reconcile', {
      reason
    });
  }

  /**
   * Admin withdrawal of MyPts from a profile
   */
  async adminWithdrawMyPts(profileId: string, amount: number, reason?: string): Promise<ApiResponse<{
    transaction: any;
    newBalance: number;
  }>> {
    return this.post<any>('/my-pts/admin/withdraw', {
      profileId,
      amount,
      reason
    });
  }

  /**
   * Get all profile transactions (admin only)
   */
  async getAllProfileTransactions(
    params: {
      limit?: number;
      offset?: number;
      sort?: 'asc' | 'desc';
      profileId?: string;
      type?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<ApiResponse<{
    transactions: MyPtsTransaction[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    }
  }>> {
    const queryParams = new URLSearchParams();

    if (params.profileId) {
      queryParams.append('profileId', params.profileId);
    }

    if (params.type) {
      queryParams.append('type', params.type);
    }

    if (params.status) {
      queryParams.append('status', params.status);
    }

    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    if (params.offset) {
      queryParams.append('offset', params.offset.toString());
    }

    if (params.sort) {
      queryParams.append('sort', params.sort);
    }

    if (params.startDate) {
      queryParams.append('startDate', params.startDate.toISOString());
    }

    if (params.endDate) {
      queryParams.append('endDate', params.endDate.toISOString());
    }

    return this.get<any>(`/my-pts/admin/transactions?${queryParams.toString()}`);
  }
}

// Export instances
export const myPtsApi = new MyPtsApi();
export const myPtsValueApi = new MyPtsValueApi();
export const myPtsHubApi = new MyPtsHubApi();
