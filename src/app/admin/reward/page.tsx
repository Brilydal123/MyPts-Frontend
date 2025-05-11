"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Pagination } from "@/components/custom/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
// Import the profile API for direct ID lookup
import { profileApi } from "@/lib/api/profile-api";
// Import our custom hooks for data fetching and mutations
import { useProfiles, useSearchProfiles, useProfile, useAwardMyPts, useRefreshMyPtsBalance } from "@/hooks/useProfileData";
// Import the MyPts Hub API for getting hub state
import { myPtsHubApi } from "@/lib/api/mypts-api";
// Import the reward invoice component
import { RewardInvoice } from "@/components/admin/reward-invoice";
import {
  Search,
  Award,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Check,
  Coins,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";

// Helper function to get profile type display text
const getProfileType = (profile: any): string => {
  if (!profile) return "Profile";

  // Handle different profile type formats
  if (profile.type) {
    if (typeof profile.type === "string") {
      return profile.type;
    }

    if (typeof profile.type === "object") {
      if (profile.type.subtype) return profile.type.subtype;
      if (profile.type.category) return profile.type.category;
    }
  }

  // Check for profileType field
  if (profile.profileType) return profile.profileType;

  // Check for profileCategory field
  if (profile.profileCategory) return profile.profileCategory;

  return "Profile";
};

const checkVariants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { type: "spring", duration: 0.4, bounce: 0 },
      opacity: { duration: 0.01 },
    },
  },
};

const circleVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      duration: 0.4,
      delay: 0.1,
    },
  },
};

