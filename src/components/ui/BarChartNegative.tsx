"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis, ResponsiveContainer } from "recharts"
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

interface TransactionDistributionProps {
  profileId: string;
}

interface TransactionData {
  type: string;
  amount: number;
  label: string;
}

const chartConfig = {
  amount: {
    label: "Amount",
  },
} satisfies ChartConfig

// Create analytics API instance
const analyticsApi = new AnalyticsApi();

export function TransactionDistributionChart({ profileId }: TransactionDistributionProps) {
  const [chartData, setChartData] = useState<TransactionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    lifetimeEarned: 0,
    lifetimeSpent: 0,
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
          const lifetimeEarned = response.data.lifetimeEarned || 0
          const lifetimeSpent = response.data.lifetimeSpent || 0

          // Group transactions by type
          const transactionsByType = new Map<string, number>()

          transactions.forEach((tx: any) => {
            const type = tx.type || 'UNKNOWN'
            const amount = tx.amount || 0

            transactionsByType.set(type, (transactionsByType.get(type) || 0) + amount)
          })

          // Convert to array format for chart
          const formattedData: TransactionData[] = []

          // Add earned transactions (positive)
          if (transactionsByType.has('BUY_MYPTS')) {
            formattedData.push({
              type: 'BUY_MYPTS',
              amount: transactionsByType.get('BUY_MYPTS') || 0,
              label: 'Purchased'
            })
          }

          if (transactionsByType.has('EARN_MYPTS')) {
            formattedData.push({
              type: 'EARN_MYPTS',
              amount: transactionsByType.get('EARN_MYPTS') || 0,
              label: 'Earned'
            })
          }

          // Add spent transactions (negative)
          if (transactionsByType.has('SELL_MYPTS')) {
            formattedData.push({
              type: 'SELL_MYPTS',
              amount: -(transactionsByType.get('SELL_MYPTS') || 0),
              label: 'Sold'
            })
          }

          if (transactionsByType.has('SPEND_MYPTS')) {
            formattedData.push({
              type: 'SPEND_MYPTS',
              amount: -(transactionsByType.get('SPEND_MYPTS') || 0),
              label: 'Spent'
            })
          }

          setChartData(formattedData)

          // Calculate ratio
          const ratio = lifetimeSpent > 0 ? (lifetimeEarned / lifetimeSpent) : lifetimeEarned

          setStats({
            lifetimeEarned,
            lifetimeSpent,
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

  // Format amount for display
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(Math.abs(amount))
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Distribution</CardTitle>
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
          <CardTitle>Transaction Distribution</CardTitle>
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
      <CardHeader>
        <CardTitle>Transaction Distribution</CardTitle>
        <CardDescription>
          Earned vs Spent MyPts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 20,
                left: 12,
                right: 12,
                bottom: 20,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => formatAmount(value)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel hideIndicator />}
              />
              <Bar dataKey="amount">
                <LabelList
                  position="top"
                  formatter={(value: number) => formatAmount(value)}
                  fillOpacity={1}
                />
                {chartData.map((item) => (
                  <Cell
                    key={item.type}
                    fill={
                      item.amount > 0
                        ? "#2563eb" // Blue for positive values
                        : "#ef4444" // Light red for negative values
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Lifetime Earned: {formatAmount(stats.lifetimeEarned)} | Spent: {formatAmount(stats.lifetimeSpent)}
        </div>
        <div className="leading-none text-muted-foreground">
          Earn/Spend Ratio: {stats.ratio} {stats.ratio > 1 ?
            <TrendingUp className="inline h-4 w-4 text-blue-600" /> :
            <TrendingDown className="inline h-4 w-4 text-red-500" />}
        </div>
      </CardFooter>
    </Card>
  )
}
