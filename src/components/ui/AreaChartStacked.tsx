"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts"
import { useState, useEffect } from "react"
import { AnalyticsApi } from "@/lib/api/analytics-api"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./chart"

interface BalanceHistoryProps {
  profileId: string;
}

interface BalanceData {
  date: string;
  balance: number;
}

const chartConfig = {
  balance: {
    label: "Balance",
    color: "#2563eb", // Blue
  },
} satisfies ChartConfig

// Create analytics API instance
const analyticsApi = new AnalyticsApi();

export function MyPtsBalanceChart({ profileId }: BalanceHistoryProps) {
  const [chartData, setChartData] = useState<BalanceData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trend, setTrend] = useState<{ percentage: number; isUp: boolean }>({ percentage: 0, isUp: true })
  const [currentBalance, setCurrentBalance] = useState<number>(0)
  const [startingBalance, setStartingBalance] = useState<number>(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        // Fetch MyPts data from the analytics API
        const response = await analyticsApi.getMyPtsAnalytics(profileId)

        if (response.success) {
          // Extract transaction history
          const transactions = response.data.transactions || []
          setCurrentBalance(response.data.currentBalance || 0)

          // Get the current balance and set it as the starting point
          const currentBalance = response.data.currentBalance || 0

          // Find the earliest transaction in the last 30 days to determine starting balance
          const today = new Date()
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(today.getDate() - 30)

          // Sort transactions by date (oldest first)
          const sortedTransactions = [...transactions].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )

          // Filter transactions to only include the last 30 days
          const recentTransactions = sortedTransactions.filter(tx =>
            new Date(tx.date) >= thirtyDaysAgo
          )

          // Calculate the starting balance 30 days ago
          // Start with current balance and reverse the transaction effects
          let initialBalance = currentBalance

          // Reverse the effect of each transaction in the last 30 days
          recentTransactions.forEach((tx: any) => {
            const amount = tx.amount || 0

            if (tx.type === 'BUY_MYPTS' || tx.type === 'EARN_MYPTS') {
              initialBalance -= amount // Subtract purchases/earnings
            } else if (tx.type === 'SELL_MYPTS' || tx.type === 'SPEND_MYPTS') {
              initialBalance += amount // Add back sales/spending
            }
          })

          // Store the starting balance for reference
          setStartingBalance(initialBalance)

          // Initialize the balance map with all 30 days
          const balanceByDate = new Map<string, number>()

          // Create an array of all dates in the last 30 days
          const dates: string[] = []
          for (let i = 29; i >= 0; i--) {
            const date = new Date()
            date.setDate(today.getDate() - i)
            const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
            dates.push(dateStr)
            // Initialize with the starting balance
            balanceByDate.set(dateStr, initialBalance)
          }

          // Sort dates chronologically
          dates.sort()

          // Group transactions by date
          const transactionsByDate = new Map<string, any[]>()

          recentTransactions.forEach((tx: any) => {
            const date = new Date(tx.date).toISOString().split('T')[0]
            if (!transactionsByDate.has(date)) {
              transactionsByDate.set(date, [])
            }
            transactionsByDate.get(date)!.push(tx)
          })

          // Calculate running balance for each day
          let runningBalance = initialBalance

          for (let i = 0; i < dates.length; i++) {
            const currentDate = dates[i]

            // Apply transactions for this date
            const dayTransactions = transactionsByDate.get(currentDate) || []

            dayTransactions.forEach((tx: any) => {
              const amount = tx.amount || 0

              if (tx.type === 'BUY_MYPTS' || tx.type === 'EARN_MYPTS') {
                runningBalance += amount
              } else if (tx.type === 'SELL_MYPTS' || tx.type === 'SPEND_MYPTS') {
                runningBalance -= amount
              }
            })

            // Set the balance for this day
            balanceByDate.set(currentDate, runningBalance)
          }

          // Convert to array format for chart
          const formattedData = Array.from(balanceByDate.entries())
            .map(([date, balance]) => ({
              date,
              balance,
              // Add trend indicator
              trend: balance > initialBalance ? 'increasing' :
                balance < initialBalance ? 'decreasing' : 'constant'
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

          setChartData(formattedData)

          // Calculate trend
          if (formattedData.length > 1) {
            const currentBalance = formattedData[formattedData.length - 1].balance
            const previousBalance = formattedData[0].balance

            if (previousBalance > 0) {
              const trendPercentage = ((currentBalance - previousBalance) / previousBalance) * 100
              setTrend({
                percentage: Math.abs(parseFloat(trendPercentage.toFixed(1))),
                isUp: trendPercentage >= 0
              })
            }
          }
        } else {
          setError("Failed to fetch MyPts balance data")
        }
      } catch (err) {
        console.error("Error fetching MyPts balance data:", err)
        setError("Error fetching MyPts balance data")
      } finally {
        setIsLoading(false)
      }
    }

    if (profileId) {
      fetchData()
    }
  }, [profileId])

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Format balance for display
  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-US').format(balance)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MyPts Balance History</CardTitle>
          <CardDescription>Loading balance data...</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-pulse">Loading chart data...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MyPts Balance History</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-destructive">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6 space-y-1">
        <CardTitle className="text-base sm:text-lg md:text-xl">MyPts Balance History</CardTitle>
        <CardDescription className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1">
          <span>Current: {formatBalance(currentBalance)} MyPts</span>
          <span className="hidden sm:inline">|</span>
          <span>Start: {formatBalance(startingBalance)} MyPts</span>
          <span className="text-xs opacity-70">(Last 30 days)</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 md:p-6">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={250} minHeight={200}>
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 15,
                left: 5,
                right: 5,
                bottom: 15,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={5}
                tickFormatter={(value) => formatDate(value)}
                interval="preserveStartEnd"
                minTickGap={20}
                tick={{ fontSize: 10, fill: 'currentColor' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={5}
                tickFormatter={(value) => formatBalance(value)}
                domain={['auto', 'auto']}
                padding={{ top: 20, bottom: 20 }}
                tick={{ fontSize: 10, fill: 'currentColor' }}
                width={40}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              {/* Reference line for starting balance */}
              {startingBalance > 0 && (
                <ReferenceLine
                  y={startingBalance}
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Starting Balance',
                    position: 'insideTopRight',
                    fill: '#94a3b8',
                    fontSize: 12
                  }}
                />
              )}
              <Area
                dataKey="balance"
                type="natural" // Changed from monotone to natural for smoother curves
                fill="#2563eb" // Blue
                fillOpacity={0.4}
                stroke="#2563eb" // Blue
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 md:p-6">
        <div className="flex w-full items-start gap-1 sm:gap-2 text-xs sm:text-sm">
          <div className="grid gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2 font-medium leading-tight">
              {trend.isUp ? (
                <>
                  Balance trending up by {trend.percentage}% <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </>
              ) : (
                <>
                  Balance trending down by {trend.percentage}% <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                </>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 leading-tight text-muted-foreground text-xs">
              Based on last 30 days of transactions
            </div>
            <div className="flex items-center gap-1 sm:gap-2 leading-tight text-xs sm:text-sm">
              {trend.isUp ? (
                <span className="text-blue-600">Increasing trend: Your balance is growing</span>
              ) : trend.percentage === 0 ? (
                <span className="text-yellow-600">Stable trend: Your balance is constant</span>
              ) : (
                <span className="text-red-500">Decreasing trend: Your balance is reducing</span>
              )}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
