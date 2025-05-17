"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from "recharts"
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

interface BuySellChartProps {
  profileId: string;
}

interface TransactionData {
  date: string;
  buy: number;
  sell: number;
}

const chartConfig = {
  buy: {
    label: "Buy",
    color: "#2563eb", // Blue
  },
  sell: {
    label: "Sell",
    color: "#ef4444", // Light red
  },
} satisfies ChartConfig

// Create analytics API instance
const analyticsApi = new AnalyticsApi();

export function BuySellChart({ profileId }: BuySellChartProps) {
  const [chartData, setChartData] = useState<TransactionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalBuy: 0,
    totalSell: 0,
    ratio: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        // Fetch MyPts data from the analytics API
        const response = await analyticsApi.getMyPtsAnalytics(profileId)

        if (response.success) {
          // Extract transaction history
          const transactions = response.data.transactions || []

          // Group transactions by date and type
          const transactionsByDate = new Map<string, { buy: number, sell: number }>()

          // Initialize with last 30 days
          const today = new Date()
          for (let i = 29; i >= 0; i--) {
            const date = new Date()
            date.setDate(today.getDate() - i)
            const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
            transactionsByDate.set(dateStr, { buy: 0, sell: 0 })
          }

          let totalBuy = 0
          let totalSell = 0

          // Process transactions
          transactions.forEach((tx: any) => {
            if (!tx.date) return

            const date = new Date(tx.date)
            const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format

            // Only include transactions from the last 30 days
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(today.getDate() - 30)

            if (date < thirtyDaysAgo) {
              return
            }

            if (!transactionsByDate.has(dateStr)) {
              transactionsByDate.set(dateStr, { buy: 0, sell: 0 })
            }

            const entry = transactionsByDate.get(dateStr)!
            const amount = tx.amount || 0

            if (tx.type === 'BUY_MYPTS') {
              entry.buy += amount
              totalBuy += amount
            } else if (tx.type === 'SELL_MYPTS') {
              entry.sell += amount
              totalSell += amount
            }
          })

          // Convert to array format for chart
          const formattedData = Array.from(transactionsByDate.entries())
            .map(([date, values]) => ({
              date,
              buy: values.buy,
              sell: values.sell
            }))
            .sort((a, b) => a.date.localeCompare(b.date))

          setChartData(formattedData)

          // Calculate ratio
          const ratio = totalSell > 0 ? (totalBuy / totalSell) : totalBuy

          setStats({
            totalBuy,
            totalSell,
            ratio: parseFloat(ratio.toFixed(2))
          })
        } else {
          setError("Failed to fetch transaction data")
        }
      } catch (err) {
        console.error("Error fetching transaction data:", err)
        setError("Error fetching transaction data")
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

  // Format amount for display
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Buy/Sell Transactions</CardTitle>
          <CardDescription>Loading transaction data...</CardDescription>
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
          <CardTitle>Buy/Sell Transactions</CardTitle>
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
        <CardTitle className="text-base sm:text-lg md:text-xl">Buy/Sell Transactions</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Daily transaction volume (last 30 days)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 md:p-6">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={250} minHeight={200}>
            <BarChart
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
                tickMargin={8}
                tickFormatter={formatDate}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={formatAmount}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />
              <Legend />
              <Bar
                dataKey="buy"
                name="Buy"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="sell"
                name="Sell"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Total Buy: {formatAmount(stats.totalBuy)} | Total Sell: {formatAmount(stats.totalSell)}
        </div>
        <div className="leading-none text-muted-foreground">
          Buy/Sell Ratio: {stats.ratio} {stats.ratio > 1 ?
            <TrendingUp className="inline h-4 w-4 text-blue-600" /> :
            <TrendingDown className="inline h-4 w-4 text-red-500" />}
        </div>
        <div className="leading-none text-muted-foreground">
          Daily Avg: Buy {formatAmount(stats.totalBuy / 30)} | Sell {formatAmount(stats.totalSell / 30)}
        </div>
      </CardFooter>
    </Card>
  )
}
