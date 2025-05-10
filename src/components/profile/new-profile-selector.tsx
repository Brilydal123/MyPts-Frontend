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

  // Loading state - Apple-like design
  if (isLoading) {
    return (
      <Card className='w-full max-w-md mx-auto'>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto px-4"
        >
          <div className="mb-8 text-center">
            <p className="text-sm text-gray-500">Choose a profile to continue with MyPts</p>
          </div>

          <div className="space-y-3 mb-8">
            {/* Just one loading skeleton for a cleaner look */}
            <motion.div
              className="p-5 border border-gray-100 rounded-xl backdrop-blur-sm"
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
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
                    <Skeleton className="h-4 w-[100px] mb-3 rounded-md" />
                    <div className="flex items-center mt-4">
                      <Skeleton className="h-9 w-9 rounded-full mr-3" />
                      <Skeleton className="h-5 w-[100px] rounded-md" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </motion.div>
          </div>

          <Skeleton className="h-12 w-full rounded-xl mb-4" />
        </motion.div>
      </Card>
    );
  }

  // No profiles found - Apple-like design
  if (profiles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md mx-auto px-4"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">No Profiles Found</h1>
          <p className="text-sm text-gray-500">You don't have any profiles yet</p>
        </div>

        <div className="mb-8 flex justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
          transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
    <Card className='w-full max-w-md max-md:max-w-full mx-auto'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} // Apple-like spring easing
        className="w-full max-w-md mx-auto px-4 max-md:px-1"
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
                        <h3 className="font-medium text-base" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif', fontWeight: 500, letterSpacing: '-0.01em' }}>{profile.name}</h3>
                      </div>

                      <div className="mt-1 flex items-center">
                        <span
                          className="inline-flex items-center px-[11px] py-[3px] rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif', fontWeight: 500, letterSpacing: '-0.01em' }}
                        >
                          {profileType}
                        </span>

                        {'secondaryId' in profile && profile.secondaryId && (
                          <span
                            className="ml-2 inline-flex items-center px-[11px] py-[3px] rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100"
                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif', fontWeight: 500, letterSpacing: '-0.01em' }}
                          >
                            ID: {profile.secondaryId}
                          </span>
                        )}
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
