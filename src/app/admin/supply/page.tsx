'use client';

import { useState, useEffect } from 'react';
// Admin layout is provided by /admin/layout.tsx
import { HubStats } from '@/components/admin/hub-stats';
import { TokenomicsChart } from '@/components/admin/tokenomics-chart';
import { SupplyManagement } from '@/components/admin/supply-management';
import { myPtsHubApi, myPtsValueApi } from '@/lib/api/mypts-api';
import { MyPtsHubState, MyPtsValue } from '@/types/mypts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SupplyManagementPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [hubState, setHubState] = useState<MyPtsHubState | null>(null);
  const [value, setValue] = useState<MyPtsValue | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch hub state
      const hubResponse = await myPtsHubApi.getHubState();
      if (hubResponse.success && hubResponse.data) {
        setHubState(hubResponse.data);
      } else {
        toast.error('Failed to fetch hub state', {
          description: hubResponse.message || 'An error occurred',
        });
      }

      // Fetch value
      const valueResponse = await myPtsValueApi.getCurrentValue();
      if (valueResponse.success && valueResponse.data) {
        setValue(valueResponse.data);
      } else {
        toast.error('Failed to fetch value data', {
          description: valueResponse.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error fetching supply management data:', error);
      toast.error('Failed to fetch supply management data', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Supply Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage MyPts supply and distribution</p>
      </div>

      {hubState && value ? (
        <HubStats hubState={hubState} value={value} isLoading={isLoading} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      )}

      {hubState && (
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <TokenomicsChart hubState={hubState} isLoading={isLoading} />
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-black/80 border border-gray-100 dark:border-gray-800 shadow-sm">
            <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Supply Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 dark:text-gray-300">Total Supply</span>
                    <span className="font-medium text-gray-900 dark:text-white">{hubState.totalSupply.toLocaleString()} MyPts</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 dark:text-gray-300">Circulating Supply</span>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 dark:text-white">{((hubState.circulatingSupply / hubState.totalSupply) * 100).toFixed(2)}%</span>
                      <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full">85%</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-300 dark:bg-gray-600"
                      style={{ width: `${(hubState.circulatingSupply / hubState.totalSupply) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    {hubState.circulatingSupply.toLocaleString()} MyPts
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 dark:text-gray-300">Holding (Reserve)</span>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 dark:text-white">{((hubState.reserveSupply / hubState.totalSupply) * 100).toFixed(2)}%</span>
                      <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full">15%</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-700 dark:bg-gray-300"
                      style={{ width: `${(hubState.reserveSupply / hubState.totalSupply) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    {hubState.reserveSupply.toLocaleString()} MyPts
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {hubState && <SupplyManagement hubState={hubState} onSuccess={fetchData} />}
    </div>
  );
}
