'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { myPtsHubApi, myPtsValueApi } from '@/lib/api/mypts-api';
import { adminApi } from '@/lib/api/admin-api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  DollarSign,
  Infinity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

// Create a client
const queryClient = new QueryClient();

// Wrapper component with QueryClientProvider
export default function SettingsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminSettings />
    </QueryClientProvider>
  );
}

function AdminSettings() {
  // State for hub settings
  const [valuePerMyPt, setValuePerMyPt] = useState<string>('');
  const [maxSupply, setMaxSupply] = useState<string>('');
  const [isUnlimited, setIsUnlimited] = useState(true);
  const [adjustReason, setAdjustReason] = useState('Adjustment from admin panel');

  // State for admin details
  const [adminName, setAdminName] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminDepartment, setAdminDepartment] = useState<string>('');
  const [adminRole, setAdminRole] = useState<string>('');
  const [systemName, setSystemName] = useState<string>('');
  const [lastLogin, setLastLogin] = useState<string>('');
  const [securityLevel, setSecurityLevel] = useState<string>('');
  const [accountStatus, setAccountStatus] = useState<string>('');

  // State for mutations
  const [isUpdatingValue, setIsUpdatingValue] = useState(false);
  const [isAdjustingMaxSupply, setIsAdjustingMaxSupply] = useState(false);
  const [updateValueResult, setUpdateValueResult] = useState<any>(null);
  const [adjustMaxSupplyResult, setAdjustMaxSupplyResult] = useState<any>(null);
  const [updateValueError, setUpdateValueError] = useState<string | null>(null);
  const [adjustMaxSupplyError, setAdjustMaxSupplyError] = useState<string | null>(null);

  // Fetch hub state
  const {
    data: hubState,
    isLoading: isHubStateLoading,
    isError: isHubStateError,
    refetch: refetchHubState
  } = useQuery({
    queryKey: ['hubState'],
    queryFn: async () => {
      const response = await myPtsHubApi.getHubState();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch hub state');
      }

      // Set initial values
      if (response.data) {
        setValuePerMyPt(response.data.valuePerMyPt.toString());
        setIsUnlimited(response.data.maxSupply === null);
        setMaxSupply(response.data.maxSupply?.toString() || '');
      }

      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Fetch admin details
  const {
    data: adminDetails,
    isLoading: isAdminDetailsLoading,
    isError: isAdminDetailsError,
    refetch: refetchAdminDetails
  } = useQuery({
    queryKey: ['adminDetails'],
    queryFn: async () => {
      const response = await adminApi.getAdminDetails();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch admin details');
      }

      // Set initial values
      if (response.data) {
        setAdminName(response.data.name || '');
        setAdminEmail(response.data.email || '');
        setAdminDepartment(response.data.department || '');
        setAdminRole(response.data.role || '');
        setSystemName(response.data.systemName || '');
        setLastLogin(response.data.lastLogin || '');
        setSecurityLevel(response.data.securityLevel || '');
        setAccountStatus(response.data.accountStatus || '');
      }

      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Handle updating value per MyPt
  const handleUpdateValue = async () => {
    try {
      setIsUpdatingValue(true);
      setUpdateValueError(null);

      const value = parseFloat(valuePerMyPt);
      if (isNaN(value) || value <= 0) {
        throw new Error('Value must be a positive number');
      }

      const response = await myPtsHubApi.updateValuePerMyPt(value);

      if (!response.success) {
        throw new Error(response.message || 'Failed to update value');
      }

      setUpdateValueResult(response.data);
      refetchHubState();
    } catch (error) {
      console.error('Error updating value:', error);
      setUpdateValueError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsUpdatingValue(false);
    }
  };

  // Handle adjusting max supply
  const handleAdjustMaxSupply = async () => {
    try {
      setIsAdjustingMaxSupply(true);
      setAdjustMaxSupplyError(null);

      let maxSupplyValue: number | null = null;

      if (!isUnlimited) {
        const value = parseInt(maxSupply);
        if (isNaN(value) || value <= 0) {
          throw new Error('Maximum supply must be a positive number');
        }
        maxSupplyValue = value;
      }

      const response = await myPtsHubApi.adjustMaxSupply(maxSupplyValue, adjustReason);

      if (!response.success) {
        throw new Error(response.message || 'Failed to adjust maximum supply');
      }

      setAdjustMaxSupplyResult(response.data);
      refetchHubState();
    } catch (error) {
      console.error('Error adjusting max supply:', error);
      setAdjustMaxSupplyError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsAdjustingMaxSupply(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>

      <Tabs defaultValue="hub" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hub">Hub Settings</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="hub" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Value Per MyPt Card */}
            <Card>
              <CardHeader>
                <CardTitle>Value Per MyPt</CardTitle>
                <CardDescription>
                  Set the monetary value of each MyPt in USD
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {updateValueResult && (
                    <Alert variant="default" className="mb-4">
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Value Updated</AlertTitle>
                      <AlertDescription>
                        {updateValueResult.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {updateValueError && (
                    <Alert variant="destructive" className="mb-4">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Update Failed</AlertTitle>
                      <AlertDescription>
                        {updateValueError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="valuePerMyPt">Value in USD</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="valuePerMyPt"
                        type="number"
                        step="0.001"
                        min="0.001"
                        className="pl-9"
                        placeholder="0.024"
                        value={valuePerMyPt}
                        onChange={(e) => setValuePerMyPt(e.target.value)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Current value: ${hubState?.valuePerMyPt.toFixed(3)} USD per MyPt
                    </p>
                  </div>

                  {hubState && (
                    <div className="pt-4">
                      <h3 className="text-sm font-medium mb-2">Total Value</h3>
                      <p className="text-2xl font-bold">
                        ${(hubState.totalSupply * parseFloat(valuePerMyPt || '0')).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} USD
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Based on total supply of {hubState.totalSupply.toLocaleString()} MyPts
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleUpdateValue}
                  disabled={isUpdatingValue || !valuePerMyPt || parseFloat(valuePerMyPt) <= 0}
                >
                  {isUpdatingValue ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Value'
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Maximum Supply Card */}
            <Card>
              <CardHeader>
                <CardTitle>Maximum Supply</CardTitle>
                <CardDescription>
                  Set the maximum number of MyPts that can exist in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adjustMaxSupplyResult && (
                    <Alert variant="default" className="mb-4">
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Maximum Supply Updated</AlertTitle>
                      <AlertDescription>
                        {adjustMaxSupplyResult.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {adjustMaxSupplyError && (
                    <Alert variant="destructive" className="mb-4">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Update Failed</AlertTitle>
                      <AlertDescription>
                        {adjustMaxSupplyError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="unlimited"
                      checked={isUnlimited}
                      onCheckedChange={setIsUnlimited}
                    />
                    <Label htmlFor="unlimited" className="flex items-center">
                      <Infinity className="h-4 w-4 mr-2" />
                      Unlimited Supply
                    </Label>
                  </div>

                  {!isUnlimited && (
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="maxSupply">Maximum Supply</Label>
                      <Input
                        id="maxSupply"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="100000000"
                        value={maxSupply}
                        onChange={(e) => setMaxSupply(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="adjustReason">Reason for adjustment</Label>
                    <Input
                      id="adjustReason"
                      placeholder="Enter reason for this adjustment"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                    />
                  </div>

                  {hubState && (
                    <div className="pt-4">
                      <h3 className="text-sm font-medium mb-2">Current Supply</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-lg font-bold">{hubState.totalSupply.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Circulating</p>
                          <p className="text-lg font-bold">{hubState.circulatingSupply.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Reserve</p>
                          <p className="text-lg font-bold">{hubState.reserveSupply.toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        Current max supply: {hubState.maxSupply === null ? 'Unlimited' : hubState.maxSupply.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleAdjustMaxSupply}
                  disabled={
                    isAdjustingMaxSupply ||
                    (!isUnlimited && (!maxSupply || parseInt(maxSupply) <= 0)) ||
                    !adjustReason
                  }
                >
                  {isAdjustingMaxSupply ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Maximum Supply'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure global system settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Coming Soon</AlertTitle>
                  <AlertDescription>
                    Additional system settings will be available in a future update.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">General Settings</h3>
                  <Separator />

                  {isAdminDetailsLoading ? (
                    <div className="space-y-4">
                      <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>
                      <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="systemName" className="text-gray-700 dark:text-gray-300">System Name</Label>
                        <Input
                          id="systemName"
                          placeholder="MyPts System"
                          value={systemName}
                          onChange={(e) => setSystemName(e.target.value)}
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="adminEmail" className="text-gray-700 dark:text-gray-300">Admin Email</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          placeholder="admin@example.com"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        />
                      </div>
                    </div>
                  )}

                  {!isAdminDetailsLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminName" className="text-gray-700 dark:text-gray-300">Admin Name</Label>
                        <Input
                          id="adminName"
                          placeholder="Admin Name"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="adminDepartment" className="text-gray-700 dark:text-gray-300">Department</Label>
                        <Input
                          id="adminDepartment"
                          placeholder="Department"
                          value={adminDepartment}
                          onChange={(e) => setAdminDepartment(e.target.value)}
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="maintenanceMode" />
                      <Label htmlFor="maintenanceMode" className="text-gray-700 dark:text-gray-300">Maintenance Mode</Label>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      When enabled, the system will be in maintenance mode and users will not be able to perform transactions.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" disabled>
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
