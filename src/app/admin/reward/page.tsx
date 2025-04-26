'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/custom/pagination';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { profileApi } from '@/lib/api/profile-api';
import { myPtsApi } from '@/lib/api/mypts-api';
import { Search, Award, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

// Helper function to get profile type display text
const getProfileType = (profile: any): string => {
  if (!profile) return 'Profile';

  // Handle different profile type formats
  if (profile.type) {
    if (typeof profile.type === 'string') {
      return profile.type;
    }

    if (typeof profile.type === 'object') {
      if (profile.type.subtype) return profile.type.subtype;
      if (profile.type.category) return profile.type.category;
    }
  }

  // Check for profileType field
  if (profile.profileType) return profile.profileType;

  // Check for profileCategory field
  if (profile.profileCategory) return profile.profileCategory;

  return 'Profile';
};

export default function RewardMyPtsPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [isAwarding, setIsAwarding] = useState(false);
  const [awardSuccess, setAwardSuccess] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);

  // Check for profile ID in URL parameters
  useEffect(() => {
    const profileId = searchParams?.get('profileId') || null;
    if (profileId) {
      setSelectedProfileId(profileId);
    }
  }, [searchParams]);

  // Query to fetch all profiles
  const { data: allProfilesData, isLoading: isLoadingAllProfiles, refetch: refetchAllProfiles } = useQuery({
    queryKey: ['allProfiles', page, limit],
    queryFn: async () => {
      console.log('Fetching all profiles, page:', page, 'limit:', limit);
      const response = await profileApi.getAllProfiles(page, limit);
      console.log('All profiles response:', response);
      return response;
    },
    enabled: true,
  });

  // Query to search for profiles
  const { data: searchResults, isLoading: isSearching, refetch } = useQuery({
    queryKey: ['searchProfiles', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return { success: true, data: [] };

      // Check if the search query is a valid MongoDB ObjectId (24 hex characters)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(searchQuery);

      if (isObjectId) {
        // Skip the search query function for direct ID lookups
        // This will be handled by the handleSearch function
        return { success: true, data: [] };
      }

      // Regular search by name/email
      console.log('Executing search query for:', searchQuery);
      const response = await profileApi.searchProfiles(searchQuery);
      console.log('Search response:', response);
      return response;
    },
    enabled: searchQuery.length >= 2 && !/^[0-9a-fA-F]{24}$/.test(searchQuery),
  });

  // Update filtered profiles when search results or all profiles change
  useEffect(() => {
    if (searchQuery.length >= 2 && searchResults?.success && searchResults.data && searchResults.data.length > 0) {
      // If we have search results, use them
      setFilteredProfiles(searchResults.data);
    } else if (allProfilesData?.success && allProfilesData.data?.profiles) {
      // Otherwise, use all profiles
      setFilteredProfiles(allProfilesData.data.profiles);
    } else {
      // Fallback to empty array
      setFilteredProfiles([]);
    }
  }, [searchResults, allProfilesData, searchQuery]);

  // Handle search
  const handleSearch = async () => {
    if (searchQuery.length >= 2) {
      // Check if the search query is a valid MongoDB ObjectId (24 hex characters)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(searchQuery);

      if (isObjectId) {
        // If it looks like an ID, try to fetch the profile directly using the admin API
        try {
          console.log('Attempting direct profile lookup by ID using admin API:', searchQuery);
          const response = await profileApi.getProfileByIdAdmin(searchQuery);
          console.log('Admin profile lookup response:', response);

          if (response.success && response.data) {
            // If found, set it as the selected profile
            setSelectedProfileId(searchQuery);
            setSearchQuery(''); // Clear the search query
            toast.success('Profile found and selected');
            return;
          } else {
            toast.error('Could not find a profile with that ID');
            return;
          }
        } catch (error) {
          console.error('Error fetching profile by ID:', error);
          toast.error('Could not find a profile with that ID');
          // Don't continue with search if ID lookup fails
          return;
        }
      }

      // Perform regular search
      console.log('Performing regular profile search for:', searchQuery);
      refetch();
    }
  };

  // Handle profile selection
  const handleSelectProfile = (profileId: string) => {
    console.log('Profile selected:', profileId);
    setSelectedProfileId(profileId);
    // Clear the search results
    setSearchQuery('');
  };

  // Handle award submission
  const handleAwardMyPts = async () => {
    if (!selectedProfileId) {
      toast.error('Please select a profile');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsAwarding(true);
    setAwardSuccess(false);

    try {
      const response = await myPtsApi.awardMyPts(selectedProfileId, amount, reason || 'Admin reward');

      if (response.success) {
        toast.success(`Successfully awarded ${amount} MyPts to the profile`);
        setAwardSuccess(true);
        // Reset form
        setAmount(0);
        setReason('');
      } else {
        toast.error(response.message || 'Failed to award MyPts');
      }
    } catch (error) {
      console.error('Error awarding MyPts:', error);
      toast.error('An error occurred while awarding MyPts');
    } finally {
      setIsAwarding(false);
    }
  };

  // Get selected profile details
  const { data: selectedProfile, isLoading: isLoadingProfile, refetch: refetchProfileDetails } = useQuery({
    queryKey: ['profileDetails', selectedProfileId],
    queryFn: async () => {
      if (!selectedProfileId) return null;
      console.log('Fetching profile details for ID:', selectedProfileId);

      // Force clear any cached data
      console.log('Current selected profile ID state:', selectedProfileId);

      // Use the admin API to get profile details
      const response = await profileApi.getProfileByIdAdmin(selectedProfileId);
      console.log('Profile details response:', response);

      if (response.success && response.data) {
        console.log('Profile data found:', response.data);
        console.log('Profile ID in response:', response.data._id || response.data.id);
        return response.data as any; // Cast to any to avoid TypeScript errors
      } else {
        console.error('Failed to fetch profile details:', response.message);
        return null;
      }
    },
    enabled: !!selectedProfileId,
    // Disable caching to ensure fresh data
    staleTime: 0,
    gcTime: 0, // Use gcTime instead of cacheTime in React Query v4
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reward MyPts</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Search Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Find Profile</CardTitle>
              <CardDescription>
                {allProfilesData?.success && allProfilesData.data?.pagination ?
                  `${allProfilesData.data.pagination.total} profiles available` :
                  'Search for a profile to reward MyPts'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchAllProfiles()}
              disabled={isLoadingAllProfiles}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingAllProfiles ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh profiles</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Search by name, email, or profile ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searchQuery.length < 2}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {isSearching || isLoadingAllProfiles ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center p-2 border rounded">
                      <Skeleton className="h-10 w-10 rounded-full mr-3" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProfiles.length > 0 ? (
                <>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredProfiles.map((profile: any) => (
                      <div
                        key={profile._id || profile.id}
                        className={`flex items-center p-2 border rounded cursor-pointer hover:bg-muted transition-colors ${
                          selectedProfileId === (profile._id || profile.id) ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => handleSelectProfile(profile._id || profile.id)}
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          {profile.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{profile.name || 'Unnamed Profile'}</p>
                          <p className="text-sm text-muted-foreground">
                            {getProfileType(profile)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            ID: {profile._id || profile.id}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {allProfilesData?.data?.pagination && allProfilesData.data.pagination.pages > 1 && !searchQuery && (
                    <div className="mt-4 flex justify-center">
                      <Pagination
                        currentPage={page}
                        totalPages={allProfilesData.data.pagination.pages}
                        onPageChange={(newPage) => {
                          setPage(newPage);
                          window.scrollTo(0, 0);
                        }}
                      />
                    </div>
                  )}
                </>
              ) : searchQuery.length >= 2 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No profiles found matching your search
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No profiles available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Award MyPts Card */}
        <Card>
          <CardHeader>
            <CardTitle>Award MyPts</CardTitle>
            <CardDescription>Reward the selected profile with MyPts</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedProfileId ? (
              isLoadingProfile ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : selectedProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center p-3 bg-muted rounded">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      {selectedProfile.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{selectedProfile.name || 'Unnamed Profile'}</p>
                      <p className="text-sm text-muted-foreground">
                        {getProfileType(selectedProfile)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {selectedProfile._id || selectedProfile.id}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (MyPts)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="Enter amount to award"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason (optional)</Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Enter reason for awarding MyPts"
                      rows={3}
                    />
                  </div>

                  {awardSuccess && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Success!</AlertTitle>
                      <AlertDescription className="text-green-700">
                        {amount} MyPts have been successfully awarded to {selectedProfile.name}.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load profile details. Please try selecting the profile again.
                  </AlertDescription>
                </Alert>
              )
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Select a profile to award MyPts</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleAwardMyPts}
              disabled={!selectedProfileId || !amount || amount <= 0 || isAwarding}
            >
              {isAwarding ? 'Processing...' : 'Award MyPts'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
