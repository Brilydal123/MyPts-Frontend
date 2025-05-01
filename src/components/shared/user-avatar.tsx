'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UserAvatarProps {
  user: any;
  className?: string;
}

export function UserAvatar({ user, className = 'h-8 w-8' }: UserAvatarProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState({ width: 32, height: 32 });

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    // Use fullName or name, whichever is available
    const displayName = user?.fullName || user?.name;
    if (!displayName) return 'U';

    return displayName
      .split(' ')
      .map((part: string) => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  // Set the image URL when the user changes
  useEffect(() => {
    if (user) {
      console.log('User in UserAvatar:', user);
      console.log('User properties:', Object.keys(user));

      // Try profileImage first, then image
      const url = user.profileImage || user.image || '';
      console.log('Setting avatar image URL to:', url);
      setImageUrl(url);
      setImageError(false);

      // Parse dimensions from className
      if (className) {
        const heightMatch = className.match(/h-(\d+)/);
        const widthMatch = className.match(/w-(\d+)/);

        const height = heightMatch ? parseInt(heightMatch[1]) * 4 : 32; // Convert from rem to px (roughly)
        const width = widthMatch ? parseInt(widthMatch[1]) * 4 : 32;

        setDimensions({ width, height });
      }
    }
  }, [user, className]);

  return (
    <div className={`relative overflow-hidden rounded-full ${className}`}>
      {!imageError && imageUrl ? (
        <Image
          src={imageUrl}
          alt={user?.fullName || user?.name || 'User'}
          width={dimensions.width}
          height={dimensions.height}
          className="object-cover"
          onError={() => {
            console.log('Avatar image failed to load:', imageUrl);
            setImageError(true);
          }}
        />
      ) : (
        <Avatar className={className}>
          <AvatarFallback>{getUserInitials()}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
