"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MyPtsHubState } from "@/types/mypts";
import { PieChart, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion, MotionConfig, AnimatePresence } from "framer-motion";

interface TokenomicsChartProps {
  hubState: MyPtsHubState;
  isLoading?: boolean;
}

export function TokenomicsChart({
  hubState,
  isLoading = false,
}: TokenomicsChartProps) {
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate percentages
  const circulatingPercentage =
    (hubState.circulatingSupply / hubState.totalSupply) * 100;
  const holdingPercentage =
    (hubState.holdingSupply / hubState.totalSupply) * 100;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 15,
        }}
      >
        <Card className="overflow-hidden bg-white dark:bg-black border-0 shadow-sm rounded-xl">
          <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 px-4 sm:px-6 md:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl font-semibold text-black dark:text-white tracking-tight">
                  MyPts Tokenomics
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-light">
                  Total supply: {formatNumber(hubState.totalSupply)} MyPts
                </CardDescription>
              </div>
              <motion.div
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black dark:bg-white flex items-center justify-center"
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-white dark:text-black" />
              </motion.div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 md:p-8">
            {isLoading ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="h-36 w-36 sm:h-48 sm:w-48 bg-neutral-100 dark:bg-neutral-800 rounded-full animate-pulse mx-auto"></div>
                <div className="h-10 sm:h-12 bg-neutral-100 dark:bg-neutral-800 rounded-md animate-pulse"></div>
              </div>
            ) : (
              <motion.div
                className="space-y-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Pie chart visualization */}
                <motion.div
                  variants={itemVariants}
                  className="flex justify-center"
                >
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64">
                    {/* SVG Pie Chart */}
                    <motion.svg
                      viewBox="0 0 100 100"
                      className="w-full h-full -rotate-90"
                      initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                      animate={{ opacity: 1, scale: 1, rotate: -90 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {/* Background circle */}
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#F5F5F5" // light neutral-100
                        strokeWidth="20"
                        className="dark:opacity-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                      {/* Circulating Supply Segment */}
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#E5E5E5" // neutral-200
                        strokeWidth="20"
                        strokeDasharray={`${circulatingPercentage * 2.51} ${(100 - circulatingPercentage) * 2.51
                          }`}
                        strokeLinecap="round"
                        className="dark:stroke-neutral-700"
                        initial={{ strokeDasharray: "0 251" }}
                        animate={{
                          strokeDasharray: `${circulatingPercentage * 2.51} ${(100 - circulatingPercentage) * 2.51
                            }`,
                        }}
                        transition={{
                          duration: 1.5,
                          ease: "easeOut",
                          delay: 0.5,
                        }}
                      />
                      {/* Holding Segment */}
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#000000" // black
                        strokeWidth="20"
                        strokeDasharray={`${holdingPercentage * 2.51} ${(100 - holdingPercentage) * 2.51
                          }`}
                        strokeDashoffset={`${-circulatingPercentage * 2.51}`}
                        strokeLinecap="round"
                        className="dark:stroke-white"
                        initial={{
                          strokeDasharray: "0 251",
                          strokeDashoffset: `${-circulatingPercentage * 2.51}`,
                        }}
                        animate={{
                          strokeDasharray: `${holdingPercentage * 2.51} ${(100 - holdingPercentage) * 2.51
                            }`,
                        }}
                        transition={{
                          duration: 1.5,
                          ease: "easeOut",
                          delay: 1,
                        }}
                      />
                    </motion.svg>
                    {/* Center text */}
                    <motion.div
                      className="absolute inset-0 flex flex-col items-center justify-center text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5, duration: 0.5 }}
                    >
                      <motion.span
                        className="text-2xl sm:text-3xl md:text-4xl font-semibold text-black dark:text-white"
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 15,
                          delay: 1.7,
                        }}
                      >
                        {holdingPercentage.toFixed(0)}%
                      </motion.span>
                      <motion.span
                        className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-light"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2 }}
                      >
                        Holding
                      </motion.span>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Legend and details */}
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
                >
                  <div className="bg-neutral-50 dark:bg-neutral-900 p-4 sm:p-6 rounded-xl border border-neutral-100 dark:border-neutral-800 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="w-3 h-3 rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
                      <h3 className="font-medium text-black dark:text-white">
                        Circulating
                      </h3>
                    </div>
                    <p className="text-xl sm:text-2xl font-semibold text-black dark:text-white tracking-tight">
                      {formatNumber(hubState.circulatingSupply)}
                    </p>
                    <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-light">
                      {circulatingPercentage.toFixed(1)}% of total
                    </p>
                    <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-neutral-100 dark:border-neutral-800">
                      <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 flex items-center">
                        <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-neutral-400" />
                        {formatCurrency(
                          hubState.circulatingSupply * hubState.valuePerMyPt
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-900 p-4 sm:p-6 rounded-xl border border-neutral-100 dark:border-neutral-800 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="w-3 h-3 rounded-full bg-black dark:bg-white"></div>
                      <h3 className="font-medium text-black dark:text-white">
                        Holding
                      </h3>
                    </div>
                    <p className="text-xl sm:text-2xl font-semibold text-black dark:text-white tracking-tight">
                      {formatNumber(hubState.holdingSupply)}
                    </p>
                    <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-light">
                      {holdingPercentage.toFixed(1)}% of total
                    </p>
                    <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-neutral-100 dark:border-neutral-800">
                      <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 flex items-center">
                        <ArrowDownRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-neutral-400" />
                        {formatCurrency(
                          hubState.holdingSupply * hubState.valuePerMyPt
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Total value */}
                <motion.div
                  variants={itemVariants}
                  className="bg-black dark:bg-white p-4 sm:p-6 rounded-xl text-white dark:text-black"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                    <div>
                      <h3 className="font-medium text-neutral-300 dark:text-neutral-700 text-xs sm:text-sm">
                        Total Value
                      </h3>
                      <p className="text-xl sm:text-2xl font-semibold tracking-tight mt-1">
                        {formatCurrency(
                          hubState.totalSupply * hubState.valuePerMyPt
                        )}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs text-neutral-400 dark:text-neutral-600 font-light">
                        Value Per MyPt
                      </p>
                      <p className="font-medium text-white dark:text-black">
                        ${hubState.valuePerMyPt.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </MotionConfig>
  );
}
