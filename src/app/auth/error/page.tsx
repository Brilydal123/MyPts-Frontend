import { Suspense } from 'react';
import { AuthErrorPage } from '@/components/auth/error-page';

export default function AuthErrorPageWrapper() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <AuthErrorPage />
      </Suspense>
    </div>
  );
}
