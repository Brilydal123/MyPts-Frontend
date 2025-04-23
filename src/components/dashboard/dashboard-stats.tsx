import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign } from 'lucide-react';
import { MyPtsBalance, MyPtsValue } from '@/types/mypts';

interface DashboardStatsProps {
  balance: MyPtsBalance;
  value: MyPtsValue;
  isLoading?: boolean;
  currency: string; // Selected currency code
}

// DashboardStats now accepts a currency prop for dynamic formatting
export function DashboardStats({ balance, value, isLoading = false, currency }: DashboardStatsProps) {
  // Format currency using the selected currency code
  const formatCurrency = (amount: number): string => {
    // For XAF and other special currencies, use custom formatting
    if (currency === 'XAF') {
      return `FCFA ${amount.toFixed(2)}`;
    } else if (currency === 'NGN') {
      return `₦${amount.toFixed(2)}`;
    } else if (currency === 'PKR') {
      return `₨${amount.toFixed(2)}`;
    } else {
      // Use Intl.NumberFormat for standard currencies
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
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
    return value.valuePerPts || value.valuePerMyPt || 0;
  };


  const calculateChange = (): { percentage: number; isPositive: boolean } => {
    if (!value.previousValue || value.previousValue === 0) {
      return { percentage: 0, isPositive: true };
    }

    // Handle both valuePerPts and valuePerMyPt for backward compatibility
    const currentValue = value.valuePerPts || value.valuePerMyPt || 0;
    const change = ((currentValue - value.previousValue) / value.previousValue) * 100;
    return {
      percentage: Math.abs(change),
      isPositive: change >= 0,
    };
  };

  const change = calculateChange();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted rounded animate-pulse"></div>
          ) : (
            <>
              <div className="text-2xl font-bold">{balance.balance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {/* Show total value using direct conversion if available */}
                {formatCurrency(balance.balance * getValuePerMyPt())}
                {currency === 'XAF' ? ' (FCFA ' : ` (${balance.value.symbol || value.symbol || '$'}`}{getValuePerMyPt().toFixed(4)} per MyPt)
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MyPts Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted rounded animate-pulse"></div>
          ) : (
            <>
              {/* Show global value per MyPt using direct conversion if available */}
              <div className="text-2xl font-bold">{getValuePerMyPt().toFixed(6)}</div>
              <p className="text-xs text-muted-foreground">
                {currency === 'XAF' ? 'FCFA ' : (value.symbol || value.baseSymbol || '$')}{getValuePerMyPt().toFixed(6)} per MyPt
              </p>
              <div className="flex items-center pt-1">
                {change.isPositive ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-red-600" />
                )}
                <p
                  className={`text-xs ${
                    change.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {change.percentage.toFixed(2)}% from previous
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lifetime Earned</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted rounded animate-pulse"></div>
          ) : (
            <>
              <div className="text-2xl font-bold">{balance.lifetimeEarned.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {/* Calculate using value.valuePerPts for global stats */}
                {formatCurrency(balance.lifetimeEarned * getValuePerMyPt())}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lifetime Spent</CardTitle>
          <ArrowDownRight className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted rounded animate-pulse"></div>
          ) : (
            <>
              <div className="text-2xl font-bold">{balance.lifetimeSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(balance.lifetimeSpent * getValuePerMyPt())}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
