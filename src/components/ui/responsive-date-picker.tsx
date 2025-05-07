'use client';

import * as React from 'react';
import { DatePicker as DesktopDatePicker } from '@/components/ui/date-picker';
import { MobileDatePicker } from '@/components/ui/mobile-date-picker';

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minAge?: number;
}

export function DatePicker(props: DatePickerProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    // Check if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <MobileDatePicker {...props} />;
  }

  return <DesktopDatePicker {...props} />;
}
