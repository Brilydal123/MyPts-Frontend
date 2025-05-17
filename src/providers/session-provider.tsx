'use client';

import { ReactNode } from 'react';
import { EnhancedSessionProvider } from '@/components/providers/enhanced-session-provider';

interface NextAuthProviderProps {
  children: ReactNode;
}

export function NextAuthProvider({ children }: NextAuthProviderProps) {
  return <EnhancedSessionProvider>{children}</EnhancedSessionProvider>;
}
