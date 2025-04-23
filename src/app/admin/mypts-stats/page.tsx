'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MyPtsApi } from '@/lib/api/mypts-api';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  TrendingUp,
  DollarSign,
  Award,
  ShoppingCart,
  RefreshCw,
  BarChart4,
  PieChart,
  LineChart,
  CircleDollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';

const myPtsApi = new MyPtsApi();

export default function MyPtsStatsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch MyPts statistics
  const { data: statsData, isLoading, error, refetch } = useQuery({
    queryKey: ['myPtsStats'],
    queryFn: async () => {
      const response = await myPtsApi.getMyPtsStats();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch MyPts statistics');
      }
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Format number with commas
  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '$0.00';
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate percentage
  const calculatePercentage = (part: number | null | undefined, total: number | null | undefined) => {
    if (!part || !total || total === 0) return 0;
    return ((part / total) * 100);
  };

  // Format percentage for display
  const formatPercentage = (percentage: number) => {
    return percentage.toFixed(1) + '%';
  };

  // Determine trend direction
  const getTrendDirection = (value: number): 'up' | 'down' | 'neutral' => {
    if (value > 0) return 'up';
    if (value < 0) return 'down';
    return 'neutral';
  };

  // Get trend icon
  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MyPts Analytics</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">Comprehensive statistics and insights for the MyPts virtual currency system</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-xs font-medium"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
          <Badge variant="outline" className="bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
            <span className="font-mono text-xs">Last updated: {new Date().toLocaleTimeString()}</span>
          </Badge>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load MyPts statistics'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <BarChart4 className="h-4 w-4" />
            <span>Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            <span>Monthly Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Hub State Card */}
            <Card className="overflow-hidden border-0 shadow-md bg-white dark:bg-slate-950">
              <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900">
                      <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-lg font-semibold">Supply Status</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                    Hub State
                  </Badge>
                </div>
                <CardDescription>Current MyPts supply and distribution</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ) : statsData ? (
                  <div className="space-y-6">
                    {/* Visual representation */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Circulation vs Reserve</span>
                        <span className="text-xs text-muted-foreground">
                          {formatPercentage(calculatePercentage(statsData.hubState.circulatingSupply, statsData.hubState.totalSupply))} in circulation
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${calculatePercentage(statsData.hubState.circulatingSupply, statsData.hubState.totalSupply)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Circulation: {formatNumber(statsData.hubState.circulatingSupply)}</span>
                        <span>Reserve: {formatNumber(statsData.hubState.reserveSupply)}</span>
                      </div>
                    </div>

                    {/* Detailed stats */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Total Supply</div>
                          <div className="font-semibold text-lg">{formatNumber(statsData.hubState.totalSupply)}</div>
                          <div className="text-xs text-muted-foreground">MyPts</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Total Value</div>
                          <div className="font-semibold text-lg">{formatCurrency(statsData.hubState.totalSupply * statsData.hubState.valuePerMyPt)}</div>
                          <div className="text-xs text-muted-foreground">USD</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 border-b">
                        <span className="text-sm">Value Per MyPt</span>
                        <span className="font-medium">{formatCurrency(statsData.hubState.valuePerMyPt)}</span>
                      </div>

                      <div className="flex items-center justify-between p-2">
                        <span className="text-sm">Max Supply</span>
                        <span className="font-medium">
                          {statsData.hubState.maxSupply ? formatNumber(statsData.hubState.maxSupply) : 'Unlimited'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Distribution Card */}
            <Card className="overflow-hidden border-0 shadow-md bg-white dark:bg-slate-950">
              <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900">
                      <PieChart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-lg font-semibold">Distribution</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                    Allocation
                  </Badge>
                </div>
                <CardDescription>How MyPts have been distributed</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ) : statsData ? (
                  <div className="space-y-6">
                    {/* Visual representation */}
                    <div className="space-y-3">
                      {/* Awarded */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">Awarded</span>
                          </div>
                          <span className="text-xs font-medium">
                            {formatPercentage(calculatePercentage(statsData.totalAwarded, statsData.hubState.totalSupply))}
                          </span>
                        </div>
                        <div className="relative">
                          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-500"
                              style={{ width: `${calculatePercentage(statsData.totalAwarded, statsData.hubState.totalSupply)}%` }}
                            />
                          </div>
                          <div className="absolute -right-1 -top-1 text-xs text-yellow-600 dark:text-yellow-400 font-mono">
                            {formatNumber(statsData.totalAwarded)}
                          </div>
                        </div>
                      </div>

                      {/* Purchased */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Purchased</span>
                          </div>
                          <span className="text-xs font-medium">
                            {formatPercentage(calculatePercentage(statsData.totalPurchased, statsData.hubState.totalSupply))}
                          </span>
                        </div>
                        <div className="relative">
                          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${calculatePercentage(statsData.totalPurchased, statsData.hubState.totalSupply)}%` }}
                            />
                          </div>
                          <div className="absolute -right-1 -top-1 text-xs text-green-600 dark:text-green-400 font-mono">
                            {formatNumber(statsData.totalPurchased)}
                          </div>
                        </div>
                      </div>

                      {/* Sold */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Sold</span>
                          </div>
                          <span className="text-xs font-medium">
                            {formatPercentage(calculatePercentage(statsData.totalSold, statsData.hubState.totalSupply))}
                          </span>
                        </div>
                        <div className="relative">
                          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${calculatePercentage(statsData.totalSold, statsData.hubState.totalSupply)}%` }}
                            />
                          </div>
                          <div className="absolute -right-1 -top-1 text-xs text-blue-600 dark:text-blue-400 font-mono">
                            {formatNumber(statsData.totalSold)}
                          </div>
                        </div>
                      </div>

                      {/* Earned */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium">Earned</span>
                          </div>
                          <span className="text-xs font-medium">
                            {formatPercentage(calculatePercentage(statsData.totalEarned, statsData.hubState.totalSupply))}
                          </span>
                        </div>
                        <div className="relative">
                          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500"
                              style={{ width: `${calculatePercentage(statsData.totalEarned, statsData.hubState.totalSupply)}%` }}
                            />
                          </div>
                          <div className="absolute -right-1 -top-1 text-xs text-purple-600 dark:text-purple-400 font-mono">
                            {formatNumber(statsData.totalEarned)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">In Circulation</span>
                        <div className="text-right">
                          <div className="font-semibold">{formatNumber(statsData.totalInCirculation)} MyPts</div>
                          <div className="text-xs text-muted-foreground">
                            {formatPercentage(calculatePercentage(statsData.totalInCirculation, statsData.hubState.totalSupply))} of total supply
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Financial Summary Card */}
            <Card className="overflow-hidden border-0 shadow-md bg-white dark:bg-slate-950">
              <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900">
                      <CircleDollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-lg font-semibold">Financial Summary</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                    Revenue
                  </Badge>
                </div>
                <CardDescription>Real money transactions and value</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                ) : statsData ? (
                  <div className="space-y-6">
                    {/* Net Revenue */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Net Revenue</div>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-2xl">
                          {formatCurrency((statsData.totalPurchased - statsData.totalSold) * statsData.hubState.valuePerMyPt)}
                        </div>
                        {getTrendIcon(getTrendDirection(statsData.totalPurchased - statsData.totalSold))}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        From {formatNumber(statsData.totalPurchased - statsData.totalSold)} MyPts net sales
                      </div>
                    </div>

                    {/* Transaction Values */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
                          <div className="text-xs text-muted-foreground">Purchased Value</div>
                        </div>
                        <div className="font-semibold text-lg mt-1">
                          {formatCurrency(statsData.totalPurchased * statsData.hubState.valuePerMyPt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(statsData.totalPurchased)} MyPts
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                          <div className="text-xs text-muted-foreground">Sold Value</div>
                        </div>
                        <div className="font-semibold text-lg mt-1">
                          {formatCurrency(statsData.totalSold * statsData.hubState.valuePerMyPt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(statsData.totalSold)} MyPts
                        </div>
                      </div>
                    </div>

                    {/* System Value */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        <div className="text-sm font-medium">System Value</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 border-b">
                          <span className="text-sm">Circulation Value</span>
                          <span className="font-medium">
                            {formatCurrency(statsData.totalInCirculation * statsData.hubState.valuePerMyPt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2">
                          <span className="text-sm">Reserve Value</span>
                          <span className="font-medium">
                            {formatCurrency(statsData.hubState.reserveSupply * statsData.hubState.valuePerMyPt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card className="overflow-hidden border-0 shadow-md bg-white dark:bg-slate-950">
            <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900">
                    <BarChart4 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Transaction Analysis</CardTitle>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                  Activity
                </Badge>
              </div>
              <CardDescription>Transaction counts and distribution by type</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-40 w-full rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ) : statsData?.transactionCountsByType ? (
                <div className="space-y-6">
                  {/* Transaction counts summary */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    <div className="text-sm font-medium mb-3">Transaction Distribution</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(statsData.transactionCountsByType).map(([type, count]) => {
                        // Calculate percentage of total transactions
                        const totalTransactions = Object.values(statsData.transactionCountsByType).reduce((a: number, b: number) => a + b, 0);
                        const percentage = totalTransactions > 0 ? (count / totalTransactions) * 100 : 0;

                        // Determine color based on transaction type
                        let bgColor = "bg-gray-100 dark:bg-gray-800";
                        let textColor = "text-gray-700 dark:text-gray-300";

                        if (type === 'BUY_MYPTS') {
                          bgColor = "bg-green-100 dark:bg-green-900/30";
                          textColor = "text-green-700 dark:text-green-400";
                        } else if (type === 'SELL_MYPTS') {
                          bgColor = "bg-red-100 dark:bg-red-900/30";
                          textColor = "text-red-700 dark:text-red-400";
                        } else if (type === 'ADJUSTMENT') {
                          bgColor = "bg-yellow-100 dark:bg-yellow-900/30";
                          textColor = "text-yellow-700 dark:text-yellow-400";
                        } else if (type === 'EARN_MYPTS') {
                          bgColor = "bg-purple-100 dark:bg-purple-900/30";
                          textColor = "text-purple-700 dark:text-purple-400";
                        }

                        return (
                          <div key={type} className={`${bgColor} p-3 rounded-lg`}>
                            <div className="text-xs text-muted-foreground mb-1">{type.replace(/_/g, ' ')}</div>
                            <div className={`font-semibold text-lg ${textColor}`}>{count}</div>
                            <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of total</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Transaction details */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium">Transaction Details</div>
                      <Badge variant="outline" className="text-xs">
                        {Object.values(statsData.transactionCountsByType).reduce((a: number, b: number) => a + b, 0)} total
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(statsData.transactionCountsByType).map(([type, count]) => {
                        // Determine icon based on transaction type
                        let icon = <Info className="h-4 w-4 text-muted-foreground" />;

                        if (type === 'BUY_MYPTS') {
                          icon = <ArrowUpRight className="h-4 w-4 text-green-500" />;
                        } else if (type === 'SELL_MYPTS') {
                          icon = <ArrowDownRight className="h-4 w-4 text-red-500" />;
                        } else if (type === 'ADJUSTMENT') {
                          icon = <Award className="h-4 w-4 text-yellow-500" />;
                        } else if (type === 'EARN_MYPTS') {
                          icon = <TrendingUp className="h-4 w-4 text-purple-500" />;
                        }

                        return (
                          <div key={type} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                            <div className="flex items-center gap-2">
                              {icon}
                              <span className="font-medium">{type.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{count} transactions</span>
                              <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-300">
                                {count > 0 ? '→' : ''}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <Card className="overflow-hidden border-0 shadow-md bg-white dark:bg-slate-950">
            <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900">
                    <LineChart className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Monthly Trends</CardTitle>
                </div>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
                  Last 12 Months
                </Badge>
              </div>
              <CardDescription>Transaction data trends over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-60 w-full rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ) : statsData?.monthlyStats ? (
                <div className="space-y-6">
                  {/* Monthly activity summary */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    <div className="text-sm font-medium mb-3">Activity Summary</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Calculate totals for the last 3 months */}
                      {(() => {
                        const last3Months = statsData.monthlyStats.slice(0, 3);
                        const totals = {
                          purchased: 0,
                          sold: 0,
                          awarded: 0,
                          earned: 0,
                          transactions: 0
                        };

                        last3Months.forEach(month => {
                          if (month.transactions['BUY_MYPTS']) {
                            totals.purchased += month.transactions['BUY_MYPTS'].total;
                            totals.transactions += month.transactions['BUY_MYPTS'].count;
                          }
                          if (month.transactions['SELL_MYPTS']) {
                            totals.sold += Math.abs(month.transactions['SELL_MYPTS'].total);
                            totals.transactions += month.transactions['SELL_MYPTS'].count;
                          }
                          if (month.transactions['ADJUSTMENT']) {
                            totals.awarded += month.transactions['ADJUSTMENT'].total;
                            totals.transactions += month.transactions['ADJUSTMENT'].count;
                          }
                          if (month.transactions['EARN_MYPTS']) {
                            totals.earned += month.transactions['EARN_MYPTS'].total;
                            totals.transactions += month.transactions['EARN_MYPTS'].count;
                          }
                        });

                        return (
                          <>
                            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                              <div className="text-xs text-muted-foreground mb-1">Purchased (3mo)</div>
                              <div className="font-semibold text-lg text-green-700 dark:text-green-400">{formatNumber(totals.purchased)}</div>
                              <div className="text-xs text-muted-foreground">MyPts</div>
                            </div>
                            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                              <div className="text-xs text-muted-foreground mb-1">Sold (3mo)</div>
                              <div className="font-semibold text-lg text-red-700 dark:text-red-400">{formatNumber(totals.sold)}</div>
                              <div className="text-xs text-muted-foreground">MyPts</div>
                            </div>
                            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                              <div className="text-xs text-muted-foreground mb-1">Awarded (3mo)</div>
                              <div className="font-semibold text-lg text-yellow-700 dark:text-yellow-400">{formatNumber(totals.awarded)}</div>
                              <div className="text-xs text-muted-foreground">MyPts</div>
                            </div>
                            <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                              <div className="text-xs text-muted-foreground mb-1">Transactions (3mo)</div>
                              <div className="font-semibold text-lg text-indigo-700 dark:text-indigo-400">{totals.transactions}</div>
                              <div className="text-xs text-muted-foreground">Total</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Monthly data table */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium">Monthly Breakdown</div>
                      <Badge variant="outline" className="text-xs">
                        {statsData.monthlyStats.length} months
                      </Badge>
                    </div>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 border-b">
                            <th className="text-left py-2 px-4 font-medium text-sm">Month</th>
                            <th className="text-right py-2 px-4 font-medium text-sm text-green-600 dark:text-green-400">Purchased</th>
                            <th className="text-right py-2 px-4 font-medium text-sm text-red-600 dark:text-red-400">Sold</th>
                            <th className="text-right py-2 px-4 font-medium text-sm text-yellow-600 dark:text-yellow-400">Awarded</th>
                            <th className="text-right py-2 px-4 font-medium text-sm text-purple-600 dark:text-purple-400">Earned</th>
                            <th className="text-right py-2 px-4 font-medium text-sm">Net Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statsData.monthlyStats.map((month, index) => {
                            // Calculate net change
                            let netChange = 0;
                            if (month.transactions['BUY_MYPTS']) {
                              netChange += month.transactions['BUY_MYPTS'].total;
                            }
                            if (month.transactions['SELL_MYPTS']) {
                              netChange += month.transactions['SELL_MYPTS'].total; // Already negative
                            }
                            if (month.transactions['ADJUSTMENT']) {
                              netChange += month.transactions['ADJUSTMENT'].total;
                            }
                            if (month.transactions['EARN_MYPTS']) {
                              netChange += month.transactions['EARN_MYPTS'].total;
                            }

                            // Determine if this is a current month with activity
                            const hasActivity = Object.keys(month.transactions).length > 0;
                            const isCurrentMonth = index === 0 && hasActivity;

                            return (
                              <tr
                                key={`${month.year}-${month.month}`}
                                className={`border-b hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${
                                  isCurrentMonth ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                }`}
                              >
                                <td className="py-2 px-4 font-medium">
                                  {isCurrentMonth && (
                                    <Badge className="mr-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0">
                                      Current
                                    </Badge>
                                  )}
                                  {month.label}
                                </td>
                                <td className="text-right py-2 px-4 font-mono text-sm">
                                  {month.transactions['BUY_MYPTS']
                                    ? formatNumber(month.transactions['BUY_MYPTS'].total)
                                    : '—'}
                                </td>
                                <td className="text-right py-2 px-4 font-mono text-sm">
                                  {month.transactions['SELL_MYPTS']
                                    ? formatNumber(Math.abs(month.transactions['SELL_MYPTS'].total))
                                    : '—'}
                                </td>
                                <td className="text-right py-2 px-4 font-mono text-sm">
                                  {month.transactions['ADJUSTMENT']
                                    ? formatNumber(month.transactions['ADJUSTMENT'].total)
                                    : '—'}
                                </td>
                                <td className="text-right py-2 px-4 font-mono text-sm">
                                  {month.transactions['EARN_MYPTS']
                                    ? formatNumber(month.transactions['EARN_MYPTS'].total)
                                    : '—'}
                                </td>
                                <td className="text-right py-2 px-4 font-mono text-sm">
                                  {hasActivity ? (
                                    <span className={netChange > 0 ? 'text-green-600 dark:text-green-400' : netChange < 0 ? 'text-red-600 dark:text-red-400' : ''}>
                                      {netChange > 0 ? '+' : ''}{formatNumber(netChange)}
                                    </span>
                                  ) : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
