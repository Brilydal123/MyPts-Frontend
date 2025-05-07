'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter }
from 'next/navigation';
import { MainLayout } from '@/components/shared/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { myPtsApi } from '@/lib/api/mypts-api';
import { MyPtsTransaction, TransactionStatus, TransactionType } from '@/types/mypts';
import { toast } from 'sonner';

export default function TransactionDetailPage() {
  const params = useParams() || { id: null };
  const router = useRouter();
  const [transaction, setTransaction] = useState<MyPtsTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [noProfileSelected, setNoProfileSelected] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // First, check if we have a valid session and profile
  useEffect(() => {
    // Skip if we've already checked
    if (sessionChecked) return;

    const checkSession = () => {
      try {
        // Safely check localStorage (only available in browser)
        let profileId = null;
        if (typeof window !== 'undefined') {
          profileId = localStorage.getItem('selectedProfileId');
          // Log without exposing the actual ID
          console.log('Profile selected from localStorage:', profileId ? 'Yes' : 'No');
        }

        if (!profileId) {
          console.warn('No profile selected, cannot fetch transaction');
          setNoProfileSelected(true);
          setIsLoading(false);
        }

        // Mark session as checked to prevent infinite loops
        setSessionChecked(true);
      } catch (error) {
        console.error('Error checking session:', error);
        // Mark session as checked even on error to prevent infinite loops
        setSessionChecked(true);
      }
    };

    // Use setTimeout to ensure this runs after component is fully mounted
    // This helps avoid issues with localStorage access during SSR/hydration
    setTimeout(checkSession, 0);
  }, [sessionChecked]);

  // Then, fetch the transaction data if we have a valid session
  useEffect(() => {
    // Skip if we haven't checked the session yet or if we've already attempted to fetch
    if (!sessionChecked || hasAttemptedFetch) return;

    // Skip if no profile is selected
    if (noProfileSelected) return;

    // Create a flag to track if the component is mounted
    let isMounted = true;

    const fetchTransaction = async () => {
      // Only set loading state if the component is still mounted
      if (isMounted) setIsLoading(true);

      try {
        // Safely get the profile ID (only available in browser)
        let profileId = null;
        if (typeof window !== 'undefined') {
          profileId = localStorage.getItem('selectedProfileId');
        }

        // Double-check that we have a profile ID
        if (!profileId) {
          console.warn('No profile selected when trying to fetch transaction');
          if (isMounted) {
            setNoProfileSelected(true);
            setIsLoading(false);
            setHasAttemptedFetch(true);
          }
          return;
        }

        const transactionId = params.id as string;
        console.log(`Fetching transaction with ID: ${transactionId} for selected profile`);

        // Add a cache-busting parameter to prevent infinite loops
        const response = await myPtsApi.getTransaction(transactionId);

        // Only update state if the component is still mounted
        if (isMounted) {
          if (response.success && response.data) {
            console.log('Transaction data received:', response.data);
            setTransaction(response.data);
          } else {
            console.error('Failed to fetch transaction:', response.message);
            toast.error('Failed to fetch transaction', {
              description: response.message || 'An error occurred',
            });
          }
        }
      } catch (error) {
        // Only show error if the component is still mounted
        if (isMounted) {
          console.error('Error fetching transaction:', error);
          toast.error('Failed to fetch transaction', {
            description: 'An unexpected error occurred',
          });
        }
      } finally {
        // Only update loading state if the component is still mounted
        if (isMounted) {
          setIsLoading(false);
          setHasAttemptedFetch(true);
        }
      }
    };

    // Only fetch if we have a transaction ID
    if (params.id) {
      fetchTransaction();
    } else {
      // If no transaction ID, just mark as not loading
      setIsLoading(false);
      setHasAttemptedFetch(true);
    }

    // Cleanup function to set the mounted flag to false when the component unmounts
    return () => {
      isMounted = false;
    };
  }, [params.id, sessionChecked, hasAttemptedFetch, noProfileSelected]); // Only re-run if these dependencies change

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
    }).format(date);
  };

  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
      case TransactionType.BUY_MYPTS:
        return 'Buy MyPts';
      case TransactionType.SELL_MYPTS:
        return 'Sell MyPts';
      case TransactionType.EARN_MYPTS:
        return 'Earn MyPts';
      case TransactionType.PURCHASE_PRODUCT:
        return 'Purchase Product';
      case TransactionType.RECEIVE_PRODUCT_PAYMENT:
        return 'Product Payment';
      case TransactionType.DONATION_SENT:
        return 'Donation Sent';
      case TransactionType.DONATION_RECEIVED:
        return 'Donation Received';
      case TransactionType.REFUND:
        return 'Refund';
      case TransactionType.ADJUSTMENT:
        return 'Adjustment';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  const getTransactionIcon = (_type: TransactionType, amount: number) => {
    // We're only using the amount to determine the icon, but keeping the type parameter
    // for potential future use based on transaction type
    if (amount > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    } else {
      return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    }
  };

  const getTransactionStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case TransactionStatus.PENDING:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case TransactionStatus.FAILED:
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">{status}</Badge>
        );
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Transactions
          </Button>
        </div>

        <h1 className="text-3xl font-bold">Transaction Details</h1>

        <Card>
          <CardHeader>
            <CardTitle>
              {isLoading ? (
                <Skeleton className="h-8 w-48" />
              ) : transaction ? (
                <div className="flex items-center gap-2">
                  {getTransactionIcon(transaction.type, transaction.amount)}
                  {getTransactionTypeLabel(transaction.type)}
                </div>
              ) : (
                'Transaction Not Found'
              )}
            </CardTitle>
            <CardDescription>
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : transaction ? (
                <div className="flex items-center gap-2">
                  {getTransactionStatusBadge(transaction.status)}
                  <span className="text-muted-foreground">
                    {formatDate(transaction.createdAt)}
                  </span>
                </div>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : transaction ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Transaction ID</h3>
                    <p className="font-mono text-sm break-all">{transaction._id}</p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                    <p>{formatDate(transaction.createdAt)}</p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
                    <p className={`text-2xl font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} MyPts
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Balance After Transaction</h3>
                    <p className="text-2xl font-bold">{transaction.balance.toLocaleString()} MyPts</p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div>{getTransactionStatusBadge(transaction.status)}</div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                    <p>{getTransactionTypeLabel(transaction.type)}</p>
                  </div>
                </div>

                {transaction.metadata && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Additional Information</h3>
                    <div className="bg-muted p-4 rounded-md">
                      <pre className="text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(transaction.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {transaction.description && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p className="text-sm">{transaction.description}</p>
                  </div>
                )}
              </div>
            ) : noProfileSelected ? (
              <div className="py-8 text-center">
                <div className="mb-4 text-amber-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">No Profile Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Please select a profile to view transaction details.
                </p>
                <Button
                  onClick={() => router.push('/dashboard/profiles')}
                  className="mx-auto"
                >
                  Go to Profiles
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Transaction not found or you don't have permission to view it.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
