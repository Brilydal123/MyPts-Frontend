import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { profileApi } from '@/lib/api/profile-api';
import Image from 'next/image';

interface ProfileInfoProps {
  profileId?: string;
  compact?: boolean;
}

export function ProfileInfo({ profileId, compact = false }: ProfileInfoProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileInfo = async () => {
      try {
        setLoading(true);
        const id = profileId || localStorage.getItem('selectedProfileId');

        if (!id) {
          setError('No profile selected');
          setLoading(false);
          return;
        }

        const profileToken = localStorage.getItem('selectedProfileToken');
        const response = await profileApi.getProfileDetails(id, profileToken || undefined);

        if (response.success && response.data) {
          setProfile(response.data);
        } else {
          setError(response.message || 'Failed to load profile');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('An error occurred while fetching profile information');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileInfo();
  }, [profileId]);

  if (loading) {
    if (compact) {
      return (
        <div className="flex items-center space-x-4 p-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-3 w-[100px]" />
          </div>
        </div>
      );
    }

    return (
      <Card className="transition-all duration-300 hover:shadow-lg shadow-md">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    if (compact) {
      return (
        <div className="p-2">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      );
    }

    return (
      <Card className="transition-all duration-300 hover:shadow-lg shadow-md border-destructive/50">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (compact && profile) {
    return (
      <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
        <Avatar className="h-10 w-10 ring-2 ring-primary/10">
          <AvatarImage src={profile.profileImage} alt={profile.name} />
          <AvatarFallback>{profile.name?.charAt(0).toUpperCase() || 'P'}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-sm font-medium">{profile.name}</h3>
          <p className="text-xs text-muted-foreground">
            {profile.profileType && (
              profile.profileType.charAt(0).toUpperCase() + profile.profileType.slice(1)
            )}
          </p>
          {profile.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{profile.description}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-lg shadow-md bg-card">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary/10">
            <AvatarImage src={profile.profileImage} alt={profile.name} />
            <AvatarFallback>{profile.name?.charAt(0).toUpperCase() || 'P'}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-medium">{profile.name}</h3>
            <p className="text-sm text-muted-foreground">
              {profile.profileType && (
                profile.profileType.charAt(0).toUpperCase() + profile.profileType.slice(1)
              )}
            </p>
            {profile.description && (
              <p className="text-sm mt-2 text-muted-foreground/90">{profile.description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
