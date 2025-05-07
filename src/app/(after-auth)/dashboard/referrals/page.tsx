'use client';

import React from 'react';
import { MainLayout } from '@/components/shared/main-layout';
import ReferralDashboard from '@/components/referrals/ReferralDashboard';

// Metadata is handled in layout.tsx since this is a client component

export default function ReferralsPage() {
  return (
    <MainLayout>
      <ReferralDashboard />
    </MainLayout>
  );
}
