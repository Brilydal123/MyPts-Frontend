import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useProfileInfo } from "@/hooks/use-mypts-data";
import { countries } from "@/components/ui/country-selector-data";
import { ProfileEditForm } from "./profile-edit-form";
import { Pencil } from "lucide-react";

// Helper function to get country flag from country name or code
const getCountryFlag = (countryNameOrCode: string | undefined): string => {
  if (!countryNameOrCode) return '';

  // Try to find the country by name first
  const countryByName = countries.find(
    c => c.name.toLowerCase() === countryNameOrCode.toLowerCase()
  );

  if (countryByName) return countryByName.flag;

  // If not found by name, try by code (assuming countryNameOrCode might be a 2-letter code)
  if (countryNameOrCode.length === 2) {
    const countryByCode = countries.find(
      c => c.code.toLowerCase() === countryNameOrCode.toLowerCase()
    );
    if (countryByCode) return countryByCode.flag;
  }

  // If still not found, return a globe icon placeholder
  return '🌐';
};

// Helper function to format profile name
const formatProfileName = (profile: any) => {
  if (!profile) return '';

  // Get the base name (either username or name)
  let baseName = profile.name;

  // Extract profile type for display (for use in badges, not in the name)
  const profileType = profile.profileType
    ? profile.profileType.charAt(0).toUpperCase() + profile.profileType.slice(1)
    : profile.type?.subtype
      ? profile.type.subtype.charAt(0).toUpperCase() + profile.type.subtype.slice(1)
      : '';

  // Clean up the name if needed
  if (baseName) {
    // Remove any existing "Profile" suffix
    baseName = baseName.replace(/\s+Profile$/i, '');

    // Remove any existing profile type suffix
    if (profileType) {
      baseName = baseName.replace(new RegExp(`\\s+${profileType}\\s*$`, 'i'), '');
    }

    // Trim any extra spaces
    baseName = baseName.trim();

    // Capitalize the first letter
    if (baseName.length > 0) {
      baseName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    }
  }

  // Return just the name without appending the profile type
  return baseName;
};

interface ProfileInfoProps {
  profileId?: string;
  compact?: boolean;
  editable?: boolean;
}

