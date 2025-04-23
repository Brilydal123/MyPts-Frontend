'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { myPtsHubApi } from '@/lib/api/mypts-api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

// Create a client
const queryClient = new QueryClient();

// Wrapper component with QueryClientProvider
export default function SystemVerificationPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <SystemVerification />
    </QueryClientProvider>
  );
}

function SystemVerification() {
  const [reconcileReason, setReconcileReason] = useState('Automatic reconciliation from admin panel');
  
  // Fetch system consistency status
  const { 
    data: consistencyData, 
    isLoading: isConsistencyLoading, 
    isError: isConsistencyError,
    refetch: refetchConsistency
  } = useQuery({
    queryKey: ['systemConsistency'],
    queryFn: async () => {
      const response = await myPtsHubApi.verifySystemConsistency();
      if (!response.success) {
        throw new Error(response.message || 'Failed to verify system consistency');
      }
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
  
  // Reconcile supply mutation
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<any>(null);
  const [reconcileError, setReconcileError] = useState<string | null>(null);
  
  const handleReconcile = async () => {
    try {
      setIsReconciling(true);
      setReconcileError(null);
      
      const response = await myPtsHubApi.reconcileSupply(reconcileReason);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reconcile supply');
      }
      
      setReconcileResult(response.data);
      refetchConsistency();
    } catch (error) {
      console.error('Error reconciling supply:', error);
      setReconcileError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsReconciling(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">System Verification</h1>
      
      <Tabs defaultValue="consistency" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="consistency">Consistency Check</TabsTrigger>
          <TabsTrigger value="reconciliation">Supply Reconciliation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="consistency" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Consistency Status</CardTitle>
              <CardDescription>
                Verify that the circulating supply in the hub matches the sum of all profile balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isConsistencyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  <span className="ml-3">Checking system consistency...</span>
                </div>
              ) : isConsistencyError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to check system consistency. Please try again.
                  </AlertDescription>
                </Alert>
              ) : consistencyData ? (
                <div className="space-y-6">
                  <Alert variant={consistencyData.isConsistent ? "default" : "destructive"}>
                    {consistencyData.isConsistent ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {consistencyData.isConsistent ? "System is consistent" : "Inconsistency detected"}
                    </AlertTitle>
                    <AlertDescription>
                      {consistencyData.message}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-muted rounded-lg p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Hub Circulating Supply</h3>
                      <p className="text-2xl font-bold">{consistencyData.hubCirculatingSupply.toLocaleString()}</p>
                    </div>
                    
                    <div className="bg-muted rounded-lg p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Actual Circulating Supply</h3>
                      <p className="text-2xl font-bold">{consistencyData.actualCirculatingSupply.toLocaleString()}</p>
                    </div>
                    
                    <div className={`rounded-lg p-4 ${
                      consistencyData.difference === 0 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Difference</h3>
                      <p className={`text-2xl font-bold ${
                        consistencyData.difference === 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {consistencyData.difference > 0 ? '+' : ''}
                        {consistencyData.difference.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => refetchConsistency()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              
              {consistencyData && !consistencyData.isConsistent && (
                <Button 
                  variant="default" 
                  onClick={() => document.getElementById('reconciliation-tab')?.click()}
                >
                  Reconcile Now
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="reconciliation" className="mt-6" id="reconciliation-tab">
          <Card>
            <CardHeader>
              <CardTitle>Supply Reconciliation</CardTitle>
              <CardDescription>
                Adjust the hub's circulating supply to match the sum of all profile balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Caution</AlertTitle>
                  <AlertDescription>
                    Reconciliation will adjust the hub's circulating supply to match the actual sum of all profile balances.
                    This operation should only be performed when necessary.
                  </AlertDescription>
                </Alert>
                
                {reconcileResult && (
                  <Alert variant="default">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Reconciliation Complete</AlertTitle>
                    <AlertDescription>
                      {reconcileResult.message}
                    </AlertDescription>
                  </Alert>
                )}
                
                {reconcileError && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Reconciliation Failed</AlertTitle>
                    <AlertDescription>
                      {reconcileError}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for reconciliation</Label>
                    <Input
                      id="reason"
                      placeholder="Enter reason for this reconciliation"
                      value={reconcileReason}
                      onChange={(e) => setReconcileReason(e.target.value)}
                    />
                  </div>
                  
                  {reconcileResult && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-muted rounded-lg p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Previous Circulating</h3>
                        <p className="text-xl font-bold">{reconcileResult.previousCirculating.toLocaleString()}</p>
                      </div>
                      
                      <div className="bg-muted rounded-lg p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Actual Circulating</h3>
                        <p className="text-xl font-bold">{reconcileResult.actualCirculating.toLocaleString()}</p>
                      </div>
                      
                      <div className="bg-muted rounded-lg p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Difference</h3>
                        <p className="text-xl font-bold">
                          {reconcileResult.difference > 0 ? '+' : ''}
                          {reconcileResult.difference.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => refetchConsistency()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Consistency
              </Button>
              
              <Button 
                variant="default" 
                onClick={handleReconcile}
                disabled={isReconciling || !reconcileReason.trim()}
              >
                {isReconciling ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                    Reconciling...
                  </>
                ) : (
                  'Reconcile Supply'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
