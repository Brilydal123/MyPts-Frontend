"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { handleNetworkError } from "@/components/shared/error-handlers";

/**
 * Hook for handling errors in React Query and other async operations
 * 
 * @param options Options for error handling
 * @returns Object with error handling functions
 */
export function useErrorHandler(options?: {
  context?: string;
  showToast?: boolean;
}) {
  const { context = "operation", showToast = true } = options || {};

  /**
   * Handle any error with appropriate UI feedback
   */
  const handleError = useCallback((error: unknown, retryFn?: () => void) => {
    return handleNetworkError(error, {
      showToast,
      retryFn,
      context,
    });
  }, [context, showToast]);

  /**
   * Handle React Query error with appropriate UI feedback
   */
  const handleQueryError = useCallback((error: unknown, retry: () => void) => {
    return handleNetworkError(error, {
      showToast,
      retryFn: retry,
      context,
    });
  }, [context, showToast]);

  return {
    handleError,
    handleQueryError,
  };
}
