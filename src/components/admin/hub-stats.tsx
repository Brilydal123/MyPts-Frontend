import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MyPtsHubState, MyPtsValue } from '@/types/mypts';
import { Coins, CircleDollarSign, Wallet, TrendingUp, Scale, PieChart, DollarSign, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface HubStatsProps {
  hubState: MyPtsHubState;
  value: MyPtsValue;
  isLoading?: boolean;
}

export function HubStats({ hubState, value, isLoading = false }: HubStatsProps) {
  const router = useRouter();
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {/* Total Supply Card */}
        <Card className="lg:col-span-1 backdrop-blur-md bg-white/75 dark:bg-neutral-900/75 border border-neutral-200/70 dark:border-neutral-800/70 shadow-lg dark:shadow-2xl shadow-neutral-400/20 dark:shadow-black/30 hover:shadow-xl dark:hover:shadow-3xl transition-shadow duration-300 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Supply</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 flex items-center justify-center">
              <Coins className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-md animate-pulse"></div>
            ) : (
              <>
                <div className="text-3xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight">{formatNumber(hubState.totalSupply)}</div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {formatCurrency(hubState.totalSupply * hubState.valuePerMyPt)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Holding Card */}
        <Card className="lg:col-span-1 backdrop-blur-md bg-white/75 dark:bg-neutral-900/75 border border-neutral-200/70 dark:border-neutral-800/70 shadow-lg dark:shadow-2xl shadow-neutral-400/20 dark:shadow-black/30 hover:shadow-xl dark:hover:shadow-3xl transition-shadow duration-300 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Holding</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-md animate-pulse"></div>
            ) : (
              <>
                <div className="text-3xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight">{formatNumber(hubState.holdingSupply)}</div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {((hubState.holdingSupply / hubState.totalSupply) * 100).toFixed(2)}% of total
                  </p>
                  <p className="text-xs font-medium bg-neutral-100 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300 px-2.5 py-1 rounded-lg">
                    15%
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Circulating Supply Card */}
        <Card className="lg:col-span-1 backdrop-blur-md bg-white/75 dark:bg-neutral-900/75 border border-neutral-200/70 dark:border-neutral-800/70 shadow-lg dark:shadow-2xl shadow-neutral-400/20 dark:shadow-black/30 hover:shadow-xl dark:hover:shadow-3xl transition-shadow duration-300 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Circulating </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 flex items-center justify-center">
              <CircleDollarSign className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-md animate-pulse"></div>
            ) : (
              <>
                <div className="text-3xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight">{formatNumber(hubState.circulatingSupply)}</div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {((hubState.circulatingSupply / hubState.totalSupply) * 100).toFixed(2)}% of total
                  </p>
                  <p className="text-xs font-medium bg-neutral-100 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300 px-2.5 py-1 rounded-lg">
                    85%
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Reserve Supply Card */}
        <Card className="lg:col-span-1 backdrop-blur-md bg-white/75 dark:bg-neutral-900/75 border border-neutral-200/70 dark:border-neutral-800/70 shadow-lg dark:shadow-2xl shadow-neutral-400/20 dark:shadow-black/30 hover:shadow-xl dark:hover:shadow-3xl transition-shadow duration-300 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Reserve </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 flex items-center justify-center">
              <PieChart className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-md animate-pulse"></div>
            ) : (
              <>
                <div className="text-3xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight">{formatNumber(hubState.reserveSupply)}</div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {((hubState.reserveSupply / hubState.totalSupply) * 100).toFixed(2)}% of total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Value Per MyPt Card */}
        <Card className="lg:col-span-1 backdrop-blur-md bg-white/75 dark:bg-neutral-900/75 border border-neutral-200/70 dark:border-neutral-800/70 shadow-lg dark:shadow-2xl shadow-neutral-400/20 dark:shadow-black/30 hover:shadow-xl dark:hover:shadow-3xl transition-shadow duration-300 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Value Per MyPt</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            {isLoading ? (
              <div className="h-9 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-md animate-pulse"></div>
            ) : (
              <>
                <div className="text-3xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight">${hubState.valuePerMyPt.toFixed(6)}</div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Total value: {formatCurrency(hubState.totalSupply * hubState.valuePerMyPt)}
                </p>
              </>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <Button 
              onClick={() => router.push('http://localhost:3001/admin/exchange-rates')} 
              variant="ghost" 
              size="sm" 
              className="w-full bg-neutral-100/80 dark:bg-neutral-800/80 hover:bg-neutral-200/90 dark:hover:bg-neutral-700/90 border border-neutral-200 dark:border-neutral-700/80 text-neutral-700 dark:text-neutral-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 h-9 text-sm font-medium"
            >
              <span>Manage Rates</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Distribution visualization */}
      <Card className="backdrop-blur-md bg-white/75 dark:bg-neutral-900/75 border border-neutral-200/70 dark:border-neutral-800/70 shadow-lg dark:shadow-2xl shadow-neutral-400/20 dark:shadow-black/30 hover:shadow-xl dark:hover:shadow-3xl transition-shadow duration-300 rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Supply Distribution</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-sky-500 dark:bg-sky-400 mr-1.5"></div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Circulating</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700 mr-1.5"></div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Holding</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-8 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-full animate-pulse"></div>
          ) : (
            <div className="relative h-8 bg-neutral-200/70 dark:bg-neutral-800/70 rounded-full overflow-hidden shadow-inner">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-sky-500 dark:from-sky-500 dark:to-sky-600 rounded-l-full transition-all duration-500 ease-out"
                style={{ width: `${(hubState.circulatingSupply / hubState.totalSupply) * 100}%` }}
              ></div>
              <div
                className="absolute inset-y-0 right-0 bg-neutral-300 dark:bg-neutral-700/80 rounded-r-full transition-all duration-500 ease-out"
                style={{ width: `${(hubState.holdingSupply / hubState.totalSupply) * 100}%` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 drop-shadow-sm">
                  {((hubState.circulatingSupply / hubState.totalSupply) * 100).toFixed(0)}% Circ. / {((hubState.holdingSupply / hubState.totalSupply) * 100).toFixed(0)}% Hold.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
