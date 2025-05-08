"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, UserPlus, RefreshCw } from "lucide-react";
import { MyPtsBalance, MyPtsValue } from "@/types/mypts";
import { DashboardStatsCard } from "./dashboard-stats-card";
import { ReferralStatsCard } from "./referral-stats-card";
import ShareReferralModal from "@/components/referrals/ShareReferralModal";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { useCachedExchangeRates } from "@/hooks/use-cached-exchange-rates";
import { formatCurrency, getDirectConversionValue } from "@/lib/currency";

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

  // Use our cached exchange rates hook to prevent excessive API calls
  const {
    exchangeRates,
    isLoading: isLoadingRates,
    forceRefresh: refetchRates,
    lastFetchTime
  } = useCachedExchangeRates();

  // State to track if we're using API rates or fallback rates
  const [usingFallbackRates, setUsingFallbackRates] = useState(false);

  // State to store the calculated value per MyPt
  const [valuePerMyPt, setValuePerMyPt] = useState<number>(() => {
    // Initialize with value from props
    return value.valuePerPts || value.valuePerMyPt || 0.024;
  });

  // Update the value per MyPt when exchange rates or currency changes
  useEffect(() => {
    let newValue: number;
    let useFallback = false;

    // Define a consistent base value for MyPts in USD, aligning with initial state and other fallbacks
    const baseValueInUsd = value.valuePerPts || value.valuePerMyPt || 0.024;

    if (exchangeRates) {
      if (currency === 'USD') {
        newValue = baseValueInUsd;
        useFallback = false; // Using direct USD value, not a fallback
      } else {
        // Try to get the exchange rate for the selected currency
        const rate = exchangeRates.rates[currency];
        if (rate) {
          // If rate is available, convert USD value to target currency
          newValue = baseValueInUsd * rate;
          useFallback = false; // Using live API rate
        } else {
          // If rate for the specific currency is not found in API response,
          // use the base USD value as a fallback.
          newValue = baseValueInUsd;
          useFallback = true;
        }
      }
    } else {
      // No exchange rates data available (e.g., API call failed or still loading)
      // Use the base USD value as a fallback.
      newValue = baseValueInUsd;
      useFallback = true;
    }

    // Update state
    setValuePerMyPt(newValue);
    setUsingFallbackRates(useFallback);
  }, [exchangeRates, currency, value]);

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
          value={valuePerMyPt.toString()}
          unit={currency}
          subtitle={`${formatCurrency(valuePerMyPt, currency, { preserveFullPrecision: true })} per MyPt ${isLoadingRates ? '(Loading rates...)' : usingFallbackRates ? '(Fallback rates)' : '(Live rates)'}`}
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
          subtitle={`${formatCurrency(balance.balance * valuePerMyPt, currency)} • ${formatCurrency(valuePerMyPt, currency)} per MyPt`}
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
          subtitle={formatCurrency(balance.lifetimeEarned * valuePerMyPt, currency)}
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
          subtitle={formatCurrency(balance.lifetimeSpent * valuePerMyPt, currency)}
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
