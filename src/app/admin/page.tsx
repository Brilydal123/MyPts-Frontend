'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
// Admin layout is now provided by /admin/layout.tsx
import { HubStats } from '@/components/admin/hub-stats';
import { SystemVerification } from '@/components/admin/system-verification';
import { RecentTransactions } from '@/components/admin/recent-transactions';
import { PendingSellTransactions } from '@/components/admin/pending-sell-transactions';
import { AdminNotificationCenter } from '@/components/admin/notification-center';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { myPtsHubApi, myPtsValueApi } from '@/lib/api/mypts-api';
import { MyPtsHubState, MyPtsValue } from '@/types/mypts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hubState, setHubState] = useState<MyPtsHubState | null>(null);
  const [value, setValue] = useState<MyPtsValue | null>(null);
  const [manualCheckPassed, setManualCheckPassed] = useState(false);

  // Manual admin check - we know this specific ID is admin regardless of session
  const KNOWN_ADMIN_ID = '67e8422eb722d77adcee042a';

  // Check if current user is our known admin by ID
  useEffect(() => {
    // Debug the current user ID
    console.log('Current user ID:', session?.user?.id);
    console.log('Known admin ID:', KNOWN_ADMIN_ID);
    console.log('ID match?', session?.user?.id === KNOWN_ADMIN_ID);

    // If user ID matches known admin ID, bypass regular admin checks
    if (session?.user?.id === KNOWN_ADMIN_ID) {
      console.log('Manual admin check passed!');
      setManualCheckPassed(true);
    }
  }, [session?.user?.id]);

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
      console.error('Error fetching admin dashboard data:', error);
      toast.error('Failed to fetch admin dashboard data', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Note: Access control is now handled in the admin layout component
  // This is just an additional check for this specific page
  if (!session || (!manualCheckPassed && !session?.user?.isAdmin)) {
    return (
      <div className="space-y-6 py-12">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access the admin dashboard.
            {session ? (
              <>
                <p className="mt-2">User ID: {session.user.id}</p>
                <p>KNOWN_ADMIN_ID: {KNOWN_ADMIN_ID}</p>
                <p>ID Match: {session.user.id === KNOWN_ADMIN_ID ? 'Yes' : 'No'}</p>
              </>
            ) : (
              <p className="mt-2">Please log in to continue.</p>
            )}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/')}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          {manualCheckPassed && (
            <Alert className="w-auto p-2 text-amber-600 bg-amber-50">
              <AlertTitle className="text-sm">Admin access granted via manual ID check</AlertTitle>
            </Alert>
          )}
        </div>

        {hubState && value ? (
          <HubStats hubState={hubState} value={value} isLoading={isLoading} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Supply Distribution</CardTitle>
              <CardDescription>Current distribution of MyPts supply</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || !hubState ? (
                <div className="h-64 bg-muted rounded animate-pulse"></div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Circulating Supply</span>
                      <span>{((hubState.circulatingSupply / hubState.totalSupply) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(hubState.circulatingSupply / hubState.totalSupply) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {hubState.circulatingSupply.toLocaleString()} MyPts
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Reserve Supply</span>
                      <span>{((hubState.reserveSupply / hubState.totalSupply) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(hubState.reserveSupply / hubState.totalSupply) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {hubState.reserveSupply.toLocaleString()} MyPts
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Total Supply</span>
                      <span className="text-sm font-medium">{hubState.totalSupply.toLocaleString()} MyPts</span>
                    </div>
                    {hubState.maxSupply !== null && (
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">Maximum Supply</span>
                        <span className="text-xs text-muted-foreground">{hubState.maxSupply.toLocaleString()} MyPts</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <SystemVerification />
        </div>

        {/* Notifications Section */}
        <div className="mt-6">
          <AdminNotificationCenter />
        </div>

        {/* Pending Sell Transactions and Recent Transactions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <PendingSellTransactions limit={5} />
          <RecentTransactions limit={5} />
        </div>
    </div>
  );
}
