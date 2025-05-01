'use client';

import { Suspense } from 'react';
import { GoogleAuthCallback } from '@/components/auth/google-auth-callback';

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoogleAuthCallback />
    </Suspense>
  );
}
