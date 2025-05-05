"use client";

import React from "react";
import { toast } from "sonner";
import { NetworkErrorAlert } from "@/components/ui/network-error-alert";

/**
 * Global error handler for network errors
 * This function can be used to handle network errors consistently across the application
 * 
 * @param error The error object
 * @param options Additional options for handling the error
 * @returns void
 */
export function handleNetworkError(
  error: unknown, 
  options?: {
    showToast?: boolean;
    retryFn?: () => void;
    context?: string;
  }
) {
  const { showToast = true, retryFn, context = "operation" } = options || {};
  
  // Check if it's a network error
  const isNetworkError = 
    error instanceof Error && 
    (error.message === "Network Error" || 
     error.name === "AxiosError" && error.message.includes("Network Error"));
  
  // Customize message based on error type
  let title = "Error";
  let message = `We encountered a problem with this ${context}. Please try again.`;
  
  if (isNetworkError) {
    title = "Connection Error";
    message = "We couldn't connect to the server. Please check your internet connection and try again.";
  } else if (error instanceof Error && error.message.includes("401")) {
    title = "Authentication Error";
    message = "Your session may have expired. Please log in again to continue.";
  } else if (error instanceof Error) {
    message = error.message;
  }
  
  // Show toast if requested
  if (showToast) {
    toast.error(title, {
      description: message,
      action: retryFn ? {
        label: "Retry",
        onClick: retryFn,
      } : undefined,
      duration: 5000,
    });
  }
  
  // Return the error details for use in UI components
  return {
    title,
    message,
    isNetworkError,
  };
}

/**
 * Global error boundary fallback component
 * This component can be used as a fallback for error boundaries
 */
export function ErrorBoundaryFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) {
  const errorDetails = handleNetworkError(error, { showToast: false });
  
  return (
    <div className="w-full p-6 flex justify-center">
      <NetworkErrorAlert
        title={errorDetails.title}
        message={errorDetails.message}
        onRetry={resetErrorBoundary}
      />
    </div>
  );
}
