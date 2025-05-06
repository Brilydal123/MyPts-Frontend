import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MyPtsHubState, MyPtsValue } from '@/types/mypts';
import { Coins, CircleDollarSign, Wallet, TrendingUp, Scale, PieChart, DollarSign } from 'lucide-react';

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
    <div className="space-y-8">
      {/* Main stats grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        {/* Total Supply Card */}
        <Card className="lg:col-span-1 backdrop-blur-sm bg-white/90 dark:bg-black/80 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Supply</CardTitle>
            <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Coins className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{formatNumber(hubState.totalSupply)}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatCurrency(hubState.totalSupply * hubState.valuePerMyPt)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Holding Card */}
        <Card className="lg:col-span-1 backdrop-blur-sm bg-white/90 dark:bg-black/80 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Holding</CardTitle>
            <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{formatNumber(hubState.reserveSupply)}</div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {((hubState.reserveSupply / hubState.totalSupply) * 100).toFixed(2)}% of total
                  </p>
                  <p className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                    15%
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Circulating Supply Card */}
        <Card className="lg:col-span-1 backdrop-blur-sm bg-white/90 dark:bg-black/80 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Circulating Supply</CardTitle>
            <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <CircleDollarSign className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{formatNumber(hubState.circulatingSupply)}</div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {((hubState.circulatingSupply / hubState.totalSupply) * 100).toFixed(2)}% of total
                  </p>
                  <p className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                    85%
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Reserve Supply Card */}
        <Card className="lg:col-span-1 backdrop-blur-sm bg-white/90 dark:bg-black/80 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Reserve Supply</CardTitle>
            <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <PieChart className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{formatNumber(hubState.reserveSupply)}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {((hubState.reserveSupply / hubState.totalSupply) * 100).toFixed(2)}% of total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Value Per MyPt Card */}
        <Card className="lg:col-span-1 backdrop-blur-sm bg-white/90 dark:bg-black/80 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Value Per MyPt</CardTitle>
            <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">${hubState.valuePerMyPt.toFixed(6)}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Total value: {formatCurrency(hubState.totalSupply * hubState.valuePerMyPt)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribution visualization */}
      <Card className="backdrop-blur-sm bg-white/90 dark:bg-black/80 border border-gray-100 dark:border-gray-800 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Supply Distribution</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 mr-1.5"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Circulating</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-700 dark:bg-gray-300 mr-1.5"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Holding</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse"></div>
          ) : (
            <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gray-300 dark:bg-gray-600 rounded-l-full"
                style={{ width: `${(hubState.circulatingSupply / hubState.totalSupply) * 100}%` }}
              ></div>
              <div
                className="absolute inset-y-0 right-0 bg-gray-700 dark:bg-gray-300 rounded-r-full"
                style={{ width: `${(hubState.reserveSupply / hubState.totalSupply) * 100}%` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-900 dark:text-white drop-shadow-sm">
                  {((hubState.circulatingSupply / hubState.totalSupply) * 100).toFixed(0)}% Circulating / {((hubState.reserveSupply / hubState.totalSupply) * 100).toFixed(0)}% Holding
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
