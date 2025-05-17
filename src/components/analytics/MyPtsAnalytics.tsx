"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { LoginActivityChart } from "../ui/LineChartLabel"
import { MyPtsBalanceChart } from "../ui/AreaChartStacked"
import { TransactionDistributionChart } from "../ui/BarChartNegative"
import { BuySellChart } from "../ui/BuySellChart"
import { AnalyticsProvider } from "@/contexts/AnalyticsContext"
import { useAuth } from "@/contexts/AuthContext"

export function MyPtsAnalytics() {
  const params = useParams()
  const { user } = useAuth()
  const [profileId, setProfileId] = useState<string>("")

  useEffect(() => {
    // Get profile ID from URL params, user context, or localStorage
    const id = params?.profileId as string ||
      user?.profileId ||
      (typeof window !== 'undefined' ? localStorage.getItem("selectedProfileId") : null)

    if (id) {
      setProfileId(id)
    }
  }, [params, user])

  if (!profileId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No profile selected</p>
      </div>
    )
  }

  return (
    <AnalyticsProvider>
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">MyPts Analytics</h2>

        {/* Stack charts vertically on small screens, 2 columns on larger screens */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
          <MyPtsBalanceChart profileId={profileId} />
          <TransactionDistributionChart profileId={profileId} />
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
          <BuySellChart profileId={profileId} />
          <LoginActivityChart profileId={profileId} />
        </div>
      </div>
    </AnalyticsProvider>
  )
}
