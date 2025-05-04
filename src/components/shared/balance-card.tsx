import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MyPtsBalance } from "@/types/mypts";
import {
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  BarChart4 as CurrencyExchange,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface BalanceCardProps {
  balance: MyPtsBalance;
  isLoading?: boolean;
  onCurrencyChange?: (currency: string) => void;
  onRefresh?: () => Promise<void> | void;
  currency: string;
}

const currencies = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "XAF", label: "XAF (FCFA)", symbol: "FCFA" },
  { value: "NGN", label: "NGN (₦)", symbol: "₦" },
  { value: "PKR", label: "PKR (₨)", symbol: "₨" },
];

export function BalanceCard({
  balance,
  isLoading = false,
  onCurrencyChange,
  currency,
}: BalanceCardProps) {
  const handleCurrencyChange = (value: string) => {
    if (onCurrencyChange) {
      onCurrencyChange(value);
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
    return balance.value.valuePerMyPt;
  };

  const getFormattedTotalValue = (): string => {
    const currencyInfo = currencies.find((c) => c.value === currency);
    const valuePerMyPt = getValuePerMyPt();
    const totalValue = balance.balance * valuePerMyPt;

    return `${
      currencyInfo?.symbol || balance.value.symbol
    } ${totalValue.toFixed(2)}`;
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 20,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      // whileHover="hover"
      className=""
    >
      <Card className="overflow-hidden shadow-md h-full border-0 rounded-xl bg-gradient-to-br from-card to-background">
        <CardHeader className="bg-primary rounded-t-md text-primary-foreground p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <CurrencyExchange className="h-5 w-5" />
              Local Currencies Conversion
            </CardTitle>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-[130px] bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 rounded-full">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CardDescription className="text-primary-foreground/90 mt-2">
            {currencies.find((c) => c.value === currency)?.label || currency}
            <br />
            Your current MyPts balance and equivalent value
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 md:p-5">
          {isLoading ? (
            <div className="flex flex-col space-y-4 animate-pulse">
              <div className="h-8 w-3/4 bg-muted rounded-full"></div>
              <div className="h-6 w-1/2 bg-muted rounded-full"></div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="h-16 bg-muted rounded-xl"></div>
                <div className="h-16 bg-muted rounded-xl"></div>
              </div>
            </div>
          ) : (
            <>
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-primary/5 rounded-xl mb-6"
              >
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Current Balance
                  </p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {balance.balance.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">MyPts</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">
                    Equivalent Value
                  </p>
                  <p className="text-3xl font-semibold">
                    {getFormattedTotalValue()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currencies.find((c) => c.value === currency)?.symbol ||
                      balance.value.symbol}{" "}
                    {getValuePerMyPt().toFixed(4)} per MyPt
                  </p>
                </div>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <motion.div
                  variants={itemVariants}
                  className="flex items-center p-5 rounded-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200"
                >
                  <div className="mr-4 rounded-full p-3 bg-green-100 text-green-600">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">
                      Total Earned
                    </p>
                    <p className="text-2xl font-bold text-green-800">
                      {balance.lifetimeEarned.toLocaleString()}
                    </p>
                  </div>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="flex items-center p-5 rounded-xl transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200"
                >
                  <div className="mr-4 rounded-full p-3 bg-red-100 text-red-600">
                    <ArrowDownRight className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-700">
                      Total Spent
                    </p>
                    <p className="text-2xl font-bold text-red-800">
                      {balance.lifetimeSpent.toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              </div>
              {balance.lastTransaction && (
                <motion.div
                  variants={itemVariants}
                  className="mt-6 text-sm bg-muted/50 p-3 rounded-lg text-muted-foreground flex items-center"
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Last transaction:{" "}
                  {new Date(balance.lastTransaction).toLocaleString()}
                </motion.div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
