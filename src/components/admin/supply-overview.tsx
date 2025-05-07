import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MyPtsHubState } from '@/types/mypts';
import { Coins, Wallet, PieChart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SupplyOverviewProps {
  hubState: MyPtsHubState;
  isLoading?: boolean;
}

export function SupplyOverview({ hubState, isLoading = false }: SupplyOverviewProps) {
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

  // Calculate percentages
  const holdingPercentage = (hubState.holdingSupply / hubState.totalSupply) * 100;
  const circulatingPercentage = (hubState.circulatingSupply / hubState.totalSupply) * 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">MyPts Supply Overview</CardTitle>
            <CardDescription className="text-blue-100 mt-1">
              Total supply and holding distribution
            </CardDescription>
          </div>
          <PieChart className="h-8 w-8 text-blue-100" />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-6">
            <div className="h-12 bg-muted rounded animate-pulse"></div>
            <div className="h-24 bg-muted rounded animate-pulse"></div>
            <div className="h-12 bg-muted rounded animate-pulse"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Coins className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Supply</p>
                  <p className="text-2xl font-bold">{formatNumber(hubState.totalSupply)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(hubState.totalSupply * hubState.valuePerMyPt)}
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <Wallet className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Holding (Reserve)</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-bold">{formatNumber(hubState.holdingSupply)}</p>
                      <p className="text-sm font-medium text-amber-600">
                        {holdingPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Value</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(hubState.holdingSupply * hubState.valuePerMyPt)}
                  </p>
                </div>
              </div>
              <Progress value={holdingPercentage} className="h-2 bg-amber-100" indicatorClassName="bg-amber-500" />
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Coins className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Circulating Supply</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-bold">{formatNumber(hubState.circulatingSupply)}</p>
                      <p className="text-sm font-medium text-green-600">
                        {circulatingPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Value</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(hubState.circulatingSupply * hubState.valuePerMyPt)}
                  </p>
                </div>
              </div>
              <Progress value={circulatingPercentage} className="h-2 bg-green-100" indicatorClassName="bg-green-500" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
