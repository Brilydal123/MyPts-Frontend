'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedButton } from '@/components/ui/animated-button';
import { GoogleAvatar } from '@/components/shared/google-avatar';
import { Card } from '../ui/card';
import { useProfileSelector } from '@/hooks/useProfileSelector';
import { countries } from '@/components/ui/country-selector-data';

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

export function NewProfileSelector() {
  const router = useRouter();
  const {
    profiles,
    isLoading,
    selectedProfileId,
    setSelectedProfileId,
    handleSelectProfile,
    selectProfileMutation
  } = useProfileSelector();

  // Loading state - Apple-like design with Framer Motion
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Card className='w-full max-w-xl mx-auto max-md:max-w-full'>
          <div className="w-full max-w-md mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="mb-8 text-center">
                <p className="text-sm text-gray-500">Choose a profile to continue with MyPts</p>
              </div>
            </motion.div>

            <div className="space-y-3 mb-8">
              {/* Just one loading skeleton for a cleaner look */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div
                  className="p-5 border border-gray-100 rounded-xl backdrop-blur-sm"
                  style={{
                    borderRadius: "16px",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)"
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex">
                      {/* Avatar skeleton */}
                      <Skeleton className="h-10 w-10 rounded-full mr-3 flex-shrink-0" />

                      <div>
                        <Skeleton className="h-5 w-[180px] mb-2 rounded-md" />
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Skeleton className="h-4 w-[100px] rounded-md" />
                          <Skeleton className="h-4 w-[80px] rounded-md" />
                          <Skeleton className="h-4 w-[120px] rounded-md" /> {/* Country flag skeleton */}
                        </div>
                        <div className="flex items-center mt-4">
                          <Skeleton className="h-9 w-9 rounded-full mr-3" />
                          <Skeleton className="h-5 w-[100px] rounded-md" />
                        </div>
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Skeleton className="h-12 w-full rounded-xl mb-4" />
            </motion.div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // No profiles found - Apple-like design with Framer Motion
  if (profiles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md mx-auto px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight mb-2">No Profiles Found</h1>
            <p className="text-sm text-gray-500">You don't have any profiles yet</p>
            <div className="flex items-center justify-center mt-2">
              <span className="text-2xl mr-2">🌎</span>
              <span className="text-sm text-gray-500">Create a profile to get started</span>
            </div>
          </div>
        </motion.div>

        <div className="mb-8 flex justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-32 h-32 rounded-full flex items-center justify-center"
          >
            <GoogleAvatar
              profileImageUrl=""
              fallbackText="P"
              size={128}
              className="ring-4 ring-gray-100"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Button
            onClick={() => router.push("/create-profile")}
            className="h-12 w-full rounded-xl font-medium bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all"
          >
            Create a Profile
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Profile list - Apple-like design
  return (
    <Card className='w-full max-w-xl max-md:max-w-full mx-auto'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} // Apple-like spring easing
        className="w-full max-w-xl max-md:max-w-full mx-auto px-4 max-md:px-1"
      >
        <div className="mb-8 text-center">
          <p className="text-sm text-gray-500">Choose a profile to continue with MyPts</p>
        </div>

        <div className="space-y-3 mb-8">
          {profiles.map((profile, index) => {
            // Extract profile type for display
            const profileType = profile.profileType
              ? profile.profileType.charAt(0).toUpperCase() + profile.profileType.slice(1)
              : 'Personal';

            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  background: selectedProfileId === profile.id
                    ? "linear-gradient(145deg, rgba(0, 122, 255, 0.08), rgba(0, 122, 255, 0.15))"
                    : "linear-gradient(145deg, rgba(255, 255, 255, 1), rgba(250, 250, 252, 1))"
                }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.08,
                  ease: [0.16, 1, 0.3, 1], // Apple-like spring easing
                }}
                whileHover={{
                  scale: 1.01,
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
                  background: selectedProfileId === profile.id
                    ? "linear-gradient(145deg, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.2))"
                    : "linear-gradient(145deg, rgba(255, 255, 255, 1), rgba(245, 245, 247, 1))"
                }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  if (selectedProfileId !== profile.id) {
                    setSelectedProfileId(profile.id);
                  }
                }}
                className={`p-5 border backdrop-blur-sm rounded-xl cursor-pointer transition-all ${selectedProfileId === profile.id
                  ? "border-[#007AFF] shadow-sm"
                  : "border-[#E1E1E6] hover:border-[#D1D1D6]"
                  }`}
                style={{
                  borderRadius: "16px",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)"
                }}
              >
                <div className="flex items-center justify-between ">
                  <div className="flex-1 flex">
                    {/* Profile Avatar */}
                    <div className="mr-3 flex-shrink-0">
                      <GoogleAvatar
                        profileImageUrl={profile.profileImage || ""}
                        fallbackText={profile.name.charAt(0)}
                        size={40}
                        className="ring-2 ring-blue-100 font-extrabold"
                      />
                    </div>

                    <div>
                      <div className="flex items-center ">
                        <h3 className="font-medium text-base" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif', fontWeight: 500, letterSpacing: '-0.01em' }}>
                          {/* Display only the user's name without the profile type suffix */}
                          {profile.name.replace(/ (Personal|Professional|Business|Academic|Medical|Emergency|Group|Team|Family) Profile$/, '')}
                        </h3>
                      </div>

                      <div className="mt-1 flex items-center flex-wrap gap-2">
                        <span
                          className="inline-flex items-center px-[11px] py-[3px] rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif', fontWeight: 500, letterSpacing: '-0.01em' }}
                        >
                          {profileType}
                        </span>

                        {'secondaryId' in profile && profile.secondaryId && (
                          <span
                            className="inline-flex items-center px-[11px] py-[3px] rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100"
                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif', fontWeight: 500, letterSpacing: '-0.01em' }}
                          >
                            ID: {profile.secondaryId}
                          </span>
                        )}

                        {/* Country flag display - safely access country data */}
                        {(() => {
                          // Try to get country from various possible locations in the profile object
                          let country =
                            // @ts-ignore - Handle potential missing properties
                            profile.profileLocation?.country ||
                            // @ts-ignore - Handle potential missing properties
                            profile._rawProfile?.profileLocation?.country ||
                            // @ts-ignore - Handle potential missing properties
                            profile.countryOfResidence ||
                            // @ts-ignore - Handle potential missing properties
                            profile.country;

                          // If country is not found in profile, try to get it from localStorage
                          if (!country && typeof window !== 'undefined') {
                            try {
                              // Try to get user data from localStorage
                              const userDataStr = localStorage.getItem('user');
                              if (userDataStr) {
                                const userData = JSON.parse(userDataStr);
                                if (userData.countryOfResidence) {
                                  country = userData.countryOfResidence;
                                  console.log('Found country in localStorage:', country);
                                }
                              }
                            } catch (error) {
                              // console.error('Error parsing user data from localStorage:', error);
                            }
                          }

                          if (country) {
                            return (
                              <span
                                className="inline-flex items-center px-[11px] py-[3px] rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif', fontWeight: 500, letterSpacing: '-0.01em' }}
                                title={country}
                              >
                                <span className="mr-1">{getCountryFlag(country)}</span>
                                {country}
                              </span>
                            );
                          }

                          // If we still don't have a country, add a hidden flag for debugging
                          return (
                            <span className="hidden">
                              No country found for profile {profile.id}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Balance display - Simple Apple-like design */}
                      <div className="mt-4 flex items-center -ml-[0.3rem]">
                        <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full p-2 mr-3 shadow-sm max-md:p-1">
                          <img
                            src="/mdi_coins-outline.svg"
                            className="h-5 w-5"
                            alt="MyPts"
                          />
                        </div>
                        <span className="text-base font-extrabold text-gray-800" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif', letterSpacing: '-0.01em' }}>
                          {profile.formattedBalance}
                        </span>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedProfileId === profile.id ? (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="flex items-center justify-center"
                      >
                        <motion.div
                          className="h-8 w-8 rounded-full bg-black flex items-center justify-center shadow-md"
                          whileHover={{ scale: 1.05 }}
                          animate={{
                            boxShadow: [
                              "0 0 0 0 rgba(59, 130, 246, 0)",
                              "0 0 0 4px rgba(59, 130, 246, 0.15)",
                              "0 0 0 0 rgba(59, 130, 246, 0)",
                            ],
                          }}
                          transition={{
                            boxShadow: {
                              repeat: Infinity,
                              duration: 2,
                              ease: "easeInOut",
                            },
                          }}
                        >
                          <Check className="h-4 w-4 text-white" />
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-8 w-8 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1]
          }}
          className=''
        >
          <AnimatedButton
            onClick={() => {
              if (selectedProfileId) {
                handleSelectProfile(selectedProfileId);
              } else {
                toast.error("Please select a profile");
              }
            }}
            disabled={!selectedProfileId || selectProfileMutation.isPending}
            type="button"
            className={`h-12 font-medium transition-all w-full auth-button active rounded-md ${(!selectedProfileId || selectProfileMutation.isPending) && "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
              fontWeight: 500,
              letterSpacing: '-0.01em'
            }}
          >
            {selectProfileMutation.isPending ? 'Loading...' : 'Continue'}
          </AnimatedButton>
        </motion.div>
      </motion.div>
    </Card>
  );
}
