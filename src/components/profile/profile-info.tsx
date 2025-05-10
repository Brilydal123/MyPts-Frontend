import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfileInfo } from "@/hooks/use-mypts-data";

// Helper function to format profile name
const formatProfileName = (profile: any) => {
  if (!profile) return '';

  // Extract profile type for display
  const profileType = profile.profileType
    ? profile.profileType.charAt(0).toUpperCase() + profile.profileType.slice(1)
    : profile.type?.subtype
      ? profile.type.subtype.charAt(0).toUpperCase() + profile.type.subtype.slice(1)
      : '';

  // Get the base name (either username or name)
  let baseName = profile.name;

  // If the name already includes the profile type and "Profile", return it as is
  if (baseName && baseName.includes(profileType) && baseName.includes('Profile')) {
    return baseName;
  }

  // Extract just the name part (without profile type and "Profile")
  if (baseName) {
    // Remove any existing "Profile" suffix
    baseName = baseName.replace(/\s+Profile$/i, '');

    // Remove any existing profile type
    baseName = baseName.replace(new RegExp(`\\s+${profileType}\\s*`, 'i'), ' ');

    // Trim any extra spaces
    baseName = baseName.trim();

    // Capitalize the first letter
    if (baseName.length > 0) {
      baseName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    }
  }

  // Format the name as "Name ProfileType Profile"
  return `${baseName} ${profileType} `;
};

interface ProfileInfoProps {
  profileId?: string;
  compact?: boolean;
}

export function ProfileInfo({ profileId, compact = false }: ProfileInfoProps) {
  // Use React Query hook for profile data
  const {
    data: profile,
    isLoading: loading,
    error: queryError,
  } = useProfileInfo(profileId);

  // Convert query error to string for display
  const error = queryError ? (queryError as Error).message : null;

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
        <div>
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
      className="rounded-xl border backdrop-blur-sm p-5 transition-all duration-300 hover:shadow-lg bg-red-800"
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
          letterSpacing: '-0.02em'
        }}
      >
        Profile Information
      </h3>
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
