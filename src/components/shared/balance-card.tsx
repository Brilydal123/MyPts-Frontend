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
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { formatCurrency, getDirectConversionValue } from "@/lib/currency";
import { Button } from "@/components/ui/button";

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

  // Fetch exchange rates using our custom hook
  const {
    data: exchangeRates,
    isLoading: isLoadingRates,
    refetch: refetchRates
  } = useExchangeRates('USD');

  // State to track if we're using API rates or fallback rates
  const [usingFallbackRates, setUsingFallbackRates] = useState(false);

  // State to store the calculated value per MyPt
  const [valuePerMyPt, setValuePerMyPt] = useState<number>(() => {
    // Initialize with direct conversion or value from balance
    const directValue = getDirectConversionValue(currency);
    if (directValue > 0) {
      return directValue;
    }
    return balance.value.valuePerMyPt;
  });

  // State to store the formatted total value
  const [formattedTotalValue, setFormattedTotalValue] = useState<string>('');

  // Handle refresh button click
  const handleRefresh = () => {
    refetchRates();
    if (onRefresh) {
      onRefresh();
    }
  };

  // Update the value per MyPt when exchange rates or currency changes
  useEffect(() => {
    let newValue: number;
    let useFallback = false;

    // If we have exchange rates from the API
    if (exchangeRates) {
      // Base value of MyPts in USD
      const baseValueInUsd = 0.024;

      // If the selected currency is USD, use the base value
      if (currency === 'USD') {
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
            // Last resort: use the value from the balance object
            newValue = balance.value.valuePerMyPt;
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
        // Last resort: use the value from the balance object
        newValue = balance.value.valuePerMyPt;
        useFallback = true;
      }
    }

    // Update state
    setValuePerMyPt(newValue);
    setUsingFallbackRates(useFallback);
  }, [exchangeRates, currency, balance.value.valuePerMyPt]);

  // Update the formatted total value when valuePerMyPt or balance changes
  useEffect(() => {
    const totalValue = balance.balance * valuePerMyPt;
    setFormattedTotalValue(formatCurrency(totalValue, currency));
  }, [valuePerMyPt, balance.balance, currency]);

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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 rounded-full h-9 w-9"
                disabled={isLoadingRates}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingRates ? 'animate-spin' : ''}`} />
              </Button>
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
          </div>
          <CardDescription className="text-primary-foreground/90 mt-2">
            {currencies.find((c) => c.value === currency)?.label || currency}
            <br />
            Your current MyPts balance and equivalent value
            {isLoadingRates && (
              <span className="ml-2 text-xs opacity-70">(Loading rates...)</span>
            )}
            {!isLoadingRates && usingFallbackRates && (
              <span className="ml-2 text-xs opacity-70">(Using fallback rates)</span>
            )}
            {!isLoadingRates && !usingFallbackRates && exchangeRates && (
              <span className="ml-2 text-xs opacity-70">(Live rates from ExchangeRate-API)</span>
            )}
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
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-primary/5 rounded-xl mb-6 balance-equivalent-value"
              >
                <div className="w-full sm:w-auto">
                  <p className="text-sm font-medium text-muted-foreground">
                    Current Balance
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {balance.balance.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">MyPts</p>
                </div>
                <div className="w-full sm:w-auto text-left sm:text-right mt-2 sm:mt-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    Equivalent Value
                  </p>
                  <p className="text-2xl sm:text-3xl font-semibold">
                    {formattedTotalValue}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {currencies.find((c) => c.value === currency)?.symbol ||
                      balance.value.symbol}{" "}
                    {valuePerMyPt.toFixed(4)} per MyPt
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
