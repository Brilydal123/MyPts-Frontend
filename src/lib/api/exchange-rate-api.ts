/**
 * Exchange Rate API Service
 *
 * This service provides functions to interact with the ExchangeRate-API
 * for fetching currency exchange rates and performing currency conversions.
 *
 * API Documentation: https://www.exchangerate-api.com/docs
 */

import { ApiResponse } from '@/types/api';

// Types for API responses
interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

interface PairConversionResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  target_code: string;
  conversion_rate: number;
  conversion_result?: number;
}

// Types for our internal API responses
export interface ExchangeRates {
  baseCurrency: string;
  rates: Record<string, number>;
  lastUpdated: string;
  nextUpdate: string;
}

export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  fromAmount?: number;
  toAmount?: number;
}

/**
 * ExchangeRateAPI class for handling currency exchange rate operations
 */
class ExchangeRateAPI {
  private readonly apiUrl = '/api/exchange-rates';

  /**
   * Get the latest exchange rates for a base currency
   * @param baseCurrency The base currency code (e.g., 'USD', 'EUR')
   * @returns Promise with exchange rates data
   */
  async getLatestRates(baseCurrency: string = 'USD'): Promise<ApiResponse<ExchangeRates>> {
    try {
      console.log(`[EXCHANGE-API] Fetching latest rates for ${baseCurrency} from ${this.apiUrl}/latest/${baseCurrency}`);

      // Add cache-busting parameter
      const url = `${this.apiUrl}/latest/${baseCurrency}?_t=${Date.now()}`;
      const response = await fetch(url);

      console.log(`[EXCHANGE-API] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        console.log(`[EXCHANGE-API] Successfully fetched rates for ${baseCurrency}`);
        console.log(`[EXCHANGE-API] Base currency: ${data.data.baseCurrency}`);
        console.log(`[EXCHANGE-API] Number of rates: ${Object.keys(data.data.rates || {}).length}`);

        // Log some example rates
        const exampleCurrencies = ['EUR', 'GBP', 'JPY', 'PKR', 'NGN', 'XAF'];
        console.log('[EXCHANGE-API] Example rates:');
        exampleCurrencies.forEach(curr => {
          if (data.data.rates && data.data.rates[curr]) {
            console.log(`[EXCHANGE-API] 1 ${baseCurrency} = ${data.data.rates[curr]} ${curr}`);
          } else {
            console.log(`[EXCHANGE-API] Rate for ${curr} not found in response`);
          }
        });
      } else {
        console.warn(`[EXCHANGE-API] Invalid response format:`, data);
      }

      return data;
    } catch (error) {
      console.error('[EXCHANGE-API] Error fetching exchange rates:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch exchange rates'
      };
    }
  }

  /**
   * Convert an amount from one currency to another
   * @param fromCurrency The source currency code
   * @param toCurrency The target currency code
   * @param amount The amount to convert (optional)
   * @returns Promise with conversion data
   */
  async convertCurrency(
    fromCurrency: string,
    toCurrency: string,
    amount?: number
  ): Promise<ApiResponse<CurrencyConversion>> {
    try {
      let url = `${this.apiUrl}/pair/${fromCurrency}/${toCurrency}`;

      if (amount !== undefined) {
        url += `/${amount}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error converting currency:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to convert currency'
      };
    }
  }
}

// Create and export a singleton instance
export const exchangeRateApi = new ExchangeRateAPI();
