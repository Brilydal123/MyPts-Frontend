"use client";

import { MainLayout } from "@/components/shared/main-layout";
import { BalanceCard } from "@/components/shared/balance-card";
import { RobustSellForm } from "@/components/dashboard/robust-sell-form";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { useBalance } from "@/hooks/use-mypts-data";
import { useCurrency } from "@/hooks/use-currency";
import { motion } from "framer-motion";

export default function SellPage() {
  // Use global currency state
  const { currency, setCurrency } = useCurrency();

  // Use React Query hook for balance data
  const {
    data: balance,
    isLoading,
    refetch: refetchBalance
  } = useBalance(currency);

  const handleCurrencyChange = (newCurrency: string) => {
    // Update the global currency state
    setCurrency(newCurrency);
  };

  // Function to refresh balance data
  const refreshData = () => {
    refetchBalance();
    toast.success("Refreshing balance data...");
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <MainLayout>
      <motion.div
        className="space-y-8 mx-auto px-4 sm:px-6 g"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header with gradient background */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Sell MyPts</h1>
          <Button
            onClick={refreshData}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
        {/* Main content */}
        <div className="grid gap-8 lg:grid-cols-2 md:grid-cols-1">
          <motion.div variants={itemVariants} className="h-full">
            {balance ? (
              <BalanceCard
                balance={balance}
                isLoading={isLoading}
                onCurrencyChange={handleCurrencyChange}
                currency={currency}
              />
            ) : (
              <div className="h-64 bg-muted rounded-xl shadow-sm animate-pulse"></div>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="h-full">
            {balance ? (
              <RobustSellForm
                balance={balance}
                onSuccess={() => refetchBalance()}
                currency={currency}
                onCurrencyChange={handleCurrencyChange}
              />
            ) : (
              <div className="h-full bg-muted rounded-xl shadow-sm animate-pulse "></div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </MainLayout>
  );
}
