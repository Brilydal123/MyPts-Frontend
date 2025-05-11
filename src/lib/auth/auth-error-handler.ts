/**
 * Utility functions for handling authentication errors gracefully
 */

/**
 * Safely execute an authentication-related API call with fallback behavior
 * @param apiCall The API call function to execute
 * @param fallbackValue The value to return if the API call fails
 * @param logPrefix A prefix for log messages
 * @returns The result of the API call or the fallback value
 */
export async function safeAuthCall<T>(
  apiCall: () => Promise<T>,
  fallbackValue: T,
  logPrefix: string = 'Auth'
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`${logPrefix} API call failed:`, error);
    console.warn(`${logPrefix} Using fallback value:`, fallbackValue);
    return fallbackValue;
  }
}

/**
 * Safely execute an authentication-related API call without expecting a return value
 * @param apiCall The API call function to execute
 * @param logPrefix A prefix for log messages
 */
export async function safeAuthAction(
  apiCall: () => Promise<any>,
  logPrefix: string = 'Auth'
): Promise<void> {
  try {
    await apiCall();
  } catch (error) {
    console.error(`${logPrefix} API action failed:`, error);
    console.warn(`${logPrefix} Continuing without completing the action`);
  }
}

/**
 * Retry an authentication-related API call with exponential backoff
 * @param apiCall The API call function to execute
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelay Initial delay in milliseconds
 * @param logPrefix A prefix for log messages
 * @returns The result of the API call or throws an error after all retries fail
 */
export async function retryAuthCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  logPrefix: string = 'Auth'
): Promise<T> {
  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      console.warn(`${logPrefix} API call failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        console.log(`${logPrefix} Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  console.error(`${logPrefix} API call failed after ${maxRetries} attempts`);
  throw lastError;
}
