"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ReferralService, { ReferralStats } from "@/services/referralService";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Clipboard, Share2, Award, Users, RefreshCw } from "lucide-react";
import ReferralTree from "./ReferralTree";
import ReferralLeaderboard from "./ReferralLeaderboard";
import ShareReferralModal from "./ShareReferralModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedButton } from "@/components/ui/animated-button";

const ReferralDashboard: React.FC = () => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const {
    data: referralStats,
    isLoading,
    error,
    refetch,
  } = useQuery<ReferralStats>({
    queryKey: ["referralStats"],
    queryFn: () => ReferralService.getReferralStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Handle initialization if there's an error
  useEffect(() => {
    if (error) {
      console.error("Error fetching referral data:", error);

      // Check if this is an authentication error
      const isAuthError = (error as any)?.response?.status === 401;

      if (isAuthError) {
        // This is an authentication error, check if we have valid tokens
        const accessToken = localStorage.getItem("accessToken");
        const profileToken = localStorage.getItem("selectedProfileToken");

        if (!accessToken || !profileToken) {
          console.warn(
            "Missing authentication tokens, user may need to log in again"
          );
          toast.error("Authentication error", {
            description: "Please log in again to continue",
          });
          // Don't redirect here to avoid loops, let the API client handle it
          return;
        }
      }

      // Try to initialize the referral code
      ReferralService.initializeReferralCode()
        .then(() => {
          toast.success("Referral code initialized successfully");
          refetch();
        })
        .catch((err) => {
          console.error("Failed to initialize referral code:", err);
          // If this is also an auth error, we might need to redirect
          if ((err as any)?.response?.status === 401) {
            toast.error("Authentication error", {
              description: "Please log in again to continue",
            });
          }
        });
    }
  }, [error, refetch]);

  const handleCopyReferralCode = async () => {
    if (referralStats?.referralCode) {
      await navigator.clipboard.writeText(referralStats.referralCode);
      toast.success("Referral code copied to clipboard!");
    }
  };

  const getMilestoneProgress = (
    currentLevel: number,
    successfulReferrals: number
  ): number => {
    // Level 0 to 1: Need 3 successful referrals
    if (currentLevel === 0) {
      return Math.min(100, (successfulReferrals / 3) * 100);
    }

    // Level 1 to 2: Need 9 successful referrals (3 referrals each from 3 people)
    if (currentLevel === 1) {
      return Math.min(100, (successfulReferrals / 9) * 100);
    }

    // Higher levels would follow similar pattern
    return 0;
  };

  const getNextMilestoneRequirement = (currentLevel: number): string => {
    if (currentLevel === 0) {
      return "Refer 3 profiles who each reach 1000+ MyPts";
    }

    if (currentLevel === 1) {
      return "Each of your 3 referred profiles must refer 3 more profiles who reach 1000+ MyPts";
    }

    if (currentLevel === 2) {
      return "Continue building your referral network to reach Level 3";
    }

    return "You've reached the maximum milestone level!";
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
          <CardDescription>Error loading referral data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Failed to load referral information.</p>
          {/* <div className="flex space-x-4 mt-4">
            <Button variant="outline" onClick={() => refetch()} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
            <Button
              variant="default"
              onClick={() => {
                ReferralService.initializeReferralCode()
                  .then(() => {
                    toast.success('Referral code initialized');
                    refetch();
                  })
                  .catch(err => {
                    console.error('Failed to initialize referral code:', err);
                    toast.error('Failed to initialize referral code');
                  });
              }}
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Initialize Referral Code
            </Button>
          </div> */}
          <p>Please try logout and login again</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg bg-primary/5 px-8 pt-4 pb-4 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-4xl font-bold tracking-tight ">
              Referral Program
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
              Grow your network and earn rewards
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto transition-all duration-200 hover:shadow-sm bg-background/50 backdrop-blur-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <div className="overflow-x-auto pb-2 mb-2">
          <TabsList className="w-full sm:w-auto flex sm:inline-flex whitespace-nowrap p-1 bg-muted/50 backdrop-blur-sm rounded-lg border border-border/50">
            <TabsTrigger
              value="overview"
              className="flex-1 sm:flex-none px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="tree"
              className="flex-1 sm:flex-none px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Referral Tree
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="flex-1 sm:flex-none px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Leaderboard
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="overview"
          className="space-y-6 animate-in slide-in-from-bottom-2 duration-300"
        >
          {/* Top Row */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Referral Code Card */}
            <Card className="md:col-span-2 transition-all duration-200 hover:shadow-md bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
              <CardHeader>
                <CardTitle>Your Referral Code</CardTitle>
                <CardDescription>
                  Share this code with others to earn rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="relative group">
                    <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border border-dashed border-primary/10 backdrop-blur-sm">
                      <code className="text-xl font-mono tracking-wider relative">
                        {referralStats?.referralCode || "Loading..."}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyReferralCode}
                        className="bg-background/50 hover:bg-primary/10 transition-all duration-200"
                      >
                        <Clipboard className="h-4 w-4 mr-2" /> Copy
                      </Button>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient rounded-lg pointer-events-none" />
                  </div>
                )}
                <div className="max-w-md mx-auto mt-6">
                  <AnimatedButton
                    className="h-13 auth-button active"
                    onClick={() => setIsShareModalOpen(true)}
                  >
                    <Share2 className="mr-2 h-4 w-4" /> Share Your Referral Code
                  </AnimatedButton>
                </div>
                {/* <Button
                  className="w-full mt-4 bg-primary/10 hover:bg-primary/20 transition-all duration-200"
                  onClick={() => setIsShareModalOpen(true)}
                >
                  <Share2 className="mr-2 h-4 w-4" /> Share Your Referral Code
                </Button> */}
              </CardContent>
            </Card>

            {/* Milestone Progress Card */}
            <Card className="transition-all duration-200 hover:shadow-md bg-gradient-to-br from-background via-background to-primary/5">
              <CardHeader>
                <CardTitle>Milestone Progress</CardTitle>
                <CardDescription>
                  Track your referral milestone level
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-20 w-full rounded-lg" />
                      <Skeleton className="h-20 w-full rounded-lg" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Level {referralStats?.currentMilestoneLevel || 0}
                      </span>
                      <span className="text-sm font-medium">
                        Level {(referralStats?.currentMilestoneLevel || 0) + 1}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress
                        value={getMilestoneProgress(
                          referralStats?.currentMilestoneLevel || 0,
                          referralStats?.successfulReferrals || 0
                        )}
                        className="h-2 mb-4 bg-primary/10"
                      />
                      <div
                        className="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-primary/20 to-transparent rounded-full animate-shimmer"
                        style={{
                          maskImage:
                            "linear-gradient(to right, transparent, black, transparent)",
                          WebkitMaskImage:
                            "linear-gradient(to right, transparent, black, transparent)",
                        }}
                      />
                    </div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary"
                      >
                        Level {referralStats?.currentMilestoneLevel || 0}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {getNextMilestoneRequirement(
                          referralStats?.currentMilestoneLevel || 0
                        )}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 hover:bg-muted p-4 rounded-md text-center transition-all duration-200 group cursor-default">
                        <p className="text-2xl font-bold group-hover:scale-105 transition-transform">
                          {referralStats?.totalReferrals || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total Referrals
                        </p>
                      </div>
                      <div className="bg-muted/50 hover:bg-muted p-4 rounded-md text-center transition-all duration-200 group cursor-default">
                        <p className="text-2xl font-bold text-primary group-hover:scale-105 transition-transform">
                          {referralStats?.successfulReferrals || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Successful Referrals
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="">
            {/* Rewards Card */}
            <Card className="transition-all duration-200 hover:shadow-md md:col-span-1 bg-gradient-to-br from-amber-500/5 via-background to-background">
              <CardHeader>
                <CardTitle>Referral Rewards</CardTitle>
                <CardDescription>MyPts earned from referrals</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                      <Skeleton className="h-12 w-12 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6 bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            {referralStats?.earnedPoints || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            MyPts Earned
                          </p>
                        </div>
                        <div className="border-l border-border pl-4">
                          <p className="text-xl font-semibold text-amber-500">
                            {referralStats?.pendingPoints || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Pending MyPts
                          </p>
                        </div>
                      </div>
                      <Award className="h-12 w-12 text-primary animate-pulse opacity-70" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You earn 100 MyPts when you reach each milestone level.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Referred Profiles Card */}
          </div>

          {/* Bottom Grid */}
          <div className="flex justify-center items-center shadow-md">
            <div className=" gap-6 w-full">
              {/* Referred Profiles Card - Wider on larger screens */}
              <Card className="lg:col-span-2 transition-all duration-200 hover:shadow-md bg-gradient-to-br from-background via-background to-primary/5">
                <CardHeader>
                  <CardTitle>Your Referrals</CardTitle>
                  <CardDescription>Profiles you've referred</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex items-center space-x-4 animate-pulse"
                        >
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-3 w-[160px]" />
                          </div>
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      ))}
                    </div>
                  ) : referralStats?.referredProfiles &&
                    referralStats.referredProfiles.length > 0 ? (
                    <div className="space-y-4">
                      {referralStats.referredProfiles.map((referral) => (
                        <div
                          key={referral.profile._id}
                          className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-md transition-all duration-200 group hover:shadow-sm"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage
                                src={referral.profile.profileImage}
                              />
                              <AvatarFallback>
                                {referral.profile.name
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                {referral.profile.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Referred on{" "}
                                {new Date(referral.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              referral.hasReachedThreshold
                                ? "default"
                                : "outline"
                            }
                            className={`transition-all duration-200 ${referral.hasReachedThreshold
                                ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 ring-1 ring-green-500/20"
                                : "hover:bg-primary/10"
                              }`}
                          >
                            {referral.hasReachedThreshold
                              ? "Qualified"
                              : "Pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-primary/20">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-3 animate-pulse" />
                      <p className="text-muted-foreground font-medium">
                        You haven't referred anyone yet
                      </p>
                      <p className="text-sm text-muted-foreground/80 mt-1 mb-4">
                        Share your referral code to start earning rewards
                      </p>
                      <Button
                        variant="outline"
                        className="bg-background/50 hover:bg-primary/10 transition-all duration-200"
                        onClick={() => setIsShareModalOpen(true)}
                      >
                        <Share2 className="h-4 w-4 mr-2" /> Start Referring
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Referred By Card (if applicable) */}
              {/* Referred By Card (if applicable) */}
              {referralStats?.referredBy && (
                <Card className="transition-all duration-200 hover:shadow-md bg-gradient-to-br from-amber-500/5 via-background to-background">
                  <CardHeader>
                    <CardTitle>You Were Referred By</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      <Avatar className="ring-2 ring-offset-2 ring-offset-background ring-amber-500/20 transition-all duration-200">
                        <AvatarImage
                          src={referralStats.referredBy.profileImage}
                        />
                        <AvatarFallback className="bg-amber-500/10">
                          {referralStats.referredBy.name
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium bg-gradient-to-r from-amber-500 to-amber-600/70 bg-clip-text text-transparent">
                          {referralStats.referredBy.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Your Referrer
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="tree"
          className="animate-in slide-in-from-bottom-2 duration-300"
        >
          <Card className="transition-all duration-200 hover:shadow-md bg-gradient-to-br from-background via-background to-primary/5">
            <CardHeader>
              <CardTitle>Your Referral Network</CardTitle>
              <CardDescription>
                Visualize your complete referral tree
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReferralTree />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="leaderboard"
          className="animate-in slide-in-from-bottom-2 duration-300"
        >
          <Card className="transition-all duration-200 hover:shadow-md bg-gradient-to-br from-primary/5 via-background to-background">
            <CardHeader>
              <CardTitle>Referral Leaderboard</CardTitle>
              <CardDescription>
                Top referrers in the MyPts community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReferralLeaderboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Share Referral Drawer */}
      <ShareReferralModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        referralCode={referralStats?.referralCode || ""}
      />
    </div>
  );
};

export default ReferralDashboard;
