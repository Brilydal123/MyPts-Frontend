"use client";

import { useCallback } from "react";
// Import the handleNetworkError function from the TSX file
import { handleNetworkError } from "@/components/shared/error-handlers";

/**
 * Hook for handling errors in React Query and other async operations
 *
 * @param options Options for error handling
 * @returns Object with error handling functions
 */
export function useErrorHandler(options?: {
  showToast?: boolean;
}) {
  const { showToast = true } = options || {};

  /**
   * Handle any error with appropriate UI feedback
   */
  const handleError = useCallback((error: unknown, retryFn?: () => void) => {
    return handleNetworkError(error, {
      showToast,
      retryCallback: retryFn,
    });
  }, [showToast]);

  /**
   * Handle React Query error with appropriate UI feedback
   */
  const handleQueryError = useCallback((error: unknown, retry: () => void) => {
    return handleNetworkError(error, {
      showToast,
      retryCallback: retry,
    });
  }, [showToast]);

  return {
    handleError,
    handleQueryError,
  };
}
