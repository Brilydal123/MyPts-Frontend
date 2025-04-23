import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { myPtsHubApi } from '@/lib/api/mypts-api';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export function SystemVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    hubCirculatingSupply: number;
    actualCirculatingSupply: number;
    difference: number;
    isConsistent: boolean;
    message: string;
  } | null>(null);
  const [reconcileReason, setReconcileReason] = useState('');

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      const response = await myPtsHubApi.verifySystemConsistency();
      
      if (response.success && response.data) {
        setVerificationResult(response.data);
        
        if (response.data.isConsistent) {
          toast.success('System is consistent', {
            description: 'The MyPts hub data matches the actual profile balances.',
          });
        } else {
          toast.warning('System inconsistency detected', {
            description: response.data.message,
          });
        }
      } else {
        toast.error('Failed to verify system consistency', {
          description: response.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error verifying system consistency:', error);
      toast.error('Failed to verify system consistency', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!reconcileReason.trim()) {
      toast.error('Reason is required', {
        description: 'Please provide a reason for the reconciliation.',
      });
      return;
    }

    setIsReconciling(true);
    try {
      const response = await myPtsHubApi.reconcileSupply(reconcileReason);
      
      if (response.success && response.data) {
        toast.success('Successfully reconciled system supply', {
          description: response.data.message,
        });
        setReconcileReason('');
        // Verify again to show updated status
        handleVerify();
      } else {
        toast.error('Failed to reconcile system supply', {
          description: response.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error reconciling system supply:', error);
      toast.error('Failed to reconcile system supply', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Verification</CardTitle>
        <CardDescription>Verify and reconcile the MyPts system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between">
            <p className="text-sm font-medium">Verify System Consistency</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleVerify}
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Now'}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            This operation checks if the hub's circulating supply matches the sum of all profile balances.
          </p>
          
          {verificationResult && (
            <div className={`p-4 rounded-lg border ${
              verificationResult.isConsistent ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                {verificationResult.isConsistent ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${
                    verificationResult.isConsistent ? 'text-green-800' : 'text-amber-800'
                  }`}>
                    {verificationResult.message}
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Hub circulating supply: <span className="font-medium">{verificationResult.hubCirculatingSupply.toLocaleString()} MyPts</span></p>
                    <p>Actual circulating supply: <span className="font-medium">{verificationResult.actualCirculatingSupply.toLocaleString()} MyPts</span></p>
                    {!verificationResult.isConsistent && (
                      <p>
                        Difference: <span className="font-medium">{Math.abs(verificationResult.difference).toLocaleString()} MyPts</span>
                        {verificationResult.difference > 0 ? ' (excess)' : ' (missing)'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {verificationResult && !verificationResult.isConsistent && (
          <div className="space-y-4 pt-4 border-t">
            <p className="text-sm font-medium">Reconcile System</p>
            <p className="text-sm text-muted-foreground">
              This operation will adjust the hub data to match the actual profile balances.
              {verificationResult.difference > 0 
                ? ' New MyPts will be issued to match the excess in circulation.' 
                : ' MyPts will be moved from circulation to reserve to match the actual balances.'}
            </p>
            
            <div className="space-y-2">
              <label htmlFor="reconcileReason" className="text-sm font-medium">
                Reason for Reconciliation
              </label>
              <Input
                id="reconcileReason"
                placeholder="Provide a reason for this reconciliation"
                value={reconcileReason}
                onChange={(e) => setReconcileReason(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This will be recorded in the system logs
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="default" 
                onClick={handleReconcile}
                disabled={isReconciling || !reconcileReason.trim()}
              >
                {isReconciling ? 'Reconciling...' : 'Reconcile System'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
