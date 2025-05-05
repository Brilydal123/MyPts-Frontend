"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NetworkErrorAlertProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function NetworkErrorAlert({
  title = "Connection Error",
  message = "We couldn't connect to the server. Please check your internet connection and try again.",
  onRetry,
  className,
}: NetworkErrorAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "rounded-xl border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-6 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="rounded-full bg-red-50 dark:bg-red-900/20 p-3 mb-2">
          <WifiOff className="h-6 w-6 text-red-500 dark:text-red-400" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            {message}
          </p>
        </div>
        
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="mt-4 flex items-center gap-2 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
