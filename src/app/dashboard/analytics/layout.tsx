import { Metadata } from "next"

export const metadata: Metadata = {
  title: "MyPts Analytics",
  description: "View your MyPts analytics and statistics",
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
