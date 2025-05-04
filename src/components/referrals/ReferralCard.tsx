"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import ReferralService, { ReferralStats } from "@/services/referralService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Share2, 
  RefreshCw, 
  Users, 
  Award, 
  ChevronRight, 
  Copy, 
  Check,
  TrendingUp
} from "lucide-react";
import ShareReferralModal from "./ShareReferralModal";
import { cn } from "@/lib/utils";

export function ReferralCard() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopyCode = async () => {
    if (referralStats?.referralCode) {
      await navigator.clipboard.writeText(referralStats.referralCode);
      setCopied(true);
      toast.success("Referral code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return <ReferralCardSkeleton />;
  }

  if (error) {
    return (
      <Card className="overflow-hidden border border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <RefreshCw className="h-6 w-6 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-base font-medium mb-2">Unable to load referral data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We couldn't load your referral information. Please try again.
            </p>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="bg-background hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalReferrals = referralStats?.totalReferrals || 0;
  const successfulReferrals = referralStats?.successfulReferrals || 0;
  const earnedPoints = referralStats?.earnedPoints || 0;
  const pendingPoints = referralStats?.pendingPoints || 0;
  const referralCode = referralStats?.referralCode || "";

  return (
    <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/10">
      <CardContent className="p-0">
        {/* Header with subtle gradient */}
        <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-6 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium tracking-tight">Referral Program</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Share and earn rewards
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              className="h-8 w-8 rounded-full hover:bg-primary/10"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6 space-y-6">
          {/* Referral code section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
                <span className="text-sm font-medium">Your Referral Code</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 rounded-full hover:bg-primary/10 hover:text-primary"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share2 className="h-3 w-3 mr-1.5" />
                Share
              </Button>
            </div>

            <motion.div 
              className="relative group"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div 
                className="flex items-center justify-between bg-muted/30 hover:bg-muted/50 p-4 rounded-xl border border-border/40 cursor-pointer transition-all duration-200"
                onClick={handleCopyCode}
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-medium tracking-wide">
                      {referralCode}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Click to copy
                    </p>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border border-border/40 group-hover:border-primary/30 transition-all duration-200">
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Subtle reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-xl"></div>
            </motion.div>
          </div>

          {/* Stats section */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              className="bg-muted/30 hover:bg-muted/50 p-4 rounded-xl border border-border/40 transition-all duration-200"
              whileHover={{ scale: 1.01, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div className="flex items-center mb-2">
                <div className="h-6 w-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mr-2">
                  <Users className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Total Referrals</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-semibold">{totalReferrals}</span>
                <span className="text-xs text-muted-foreground ml-1.5">people</span>
              </div>
              <div className="mt-1 flex items-center">
                <span className={cn(
                  "text-xs flex items-center",
                  successfulReferrals > 0 ? "text-green-500" : "text-muted-foreground"
                )}>
                  {successfulReferrals > 0 && <TrendingUp className="h-3 w-3 mr-1" />}
                  {successfulReferrals} successful
                </span>
              </div>
            </motion.div>

            <motion.div 
              className="bg-muted/30 hover:bg-muted/50 p-4 rounded-xl border border-border/40 transition-all duration-200"
              whileHover={{ scale: 1.01, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div className="flex items-center mb-2">
                <div className="h-6 w-6 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mr-2">
                  <Award className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Earned Rewards</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-semibold">{earnedPoints}</span>
                <span className="text-xs text-muted-foreground ml-1.5">MyPts</span>
              </div>
              <div className="mt-1 flex items-center">
                <span className={cn(
                  "text-xs",
                  pendingPoints > 0 ? "text-amber-500" : "text-muted-foreground"
                )}>
                  {pendingPoints} pending
                </span>
              </div>
            </motion.div>
          </div>

          {/* Referred by section (if applicable) */}
          {referralStats?.referredBy && (
            <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8 ring-2 ring-offset-2 ring-offset-background ring-amber-500/20">
                    <AvatarImage src={referralStats.referredBy.profileImage} />
                    <AvatarFallback className="bg-amber-500/10 text-xs">
                      {referralStats.referredBy.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{referralStats.referredBy.name}</p>
                    <p className="text-xs text-muted-foreground">Referred you</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Call to action */}
          <Button 
            variant="default" 
            className="w-full rounded-xl h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm"
            onClick={() => setIsShareModalOpen(true)}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Your Referral
          </Button>

          <Button
            variant="ghost"
            className="w-full text-xs text-muted-foreground hover:text-primary hover:bg-primary/5"
            onClick={() => window.location.href = "/dashboard/referrals"}
          >
            View Detailed Referral Dashboard
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardContent>

      {/* Share Referral Modal */}
      <ShareReferralModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        referralCode={referralCode}
      />
    </Card>
  );
}

function ReferralCardSkeleton() {
  return (
    <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/10">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-6 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24 mt-2" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-16 rounded-full" />
            </div>
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>

          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-8 w-full rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}