export function ProfileInfo({ profileId, compact = false, editable = false }: ProfileInfoProps) {
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Use React Query hook for profile data
  const {
    data: profile,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useProfileInfo(profileId);

  // Convert query error to string for display
  const error = queryError ? (queryError as Error).message : null;

  // Handle edit button click
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Handle successful edit
  const handleEditSuccess = () => {
    setIsEditing(false);
    refetch(); // Refresh the profile data
  };

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
      <div
        className="rounded-xl border backdrop-blur-sm p-5 transition-all duration-300 hover:shadow-lg"
        style={{
          background: "linear-gradient(145deg, rgba(255, 255, 255, 1), rgba(250, 250, 252, 1))",
          borderColor: "#E1E1E6",
          borderRadius: "16px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)"
        }}
      >
        <h3
          className="text-lg font-medium mb-4"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            opacity: 0.7
          }}
        >
          Profile Information
        </h3>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-14 w-14 rounded-full" style={{ background: 'linear-gradient(145deg, #f1f5f9, #e2e8f0)' }} />
          <div className="space-y-3">
            <Skeleton className="h-5 w-[200px] rounded-md" style={{ background: 'linear-gradient(145deg, #f1f5f9, #e2e8f0)' }} />
            <Skeleton className="h-4 w-[120px] rounded-full" style={{ background: 'linear-gradient(145deg, #f1f5f9, #e2e8f0)' }} />
          </div>
        </div>
      </div>
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

  // If editing, show the edit form
  if (isEditing && profile) {
    return (
      <div className="rounded-xl border backdrop-blur-sm p-4">
        <ProfileEditForm
          profileId={profileId}
          onCancel={handleCancelEdit}
          onSuccess={handleEditSuccess}
        />
      </div>
    );
  }

  if (compact && profile) {
    return (
      <div
        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-50/30 transition-colors"
        style={{
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)"
        }}
      >
        <Avatar
          className="h-10 w-10 ring-1 ring-blue-100"
          style={{ boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)" }}
        >
          <AvatarImage src={profile.profileImage} alt={profile.name} />
          <AvatarFallback style={{ background: "linear-gradient(145deg, #3B82F6, #60A5FA)" }}>
            {formatProfileName(profile).charAt(0) || "P"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3
              className="text-sm font-medium"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
                fontWeight: 500,
                letterSpacing: '-0.01em'
              }}
            >
              {formatProfileName(profile)}
            </h3>

            {editable && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-2"
                onClick={handleEditClick}
                title="Edit profile"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="mt-1 flex items-center flex-wrap gap-1">
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                fontSize: '0.65rem'
              }}
            >
              {profile.profileType &&
                profile.profileType.charAt(0).toUpperCase() +
                profile.profileType.slice(1)}
            </span>

            {profile.secondaryId && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  fontSize: '0.65rem'
                }}
              >
                ID: {profile.secondaryId}
              </span>
            )}

            {/* Country flag display */}
            {(() => {
              // Try to get country from various possible locations in the profile object
              const country =
                // @ts-ignore - Handle potential missing properties
                profile.profileLocation?.country ||
                // @ts-ignore - Handle potential missing properties
                profile._rawProfile?.profileLocation?.country ||
                // @ts-ignore - Handle potential missing properties
                profile.countryOfResidence ||
                // @ts-ignore - Handle potential missing properties
                profile.country;

              // If country is not found in profile, try to get it from localStorage
              let userCountry = '';
              if (!country && typeof window !== 'undefined') {
                try {
                  const userDataStr = localStorage.getItem('user');
                  if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    userCountry = userData.countryOfResidence || '';
                  }
                } catch (error) {
                  console.error('Error parsing user data from localStorage:', error);
                }
              }

              const displayCountry = country || userCountry;

              if (displayCountry) {
                return (
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                      fontWeight: 500,
                      letterSpacing: '-0.01em',
                      fontSize: '0.65rem'
                    }}
                    title={displayCountry}
                  >
                    <span className="mr-1">{getCountryFlag(displayCountry)}</span>
                    {displayCountry}
                  </span>
                );
              }
              return null;
            })()}
          </div>
          {profile.description && (
            <p
              className="text-xs text-gray-500 mt-1 line-clamp-1"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                fontWeight: 400,
                letterSpacing: '-0.01em'
              }}
            >
              {profile.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border backdrop-blur-sm p-5 transition-all duration-300 hover:shadow-lg"
      style={{
        background: "linear-gradient(145deg, rgba(255, 255, 255, 1), rgba(250, 250, 252, 1))",
        borderColor: "#E1E1E6",
        borderRadius: "16px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)"
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg font-medium"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
            fontWeight: 600,
            letterSpacing: '-0.02em'
          }}
        >
          Profile Information
        </h3>

        {editable && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={handleEditClick}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <Avatar
          className="h-14 w-14 ring-2 ring-blue-100"
          style={{ boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)" }}
        >
          <AvatarImage src={profile.profileImage} alt={profile.name} />
          <AvatarFallback className="font-extrabold" style={{ background: "black", color: "white" }}>
            {formatProfileName(profile).charAt(0) || "P"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3
            className="text-base font-bold"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
              fontWeight: 500,
              letterSpacing: '-0.01em'
            }}
          >
            {profile.formattedName || formatProfileName(profile)}
          </h3>
          <div className="mt-1 flex items-center flex-wrap gap-1">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                fontWeight: 500,
                letterSpacing: '-0.01em'
              }}
            >
              {profile.profileType &&
                profile.profileType.charAt(0).toUpperCase() +
                profile.profileType.slice(1)}
            </span>

            {profile.secondaryId && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                  fontWeight: 500,
                  letterSpacing: '-0.01em'
                }}
              >
                ID: {profile.secondaryId}
              </span>
            )}

            {/* Country flag display */}
            {(() => {
              // Try to get country from various possible locations in the profile object
              const country =
                // @ts-ignore - Handle potential missing properties
                profile.profileLocation?.country ||
                // @ts-ignore - Handle potential missing properties
                profile._rawProfile?.profileLocation?.country ||
                // @ts-ignore - Handle potential missing properties
                profile.countryOfResidence ||
                // @ts-ignore - Handle potential missing properties
                profile.country;

              // If country is not found in profile, try to get it from localStorage
              let userCountry = '';
              if (!country && typeof window !== 'undefined') {
                try {
                  const userDataStr = localStorage.getItem('user');
                  if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    userCountry = userData.countryOfResidence || '';
                  }
                } catch (error) {
                  console.error('Error parsing user data from localStorage:', error);
                }
              }

              const displayCountry = country || userCountry;

              if (displayCountry) {
                return (
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                      fontWeight: 500,
                      letterSpacing: '-0.01em'
                    }}
                    title={displayCountry}
                  >
                    <span className="mr-1">{getCountryFlag(displayCountry)}</span>
                    {displayCountry}
                  </span>
                );
              }
              return null;
            })()}
          </div>
          {profile.description && (
            <p
              className="text-sm mt-2 text-gray-500"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                fontWeight: 400,
                letterSpacing: '-0.01em'
              }}
            >
              {profile.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
