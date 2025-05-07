"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DashboardStatsCardProps {
  title: string;
  icon: ReactNode;
  iconColor: string;
  iconBgColor: string;
  value: string;
  unit?: string;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  action?: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
  };
  isLoading?: boolean;
}

export function DashboardStatsCard({
  title,
  icon,
  iconColor,
  iconBgColor,
  value,
  unit,
  subtitle,
  trend,
  action,
  isLoading = false,
}: DashboardStatsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 h-full border border-[#E5E5EA] dark:border-[#38383A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <div className="flex justify-between items-center mb-5">
          <div className="h-5 w-24 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-md animate-pulse"></div>
          <div className="h-10 w-10 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] animate-pulse"></div>
        </div>
        <div className="h-9 w-28 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-md animate-pulse mt-4"></div>
        <div className="h-4 w-40 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-md animate-pulse mt-3"></div>
        {trend && (
          <div className="h-6 w-32 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full animate-pulse mt-4"></div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-shadow p-4">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-medium text-[#86868b] dark:text-[#86868b]">
          {title}
        </h3>
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            iconBgColor
          )}
        >
          <div className={cn("h-5 w-5", iconColor)}>{icon}</div>
        </div>
      </div>

      <div className="mt-1">
        <div className="flex items-baseline">
          <span className="text-[28px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
            {value}
          </span>
          {unit && (
            <span className="ml-1.5 text-sm font-medium text-[#86868b] dark:text-[#86868b]">
              {unit}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-sm text-[#86868b] dark:text-[#86868b] mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {trend && (
        <div className="flex items-center mt-4">
          <div
            className={cn(
              "flex items-center px-2.5 py-1 rounded-full text-sm font-medium",
              trend.isPositive
                ? "bg-[#f2f7f2] text-[#208237] dark:bg-[#1c2b1f] dark:text-[#30d158]"
                : "bg-[#f8f1f0] text-[#a5251d] dark:bg-[#2f1a19] dark:text-[#ff453a]"
            )}
          >
            {trend.value}
          </div>
          {trend.label && (
            <span className="text-sm text-[#86868b] dark:text-[#86868b] ml-2">
              {trend.label}
            </span>
          )}
        </div>
      )}

      {action && (
        <div className="mt-4">
          <motion.button
            className="flex items-center text-sm text-[#007AFF] dark:text-[#0A84FF] hover:text-[#0051b3] dark:hover:text-[#409cff] transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.onClick}
          >
            <span className="mr-1.5">{action.icon}</span>
            {action.label}
          </motion.button>
        </div>
      )}
    </div>
  );
}
