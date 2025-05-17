"use client"

import { MainLayout } from "@/components/shared/main-layout"
import { Metadata } from "next"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
