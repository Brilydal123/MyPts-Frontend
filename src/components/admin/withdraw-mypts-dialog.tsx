'use client';

import { useState } from 'react';
import { useAdminWithdrawMyPts } from '@/hooks/use-mypts-data';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Coins, AlertCircle, MinusCircle } from 'lucide-react';

interface WithdrawMyPtsDialogProps {
  profileId: string;
  profileName: string;
  currentBalance: number;
  onSuccess?: (newBalance: number) => void;
}

export function WithdrawMyPtsDialog({
  profileId,
  profileName,
  currentBalance,
  onSuccess,
}: WithdrawMyPtsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Use our custom hook for admin withdrawal
  const adminWithdrawMyPtsMutation = useAdminWithdrawMyPts();

  const handleWithdraw = async () => {
    // Validate amount
    if (!amount || amount <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    if (amount > currentBalance) {
      setError(`Amount cannot exceed current balance (${currentBalance} MyPts)`);
      return;
    }

    setError(null);

    try {
      // Call the mutation
      const result = await adminWithdrawMyPtsMutation.mutateAsync({
        profileId,
        amount: Number(amount),
        reason: reason.trim() || 'Admin withdrawal',
      });

      // Call onSuccess callback if provided
      if (onSuccess && result) {
        onSuccess(result.newBalance);
      }

      // Close the dialog
      setIsOpen(false);

      // Reset form
      setAmount('');
      setReason('');
    } catch (error) {
      console.error('Error withdrawing MyPts:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
          <MinusCircle className="h-4 w-4 mr-2" />
          Withdraw MyPts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw MyPts</DialogTitle>
          <DialogDescription>
            Withdraw MyPts from {profileName}'s account. Current balance: {currentBalance} MyPts.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <div className="col-span-3 flex items-center">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                className="flex-1"
                min={1}
                max={currentBalance}
                placeholder="Enter amount to withdraw"
              />
              <span className="ml-2 text-sm text-muted-foreground">MyPts</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              Reason
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="col-span-3"
              placeholder="Enter reason for withdrawal (optional)"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={adminWithdrawMyPtsMutation.isPending}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {adminWithdrawMyPtsMutation.isPending ? 'Processing...' : 'Withdraw MyPts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
