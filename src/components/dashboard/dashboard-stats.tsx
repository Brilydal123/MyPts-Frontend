import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  UserPlus,
  Share2,
} from "lucide-react";
import { useState } from "react";
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

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard
      .writeText(referralCode)
      .then(() => {
        setCopied(true);
        toast.success("Referral code copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(error => {
        console.error("Failed to copy:", error);
        toast.error("Failed to copy referral code");
      });
  };

  // Apple-inspired card styling - extremely clean, minimal, with subtle interactions
  const cardClasses = "transition-all duration-300 bg-[#FFFFFF] dark:bg-[#1C1C1E] border-none rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className={cardClasses}>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-9 w-28 mt-2" />
              <Skeleton className="h-4 w-32 mt-1" />
              <Skeleton className="h-5 w-24 mt-2" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-[#86868b] dark:text-[#86868b]">MyPts Value</h3>
                <div className="h-8 w-8 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-[#007AFF] dark:text-[#0A84FF]" />
                </div>
              </div>

              <div className="mt-2">
                <div className="flex items-baseline">
                  <span className="text-[28px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                    {getValuePerMyPt().toFixed(6)}
                  </span>
                  <span className="ml-1.5 text-sm font-medium text-[#86868b] dark:text-[#86868b]">
                    {currency}
                  </span>
                </div>

                <p className="text-sm text-[#86868b] dark:text-[#86868b] mt-1">
                  {currency === "XAF"
                    ? "FCFA "
                    : value.symbol || value.baseSymbol || "$"}
                  {getValuePerMyPt().toFixed(6)} per MyPt
                </p>
              </div>

              <div className="flex items-center mt-4">
                <div className={cn(
                  "flex items-center px-2 py-1 rounded-full text-sm font-medium",
                  change.isPositive
                    ? "bg-[#f2f7f2] text-[#208237] dark:bg-[#1c2b1f] dark:text-[#30d158]"
                    : "bg-[#f8f1f0] text-[#a5251d] dark:bg-[#2f1a19] dark:text-[#ff453a]"
                )}>
                  {change.isPositive ? (
                    <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3.5 w-3.5" />
                  )}
                  {change.percentage.toFixed(2)}%
                </div>
                <span className="text-sm text-[#86868b] dark:text-[#86868b] ml-2">from previous</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className={cardClasses}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Current Balance</CardTitle>
          <div className="h-7 w-7 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline">
                <span className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {balance.balance.toLocaleString()}
                </span>
                <span className="ml-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  MyPts
                </span>
              </div>

              <div className="flex items-center mt-1.5">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatCurrency(balance.balance * getValuePerMyPt())}
                </span>
                <span className="mx-1 text-xs text-zinc-400 dark:text-zinc-500">•</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {currency === "XAF"
                    ? "FCFA "
                    : balance.value.symbol || value.symbol || "$"}
                  {getValuePerMyPt().toFixed(4)} per MyPt
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className={cardClasses}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Lifetime Earned</CardTitle>
          <div className="h-7 w-7 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <ArrowUpRight className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline">
                <span className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {balance.lifetimeEarned.toLocaleString()}
                </span>
                <span className="ml-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  MyPts
                </span>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                {formatCurrency(balance.lifetimeEarned * getValuePerMyPt())}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className={cardClasses}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Lifetime Spent</CardTitle>
          <div className="h-7 w-7 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <ArrowDownRight className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline">
                <span className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {balance.lifetimeSpent.toLocaleString()}
                </span>
                <span className="ml-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  MyPts
                </span>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                {formatCurrency(balance.lifetimeSpent * getValuePerMyPt())}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className={cn(
        cardClasses,
        "overflow-hidden bg-gradient-to-br from-background to-muted/10 hover:from-primary/5 hover:to-background transition-all duration-300"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Referrals</CardTitle>
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-3.5 w-3.5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-full rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{referralsCount}</span>
                <span className="text-xs text-muted-foreground ml-1.5">people referred</span>
              </div>

              <motion.div
                className="mt-3 relative group"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <div
                  className="flex items-center justify-between bg-muted/30 hover:bg-muted/50 p-2 pl-3 pr-2 rounded-full border border-border/40 cursor-pointer transition-all duration-200"
                  onClick={handleCopy}
                >
                  <div className="flex items-center overflow-hidden">
                    <p className="font-mono text-xs font-medium tracking-wide truncate">
                      {referralCode}
                    </p>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-background flex items-center justify-center border border-border/40 group-hover:border-primary/30 transition-all duration-200 ml-2 flex-shrink-0">
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Check className="h-3 w-3 text-green-500" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Copy className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              <div className="mt-2 flex items-center justify-between">
                <a
                  href="/dashboard/referrals"
                  className="text-xs text-primary hover:underline flex items-center"
                >
                  View Program
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </a>

                <a
                  href="/dashboard/referrals"
                  onClick={(e) => {
                    e.preventDefault();
                    if (referralCode) {
                      navigator.clipboard.writeText(referralCode)
                        .then(() => {
                          toast.success("Referral code copied");
                        })
                        .catch(console.error);
                    }
                  }}
                  className="text-xs text-muted-foreground hover:text-primary hover:underline flex items-center transition-colors"
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </a>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
