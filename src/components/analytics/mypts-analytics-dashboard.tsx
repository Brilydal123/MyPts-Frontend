"use client";

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useMyPtsAnalytics, useRefreshMyPtsAnalytics } from "@/hooks/use-mypts-analytics";
import { useBalance, useMyPtsValue } from "@/hooks/use-mypts-data";
import { formatCurrency } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionType } from "@/types/mypts";
import { BarChart, LineChart, PieChart } from "@/components/ui/charts";
import { format, subDays, parseISO } from "date-fns";
import { toast } from "sonner";

export function MyPtsAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [currency, setCurrency] = useState("USD");

  // Fetch MyPts analytics data
  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    error: analyticsError
  } = useMyPtsAnalytics();

  // Fetch balance data
  const {
    data: balance,
    isLoading: isBalanceLoading
  } = useBalance(currency);

  // Fetch MyPts value data
  const {
    data: value,
    isLoading: isValueLoading
  } = useMyPtsValue();

  // Refresh analytics data
  const {
    refetch: refreshAnalytics,
    isLoading: isRefreshing
  } = useRefreshMyPtsAnalytics();

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refreshAnalytics();
      toast.success("Analytics data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh analytics data");
    }
  };

  // Calculate value per MyPt
  const valuePerMyPt = value?.valuePerPts || value?.valuePerMyPt || 0;

  // Prepare transaction data for charts
  const prepareTransactionData = () => {
    if (!analytics?.transactions || analytics.transactions.length === 0) {
      return {
        byType: [],
        byDate: [],
        recentActivity: []
      };
    }

    // Group transactions by type
    const typeMap = new Map<string, number>();
    analytics.transactions.forEach((tx: { type: any; amount: number; }) => {
      const type = tx.type;
      typeMap.set(type, (typeMap.get(type) || 0) + Math.abs(tx.amount));
    });

    const byType = Array.from(typeMap.entries()).map(([type, amount]) => ({
      name: formatTransactionType(type),
      value: amount
    }));

    // Group transactions by date (last 30 days)
    const dateMap = new Map<string, number>();
    const today = new Date();

    // Initialize all dates in the last 30 days with 0
    for (let i = 0; i < 30; i++) {
      const date = subDays(today, i);
      dateMap.set(format(date, 'yyyy-MM-dd'), 0);
    }

    // Add transaction amounts to dates
    analytics.transactions.forEach((tx: { date: string; amount: number; }) => {
      const date = format(parseISO(tx.date), 'yyyy-MM-dd');
      if (dateMap.has(date)) {
        dateMap.set(date, (dateMap.get(date) || 0) + Math.abs(tx.amount));
      }
    });

    const byDate = Array.from(dateMap.entries())
      .map(([date, amount]) => ({
        date,
        amount
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get recent activity (last 10 transactions)
    const recentActivity = analytics.transactions
      .slice(0, 10)
      .map((tx: { date: string; type: string; amount: number; }) => ({
        date: format(parseISO(tx.date), 'MMM dd, yyyy'),
        type: formatTransactionType(tx.type),
        amount: tx.amount,
        isPositive: tx.amount > 0
      }));

    return { byType, byDate, recentActivity };
  };

  const { byType, byDate, recentActivity } = prepareTransactionData();

  // Format transaction type for display
  function formatTransactionType(type: string): string {
    switch (type) {
      case TransactionType.BUY_MYPTS:
        return "Buy MyPts";
      case TransactionType.SELL_MYPTS:
        return "Sell MyPts";
      case TransactionType.EARN_MYPTS:
        return "Earn MyPts";
      case TransactionType.PURCHASE_PRODUCT:
        return "Purchase";
      case TransactionType.RECEIVE_PRODUCT_PAYMENT:
        return "Product Payment";
      case TransactionType.DONATION_SENT:
        return "Donation Sent";
      case TransactionType.DONATION_RECEIVED:
        return "Donation Received";
      case TransactionType.REFUND:
        return "Refund";
      case TransactionType.ADJUSTMENT:
        return "Adjustment";
      default:
        return type;
    }
  }

  // Loading state
  const isLoading = isAnalyticsLoading || isBalanceLoading || isValueLoading;

  // Error state
  if (analyticsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MyPts Analytics</CardTitle>
          <CardDescription>Error loading analytics data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            {analyticsError instanceof Error ? analyticsError.message : "An error occurred"}
          </p>
          <Button onClick={handleRefresh} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">MyPts Analytics</h1>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="logins">Logins</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Current Balance Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-[200px]" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{analytics?.currentBalance?.toLocaleString() || 0} MyPts</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency((analytics?.currentBalance || 0) * valuePerMyPt, currency)}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Lifetime Earned Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lifetime Earned</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-[200px]" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{analytics?.lifetimeEarned?.toLocaleString() || 0} MyPts</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency((analytics?.lifetimeEarned || 0) * valuePerMyPt, currency)}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Lifetime Spent Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lifetime Spent</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-[200px]" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{analytics?.lifetimeSpent?.toLocaleString() || 0} MyPts</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency((analytics?.lifetimeSpent || 0) * valuePerMyPt, currency)}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Transaction Distribution Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Transaction Distribution</CardTitle>
                <CardDescription>MyPts by transaction type</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Skeleton className="h-[250px] w-[250px] rounded-full" />
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <PieChart
                      data={byType}
                      index="name"
                      valueKey="value"
                      category="name"
                      colors={["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest MyPts transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity: { isPositive: any; type: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; date: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; amount: number; }, i: Key | null | undefined) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-full ${activity.isPositive ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                              {activity.isPositive ? (
                                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-rose-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{activity.type}</p>
                              <p className="text-xs text-muted-foreground">{activity.date}</p>
                            </div>
                          </div>
                          <div className={`text-sm font-medium ${activity.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {activity.isPositive ? '+' : '-'}{Math.abs(activity.amount).toLocaleString()} MyPts
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No recent transactions</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {/* Transaction History Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>MyPts transactions over time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <div className="h-[350px]">
                  <BarChart
                    data={byDate}
                    index="date"
                    categories={["amount"]}
                    colors={["#0ea5e9"]}
                    valueFormatter={(value) => `${value.toLocaleString()} MyPts`}
                    yAxisWidth={65}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logins" className="space-y-4">
          {/* Login Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Login Activity</CardTitle>
              <CardDescription>Number of logins over time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <div className="h-[350px]">
                  <LineChart
                    data={analytics?.logins || []}
                    index="date"
                    categories={["count"]}
                    colors={["#8b5cf6"]}
                    valueFormatter={(value) => `${value} login${value !== 1 ? 's' : ''}`}
                    yAxisWidth={65}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
