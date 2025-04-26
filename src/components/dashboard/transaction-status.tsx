import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { myPtsApi } from '@/lib/api/mypts-api';
import { TransactionStatus as TxStatus, TransactionType, MyPtsTransaction } from '@/types/mypts';
import { RefreshCw, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TransactionStatusProps {
  transactionId: string;
  onRefresh?: () => void;
}

export function TransactionStatus({ transactionId, onRefresh }: TransactionStatusProps) {
  const [transaction, setTransaction] = useState<MyPtsTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransaction = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await myPtsApi.getTransaction(transactionId);
      if (response.success && response.data) {
        setTransaction(response.data);
      } else {
        setError(response.message || 'Failed to fetch transaction');
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  const handleRefresh = () => {
    fetchTransaction();
    if (onRefresh) {
      onRefresh();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case TxStatus.COMPLETED:
        return <Badge className="bg-green-500">Completed</Badge>;
      case TxStatus.PENDING:
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
      case TxStatus.RESERVED:
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Reserved</Badge>;
      case TxStatus.FAILED:
        return <Badge variant="destructive">Failed</Badge>;
      case TxStatus.CANCELLED:
        return <Badge variant="secondary">Cancelled</Badge>;
      case TxStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case TxStatus.COMPLETED:
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case TxStatus.PENDING:
        return <Clock className="h-8 w-8 text-amber-500" />;
      case TxStatus.RESERVED:
        return <Clock className="h-8 w-8 text-blue-500" />;
      case TxStatus.FAILED:
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      case TxStatus.CANCELLED:
        return <AlertCircle className="h-8 w-8 text-gray-500" />;
      case TxStatus.REJECTED:
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Clock className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusMessage = (transaction: MyPtsTransaction) => {
    if (!transaction) return '';

    switch (transaction.status) {
      case TxStatus.COMPLETED:
        return transaction.type === TransactionType.SELL_MYPTS
          ? 'Your sale has been processed and payment has been sent.'
          : 'Your transaction has been completed successfully.';
      case TxStatus.PENDING:
        return transaction.type === TransactionType.SELL_MYPTS
          ? 'Your sale is pending admin approval. You will be notified once processed.'
          : 'Your transaction is being processed.';
      case TxStatus.RESERVED:
        return 'Your sell request is awaiting admin approval. Your MyPts will remain in your account until approved.';
      case TxStatus.FAILED:
        return 'Your transaction has failed. Please try again or contact support.';
      case TxStatus.CANCELLED:
        return 'Your transaction has been cancelled.';
      case TxStatus.REJECTED:
        return `Your sell request has been rejected by an admin${transaction.metadata?.rejectionReason ? `: ${transaction.metadata.rejectionReason}` : '.'}`;
      default:
        return 'Transaction status unknown.';
    }
  };

  const getTimeInfo = (transaction: MyPtsTransaction) => {
    if (!transaction) return '';

    const date = new Date(transaction.createdAt);
    return `${formatDistanceToNow(date, { addSuffix: true })}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <p>Loading transaction status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !transaction) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-center">{error || 'Transaction not found'}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Transaction Status</CardTitle>
          {getStatusBadge(transaction.status)}
        </div>
        <CardDescription>
          {transaction.type === TransactionType.SELL_MYPTS ? 'Sell' : 'Buy'} transaction {getTimeInfo(transaction)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-4">
          {getStatusIcon(transaction.status)}
          <div>
            <p className="font-medium">{transaction.status}</p>
            <p className="text-sm text-muted-foreground">{getStatusMessage(transaction)}</p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Transaction ID:</span>
            <span className="text-sm font-mono">{transaction._id.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Type:</span>
            <span className="text-sm">{transaction.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Amount:</span>
            <span className="text-sm font-medium">{Math.abs(transaction.amount).toLocaleString()} MyPts</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Date:</span>
            <span className="text-sm">{new Date(transaction.createdAt).toLocaleString()}</span>
          </div>
          {transaction.type === TransactionType.SELL_MYPTS && (transaction.status === TxStatus.PENDING || transaction.status === TxStatus.RESERVED) && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md text-sm">
              <p className="text-amber-800 dark:text-amber-300">
                Your sell request is awaiting admin approval. This typically takes 1-2 business days.
                {transaction.status === TxStatus.RESERVED && " Your MyPts will remain in your account until approved."}
                {" "}You will be notified once your transaction is processed.
              </p>
            </div>
          )}

          {transaction.type === TransactionType.SELL_MYPTS && transaction.status === TxStatus.REJECTED && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-md text-sm">
              <p className="text-red-800 dark:text-red-300">
                Your sell request has been rejected by an admin.
                {transaction.metadata?.rejectionReason && (
                  <>
                    <br /><br />
                    <strong>Reason:</strong> {transaction.metadata.rejectionReason}
                  </>
                )}
              </p>
            </div>
          )}

          {transaction.type === TransactionType.SELL_MYPTS && transaction.status === TxStatus.COMPLETED && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-md text-sm">
              <p className="text-green-800 dark:text-green-300">
                <strong>Payment Details:</strong>
                <br />
                {transaction.metadata?.paymentResult?.type === 'bank_transfer' && (
                  <>
                    <strong>Method:</strong> Bank Transfer<br />
                    <strong>Reference:</strong> {transaction.metadata.paymentResult.reference || 'N/A'}<br />
                    {transaction.metadata.adminNotes && (
                      <>
                        <strong>Notes:</strong> {transaction.metadata.adminNotes}
                      </>
                    )}
                  </>
                )}
                {transaction.metadata?.paymentResult?.type === 'paypal' && (
                  <>
                    <strong>Method:</strong> PayPal<br />
                    <strong>Reference:</strong> {transaction.metadata.paymentResult.reference || 'N/A'}<br />
                    {transaction.metadata.adminNotes && (
                      <>
                        <strong>Notes:</strong> {transaction.metadata.adminNotes}
                      </>
                    )}
                  </>
                )}
                {transaction.metadata?.paymentResult?.type === 'stripe' && (
                  <>
                    <strong>Method:</strong> Card Payment<br />
                    {transaction.metadata.paymentResult.status === 'manual_required' ? (
                      <>
                        <strong>Status:</strong> Manual Processing Required<br />
                        <strong>Message:</strong> {transaction.metadata.paymentResult.userFriendlyMessage || 'Your payment will be processed manually.'}<br />
                      </>
                    ) : (
                      <>
                        <strong>Payout ID:</strong> {transaction.metadata.paymentResult.payoutId || 'N/A'}<br />
                        <strong>Status:</strong> {transaction.metadata.paymentResult.status === 'error' ? 'Manual Processing' : transaction.metadata.paymentResult.status || 'Completed'}<br />
                      </>
                    )}
                    {transaction.metadata.adminNotes && (
                      <>
                        <strong>Notes:</strong> {transaction.metadata.adminNotes}
                      </>
                    )}
                  </>
                )}
                {transaction.metadata?.paymentResult?.type === 'crypto' && (
                  <>
                    <strong>Method:</strong> Cryptocurrency ({transaction.metadata.accountDetails?.cryptoType?.toUpperCase() || 'CRYPTO'})<br />
                    <strong>Reference:</strong> {transaction.metadata.paymentResult.reference || 'N/A'}<br />
                    {transaction.metadata.adminNotes && (
                      <>
                        <strong>Notes:</strong> {transaction.metadata.adminNotes}
                      </>
                    )}
                  </>
                )}
                {(!transaction.metadata?.paymentResult?.type || transaction.metadata?.paymentResult?.type === 'manual') && (
                  <>
                    <strong>Method:</strong> Manual Payment<br />
                    <strong>Reference:</strong> {transaction.metadata?.paymentResult?.reference || 'N/A'}<br />
                    {transaction.metadata?.adminNotes && (
                      <>
                        <strong>Notes:</strong> {transaction.metadata.adminNotes}
                      </>
                    )}
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href="/dashboard/transactions">
            View All Transactions
            <ArrowRight className="h-4 w-4 ml-2" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
