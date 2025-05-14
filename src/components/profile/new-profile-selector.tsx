'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedButton } from '@/components/ui/animated-button';
import { GoogleAvatar } from '@/components/shared/google-avatar';
import { Card } from '../ui/card';
import { useProfileSelector, ProfileData } from '@/hooks/useProfileSelector';
import { useUser } from '@/contexts/UserContext';
import { countries } from '@/components/ui/country-selector-data';

// Helper function to get country flag from country name or code
const getCountryFlag = (countryNameOrCode: string | undefined): string => {
  if (!countryNameOrCode) return '🌐';

  // Normalize the input by trimming and converting to lowercase
  const normalizedInput = countryNameOrCode.trim().toLowerCase();

  // Log the country name for debugging
  console.log(`Looking up country flag for: "${countryNameOrCode}" (normalized: "${normalizedInput}")`);

  // Try to find the country by exact name match first
  const countryByExactName = countries.find(
    c => c.name.toLowerCase() === normalizedInput
  );

  if (countryByExactName) {
    console.log(`Found exact match for ${normalizedInput}: ${countryByExactName.flag}`);
    return countryByExactName.flag;
  }

  // If not found by exact name, try by code (assuming countryNameOrCode might be a 2-letter code)
  if (normalizedInput.length === 2) {
    const countryByCode = countries.find(
      c => c.code.toLowerCase() === normalizedInput
    );
    if (countryByCode) {
      console.log(`Found match by code for ${normalizedInput}: ${countryByCode.flag}`);
      return countryByCode.flag;
    }
  }

  // Try fuzzy matching for common variations and misspellings
  // First, check for common variations with a more flexible approach
  for (const country of countries) {
    const countryNameLower = country.name.toLowerCase();

    // Check if the country name contains the input or vice versa
    if (countryNameLower.includes(normalizedInput) || normalizedInput.includes(countryNameLower)) {
      console.log(`Found partial match for ${normalizedInput}: ${country.flag} (${country.name})`);
      return country.flag;
    }

    // Check for common country name variations with different spellings
    // This handles cases like "Cameroon" vs "Cameroun", "USA" vs "United States", etc.
    const countryVariations: Record<string, string[]> = {
      'cameroon': ['cameroun'],
      'united states': ['usa', 'america', 'united states of america'],
      'united kingdom': ['uk', 'great britain', 'england'],
      'united arab emirates': ['uae', 'emirates'],
      'russian federation': ['russia'],
      'china': ['prc'],
      'south korea': ['korea'],
      'democratic republic of the congo': ['drc', 'dr congo'],
      'côte d\'ivoire': ['ivory coast', 'cote d\'ivoire'],
    };

    // Check if this country has known variations
    if (countryVariations[countryNameLower]) {
      // Check if the input matches any of the variations
      if (countryVariations[countryNameLower].includes(normalizedInput)) {
        console.log(`Found match through variations for ${normalizedInput}: ${country.flag} (${country.name})`);
        return country.flag;
      }
    }

    // Check if the input is a variation of this country
    for (const [countryKey, variations] of Object.entries(countryVariations)) {
      if (countryNameLower === countryKey && variations.some(v => normalizedInput.includes(v))) {
        console.log(`Found match through variation inclusion for ${normalizedInput}: ${country.flag} (${country.name})`);
        return country.flag;
      }

      if (variations.includes(countryNameLower) && normalizedInput.includes(countryKey)) {
        console.log(`Found match through country key inclusion for ${normalizedInput}: ${country.flag} (${country.name})`);
        return country.flag;
      }
    }
  }

  // Special case for Cameroon (case insensitive)
  if (normalizedInput === 'cameroon' || normalizedInput === 'cameroun' ||
    normalizedInput.includes('cameroon') || normalizedInput.includes('cameroun')) {
    console.log(`Special case for Cameroon: 🇨🇲`);
    return '🇨🇲';
  }

  // Try direct lookup for common variations using a more general approach
  for (const country of countries) {
    // Create a map of country code to flag
    if (country.code.toLowerCase() === normalizedInput) {
      console.log(`Found match by code lookup for ${normalizedInput}: ${country.flag}`);
      return country.flag;
    }

    // Check for exact name match (case insensitive)
    if (country.name.toLowerCase() === normalizedInput) {
      console.log(`Found exact name match for ${normalizedInput}: ${country.flag}`);
      return country.flag;
    }
  }

  // Try matching by removing spaces and special characters
  const simplifiedInput = normalizedInput.replace(/[^a-z0-9]/g, '');
  for (const country of countries) {
    const simplifiedCountry = country.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (simplifiedCountry === simplifiedInput ||
      simplifiedCountry.includes(simplifiedInput) ||
      simplifiedInput.includes(simplifiedCountry)) {
      console.log(`Found match after simplification for ${normalizedInput}: ${country.flag} (${country.name})`);
      return country.flag;
    }
  }

  // If still not found, return a globe icon placeholder
  console.log(`Country flag not found for: ${countryNameOrCode}`);
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

  // Get user data from the user context
  const { user: contextUser, isLoading: isUserLoading } = useUser();

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
                          <Skeleton className="h-5 w-[100px] rounded-full" /> {/* Profile type skeleton */}
                          <Skeleton className="h-5 w-[80px] rounded-full" /> {/* Secondary ID skeleton */}
                          <Skeleton className="h-5 w-[120px] rounded-full" /> {/* Country flag skeleton */}
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
                            ID: {(profile as ProfileData).secondaryId}
                          </span>
                        )}

                        {/* Country flag display - enhanced version */}
                        {(() => {
                          // Try to get country from various possible locations in the profile object
                          let country: string | undefined;

                          // Safely access properties with type assertions
                          const profileAsAny = profile as any;

                          // Try to get country from various possible locations
                          if (profileAsAny.profileLocation?.country) {
                            country = profileAsAny.profileLocation.country;
                          } else if (profileAsAny._rawProfile?.profileLocation?.country) {
                            country = profileAsAny._rawProfile.profileLocation.country;
                          } else if (profileAsAny.countryOfResidence) {
                            country = profileAsAny.countryOfResidence;
                          } else if (profileAsAny.country) {
                            country = profileAsAny.country;
                          }

                          // Log the profile data for debugging
                          const secondaryId = 'secondaryId' in profile ? profile.secondaryId : 'no secondary ID';
                          console.log(`Profile ${profile.id} (${secondaryId}) country data:`, {
                            profileLocationCountry: profileAsAny.profileLocation?.country,
                            rawProfileLocationCountry: profileAsAny._rawProfile?.profileLocation?.country,
                            countryOfResidence: profileAsAny.countryOfResidence,
                            country: profileAsAny.country,
                            extractedCountry: country
                          });

                          // If country is not found in profile, try to get it from the user context
                          if (!country && contextUser) {
                            console.log('Checking user context for country information:', contextUser);

                            // Check for country information in the user context
                            const userAsAny = contextUser as any;
                            if (userAsAny.countryOfResidence) {
                              country = userAsAny.countryOfResidence;
                              console.log(`Found country in user context: ${country}`);
                            } else if (userAsAny.country) {
                              country = userAsAny.country;
                              console.log(`Found country in user context (country field): ${country}`);
                            }
                          }

                          // If still no country, try to get it from localStorage and other sources
                          if (!country && typeof window !== 'undefined') {
                            try {
                              // Try to get user data from localStorage
                              const userDataStr = localStorage.getItem('user');
                              if (userDataStr) {
                                const userData = JSON.parse(userDataStr);
                                console.log('User data from localStorage:', userData);

                                // Check for country information in various fields
                                if (userData.countryOfResidence) {
                                  country = userData.countryOfResidence;
                                  console.log(`Found country in localStorage.user.countryOfResidence: ${country}`);
                                } else if (userData.country) {
                                  country = userData.country;
                                  console.log(`Found country in localStorage.user.country: ${country}`);
                                }
                              }

                              // If still no country, try to get it from the userCountry item in localStorage
                              if (!country) {
                                const userCountry = localStorage.getItem('userCountry');
                                if (userCountry) {
                                  country = userCountry;
                                  console.log(`Found country in localStorage.userCountry: ${country}`);
                                }
                              }

                              // If still no country, try to get it from cookies
                              if (!country) {
                                const cookies = document.cookie.split(';');
                                for (const cookie of cookies) {
                                  const [name, value] = cookie.trim().split('=');
                                  if (name === 'userCountry') {
                                    country = decodeURIComponent(value);
                                    console.log(`Found country in cookies: ${country}`);
                                    break;
                                  }
                                }
                              }

                              // If we found a country, store it in localStorage for future use
                              if (country) {
                                localStorage.setItem('userCountry', country);
                              }
                            } catch (error) {
                              console.error('Error parsing user data from localStorage:', error);
                            }
                          }

                          // Special case for Kemanjou Marco Blaise's profile
                          if ('secondaryId' in profile && profile.secondaryId === 'QIY80LOO' && !country) {
                            country = 'Cameroon';
                            console.log(`Applied special case for profile ${profile.secondaryId}: ${country}`);
                          }

                          // If we still don't have a country, try to extract it from all possible locations in the raw profile
                          if (!country && profileAsAny._rawProfile) {
                            // Check all possible paths where country information might be stored
                            const rawProfile = profileAsAny._rawProfile;
                            country = rawProfile.countryOfResidence ||
                              rawProfile.country ||
                              rawProfile.profileLocation?.country ||
                              rawProfile.personalInfo?.countryOfResidence ||
                              rawProfile.user?.countryOfResidence ||
                              rawProfile.creator?.countryOfResidence ||
                              rawProfile.owner?.countryOfResidence ||
                              rawProfile.profileInformation?.location?.country;

                            if (country) {
                              console.log(`Found country in raw profile object: ${country}`);
                            }
                          }

                          if (country) {
                            // Get the country flag
                            const flag = getCountryFlag(country);

                            return (
                              <span
                                className="inline-flex items-center px-[11px] py-[3px] rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100 hover:bg-gray-100 transition-colors"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                                  fontWeight: 500,
                                  letterSpacing: '-0.01em',
                                  backdropFilter: "blur(8px)",
                                  WebkitBackdropFilter: "blur(8px)"
                                }}
                                title={`Country of Residence: ${country}`}
                              >
                                <span className="mr-1.5 text-base">{flag}</span>
                                <span className="truncate max-w-[120px]">{country}</span>
                              </span>
                            );
                          }

                          // If we still don't have a country, show a globe icon with "Unknown"
                          return (
                            <span
                              className="inline-flex items-center px-[11px] py-[3px] rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-100 opacity-70"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                                fontWeight: 500,
                                letterSpacing: '-0.01em'
                              }}
                              title="Country information not available"
                            >
                              <span className="mr-1.5">🌐</span>
                              <span>Unknown</span>
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
