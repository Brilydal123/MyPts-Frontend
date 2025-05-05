"use client";

import React from "react";
import { NetworkErrorAlert } from "@/components/ui/network-error-alert";
import { Card, CardContent } from "@/components/ui/card";
import { handleNetworkError } from "@/components/shared/error-handlers";

interface ReferralErrorHandlerProps {
  error: Error | unknown;
  onRetry: () => void;
}

export function ReferralErrorHandler({ error, onRetry }: ReferralErrorHandlerProps) {
  // Use the global error handler to get consistent error messages
  const errorDetails = handleNetworkError(error, {
    showToast: false,
    context: "referral data"
  });

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
