"use client";

import { MainLayout } from "@/components/shared/main-layout";
import { BalanceCard } from "@/components/shared/balance-card";
import { BuyForm } from "@/components/dashboard/buy-form";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useBalance } from "@/hooks/use-mypts-data";
import { useCurrency } from "@/hooks/use-currency";

export default function BuyPage() {
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Buy MyPts</h1>
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

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            {balance ? (
              <BalanceCard
                balance={balance}
                isLoading={isLoading}
                onCurrencyChange={handleCurrencyChange}
                currency={currency}
              />
            ) : (
              <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
            )}
          </div>

          <div className="order-1 lg:order-2">
            <BuyForm onSuccess={() => refetchBalance()} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
