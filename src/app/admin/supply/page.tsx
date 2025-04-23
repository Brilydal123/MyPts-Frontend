'use client';

import { useState, useEffect } from 'react';
// Admin layout is provided by /admin/layout.tsx
import { HubStats } from '@/components/admin/hub-stats';
import { SupplyManagement } from '@/components/admin/supply-management';
import { myPtsHubApi, myPtsValueApi } from '@/lib/api/mypts-api';
import { MyPtsHubState, MyPtsValue } from '@/types/mypts';
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Supply Management</h1>
        
        {hubState && value ? (
          <HubStats hubState={hubState} value={value} isLoading={isLoading} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        )}
        
        {hubState && <SupplyManagement hubState={hubState} onSuccess={fetchData} />}
    </div>
  );
}
