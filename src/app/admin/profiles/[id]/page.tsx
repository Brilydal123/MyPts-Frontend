'use client';

import * as React from 'react';
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Award, Edit, Trash, RefreshCw, User, Calendar, Tag, Info, AlertCircle, CheckCircle, MinusCircle, MapPin, Share2, ShoppingBag, Gift, Link as LinkIcon } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProfile } from '@/hooks/useProfileData';
import { useMutation } from '@tanstack/react-query';
import { WithdrawMyPtsDialog } from '@/components/admin/withdraw-mypts-dialog';

interface PageParams {
  id: string;
}

interface PageProps {
  params: Promise<PageParams>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Helper component to render detail items
const DetailItem: React.FC<{ icon?: React.ElementType; label: string; value?: React.ReactNode; className?: string }> = ({ icon: Icon, label, value, className }) => {
  if (value === null || typeof value === 'undefined' || value === '') return null;
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {Icon && <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />}
      <div className={!Icon ? "ml-[20px] pl-3" : ""}>
        <p className="font-medium">{label}</p>
        {typeof value === 'string' || typeof value === 'number' || React.isValidElement(value) ? (
          <p className="text-muted-foreground break-words">{value}</p>
        ) : (
          <div className="text-muted-foreground break-words">{value}</div>
        )}
      </div>
    </div>
  );
};

