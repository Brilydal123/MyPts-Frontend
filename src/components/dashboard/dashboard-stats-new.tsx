"use client";

import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { MyPtsBalance, MyPtsValue } from "@/types/mypts";
import { DashboardStatsCard } from "./dashboard-stats-card";
import { ReferralStatsCard } from "./referral-stats-card";
import ShareReferralModal from "@/components/referrals/ShareReferralModal";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
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

  // Fetch exchange rates using our custom hook
  const {
    data: exchangeRates,
    isLoading: isLoadingRates,
    refetch: refetchRates,
  } = useExchangeRates("USD");

  // State to track if we're using API rates or fallback rates
  const [usingFallbackRates, setUsingFallbackRates] = useState(false);

  // State to store the calculated value per MyPt
  const [valuePerMyPt, setValuePerMyPt] = useState<number>(() => {
    // Initialize with direct conversion or value from props
    const directValue = getDirectConversionValue(currency);
    if (directValue > 0) {
      return directValue;
    }
    return value.valuePerPts || value.valuePerMyPt || 0;
  });

  // Update the value per MyPt when exchange rates or currency changes
  useEffect(() => {
    let newValue: number;
    let useFallback = false;

    // If we have exchange rates from the API
    if (exchangeRates) {
      // Base value of MyPts in USD
      const baseValueInUsd = 0.024;

      // If the selected currency is USD, use the base value
      if (currency === "USD") {
        newValue = baseValueInUsd;
      } else {
        // Check if we have a direct conversion value first (preferred method)
        const directValue = getDirectConversionValue(currency);
        if (directValue > 0) {
          // Use the direct conversion value as it's specifically calibrated for MyPts
          newValue = directValue;
          // We're using hardcoded values, but they're the preferred ones for MyPts
          useFallback = false;
        } else {
          // Get the exchange rate for the selected currency from the API
          const rate = exchangeRates.rates[currency];

          // If we have a rate, calculate the value
          if (rate) {
            // Convert USD value to target currency
            newValue = baseValueInUsd * rate;
            useFallback = false;
          } else {
            // Last resort: use the value from the value object
            newValue = value.valuePerPts || value.valuePerMyPt || 0;
            useFallback = true;
          }
        }
      }
    } else {
      // No exchange rates, use fallback
      const directValue = getDirectConversionValue(currency);
      if (directValue > 0) {
        newValue = directValue;
        useFallback = true;
      } else {
        // Last resort: use the value from the value object
        newValue = value.valuePerPts || value.valuePerMyPt || 0;
        useFallback = true;
      }
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
    const change =
      ((currentValue - value.previousValue) / value.previousValue) * 100;
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
          value={valuePerMyPt.toFixed(6)}
          unit={currency}
          subtitle={`${formatCurrency(valuePerMyPt, currency)} per MyPt ${
            isLoadingRates
              ? "(Loading rates...)"
              : usingFallbackRates
              ? "(Fallback rates)"
              : "(Live rates)"
          }`}
          trend={{
            value: `${change.percentage.toFixed(2)}%`,
            isPositive: change.isPositive,
            label: "from previous",
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
          subtitle={`${formatCurrency(
            balance.balance * valuePerMyPt,
            currency
          )} • ${formatCurrency(valuePerMyPt, currency)} per MyPt`}
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
          subtitle={formatCurrency(
            balance.lifetimeEarned * valuePerMyPt,
            currency
          )}
          isLoading={isLoading}
        />

        <DashboardStatsCard
          title="Lifetime Spent"
          icon={<ArrowDownRight className="h-5 w-5" />}
          iconColor="text-[#FF3B30] dark:text-[#FF453A]"
          iconBgColor="bg-[#f8f1f0] dark:bg-[#2f1a19]"
          value={balance.lifetimeSpent.toLocaleString()}
          unit="MyPts"
          subtitle={formatCurrency(
            balance.lifetimeSpent * valuePerMyPt,
            currency
          )}
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
