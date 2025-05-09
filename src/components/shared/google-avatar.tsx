'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface GoogleAvatarProps {
  profileImageUrl: string;
  fallbackText: string;
  size?: number;
  className?: string;
}

export function GoogleAvatar({
  profileImageUrl,
  fallbackText,
  size = 32,
  className = ''
}: GoogleAvatarProps) {
  const [error, setError] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 32, height: 32 });

  // Reset error state if URL changes
  useEffect(() => {
    setError(false);

    // Set dimensions based on size prop
    setDimensions({
      width: size,
      height: size
    });

    // Log avatar information for debugging
    console.log('GoogleAvatar props:', {
      profileImageUrl,
      fallbackText,
      size,
      hasValidUrl: !!profileImageUrl && profileImageUrl !== 'undefined' && profileImageUrl !== 'null'
    });
  }, [profileImageUrl, size]);

  // Get initials for fallback with improved handling
  const getInitials = () => {
    if (!fallbackText) return 'U';

    // Handle email addresses by using first part before @
    if (fallbackText.includes('@')) {
      const emailName = fallbackText.split('@')[0];
      // If email has dots or underscores, treat them as word separators
      const parts = emailName.split(/[._-]/);
      if (parts.length > 1) {
        return parts.map(part => part.charAt(0)).join('').toUpperCase();
      }
      // Otherwise just use first two characters of email name
      return emailName.substring(0, 2).toUpperCase();
    }

    // Handle normal names
    return fallbackText
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  // If there's an error or no valid URL, show fallback
  if (error || !profileImageUrl || profileImageUrl === 'undefined' || profileImageUrl === 'null') {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-primary text-primary-foreground ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-sm font-medium">{getInitials()}</span>
      </div>
    );
  }

  // Otherwise show the image
  return (
    <div className={`relative overflow-hidden rounded-full ${className}`} style={{ width: size, height: size }}>
      <Image
        src={profileImageUrl}
        width={dimensions.width}
        height={dimensions.height}
        alt={fallbackText || 'User avatar'}
        className="object-cover w-full h-full"
        onError={() => {
          console.error('Failed to load Google profile image:', profileImageUrl);
          setError(true);
        }}
      />
    </div>
  );
}
