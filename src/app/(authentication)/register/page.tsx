"use client";

import { Suspense } from "react";
import { RegistrationFlow } from "@/components/auth/registration-flow";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen w-full">
          <div className="flex flex-col gap-5 w-full max-w-lg border rounded-xl overflow-hidden p-10 bg-white shadow">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <h2 className="text-xl font-medium">Loading registration form...</h2>
            </div>
          </div>
        </div>
      }
    >
      <RegistrationFlow />
    </Suspense>
  );
}
