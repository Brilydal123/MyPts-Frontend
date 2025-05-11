'use client';

import { ReactNode } from 'react';
import { ProfileProvider } from '@/contexts/ProfileContext';

interface LocalTransactionsLayoutProps {
  children: ReactNode;
}

export default function LocalTransactionsLayout({ children }: LocalTransactionsLayoutProps) {
  return (
    <ProfileProvider>
      {children}
    </ProfileProvider>
  );
}
