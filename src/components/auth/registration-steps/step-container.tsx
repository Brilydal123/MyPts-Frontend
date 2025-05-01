'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StepContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function StepContainer({ children, className }: StepContainerProps) {
  return (
    <div className={cn(
      "flex flex-col min-h-[500px] md:min-h-[600px] w-full max-w-md mx-auto",
      className
    )}>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