// Main component for profile detail page
export default function ProfileDetailPage({ params, searchParams }: PageProps) {
  const router = useRouter();
  // Use React.use to unwrap the params Promise
  const unwrappedParams = use(params);
  const [profileId] = useState<string>(unwrappedParams.id);

  // Use our custom hook to fetch the profile
  const {
    data: profile,
    isLoading,
    refetch: refetchProfile,
    isError,
    error
  } = useProfile(profileId);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteUserAccount, setDeleteUserAccount] = useState(false);

  // Debug function to log profile data
  const handleDebugProfile = () => {
    console.log('Full profile data:', profile);
    toast.info('Profile data logged to console', {
      description: 'Check the browser console for details',
    });
  };

  // Create a delete profile mutation
  const deleteProfileMutation = useMutation({
    mutationFn: async () => {
      // Build the URL with the deleteUserAccount parameter if needed
      const url = deleteUserAccount
        ? `/api/admin/profiles/${profileId}?deleteUserAccount=true`
        : `/api/admin/profiles/${profileId}`;

      // Use fetch with credentials to ensure cookies are sent
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete profile');
      }

      return { success: true, deleteUserAccount };
    },
    onSuccess: (data) => {
      // Show different success messages based on what was deleted
      if (data.deleteUserAccount) {
        toast.success('User account and all associated profiles deleted successfully');
      } else {
        toast.success('Profile deleted successfully');
      }

      setIsDeleteDialogOpen(false);
      router.push('/admin/profiles');
    },
    onError: (error) => {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  });

  // Handle profile actions
  const handleEditProfile = () => {
    router.push(`/admin/profiles/edit/${profileId}`);
  };

  const handleRewardProfile = () => {
    router.push(`/admin/reward?profileId=${profileId}`);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    deleteProfileMutation.mutate();
  };

  // Get profile type badge
  const getProfileTypeBadge = () => {
    if (!profile) return null;

    const category = profile.type?.category || profile.profileCategory;
    const type = profile.type?.subtype || profile.profileType;

    // Format category and type for display
    const displayCategory = category ?
      category.charAt(0).toUpperCase() + category.slice(1).toLowerCase() : 'Unknown';

    const displayType = type ?
      type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : 'Unknown';

    let color = '';
    switch ((category || '').toLowerCase()) {
      case 'individual':
        color = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        break;
      case 'functional':
        color = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        break;
      case 'group':
        color = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
        break;
      default:
        color = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }

    return (
      <div className="flex flex-col gap-1">
        <Badge variant="outline" className={color}>
          {displayCategory}
        </Badge>
        <span className="text-xs text-muted-foreground">{displayType}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Profile Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">The requested profile could not be found.</p>
            <Button className="mt-4" onClick={() => router.push('/admin/profiles')}>
              Return to Profiles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {profile.profileInformation?.username || profile.name || 'Unnamed Profile'}
            </h1>
            <div className="flex items-center gap-2">
              {getProfileTypeBadge()}
              {profile.verificationStatus ? (
                <Badge variant={profile.verificationStatus.isVerified ? "default" : "outline"}>
                  {profile.verificationStatus.isVerified ? 'Verified' : 'Unverified'}
                </Badge>
              ) : (
                <Badge variant={profile.claimed ? "default" : "outline"}>
                  {profile.claimed ? 'Claimed' : 'Unclaimed'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => refetchProfile()} className="flex-1 sm:flex-none">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleEditProfile} className="flex-1 sm:flex-none">
            <Edit className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Edit</span>
            <span className="sm:hidden">Edit</span>
          </Button>
          <Button variant="default" size="sm" onClick={handleRewardProfile} className="flex-1 sm:flex-none">
            <Award className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Reward MyPts</span>
            <span className="sm:hidden">Reward</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteClick} className="flex-1 sm:flex-none">
            <Trash className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Delete</span>
            <span className="sm:hidden">Delete</span>
          </Button>
          {process.env.NODE_ENV !== 'production' && (
            <Button variant="outline" size="sm" onClick={handleDebugProfile} className="flex-1 sm:flex-none">
              <Info className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Debug</span>
              <span className="sm:hidden">Debug</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Basic details about this profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Description</p>
                <p className="text-muted-foreground">{profile.description || 'No description provided'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Owner</p>
                <p className="text-muted-foreground">
                  {profile.owner ? (
                    typeof profile.owner === 'string' ?
                      profile.owner :
                      profile.owner._id ? profile.owner._id : 'Unknown'
                  ) : profile.profileInformation?.creator ? (
                    typeof profile.profileInformation.creator === 'string' ?
                      profile.profileInformation.creator :
                      profile.profileInformation.creator.$oid ?
                        profile.profileInformation.creator.$oid : 'Unknown'
                  ) : 'Unknown'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Profile ID</p>
                <p className="text-muted-foreground">{profile._id}</p>
              </div>
            </div>

            {profile.secondaryId && (
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Secondary ID</p>
                  <p className="text-muted-foreground">{profile.secondaryId}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Created</p>
                <p className="text-muted-foreground">
                  {profile.createdAt ? (
                    <>
                      {format(new Date(profile.createdAt), 'PPP')}
                      <span className="text-xs ml-2">
                        ({formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })})
                      </span>
                    </>
                  ) : 'Unknown'}
                </p>
              </div>
            </div>
            {profile.profileInformation?.profileLink && (
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Profile Link</p>
                  <p className="text-muted-foreground">{profile.profileInformation.profileLink}</p>
                </div>
              </div>
            )}
            {profile.profileInformation?.connectLink && (
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Connect Link</p>
                  <p className="text-muted-foreground">{profile.profileInformation.connectLink}</p>
                </div>
              </div>
            )}
            {profile.profileInformation?.followLink && (
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Follow Link</p>
                  <p className="text-muted-foreground">{profile.profileInformation.followLink}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>MyPts Information</CardTitle>
            <CardDescription>MyPts related data for this profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <p className="font-medium">Current Balance</p>
                <p className="text-3xl font-bold mt-1">
                  {profile.myPtsBalance ?? profile.ProfileMypts?.currentBalance ?? 0} MyPts
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={handleRewardProfile}>
                  <Award className="h-4 w-4 mr-2" />
                  Award Points
                </Button>
                <WithdrawMyPtsDialog
                  profileId={profileId}
                  profileName={profile.profileInformation?.username || profile.name || 'Unnamed Profile'}
                  currentBalance={profile.myPtsBalance ?? profile.ProfileMypts?.currentBalance ?? 0}
                  onSuccess={(newBalance) => {
                    refetchProfile();
                    toast.success(`Balance updated to ${newBalance} MyPts`);
                  }}
                />
              </div>
            </div>

            <div className="p-4 border rounded-md">
              <p className="font-medium mb-2">Lifetime MyPts</p>
              <p className="text-xl font-semibold">
                {profile.lifetimeMypts ?? profile.ProfileMypts?.lifetimeMypts ?? 0} MyPts
              </p>
            </div>

            <div className="p-4 border rounded-md">
              <p className="font-medium mb-2">Recent Transactions</p>
              {profile.recentTransactions && profile.recentTransactions.length > 0 ? (
                <div className="space-y-2">
                  {profile.recentTransactions.map((transaction: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                      <span>{transaction.type}</span>
                      <span className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount} MyPts
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No recent transactions</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => router.push(`/admin/profile-transactions?profileId=${profileId}`)}>
              View All Transactions
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Additional Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
            <CardDescription>Profile verification information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.verificationStatus && (
              <div className="flex items-start gap-3">
                <div className="p-4 border rounded-md w-full">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">Verification Status</p>
                    <Badge variant={profile.verificationStatus.isVerified ? "default" : "outline"}>
                      {profile.verificationStatus.isVerified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </div>
                  {profile.verificationStatus.badge && (
                    <div className="flex justify-between items-center mt-2">
                      <p className="font-medium">Badge</p>
                      <span>{profile.verificationStatus.badge}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {profile.kycVerification && (
              <div className="flex items-start gap-3">
                <div className="p-4 border rounded-md w-full">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">KYC Status</p>
                    <Badge variant={profile.kycVerification.status === "approved" ? "default" : "outline"}>
                      {profile.kycVerification.status || 'Not Started'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="font-medium">Verification Level</p>
                    <span>{profile.kycVerification.verificationLevel || 'None'}</span>
                  </div>
                </div>
              </div>
            )}

            {profile.verifications && (
              <div className="flex items-start gap-3">
                <div className="p-4 border rounded-md w-full">
                  <p className="font-medium mb-2">Verification Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span>Email:</span>
                      {profile.verifications.email ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Phone:</span>
                      {profile.verifications.phone ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Identity:</span>
                      {profile.verifications.identity ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Professional:</span>
                      {profile.verifications.professional ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Statistics</CardTitle>
            <CardDescription>Usage and engagement metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.analytics && (
              <div className="flex items-start gap-3">
                <div className="p-4 border rounded-md w-full">
                  <p className="font-medium mb-2">Analytics</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{profile.analytics.views || 0}</p>
                      <p className="text-xs text-muted-foreground">Views</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{profile.analytics.connections || 0}</p>
                      <p className="text-xs text-muted-foreground">Connections</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{profile.analytics.engagement || 0}</p>
                      <p className="text-xs text-muted-foreground">Engagement</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {profile.stats && (
              <div className="flex items-start gap-3">
                <div className="p-4 border rounded-md w-full">
                  <p className="font-medium mb-2">Detailed Statistics</p>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    {Object.entries(profile.stats).map(([key, value]) => {
                      // Skip rendering if the value is an object
                      if (typeof value === 'object' && value !== null) {
                        const count = Array.isArray(value) ? value.length : Object.keys(value).length;
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span>{count} items</span>
                          </div>
                        );
                      }

                      // Render normal values
                      return (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^\w/, c => c.toUpperCase())}:
                          </span>
                          <span>{String(value || 0)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Privacy and Security Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>Profile privacy configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.privacySettings && (
              <div className="p-4 border rounded-md w-full">
                <div className="grid grid-cols-2 gap-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visibility:</span>
                    <Badge variant="outline">{profile.privacySettings.visibility || 'Unknown'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Searchable:</span>
                    {profile.privacySettings.searchable ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Show Contact Info:</span>
                    {profile.privacySettings.showContactInfo ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Show Social Links:</span>
                    {profile.privacySettings.showSocialLinks ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Profile security configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.security && (
              <div className="p-4 border rounded-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">Two-Factor Authentication:</span>
                  {profile.security.twoFactorRequired ? (
                    <Badge variant="default">Enabled</Badge>
                  ) : (
                    <Badge variant="outline">Disabled</Badge>
                  )}
                </div>

                <div className="mt-4">
                  <p className="font-medium mb-2">IP Whitelist</p>
                  {profile.security.ipWhitelist && profile.security.ipWhitelist.length > 0 ? (
                    <div className="space-y-2">
                      {profile.security.ipWhitelist.map((ip: string, index: number) => (
                        <div key={index} className="p-2 bg-muted/50 rounded text-sm">
                          {ip}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No IP whitelist configured</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profile Sections */}
      {(profile.sections && profile.sections.length > 0) && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Sections</CardTitle>
              <CardDescription>Content sections defined in this profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {profile.sections.map((section: any, index: number) => (
                  <div key={index} className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg">{section.label || section.key}</h3>
                      <Badge variant="outline">{section.key}</Badge>
                    </div>

                    {section.fields && section.fields.length > 0 ? (
                      <div className="space-y-3">
                        {section.fields.map((field: any, fieldIndex: number) => (
                          <div key={fieldIndex} className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                            <div className="font-medium">{field.label || field.key}</div>
                            <div className="col-span-2 break-words">
                              {field.value !== undefined ? (
                                typeof field.value === 'object' ?
                                  JSON.stringify(field.value) :
                                  String(field.value)
                              ) : 'No value'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No fields in this section</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profile Format */}
      {profile.ProfileFormat && Object.keys(profile.ProfileFormat).length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Format</CardTitle>
              <CardDescription>Visual and layout settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.ProfileFormat.profileImage && (
                  <div className="flex flex-col items-center gap-2 mb-4">
                    <img
                      src={profile.ProfileFormat.profileImage}
                      alt="Profile Image"
                      className="w-24 h-24 rounded-full object-cover border"
                    />
                    <p className="text-sm text-muted-foreground">Profile Image</p>
                  </div>
                )}

                {profile.ProfileFormat.coverImage && (
                  <div className="flex flex-col items-center gap-2 mb-4">
                    <img
                      src={profile.ProfileFormat.coverImage}
                      alt="Cover Image"
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <p className="text-sm text-muted-foreground">Cover Image</p>
                  </div>
                )}

                {profile.ProfileFormat.customization && (
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold mb-2">Customization</h3>

                    {profile.ProfileFormat.customization.theme && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Theme</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(profile.ProfileFormat.customization.theme).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{key}:</span>
                              {key.includes('color') ? (
                                <div className="flex items-center gap-1">
                                  <div
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: value as string }}
                                  ></div>
                                  <span className="text-xs">{value as string}</span>
                                </div>
                              ) : (
                                <span className="text-xs">{value as string}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.ProfileFormat.customization.layout && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Layout</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {profile.ProfileFormat.customization.layout.gridStyle && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Grid Style:</span>
                              <span>{profile.ProfileFormat.customization.layout.gridStyle}</span>
                            </div>
                          )}
                          {profile.ProfileFormat.customization.layout.animation && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Animation:</span>
                              <span>{profile.ProfileFormat.customization.layout.animation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR Code Section */}
      {(profile.qrCode || profile.ProfileQrCode?.qrCode) && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile QR Code</CardTitle>
              <CardDescription>Scan to connect with this profile</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="border p-4 rounded-md">
                <img
                  src={profile.qrCode || profile.ProfileQrCode.qrCode}
                  alt="Profile QR Code"
                  className="max-w-[200px] h-auto"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Referral Information */}
      {profile.ProfileReferal && Object.keys(profile.ProfileReferal).length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Referral Information</CardTitle>
              <CardDescription>Referral data for this profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.ProfileReferal.referalLink && (
                <div className="flex items-start gap-3">
                  <div className="p-4 border rounded-md w-full">
                    <p className="font-medium mb-2">Referral Link</p>
                    <p className="text-sm break-all">{profile.ProfileReferal.referalLink}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="p-4 border rounded-md w-full">
                  <p className="font-medium mb-2">Referrals Count</p>
                  <p className="text-2xl font-bold">{profile.ProfileReferal.referals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Information */}
      {profile.analytics && typeof profile.analytics === 'object' && Object.keys(profile.analytics).length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Information</CardTitle>
              <CardDescription>Usage and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  try {
                    // Safely process analytics data
                    return Object.entries(profile.analytics).map(([category, data]: [string, any], index) => {
                      // Skip rendering if data is not an object or is null
                      if (!data || typeof data !== 'object') return null;

                      // Create a safe copy of the data that we can render
                      const safeData: Record<string, string | number> = {};

                      Object.entries(data).forEach(([key, value]) => {
                        if (value === null || value === undefined) {
                          safeData[key] = 0;
                        } else if (typeof value === 'object') {
                          // For nested objects/arrays, store a summary
                          if (Array.isArray(value)) {
                            safeData[key] = `${value.length} items`;
                          } else {
                            const keys = Object.keys(value);
                            safeData[key] = `${keys.length} properties`;
                          }
                        } else if (typeof value === 'string' || typeof value === 'number') {
                          safeData[key] = value;
                        } else {
                          safeData[key] = String(value);
                        }
                      });

                      data = safeData;

                      return (
                        <div key={`${category}-${index}`} className="border rounded-md p-4">
                          <h3 className="font-semibold mb-3 capitalize">{category}</h3>
                          {Object.keys(data).length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {Object.entries(data).map(([key, value]: [string, any], keyIndex) => {
                                // Format the value for display
                                let displayValue = '';
                                if (value === null || value === undefined) {
                                  displayValue = '0';
                                } else if (typeof value === 'object') {
                                  // Handle nested objects by showing a summary
                                  if (Array.isArray(value)) {
                                    displayValue = `${value.length} items`;
                                  } else {
                                    const keys = Object.keys(value);
                                    displayValue = `${keys.length} properties`;
                                  }
                                } else {
                                  displayValue = String(value);
                                }

                                return (
                                  <div key={`${key}-${keyIndex}`} className="bg-muted/50 p-3 rounded-md text-center">
                                    <p className="text-lg font-bold">{displayValue}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{key}</p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">No data available</p>
                          )}
                        </div>
                      );
                    });
                  } catch (error) {
                    console.error('Error rendering analytics:', error);
                    return (
                      <div className="border rounded-md p-4">
                        <p className="text-red-500">Error rendering analytics data</p>
                      </div>
                    );
                  }
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- New Sections for Additional Profile Details --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Location Information Card */}
        {profile.profileLocation && Object.keys(profile.profileLocation).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Location Information</CardTitle>
              <CardDescription>Geographical details of the profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(profile.profileLocation).map(([key, value]) => {
                if (typeof value === 'string' && value.trim() !== '') {
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  return <DetailItem key={key} icon={MapPin} label={label} value={value} />;
                }
                return null;
              })}
              {/* Example for nested location object if any, e.g., coordinates */}
              {/* {profile.profileLocation.coordinates && (
                <DetailItem icon={MapPin} label="Coordinates" value={`Lat: ${profile.profileLocation.coordinates.latitude}, Lng: ${profile.profileLocation.coordinates.longitude}`} />
              )} */}
            </CardContent>
          </Card>
        )}

        {/* Social Profiles Card */}
        {profile.socialProfiles && Array.isArray(profile.socialProfiles) && profile.socialProfiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Social Profiles</CardTitle>
              <CardDescription>Links to social media and other online profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.socialProfiles.map((social: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-2 border rounded-md">
                  <Share2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium">{social.platform || 'Platform'}</p>
                    {social.username && <p className="text-xs text-muted-foreground">@{social.username}</p>}
                    {social.url && (
                      <a href={social.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm break-all">
                        {social.url}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Profile Products/Services Card */}
        {profile.ProfileProducts && Array.isArray(profile.ProfileProducts) && profile.ProfileProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Products & Services</CardTitle>
              <CardDescription>Offerings by this profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {profile.ProfileProducts.map((product: any, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                  <ShoppingBag className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">
                    {typeof product === 'string' ? product : product.name || 'Unnamed Product'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Referral Information Card */}
        {profile.ProfileReferal && Object.keys(profile.ProfileReferal).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Referral Information</CardTitle>
              <CardDescription>Referral program details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.ProfileReferal.referralCode && (
                <DetailItem icon={Gift} label="Referral Code" value={profile.ProfileReferal.referralCode} />
              )}
              {profile.ProfileReferal.referralLink && (
                <DetailItem
                  icon={LinkIcon}
                  label="Referral Link"
                  value={(
                    <a href={profile.ProfileReferal.referralLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
                      {profile.ProfileReferal.referralLink}
                    </a>
                  )}
                />
              )}
              {/* Add other referral fields as needed */}
              {Object.entries(profile.ProfileReferal).map(([key, value]) => {
                if (key !== 'referralCode' && key !== 'referralLink' && typeof value === 'string' && value.trim() !== '') {
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  return <DetailItem key={key} label={label} value={value} />
                }
                return null;
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Profile Badges Card */}
      {profile.ProfileBadges && Array.isArray(profile.ProfileBadges) && profile.ProfileBadges.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Badges & Achievements</CardTitle>
              <CardDescription>Recognitions earned by this profile</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {profile.ProfileBadges.map((badge: any, index: number) => (
                <Badge key={index} variant="secondary" className="py-2 px-3 text-sm">
                  <Award className="h-4 w-4 mr-2" />
                  {typeof badge === 'string' ? badge : badge.name || 'Unnamed Badge'}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Raw Profile Data (Developer View) */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Raw Profile Data
                <Badge variant="outline">Developer View</Badge>
              </CardTitle>
              <CardDescription>Complete profile data for debugging</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 bg-muted/50 overflow-auto max-h-[500px]">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {(() => {
                    try {
                      // Create a safe copy of the profile with sanitized data
                      const sanitizeData = (data: any): any => {
                        if (data === null || data === undefined) {
                          return null;
                        }
                        if (Array.isArray(data)) {
                          return data.map(item => sanitizeData(item));
                        }
                        if (typeof data === 'object') {
                          const sanitized: Record<string, any> = {};
                          for (const [key, value] of Object.entries(data)) {
                            if (key === '_rawProfile') {
                              sanitized[key] = '[Circular Reference]';
                            } else {
                              sanitized[key] = sanitizeData(value);
                            }
                          }
                          return sanitized;
                        }
                        return data;
                      };

                      const sanitizedProfile = sanitizeData(profile);
                      return JSON.stringify(sanitizedProfile, null, 2);
                    } catch (error) {
                      return `Error serializing profile: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    }
                  })()}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Profile</DialogTitle>
            <DialogDescription>
              Choose whether to delete just this profile or the entire user account with all associated profiles.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-start space-x-3">
              <div>
                <input
                  type="radio"
                  id="delete-profile-only"
                  name="delete-option"
                  className="mt-1"
                  checked={!deleteUserAccount}
                  onChange={() => setDeleteUserAccount(false)}
                  disabled={deleteProfileMutation.isPending}
                />
              </div>
              <div>
                <label htmlFor="delete-profile-only" className="font-medium">Delete profile only</label>
                <p className="text-sm text-muted-foreground">
                  This will delete only the profile "{profile?.name}" while keeping the user account and other profiles.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div>
                <input
                  type="radio"
                  id="delete-user-account"
                  name="delete-option"
                  className="mt-1"
                  checked={deleteUserAccount}
                  onChange={() => setDeleteUserAccount(true)}
                  disabled={deleteProfileMutation.isPending}
                />
              </div>
              <div>
                <label htmlFor="delete-user-account" className="font-medium">Delete user account</label>
                <p className="text-sm text-muted-foreground">
                  This will delete the entire user account and all associated profiles. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteProfileMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteProfileMutation.isPending}
            >
              {deleteProfileMutation.isPending ? 'Deleting...' : deleteUserAccount ? 'Delete User Account' : 'Delete Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
