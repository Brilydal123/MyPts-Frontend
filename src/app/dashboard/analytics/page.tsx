"use client"

import { MyPtsAnalytics } from "@/components/analytics/MyPtsAnalytics"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { MainLayout } from "@/components/shared/main-layout"

export default function AnalyticsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <Suspense fallback={<AnalyticsPageSkeleton />}>
          <MyPtsAnalytics />
        </Suspense>
      </div>
    </MainLayout>)
}

function AnalyticsPageSkeleton() {
  return (

    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">MyPts Analytics</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    </div>
  )
}
