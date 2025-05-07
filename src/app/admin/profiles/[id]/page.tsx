'use client';

import { useState, useEffect, use } from 'react';
import { profileApi } from '@/lib/api/profile-api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Award, Edit, Trash, RefreshCw, User, Calendar, Tag, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PageParams {
  id: string;
}

interface PageProps {
  params: Promise<PageParams>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function ProfileDetailPage({ params, searchParams }: PageProps) {
  const router = useRouter();
  // Use React.use to unwrap the params Promise
  const unwrappedParams = use(params);
  const [profileId] = useState<string>(unwrappedParams.id);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [deleteUserAccount, setDeleteUserAccount] = useState(false);

  // Fetch profile details
  const fetchProfileDetails = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching profile with ID:', profileId);

      // Use the profileApi service to get the profile by ID
      const result = await profileApi.getProfileByIdAdmin(profileId);

      if (result.success) {
        console.log('Profile data:', result.data);
        setProfile(result.data);
      } else {
        toast.error('Failed to fetch profile details', {
          description: result.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error fetching profile details:', error);
      toast.error('Failed to fetch profile details', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profileId) {
      fetchProfileDetails();
    }
  }, [profileId]);

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
    setIsActionLoading(true);
    try {
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

      // Show different success messages based on what was deleted
      if (deleteUserAccount) {
        toast.success('User account and all associated profiles deleted successfully');
      } else {
        toast.success('Profile deleted successfully');
      }

      setIsDeleteDialogOpen(false);
      router.push('/admin/profiles');
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Get profile type badge
  const getProfileTypeBadge = () => {
    if (!profile) return null;

    const category = profile.type?.category || profile.profileCategory;
    const type = profile.type?.subtype || profile.profileType;

    let color = '';
    switch (category?.toLowerCase()) {
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
          {category || 'Unknown'}
        </Badge>
        <span className="text-xs text-muted-foreground">{type || 'Unknown'}</span>
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
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          {getProfileTypeBadge()}
          <Badge variant={profile.claimed ? "default" : "outline"}>
            {profile.claimed ? 'Claimed' : 'Unclaimed'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchProfileDetails}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleEditProfile}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="default" size="sm" onClick={handleRewardProfile}>
            <Award className="h-4 w-4 mr-2" />
            Reward MyPts
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteClick}>
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            {profile.connectLink && (
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Connect Link</p>
                  <p className="text-muted-foreground">{profile.connectLink}</p>
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
                  {profile.myPtsBalance !== undefined ? profile.myPtsBalance : 'N/A'} MyPts
                </p>
              </div>
              <Button variant="outline" onClick={handleRewardProfile}>
                <Award className="h-4 w-4 mr-2" />
                Award Points
              </Button>
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Followers:</span>
                      <span>{profile.stats.followers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Following:</span>
                      <span>{profile.stats.following || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Donations:</span>
                      <span>{profile.stats.donations || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Employment Requests:</span>
                      <span>{profile.stats.employmentRequests || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Collaboration Requests:</span>
                      <span>{profile.stats.collaborationRequests || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Views:</span>
                      <span>{profile.stats.totalViews || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Views:</span>
                      <span>{profile.stats.monthlyViews || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Engagement:</span>
                      <span>{profile.stats.engagement || 0}</span>
                    </div>
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

      {/* QR Code Section */}
      {profile.qrCode && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile QR Code</CardTitle>
              <CardDescription>Scan to connect with this profile</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="border p-4 rounded-md">
                <img
                  src={profile.qrCode}
                  alt="Profile QR Code"
                  className="max-w-[200px] h-auto"
                />
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
                  disabled={isActionLoading}
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
                  disabled={isActionLoading}
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
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isActionLoading}
            >
              {isActionLoading ? 'Deleting...' : deleteUserAccount ? 'Delete User Account' : 'Delete Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
