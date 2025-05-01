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

      // Log response status
      console.log(`Response status for ${endpoint}:`, response.status);
      console.log(`Response from ${endpoint}:`, { status: response.status, statusText: response.statusText });

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

      console.log(`Making POST request to ${url}`, { headers, data });

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

      console.log(`Response from ${endpoint}:`, { status: response.status, statusText: response.statusText });

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
   * Get the current user's MyPts balance
   */
  async getBalance(currency: string = 'USD'): Promise<ApiResponse<MyPtsBalance>> {
    try {
      // Get profile ID from localStorage
      const profileId = typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null;
      console.log("🚀 ~ MyPtsApi ~ getBalance ~ profileId:", profileId)

      // For direct conversion currencies, handle the calculation in the frontend
      const directConversions: Record<string, { value: number, symbol: string }> = {
        'XAF': { value: 13.61, symbol: 'FCFA' },  // 1 MyPt = 13.61 XAF
        'EUR': { value: 0.0208, symbol: '€' },    // 1 MyPt = 0.0208 EUR
        'GBP': { value: 0.0179, symbol: '£' },    // 1 MyPt = 0.0179 GBP
        'NGN': { value: 38.26, symbol: '₦' },     // 1 MyPt = 38.26 NGN
        'PKR': { value: 6.74, symbol: '₨' }       // 1 MyPt = 6.74 PKR
      };

      // Include profileId as a query parameter
      const response = await this.get<MyPtsBalance>(`/my-pts/balance?currency=${currency}${profileId ? `&profileId=${profileId}` : ''}`);

      // If it's a direct conversion currency, update the value
      if (response.success && response.data && directConversions[currency]) {
        const directValue = directConversions[currency].value;
        const symbol = directConversions[currency].symbol;

        console.log(`Updating balance value for ${currency} using direct conversion: ${directValue}`);

        // Update the value in the response
        response.data.value.valuePerMyPt = directValue;
        response.data.value.symbol = symbol;
        response.data.value.totalValue = response.data.balance * directValue;
        response.data.value.formattedValue = `${symbol}${response.data.value.totalValue.toFixed(2)}`;
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
    return this.post<any>('/my-pts/award', {
      profileId,
      amount,
      reason
    });
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

      // If the response is successful, handle special currency cases
      if (response.success && response.data) {
        // Handle case where valuePerPts is missing
        if (!response.data.valuePerPts && !response.data.valuePerMyPt) {
          console.warn('MyPts value is 0 or undefined, using fallback value');
          response.data.valuePerPts = 0.024; // Default fallback value
          response.data.symbol = response.data.symbol || response.data.baseSymbol || '$';
        }

        // Create a direct conversion map for currencies that have a fixed value per MyPt
        const directConversions: Record<string, number> = {
          'XAF': 13.61,  // 1 MyPt = 13.61 XAF
          'EUR': 0.0208, // 1 MyPt = 0.0208 EUR
          'GBP': 0.0179, // 1 MyPt = 0.0179 GBP
          'NGN': 38.26,  // 1 MyPt = 38.26 NGN
          'PKR': 6.74    // 1 MyPt = 6.74 PKR
        };

        // Update exchange rates for direct conversion currencies
        if (response.data?.exchangeRates && Array.isArray(response.data.exchangeRates)) {
          response.data.exchangeRates.forEach(rate => {
            if (rate.currency && directConversions[rate.currency]) {
              // Calculate the rate that would give us the direct conversion value
              // when multiplied by the base value (0.024 USD)
              const directValue = directConversions[rate.currency];
              const baseValue = response.data?.valuePerPts || 0.024;

              // Set the rate to achieve the direct conversion
              const newRate = directValue / baseValue;
              console.log(`Updating ${rate.currency} rate from ${rate.rate} to ${newRate} for direct conversion`);
              rate.rate = newRate;
            }
          });
        }
      }

      return response;
    } catch (error) {
      console.error('Error getting MyPts value:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get MyPts value',
        data: {
          valuePerPts: 0.024, // Fallback value
          valuePerMyPt: 0.024, // Fallback value
          baseCurrency: 'USD',
          baseSymbol: '$',
          symbol: '$',
          lastUpdated: new Date().toISOString(),
          exchangeRates: [],
          totalSupply: 0,
          totalValueUSD: 0
        }
      };
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
      // For direct conversion currencies, handle the calculation in the frontend
      const directConversions: Record<string, { value: number, symbol: string }> = {
        'XAF': { value: 13.61, symbol: 'FCFA' },  // 1 MyPt = 13.61 XAF
        'EUR': { value: 0.0208, symbol: '€' },    // 1 MyPt = 0.0208 EUR
        'GBP': { value: 0.0179, symbol: '£' },    // 1 MyPt = 0.0179 GBP
        'NGN': { value: 38.26, symbol: '₦' },     // 1 MyPt = 38.26 NGN
        'PKR': { value: 6.74, symbol: '₨' }       // 1 MyPt = 6.74 PKR
      };

      // If it's a direct conversion currency, calculate it directly
      if (directConversions[currency]) {
        const directValue = directConversions[currency].value;
        const totalValue = amount * directValue;

        console.log(`Direct conversion for ${currency}: ${amount} MyPts × ${directValue} = ${totalValue}`);

        return {
          success: true,
          data: {
            myPts: amount,
            valuePerMyPt: directValue,
            currency: currency,
            symbol: directConversions[currency].symbol,
            totalValue: totalValue,
            formattedValue: `${directConversions[currency].symbol}${totalValue.toFixed(2)}`
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
      // For direct conversion currencies, handle the calculation in the frontend
      const directConversions: Record<string, { value: number, symbol: string }> = {
        'XAF': { value: 13.61, symbol: 'FCFA' },  // 1 MyPt = 13.61 XAF
        'EUR': { value: 0.0208, symbol: '€' },    // 1 MyPt = 0.0208 EUR
        'GBP': { value: 0.0179, symbol: '£' },    // 1 MyPt = 0.0179 GBP
        'NGN': { value: 38.26, symbol: '₦' },     // 1 MyPt = 38.26 NGN
        'PKR': { value: 6.74, symbol: '₨' }       // 1 MyPt = 6.74 PKR
      };

      // If it's a direct conversion currency, calculate it directly
      if (directConversions[currency]) {
        const directValue = directConversions[currency].value;
        const myPtsAmount = amount / directValue;

        console.log(`Direct conversion from ${currency} to MyPts: ${amount} ${currency} ÷ ${directValue} = ${myPtsAmount} MyPts`);

        return {
          success: true,
          data: {
            currencyAmount: amount,
            currency: currency,
            symbol: directConversions[currency].symbol,
            valuePerMyPt: directValue,
            myPtsAmount: myPtsAmount,
            formattedCurrencyValue: `${directConversions[currency].symbol}${amount.toFixed(2)}`,
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
