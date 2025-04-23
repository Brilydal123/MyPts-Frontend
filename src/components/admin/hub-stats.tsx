import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MyPtsHubState, MyPtsValue } from '@/types/mypts';
import { Coins, CircleDollarSign, Wallet, TrendingUp, Scale } from 'lucide-react';

interface HubStatsProps {
  hubState: MyPtsHubState;
  value: MyPtsValue;
  isLoading?: boolean;
}

export function HubStats({ hubState, value, isLoading = false }: HubStatsProps) {
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Supply</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted rounded animate-pulse"></div>
          ) : (
            <>
              <div className="text-2xl font-bold">{formatNumber(hubState.totalSupply)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(hubState.totalSupply * hubState.valuePerMyPt)}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Circulating Supply</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted rounded animate-pulse"></div>
          ) : (
            <>
              <div className="text-2xl font-bold">{formatNumber(hubState.circulatingSupply)}</div>
              <p className="text-xs text-muted-foreground">
                {((hubState.circulatingSupply / hubState.totalSupply) * 100).toFixed(2)}% of total
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Reserve Supply</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted rounded animate-pulse"></div>
          ) : (
            <>
              <div className="text-2xl font-bold">{formatNumber(hubState.reserveSupply)}</div>
              <p className="text-xs text-muted-foreground">
                {((hubState.reserveSupply / hubState.totalSupply) * 100).toFixed(2)}% of total
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Value Per MyPt</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted rounded animate-pulse"></div>
          ) : (
            <>
              <div className="text-2xl font-bold">${hubState.valuePerMyPt.toFixed(6)}</div>
              <p className="text-xs text-muted-foreground">
                Total value: {formatCurrency(hubState.totalSupply * hubState.valuePerMyPt)}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
