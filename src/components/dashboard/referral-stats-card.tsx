"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Share2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

interface ReferralStatsCardProps {
  referralCode: string;
  referralsCount: number;
  isLoading?: boolean;
  onShare?: () => void;
}

export function ReferralStatsCard({
  referralCode,
  referralsCount,
  isLoading = false,
  onShare,
}: ReferralStatsCardProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard
      .writeText(referralCode)
      .then(() => {
        setCopied(true);
        toast.success("Referral code copied to clipboard", {
          position: "bottom-center",
          duration: 2000,
          className: "bg-[#1d1d1f] text-white",
        });
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((error) => {
        console.error("Failed to copy:", error);
        toast.error("Failed to copy referral code");
      });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 h-full border border-[#E5E5EA] dark:border-[#38383A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <div className="flex justify-between items-center mb-5">
          <div className="h-5 w-24 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-md animate-pulse"></div>
          <div className="h-10 w-10 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] animate-pulse"></div>
        </div>
        <div className="h-9 w-28 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-md animate-pulse mt-4"></div>
        <div className="h-10 w-full bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full animate-pulse mt-4"></div>
        <div className="flex justify-between mt-4">
          <div className="h-5 w-24 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-md animate-pulse"></div>
          <div className="h-5 w-16 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-md animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-shadow p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-[#86868b] dark:text-[#86868b]">
          Referrals
        </h3>
        <div className="size-10 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-center justify-center">
          <Share2 className="size-5 text-[#007AFF]" />
        </div>
      </div>

      <div className="">
        <div className="flex items-baseline">
          <span className="text-[28px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
            {referralsCount}
          </span>
          <span className="ml-1.5 text-sm font-medium text-[#86868b] dark:text-[#86868b]">
            people referred
          </span>
        </div>
      </div>

      <motion.div
        className="mt-4 relative group cursor-pointer"
        onClick={handleCopy}
      >
        <div className="flex items-center justify-between bg-[#fff8f0] dark:bg-[#2e2922] px-4 py-3 rounded-full">
          <div className="flex items-center overflow-hidden">
            <p className="font-mono text-sm font-medium tracking-wide truncate text-[#1d1d1f] dark:text-[#f5f5f7]">
              {referralCode}
            </p>
          </div>
          <div className="h-7 w-7 rounded-full bg-white dark:bg-[#3a3a3c] flex items-center justify-center ml-2 flex-shrink-0 shadow-sm">
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[#30d158] dark:text-[#30d158]"
                >
                  <Check className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[#86868b] dark:text-[#86868b] group-hover:text-[#FF9500] dark:group-hover:text-[#FF9F0A] transition-colors duration-200"
                >
                  <Copy className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* <div className="mt-4 flex items-center justify-between">
        <a
          href="/dashboard/referrals"
          className="text-sm text-[#007AFF] dark:text-[#0A84FF] hover:text-[#0051b3] dark:hover:text-[#409cff] transition-colors flex items-center"
        >
          View Program
          <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
        </a>

        <motion.button
          className="text-sm text-[#86868b] dark:text-[#86868b] hover:text-[#007AFF] dark:hover:text-[#0A84FF] transition-colors flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShare}
        >
          <Share2 className="h-3.5 w-3.5 mr-1.5" />
          Share
        </motion.button>
      </div> */}
    </div>
  );
}
