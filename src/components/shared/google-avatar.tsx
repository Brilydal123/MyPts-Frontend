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
  }, [profileImageUrl]);

  // Get initials for fallback
  const getInitials = () => {
    if (!fallbackText) return 'U';
    return fallbackText
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  // If there's an error or no URL, show fallback
  if (error || !profileImageUrl) {
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
