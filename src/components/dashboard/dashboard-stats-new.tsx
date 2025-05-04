"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, UserPlus } from "lucide-react";
import { MyPtsBalance, MyPtsValue } from "@/types/mypts";
import { DashboardStatsCard } from "./dashboard-stats-card";
import { ReferralStatsCard } from "./referral-stats-card";
import ShareReferralModal from "@/components/referrals/ShareReferralModal";

interface DashboardStatsProps {
  balance: MyPtsBalance;
  value: MyPtsValue;
  isLoading?: boolean;
  currency: string;
  referralsCount: number;
  referralCode: string;
}

export function DashboardStats({
  balance,
  value,
  isLoading = false,
  currency,
  referralsCount,
  referralCode,
}: DashboardStatsProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const formatCurrency = (amount: number): string => {
    if (currency === "XAF") {
      return `FCFA ${amount.toFixed(2)}`;
    } else if (currency === "NGN") {
      return `₦${amount.toFixed(2)}`;
    } else if (currency === "PKR") {
      return `₨${amount.toFixed(2)}`;
    } else {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }
  };

  const getDirectConversionValue = (): number => {
    const directConversions: Record<string, number> = {
      XAF: 13.61,
      EUR: 0.0208,
      GBP: 0.0179,
      NGN: 38.26,
      PKR: 6.74,
    };

    return directConversions[currency] || 0;
  };

  const getValuePerMyPt = (): number => {
    const directValue = getDirectConversionValue();
    if (directValue > 0) {
      return directValue;
    }
    return value.valuePerPts || value.valuePerMyPt || 0;
  };

  const calculateChange = (): { percentage: number; isPositive: boolean } => {
    if (!value.previousValue || value.previousValue === 0) {
      return { percentage: 0, isPositive: true };
    }

    const currentValue = value.valuePerPts || value.valuePerMyPt || 0;
    const change = ((currentValue - value.previousValue) / value.previousValue) * 100;
    return {
      percentage: Math.abs(change),
      isPositive: change >= 0,
    };
  };

  const change = calculateChange();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* MyPts Value Card */}
        <DashboardStatsCard
          title="MyPts Value"
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor="text-[#007AFF] dark:text-[#0A84FF]"
          iconBgColor="bg-[#f5f5f7] dark:bg-[#2c2c2e]"
          value={getValuePerMyPt().toFixed(6)}
          unit={currency}
          subtitle={`${currency === "XAF" ? "FCFA " : value.symbol || value.baseSymbol || "$"}${getValuePerMyPt().toFixed(6)} per MyPt`}
          trend={{
            value: `${change.percentage.toFixed(2)}%`,
            isPositive: change.isPositive,
            label: "from previous"
          }}
          isLoading={isLoading}
        />

        {/* Current Balance Card */}
        <DashboardStatsCard
          title="Current Balance"
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="text-[#34C759] dark:text-[#30D158]"
          iconBgColor="bg-[#f2f7f2] dark:bg-[#1c2b1f]"
          value={balance.balance.toLocaleString()}
          unit="MyPts"
          subtitle={`${formatCurrency(balance.balance * getValuePerMyPt())} • ${currency === "XAF" ? "FCFA " : balance.value.symbol || value.symbol || "$"}${getValuePerMyPt().toFixed(4)} per MyPt`}
          isLoading={isLoading}
        />

        {/* Lifetime Earned Card */}
        <DashboardStatsCard
          title="Lifetime Earned"
          icon={<ArrowUpRight className="h-5 w-5" />}
          iconColor="text-[#34C759] dark:text-[#30D158]"
          iconBgColor="bg-[#f2f7f2] dark:bg-[#1c2b1f]"
          value={balance.lifetimeEarned.toLocaleString()}
          unit="MyPts"
          subtitle={formatCurrency(balance.lifetimeEarned * getValuePerMyPt())}
          isLoading={isLoading}
        />

        {/* Lifetime Spent Card */}
        <DashboardStatsCard
          title="Lifetime Spent"
          icon={<ArrowDownRight className="h-5 w-5" />}
          iconColor="text-[#FF3B30] dark:text-[#FF453A]"
          iconBgColor="bg-[#f8f1f0] dark:bg-[#2f1a19]"
          value={balance.lifetimeSpent.toLocaleString()}
          unit="MyPts"
          subtitle={formatCurrency(balance.lifetimeSpent * getValuePerMyPt())}
          isLoading={isLoading}
        />

        {/* Referrals Card */}
        <ReferralStatsCard
          referralCode={referralCode}
          referralsCount={referralsCount}
          isLoading={isLoading}
          onShare={() => setIsShareModalOpen(true)}
        />
      </div>

      {/* Share Referral Modal */}
      <ShareReferralModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        referralCode={referralCode}
      />
    </>
  );
}
