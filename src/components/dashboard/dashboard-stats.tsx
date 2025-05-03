import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  UserPlus,
  Copy,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { MyPtsBalance, MyPtsValue } from "@/types/mypts";

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
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(console.error);
  };

  const cardClasses = "transition-all duration-300 hover:shadow-lg shadow-md bg-card";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className={cardClasses}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MyPts Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted rounded animate-pulse"></div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {getValuePerMyPt().toFixed(6)}
              </div>
              <p className="text-xs text-muted-foreground">
                {currency === "XAF"
                  ? "FCFA "
                  : value.symbol || value.baseSymbol || "$"}
                {getValuePerMyPt().toFixed(6)} per MyPt
              </p>
              <div className="flex items-center pt-1">
                {change.isPositive ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-red-600" />
                )}
                <p className={`text-xs ${change.isPositive ? "text-green-600" : "text-red-600"}`}>
                  {change.percentage.toFixed(2)}% from previous
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className={cardClasses}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted rounded animate-pulse"></div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {balance.balance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(balance.balance * getValuePerMyPt())}
                {currency === "XAF"
                  ? " (FCFA "
                  : ` (${balance.value.symbol || value.symbol || "$"}`}
                {getValuePerMyPt().toFixed(4)} per MyPt)
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className={cardClasses}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lifetime Earned</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted rounded animate-pulse"></div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {balance.lifetimeEarned.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(balance.lifetimeEarned * getValuePerMyPt())}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className={cardClasses}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lifetime Spent</CardTitle>
          <ArrowDownRight className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted rounded animate-pulse"></div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {balance.lifetimeSpent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(balance.lifetimeSpent * getValuePerMyPt())}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className={cardClasses}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Referrals</CardTitle>
          <UserPlus className="h-4 w-4 text-black" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="bg-muted rounded animate-pulse"></div>
          ) : (
            <>
              <div className="text-2xl font-bold">{referralsCount}</div>
              <div className="mt-1 flex items-center space-x-4">
                <span className="font-mono bg-gray-100 border border-gray-200 px-3 rounded-full text-gray-800">
                  {referralCode}
                </span>
                <motion.button
                  onClick={handleCopy}
                  initial={{ opacity: 0.9 }}
                  whileHover={{ scale: 1.1, opacity: 1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="cursor-pointer relative"
                >
                  <Copy className="h-4 w-4" />
                  <span className="text-sm absolute top-[1.3rem] -right-[1.4rem] text-muted-foreground">
                    {copied ? "Copied!" : ""}
                  </span>
                </motion.button>
              </div>
              <div className="mt-2">
                <a
                  href="/dashboard/referrals"
                  className="text-xs text-blue-600 hover:underline flex items-center"
                >
                  View Referral Program
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </a>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
