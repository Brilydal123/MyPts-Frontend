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
      .catch(error => {
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
    <motion.div
      className="relative bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 h-full border border-[#E5E5EA] dark:border-[#38383A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.15)] backdrop-blur-sm overflow-hidden group"
      whileHover={{
        y: -2,
        boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
        borderColor: "#D1D1D6",
        transition: { duration: 0.2 }
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Apple-like inner highlight/glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-50 dark:opacity-10 pointer-events-none rounded-2xl"></div>

      {/* True Apple-like gradient on hover - subtle, elegant, with depth */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out pointer-events-none">
        {/* Main gradient - extremely subtle color shift */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFFFFF] via-[#F9F9FC] to-[#F5F5F7] dark:from-[#1D1D1F] dark:via-[#1C1C1E] dark:to-[#1A1A1C] opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-2xl"></div>

        {/* Top highlight - simulates light from above */}
        <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/30 to-transparent dark:from-white/10 dark:to-transparent rounded-t-2xl"></div>

        {/* Bottom shadow - adds depth */}
        <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-gradient-to-t from-black/5 to-transparent dark:from-black/20 dark:to-transparent rounded-b-2xl"></div>

        {/* Left edge highlight */}
        <div className="absolute top-[10%] bottom-[10%] left-0 w-[1px] bg-gradient-to-b from-transparent via-white/50 to-transparent dark:via-white/10"></div>

        {/* Right edge shadow */}
        <div className="absolute top-[10%] bottom-[10%] right-0 w-[1px] bg-gradient-to-b from-transparent via-black/5 to-transparent dark:via-black/20"></div>
      </div>

      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-medium text-[#86868b] dark:text-[#86868b]">Referrals</h3>
        <div className="h-10 w-10 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-center justify-center">
          <div className="h-5 w-5 text-[#007AFF] dark:text-[#0A84FF]">
            <Share2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="mt-1">
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
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleCopy}
      >
        <div className="flex items-center justify-between bg-[#f5f5f7] dark:bg-[#2c2c2e] px-4 py-3 rounded-full">
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
                  className="text-[#86868b] dark:text-[#86868b] group-hover:text-[#007AFF] dark:group-hover:text-[#0A84FF] transition-colors duration-200"
                >
                  <Copy className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <div className="mt-4 flex items-center justify-between">
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
      </div>
    </motion.div>
  );
}
