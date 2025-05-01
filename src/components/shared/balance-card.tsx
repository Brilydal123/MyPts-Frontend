import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MyPtsBalance } from '@/types/mypts';
import { ArrowUpRight, ArrowDownRight, Coins } from 'lucide-react';
import { useState } from 'react';

interface BalanceCardProps {
  balance: MyPtsBalance;
  isLoading?: boolean;
  onCurrencyChange?: (currency: string) => void;
  onRefresh?: () => Promise<void> | void;
  currency: string; // Selected currency code
}

const currencies = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'XAF', label: 'XAF (FCFA)', symbol: 'FCFA' },
  { value: 'NGN', label: 'NGN (₦)', symbol: '₦' },
  { value: 'PKR', label: 'PKR (₨)', symbol: '₨' },
];

// BalanceCard now accepts a currency prop for dynamic formatting
export function BalanceCard({ balance, isLoading = false, onCurrencyChange, currency }: BalanceCardProps) {
  // Use the currency prop instead of local state
  const handleCurrencyChange = (value: string) => {
    if (onCurrencyChange) {
      onCurrencyChange(value);
    }
  };

  // Get the direct conversion value for a currency
  const getDirectConversionValue = (): number => {
    const directConversions: Record<string, number> = {
      'XAF': 13.61,  // 1 MyPt = 13.61 XAF
      'EUR': 0.0208, // 1 MyPt = 0.0208 EUR
      'GBP': 0.0179, // 1 MyPt = 0.0179 GBP
      'NGN': 38.26,  // 1 MyPt = 38.26 NGN
      'PKR': 6.74    // 1 MyPt = 6.74 PKR
    };

    return directConversions[currency] || 0;
  };

  // Get the value per MyPt based on the selected currency
  const getValuePerMyPt = (): number => {
    const directValue = getDirectConversionValue();
    if (directValue > 0) {
      return directValue;
    }
    return balance.value.valuePerMyPt;
  };

  // Format the total value based on the currency
  const getFormattedTotalValue = (): string => {
    const currencyInfo = currencies.find(c => c.value === currency);
    const valuePerMyPt = getValuePerMyPt();
    const totalValue = balance.balance * valuePerMyPt;

    return `${currencyInfo?.symbol || balance.value.symbol} ${totalValue.toFixed(2)}`;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground -mt-[1.5rem] p-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Local Currencies Convension</CardTitle>
          <Select value={currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-[120px] bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20">
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
        <CardDescription className="text-primary-foreground/80">
          {currencies.find(c => c.value === currency)?.label || currency}
          <br />
          Your current MyPts balance and value
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex flex-col space-y-4 animate-pulse">
            <div className="h-8 w-3/4 bg-muted rounded"></div>
            <div className="h-6 w-1/2 bg-muted rounded"></div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{balance.balance.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">MyPts</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold">{getFormattedTotalValue()}</p>
                <p className="text-sm text-muted-foreground">
                  {currencies.find(c => c.value === currency)?.symbol || balance.value.symbol} {getValuePerMyPt().toFixed(4)} per MyPt
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center p-4 border rounded-lg">
                <div className="mr-4 rounded-full p-2 bg-green-100 text-green-600">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Earned</p>
                  <p className="text-xl font-bold">{balance.lifetimeEarned.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center p-4 border rounded-lg">
                <div className="mr-4 rounded-full p-2 bg-red-100 text-red-600">
                  <ArrowDownRight className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Spent</p>
                  <p className="text-xl font-bold">{balance.lifetimeSpent.toLocaleString()}</p>
                </div>
              </div>
            </div>
            {balance.lastTransaction && (
              <div className="mt-4 text-sm text-muted-foreground flex items-center">
                <Coins className="h-4 w-4 mr-1" />
                Last transaction: {new Date(balance.lastTransaction).toLocaleString()}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