export default function RewardMyPtsPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [isAwarding, setIsAwarding] = useState(false);
  const [awardSuccess, setAwardSuccess] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);
  const [awardedAmount, setAwardedAmount] = useState<number>(0);
  const [awardApiError, setAwardApiError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>('default');
  const [selectedProfileData, setSelectedProfileData] = useState<any | null>(null);

  // State for invoice data
  const [showInvoice, setShowInvoice] = useState(false);
  const [isProcessingAward, setIsProcessingAward] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{
    profileData: {
      id: string;
      name: string;
      type?: string;
      category?: string;
      balanceBefore: number;
      balanceAfter: number;
    };
    hubData: {
      reserveSupplyBefore: number;
      reserveSupplyAfter: number;
      circulatingSupplyBefore: number;
      circulatingSupplyAfter: number;
    };
    transactionData: {
      id: string;
      amount: number;
      reason: string;
      timestamp: Date;
      admin?: {
        name?: string;
        email?: string;
      };
      isProcessing?: boolean;
    };
  } | null>(null);

  // Check for profile ID in URL parameters
  useEffect(() => {
    const profileId = searchParams?.get("profileId") || null;
    if (profileId) {
      setSelectedProfileId(profileId);
    }
  }, [searchParams]);

  // Define sort options
  const sortOptions = [
    { value: 'default', label: 'Default Order' },
    { value: 'balance_desc', label: 'Balance: High to Low' },
    { value: 'balance_asc', label: 'Balance: Low to High' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' },
  ];

  // Use our custom hook to fetch all profiles
  const {
    data: allProfilesData,
    isLoading: isLoadingAllProfiles,
    refetch: refetchAllProfiles,
  } = useProfiles({
    page: page.toString(),
    limit: limit.toString(),
    sortBy: getSortByFromOption(sortOption),
    sortOrder: getSortOrderFromOption(sortOption),
  });

  // Helper function to get sortBy from sort option
  function getSortByFromOption(option: string): string | undefined {
    switch (option) {
      case 'balance_desc':
      case 'balance_asc':
        return 'myPtsBalance';
      case 'name_asc':
      case 'name_desc':
        return 'name';
      default:
        return undefined;
    }
  }

  // Helper function to get sortOrder from sort option
  function getSortOrderFromOption(option: string): 'asc' | 'desc' | undefined {
    switch (option) {
      case 'balance_desc':
      case 'name_desc':
        return 'desc';
      case 'balance_asc':
      case 'name_asc':
        return 'asc';
      default:
        return undefined;
    }
  }

  // Use our custom hook to search for profiles
  const {
    data: searchResults,
    isLoading: isSearching,
    refetch,
  } = useSearchProfiles(searchQuery, {
    enabled: searchQuery.length >= 2 && !/^[0-9a-fA-F]{24}$/.test(searchQuery),
  });

  // Normalize IDs in profile data
  const normalizeProfile = (profile: any) => {
    const normalizedId = normalizeObjectId(profile._id || profile.id || "");
    return {
      ...profile,
      _id: normalizedId,
      id: normalizedId, // Ensure both _id and id are normalized
    };
  };

  // Update filtered profiles when search results or all profiles change
  useEffect(() => {
    if (
      searchQuery.length >= 2 &&
      searchResults?.profiles &&
      searchResults.profiles.length > 0
    ) {
      // If we have search results, normalize IDs
      console.log("Normalizing search results profiles");
      const normalizedProfiles = searchResults.profiles.map(normalizeProfile);
      setFilteredProfiles(normalizedProfiles);
    } else if (allProfilesData?.profiles) {
      // Otherwise, normalize all profiles
      console.log("Normalizing all profiles");
      const normalizedProfiles = allProfilesData.profiles.map(normalizeProfile);
      setFilteredProfiles(normalizedProfiles);
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
          console.log(
            "Attempting direct profile lookup by ID using admin API:",
            searchQuery
          );
          const response = await profileApi.getProfileByIdAdmin(searchQuery);
          console.log("Admin profile lookup response:", response);

          if (response.success && response.data) {
            // If found, set it as the selected profile
            setSelectedProfileId(searchQuery);
            setSearchQuery(""); // Clear the search query
            toast.success("Profile found and selected");
            return;
          } else {
            toast.error("Could not find a profile with that ID");
            return;
          }
        } catch (error) {
          console.error("Error fetching profile by ID:", error);
          toast.error("Could not find a profile with that ID");
          // Don't continue with search if ID lookup fails
          return;
        }
      }

      // Perform regular search
      console.log("Performing regular profile search for:", searchQuery);
      refetch();
    }
  };

  // Normalize MongoDB ObjectId
  const normalizeObjectId = (id: string): string | null => {
    // Convert to string in case we get a different type
    const idString = String(id).trim();

    // Check if it's a valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(idString)) {
      return null;
    }

    return idString;
  };

  // Use our custom hook to fetch a profile by ID
  const { refetch: refetchProfile } = useProfile(selectedProfileId, {
    enabled: !!selectedProfileId,
    staleTime: 0 // Always refetch when selectedProfileId changes
  });

  // Handle profile selection
  const handleSelectProfile = async (profileId: string) => {
    // First, find the profile in the current list
    const currentProfiles = searchQuery ? filteredProfiles : allProfilesData?.profiles || [];
    const profile = currentProfiles.find(
      (p: any) => (p._id || p.id) === profileId
    );

    if (profile) {
      // Log the complete profile data structure
      console.log('Selected profile data (complete):', JSON.stringify(profile, null, 2));

      // Log specific MyPts-related fields
      console.log('Profile MyPts data:', {
        id: profile._id || profile.id,
        name: profile.name || profile.username,
        myPtsBalance: profile.myPtsBalance,
        ProfileMypts: profile.ProfileMypts ? {
          currentBalance: profile.ProfileMypts.currentBalance,
          lifetimeMypts: profile.ProfileMypts.lifetimeMypts
        } : 'undefined',
        balance: profile.balance,
        // Check for nested properties
        nestedBalance: profile.ProfileMypts?.currentBalance,
        rawProfileMypts: JSON.stringify(profile.ProfileMypts)
      });

      // Ensure ProfileMypts is an object, not a string
      if (typeof profile.ProfileMypts === 'string' || profile.ProfileMypts === undefined) {
        console.log('Creating ProfileMypts object from balance');
        profile.ProfileMypts = {
          currentBalance: profile.balance || profile.myPtsBalance || 0,
          lifetimeMypts: profile.lifetimeMypts || 0
        };
      }

      // Check if we have a balance property but no myPtsBalance
      if (profile.balance !== undefined && profile.myPtsBalance === undefined) {
        console.log(`Setting myPtsBalance from balance: ${profile.balance}`);
        profile.myPtsBalance = profile.balance;
      }

      setSelectedProfileId(profileId);
      setSelectedProfileData(profile); // Set the full profile object
      setAwardSuccess(false); // Reset success state when selecting a new profile
      setAwardApiError(null); // Reset error state
    } else {
      console.error("Selected profile not found in current list data.");
      // Handle case where profile isn't found (maybe show an error)
      setSelectedProfileId('');
      setSelectedProfileData(null);
      toast.error("Could not find selected profile details.");
    }
  };

  // Use our custom hook for awarding MyPts
  const awardMyPtsMutation = useAwardMyPts();

  // Use our custom hook for refreshing MyPts balance
  const refreshMyPtsBalanceMutation = useRefreshMyPtsBalance();

  // Handle award submission
  const handleAwardMyPts = async () => {
    if (!selectedProfileId || !amount || amount <= 0) {
      toast.error("Please select a profile and enter a valid positive amount.");
      return;
    }

    setIsAwarding(true);
    setAwardSuccess(false);
    setAwardApiError(null); // Reset error state at the beginning
    setIsProcessingAward(true);

    try {
      // Ensure we have the selected profile data
      if (!selectedProfileData) {
        throw new Error("Selected profile data is missing");
      }

      // Get the profile ID, ensuring we use the correct format
      // Use the _id property if available, otherwise use id
      const rawProfileId = selectedProfileData._id || selectedProfileData.id;
      const profileIdStr = rawProfileId.toString();
      const reasonText = reason.trim() || "Admin reward";

      // Check if the profile ID is in the correct format (24 character hex string)
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(profileIdStr);

      // Log detailed information about the profile ID
      console.log('Profile ID details:', {
        rawId: rawProfileId,
        stringId: profileIdStr,
        idType: typeof rawProfileId,
        idLength: profileIdStr.length,
        isValidObjectId: isValidObjectId,
        secondaryId: selectedProfileData.secondaryId,
        fullProfileData: selectedProfileData
      });

      // If the profile ID is not in the correct format, try to use the secondaryId
      if (!isValidObjectId && selectedProfileData.secondaryId) {
        console.log('Using secondaryId instead of invalid ObjectId');
        throw new Error('Invalid profile ID format. Please try selecting the profile again.');
      }

      // Ensure the profile ID is a valid MongoDB ObjectId
      if (!/^[0-9a-fA-F]{24}$/.test(profileIdStr)) {
        throw new Error(`Invalid profile ID format: ${profileIdStr}. Must be a 24-character hex string.`);
      }

      console.log(`Attempting to award ${amount} MyPts to profile ${profileIdStr}`);
      console.log('Using profile data from state:', selectedProfileData);

      // Get the current balance from the selected profile data
      // Try different possible locations for the balance
      const profileBalanceBefore =
        selectedProfileData.myPtsBalance ||
        selectedProfileData.ProfileMypts?.currentBalance ||
        selectedProfileData.balance ||
        0;

      // Get hub state before award
      const hubStateBefore = await myPtsHubApi.getHubState();
      const hubDataBefore = hubStateBefore.data || {
        reserveSupply: 0,
        circulatingSupply: 0
      };

      console.log('Profile balance before award:', profileBalanceBefore);
      console.log('Hub state before award:', hubDataBefore);

      // Show the invoice with processing state before starting the award process
      setInvoiceData({
        profileData: {
          id: profileIdStr,
          name: selectedProfileData.name || 'Unknown Profile',
          type: getProfileType(selectedProfileData),
          category: selectedProfileData.category,
          balanceBefore: profileBalanceBefore,
          balanceAfter: profileBalanceBefore + Number(amount) // Estimated after balance
        },
        hubData: {
          reserveSupplyBefore: hubDataBefore.reserveSupply,
          reserveSupplyAfter: hubDataBefore.reserveSupply - Number(amount), // Estimated after values
          circulatingSupplyBefore: hubDataBefore.circulatingSupply,
          circulatingSupplyAfter: hubDataBefore.circulatingSupply + Number(amount) // Estimated after values
        },
        transactionData: {
          id: 'Processing...',
          amount: Number(amount),
          reason: reasonText,
          timestamp: new Date(),
          admin: {
            name: typeof window !== 'undefined' ? localStorage.getItem('userName') || 'Admin' : 'Admin',
            email: typeof window !== 'undefined' ? localStorage.getItem('userEmail') || undefined : undefined
          },
          isProcessing: true
        }
      });

      // Show the invoice immediately
      setShowInvoice(true);

      // Use our mutation to award MyPts
      console.log('Using award mutation with these parameters:', {
        profileId: profileIdStr,
        amount: Number(amount),
        reason: reasonText
      });

      const awardResponse = await awardMyPtsMutation.mutateAsync({
        profileId: profileIdStr,
        amount: Number(amount),
        reason: reasonText
      });

      setAwardedAmount(amount);
      setAwardSuccess(true);

      // Get the new balance from the response or calculate it
      const profileBalanceAfter = awardResponse.data?.newBalance ||
        awardResponse.data?.balance ||
        (profileBalanceBefore + Number(amount));

      console.log('New balance after award:', profileBalanceAfter);

      // Get hub state after award
      const hubStateAfter = await myPtsHubApi.getHubState();
      const hubDataAfter = hubStateAfter.data || {
        reserveSupply: 0,
        circulatingSupply: 0
      };

      console.log('Profile balance after award:', profileBalanceAfter);
      console.log('Hub state after award:', hubDataAfter);

      // Update invoice data with actual values after award is complete
      setInvoiceData({
        profileData: {
          id: profileIdStr,
          name: selectedProfileData.name || 'Unknown Profile',
          type: getProfileType(selectedProfileData),
          category: selectedProfileData.category,
          balanceBefore: profileBalanceBefore,
          balanceAfter: profileBalanceAfter
        },
        hubData: {
          reserveSupplyBefore: hubDataBefore.reserveSupply,
          reserveSupplyAfter: hubDataAfter.reserveSupply,
          circulatingSupplyBefore: hubDataBefore.circulatingSupply,
          circulatingSupplyAfter: hubDataAfter.circulatingSupply
        },
        transactionData: {
          id: awardResponse.data?.transaction?.id || awardResponse.data?.transaction?._id || 'Unknown',
          amount: Number(amount),
          reason: reasonText,
          timestamp: new Date(),
          admin: {
            name: typeof window !== 'undefined' ? localStorage.getItem('userName') || 'Admin' : 'Admin',
            email: typeof window !== 'undefined' ? localStorage.getItem('userEmail') || undefined : undefined
          },
          isProcessing: false
        }
      });

      // Update the selected profile data with the new balance
      if (selectedProfileData) {
        // Update the local state with the new balance
        const updatedProfileData = {
          ...selectedProfileData,
          myPtsBalance: profileBalanceAfter,
          balance: profileBalanceAfter,
          ProfileMypts: {
            ...(selectedProfileData.ProfileMypts || {}),
            currentBalance: profileBalanceAfter,
            lifetimeMypts: (selectedProfileData.ProfileMypts?.lifetimeMypts || 0) + Number(amount)
          }
        };

        setSelectedProfileData(updatedProfileData);

        // Refetch all profiles to update the list in the background
        // This ensures the list is updated but doesn't block the UI
        setTimeout(() => {
          refetchAllProfiles();
        }, 1000);
      }
    } catch (error: any) {
      console.error("Award MyPts failed:", error);

      // Try to extract the most useful error message
      let errorMessage = "An unexpected error occurred.";

      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Log detailed error information
      console.error('Detailed error information:', {
        errorObject: error,
        errorMessage,
        profileId: selectedProfileData?._id || selectedProfileData?.id,
        amount,
        reason
      });

      setAwardSuccess(false);
      setAwardApiError(errorMessage);

      // Close the invoice if there's an error
      setShowInvoice(false);

      // Show a more detailed error message
      toast.error(`Award failed: ${errorMessage}`);

      // If the error is related to profile not found, suggest reselecting the profile
      if (errorMessage.includes('profile not found') || errorMessage.includes('not owned by user')) {
        toast.error('Please try selecting the profile again', {
          description: 'The profile may have been deleted or you may not have permission to award MyPts to it.',
          duration: 5000
        });
      }

      // If the error is related to authentication, suggest logging in again
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('Authentication token')) {
        toast.error('Your session may have expired', {
          description: 'Please try logging out and logging back in.',
          duration: 5000
        });
      }
    } finally {
      setIsAwarding(false);
      setIsProcessingAward(false);
    }
  };

  return (
    <React.Fragment>
      <div className="space-y-6 sm:space-y-10 p-4 sm:p-6 md:p-8 lg:p-12 bg-gray-50 min-h-screen font-sans">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Award MyPts</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 max-w-full w-full mx-auto">
          {/* Profile Search Card - Softer corners, more padding */}
          <Card className="border-none shadow-sm rounded-xl overflow-hidden w-full">
            {/* Responsive header padding */}
            <CardHeader className="flex flex-row items-start justify-between space-y-0 px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 pb-3 sm:pb-4">
              <div>
                <CardTitle className="text-lg sm:text-xl font-medium text-gray-900">Find Profile</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-500 pt-1">
                  {allProfilesData?.pagination
                    ? `${allProfilesData.pagination.total} profiles available`
                    : "Search by name, email, or ID to award MyPts"}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetchAllProfiles()}
                disabled={isLoadingAllProfiles}
                className="text-gray-500 hover:bg-gray-100 h-8 w-8 sm:h-10 sm:w-10"
              >
                <RefreshCw
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${isLoadingAllProfiles ? "animate-spin" : ""}`}
                />
              </Button> {/* Close Refresh Button */}
            </CardHeader> {/* Close CardHeader */}

            <CardContent className="px-4 sm:px-6 md:px-8 py-4 sm:py-6"> {/* Start CardContent and add padding */}
              {/* Search Input and Button Section */}
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-4 sm:mb-6"> {/* Wrapper for input and search button */}
                <Label htmlFor="search-profiles" className="sr-only">Search Profiles</Label>
                <Input
                  id="search-profiles"
                  type="search"
                  placeholder="Search by name, email, or ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm sm:text-base h-10 sm:h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)} /* Corrected TS error */
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  disabled={searchQuery.length < 2}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium shadow-sm rounded-lg disabled:bg-gray-300 px-3 sm:px-5 h-9 sm:h-10 w-full sm:w-auto mt-2 sm:mt-0"
                >
                  <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Search
                </Button>
              </div>

              {/* Sort Dropdown - now inside CardContent */}
              {!searchQuery && allProfilesData?.profiles?.length > 0 && (
                <div className="w-full sm:w-auto mb-4 sm:mb-6">
                  <Label htmlFor="sort-profiles" className="sr-only">Sort by</Label>
                  <Select value={sortOption} onValueChange={setSortOption}>
                    <SelectTrigger id="sort-profiles" className="w-full sm:w-[200px] text-xs sm:text-sm h-9 sm:h-10">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default (Date Added)</SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="balance-asc">Balance (Low-High)</SelectItem>
                      <SelectItem value="balance-desc">Balance (High-Low)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Profile List / Search Results Section - Stays within CardContent */}
              {isSearching || isLoadingAllProfiles ? (
                <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 sm:p-4 border border-gray-100 rounded-xl"
                    >
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full mr-3 sm:mr-4 bg-gray-200" />
                        <div className="space-y-1 sm:space-y-2 flex-1">
                          <Skeleton className="h-4 sm:h-5 w-24 sm:w-32 bg-gray-200" />
                          <Skeleton className="h-3 sm:h-4 w-32 sm:w-48 bg-gray-200" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gray-200" />
                    </div>
                  ))}
                </div>
              ) : filteredProfiles.length > 0 ? (
                <>
                  <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto pt-2 sm:pt-4 pr-2 sm:pr-3 -mr-1 pb-3 sm:pb-5 pl-2 sm:pl-3">
                    {filteredProfiles.map((profile: any) => (
                      <motion.div
                        key={profile._id || profile.id}
                        layout
                        className={`flex items-center justify-between p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-150 ease-in-out
                          ${selectedProfileId === (profile._id || profile.id)
                            ? 'border-0 outline-2 outline-primary shadow-md'
                            : 'border border-gray-200 hover:bg-gray-100'
                          }`}
                        onClick={() =>
                          handleSelectProfile(profile._id || profile.id)
                        }
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center w-full">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-100 flex items-center justify-center mr-3 sm:mr-4 text-gray-500 font-medium text-sm sm:text-base flex-shrink-0">
                            {profile.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                              {profile.name || "Unnamed Profile"}
                            </p>
                            <div className="flex flex-wrap items-center mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500">
                              <span className="mr-2 truncate">{getProfileType(profile)}</span>
                              <div className="flex items-center flex-shrink-0">
                                <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-gray-400" />
                                <span>{profile.myPtsBalance ?? profile.ProfileMypts?.currentBalance ?? profile.balance ?? 0} MyPts</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <AnimatePresence>
                          {selectedProfileId === (profile._id || profile.id) && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0, rotate: -180 }}
                              animate={{ scale: 1, opacity: 1, rotate: 0 }}
                              exit={{ scale: 0, opacity: 0, rotate: 180 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                              }}
                              className="flex items-center justify-center flex-shrink-0 ml-2"
                            >
                              <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                  {/* Pagination Controls - Show only when not searching & multiple pages exist */}
                  {allProfilesData?.pagination &&
                    allProfilesData.pagination.pages > 1 &&
                    !searchQuery && (
                      <div className="mt-4 sm:mt-6 flex justify-center pb-2">
                        <Pagination
                          currentPage={page}
                          totalPages={allProfilesData.pagination.pages}
                          onPageChange={(newPage) => {
                            setPage(newPage);
                          }}
                        />
                      </div>
                    )}
                </>
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-6 sm:py-10 px-4 text-gray-500 text-sm sm:text-base">
                  No profiles found matching your search.
                </div>
              ) : (
                <div className="text-center py-6 sm:py-10 px-4 text-gray-500 text-sm sm:text-base">
                  Enter a name, email, or profile ID to search.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Award MyPts Card - Softer corners, more padding */}
          <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden w-full">
            {/* Responsive header padding */}
            <CardHeader className="px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl font-medium text-gray-900">Award MyPts</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-500 pt-1">Award the selected profile with MyPts.</CardDescription>
            </CardHeader>
            {/* Responsive content padding */}
            <CardContent className="px-4 sm:px-6 md:px-8">
              {selectedProfileId ? (
                selectedProfileData ? (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Display selected profile info */}
                    <div className="flex items-center p-3 sm:p-4 bg-gray-100 rounded-xl border border-gray-200 shadow-sm">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center mr-3 sm:mr-4 text-blue-600 font-medium text-sm sm:text-base">
                        {selectedProfileData.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                          {selectedProfileData.name || "Unnamed Profile"}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {getProfileType(selectedProfileData)}
                        </p>
                        <div className="flex items-center mt-1 mb-1">
                          <Coins className="h-4 w-4 mr-1 text-blue-500" />
                          <p className="text-sm font-medium text-blue-600">
                            {selectedProfileData.myPtsBalance ?? selectedProfileData.ProfileMypts?.currentBalance ?? selectedProfileData.balance ?? 0} MyPts
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mt-0.5 sm:mt-1">
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                            ID: {selectedProfileData._id || selectedProfileData.id}
                          </p>
                          {/* Assuming email is available in selectedProfileData */}
                          {selectedProfileData.email && (
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                              Email: {selectedProfileData.email}
                            </p>
                          )}
                        </div>
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                // Use our custom hook to refresh the balance
                                const profileId = selectedProfileData._id || selectedProfileData.id;
                                const balanceData = await refreshMyPtsBalanceMutation.mutateAsync(profileId);

                                // Update the selected profile data with the latest balance
                                if (balanceData) {
                                  // Create a new ProfileMypts object if it doesn't exist or is a string
                                  const updatedProfileMypts = typeof selectedProfileData.ProfileMypts === 'object' && selectedProfileData.ProfileMypts !== null
                                    ? {
                                      ...selectedProfileData.ProfileMypts,
                                      currentBalance: balanceData.balance,
                                      lifetimeMypts: balanceData.lifetimeEarned
                                    }
                                    : {
                                      currentBalance: balanceData.balance,
                                      lifetimeMypts: balanceData.lifetimeEarned
                                    };

                                  // Update the selected profile data with the latest balance
                                  setSelectedProfileData({
                                    ...selectedProfileData,
                                    myPtsBalance: balanceData.balance,
                                    balance: balanceData.balance, // Also update the balance property
                                    ProfileMypts: updatedProfileMypts
                                  });
                                }
                              } catch (error) {
                                console.error('Error refreshing balance:', error);
                              }
                            }}
                            disabled={refreshMyPtsBalanceMutation.isPending}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${refreshMyPtsBalanceMutation.isPending ? 'animate-spin' : ''}`} />
                            {refreshMyPtsBalanceMutation.isPending ? 'Refreshing...' : 'Refresh Balance'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Award Form */}
                    <div className="space-y-2 sm:space-y-3">
                      <Label htmlFor="amount" className="text-gray-700 font-medium text-sm sm:text-base">Amount (MyPts)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="1"
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-sm sm:text-base h-9 sm:h-10"
                        value={amount || ""}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        placeholder="Enter amount to award"
                      />
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <Label htmlFor="reason" className="text-gray-700 font-medium text-sm sm:text-base">Reason (optional)</Label>
                      <Textarea
                        id="reason"
                        value={reason}
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-sm sm:text-base"
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter reason for awarding MyPts (e.g., Contest winner)"
                        rows={3}
                      />
                    </div>
                    <AnimatePresence>
                      {awardSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert className="bg-green-50 border-green-200 mt-3 sm:mt-4 text-sm sm:text-base">
                            <motion.svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-1.5 sm:mr-2"
                              initial="hidden"
                              animate="visible"
                            >
                              <motion.path
                                d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                                variants={checkVariants}
                                stroke="currentColor"
                              ></motion.path>
                              <motion.polyline
                                points="22 4 12 14.01 9 11.01"
                                variants={checkVariants}
                                stroke="currentColor"
                              ></motion.polyline>
                            </motion.svg>
                            <AlertTitle className="text-green-800 text-sm sm:text-base">
                              Success!
                            </AlertTitle>
                            <AlertDescription className="text-green-700 text-xs sm:text-sm">
                              {awardedAmount} MyPts have been successfully awarded to{" "}
                              {selectedProfileData.name}.
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Error Alert: Check our manual error state */}
                    {awardApiError && (
                      <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 mt-3 sm:mt-4 text-sm sm:text-base">
                        <AlertCircle className="h-4 w-4 !text-red-600" />
                        <AlertTitle className="text-sm sm:text-base">Award Failed</AlertTitle>
                        <AlertDescription className="text-xs sm:text-sm">
                          {awardApiError}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* View Invoice Button (only show after successful award) */}
                    {awardSuccess && invoiceData && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                        className="mt-4"
                      >
                        <Button
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
                          onClick={() => setShowInvoice(true)}
                        >
                          <FileText className="h-4 w-4" />
                          View Transaction Invoice
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-10 px-4 text-gray-500 text-sm sm:text-base">
                    Loading profile data...
                  </div>
                )
              ) : (
                <div className="text-center py-6 sm:py-10 px-4 text-gray-500 text-sm sm:text-base">
                  <Award className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p>Select a profile to begin awarding MyPts.</p>
                </div>
              )}
            </CardContent>
            {/* Responsive footer padding */}
            <CardFooter className="px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 pt-4 sm:pt-6">
              <Button
                size="lg"
                className="w-full bg-black hover:bg-slate-700 text-white text-sm sm:text-base font-medium shadow-sm rounded-lg disabled:bg-gray-300 h-10 sm:h-12"
                onClick={handleAwardMyPts}
                disabled={
                  !selectedProfileId || !amount || amount <= 0 || isAwarding
                }
              >
                {isAwarding ? "Processing..." : "Award MyPts"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Invoice Modal - Must be inside the React.Fragment before it closes */}
      {showInvoice && invoiceData && (
        <RewardInvoice
          isOpen={true} /* Always true since we're already checking showInvoice in the conditional */
          onClose={() => setShowInvoice(false)}
          profileData={invoiceData.profileData}
          hubData={invoiceData.hubData}
          transactionData={invoiceData.transactionData}
        />
      )}
    </React.Fragment>
  );
}
