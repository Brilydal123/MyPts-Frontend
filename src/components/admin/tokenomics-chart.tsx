'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MyPtsHubState } from '@/types/mypts';
import { PieChart, Wallet, Coins } from 'lucide-react';

interface TokenomicsChartProps {
  hubState: MyPtsHubState;
  isLoading?: boolean;
}

export function TokenomicsChart({ hubState, isLoading = false }: TokenomicsChartProps) {
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate percentages
  const circulatingPercentage = (hubState.circulatingSupply / hubState.totalSupply) * 100;
  const holdingPercentage = (hubState.reserveSupply / hubState.totalSupply) * 100;

  return (
    <Card className="overflow-hidden backdrop-blur-sm bg-white/90 dark:bg-black/80 border border-gray-100 dark:border-gray-800 shadow-sm">
      <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">MyPts Tokenomics</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400 mt-1">
              Total supply: {formatNumber(hubState.totalSupply)} MyPts
            </CardDescription>
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <PieChart className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-6">
            <div className="h-48 w-48 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse mx-auto"></div>
            <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pie chart visualization */}
            <div className="flex justify-center">
              <div className="relative w-56 h-56">
                {/* SVG Pie Chart */}
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {/* Circulating Supply Segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#D1D5DB" // gray-300
                    strokeWidth="20"
                    strokeDasharray={`${circulatingPercentage * 2.51} ${(100 - circulatingPercentage) * 2.51}`}
                    strokeLinecap="round"
                  />
                  {/* Holding Segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#4B5563" // gray-600
                    strokeWidth="20"
                    strokeDasharray={`${holdingPercentage * 2.51} ${(100 - holdingPercentage) * 2.51}`}
                    strokeDashoffset={`${-circulatingPercentage * 2.51}`}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{holdingPercentage.toFixed(0)}%</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Holding</span>
                </div>
              </div>
            </div>

            {/* Legend and details */}
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Circulating Supply</h3>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{formatNumber(hubState.circulatingSupply)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{circulatingPercentage.toFixed(2)}% of total</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Value: {formatCurrency(hubState.circulatingSupply * hubState.valuePerMyPt)}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 rounded-full bg-gray-700 dark:bg-gray-300"></div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Holding (Reserve)</h3>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{formatNumber(hubState.reserveSupply)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{holdingPercentage.toFixed(2)}% of total</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Value: {formatCurrency(hubState.reserveSupply * hubState.valuePerMyPt)}
                </p>
              </div>
            </div>

            {/* Total value */}
            <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-lg border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Total Value</h3>
                  <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {formatCurrency(hubState.totalSupply * hubState.valuePerMyPt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Value Per MyPt</p>
                  <p className="font-medium text-gray-900 dark:text-white">${hubState.valuePerMyPt.toFixed(6)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
