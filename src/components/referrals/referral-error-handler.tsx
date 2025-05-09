"use client";

import React from "react";
import { NetworkErrorAlert } from "@/components/ui/network-error-alert";
import { Card, CardContent } from "@/components/ui/card";

interface ReferralErrorHandlerProps {
  error: Error | unknown;
  onRetry: () => void;
}

/**
 * Local error handler function that formats errors for display
 */
function formatErrorForDisplay(error: unknown): { title: string; message: string } {
  // Default error details
  let title = "Error";
  let message = "An unexpected error occurred. Please try again.";

  if (error instanceof Error) {
    // Handle standard Error objects
    if (error.message.includes("network") || error.message.includes("Network")) {
      title = "Connection Error";
      message = "We couldn't connect to the server. Please check your internet connection and try again.";
    } else if (error.message.includes("401") || error.message.includes("unauthorized")) {
      title = "Authentication Error";
      message = "Your session may have expired. Please log in again to continue.";
    } else {
      // Use the error message directly
      message = error.message;
    }
  } else if (typeof error === "string") {
    // Handle string errors
    message = error;
  } else if (error && typeof error === "object") {
    // Handle error objects with message property
    const errorObj = error as any;
    if (errorObj.message) {
      message = errorObj.message;
    }
  }

  return { title, message };
}

export function ReferralErrorHandler({ error, onRetry }: ReferralErrorHandlerProps) {
  // Format the error for display
  const errorDetails = formatErrorForDisplay(error);

  return (
    <Card className="border-none shadow-none">
      <CardContent className="pt-6">
        <NetworkErrorAlert
          title={errorDetails.title}
          message={errorDetails.message}
          onRetry={onRetry}
        />
      </CardContent>
    </Card>
  );
}
