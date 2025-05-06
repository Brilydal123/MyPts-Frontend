"use client"; // Required for useSearchParams

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import React, { Suspense } from "react";

// Helper component to ensure ResetPasswordForm is rendered within Suspense boundary
// because useSearchParams requires it.
function ResetPasswordContent() {
  return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      {/* Wrap component using useSearchParams in Suspense */}
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
