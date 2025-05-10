'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/shared/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, Clock, Info } from 'lucide-react';
import { myPtsApi } from '@/lib/api/mypts-api';
import { MyPtsTransaction, TransactionStatus, TransactionType } from '@/types/mypts';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function TransactionDetailPage() {
  const params = useParams() || { id: null };
  const router = useRouter();
  const [transaction, setTransaction] = useState<MyPtsTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [noProfileSelected, setNoProfileSelected] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Session check effect
  useEffect(() => {
    if (sessionChecked) return;

    const checkSession = () => {
      try {
        const profileId = typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null;
        console.log('Profile selected from localStorage:', profileId ? 'Yes' : 'No');

        if (!profileId) {
          console.warn('No profile selected, cannot fetch transaction');
          setNoProfileSelected(true);
          setIsLoading(false);
        }
        setSessionChecked(true);
      } catch (error) {
        console.error('Error checking session:', error);
        setSessionChecked(true);
      }
    };

    setTimeout(checkSession, 0);
  }, [sessionChecked]);

  // Transaction fetch effect
  useEffect(() => {
    if (!sessionChecked || hasAttemptedFetch || noProfileSelected) return;

    let isMounted = true;

    const fetchTransaction = async () => {
      if (isMounted) setIsLoading(true);

      try {
        const profileId = typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null;

        if (!profileId) {
          if (isMounted) {
            setNoProfileSelected(true);
            setIsLoading(false);
            setHasAttemptedFetch(true);
          }
          return;
        }

        const transactionId = params.id as string;
        console.log(`Fetching transaction with ID: ${transactionId} for selected profile`);

        const response = await myPtsApi.getTransaction(transactionId);

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
        if (isMounted) {
          console.error('Error fetching transaction:', error);
          toast.error('Failed to fetch transaction', {
            description: 'An unexpected error occurred',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setHasAttemptedFetch(true);
        }
      }
    };

    if (params.id) {
      fetchTransaction();
    } else {
      setIsLoading(false);
      setHasAttemptedFetch(true);
    }

    return () => {
      isMounted = false;
    };
  }, [params.id, sessionChecked, hasAttemptedFetch, noProfileSelected]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  const getTransactionTypeLabel = (type: TransactionType) => {
    const labels: Record<TransactionType, string> = {
      [TransactionType.BUY_MYPTS]: 'Buy MyPts',
      [TransactionType.SELL_MYPTS]: 'Sell MyPts',
      [TransactionType.EARN_MYPTS]: 'Earn MyPts',
      [TransactionType.PURCHASE_PRODUCT]: 'Purchase Product',
      [TransactionType.RECEIVE_PRODUCT_PAYMENT]: 'Product Payment',
      [TransactionType.DONATION_SENT]: 'Donation Sent',
      [TransactionType.DONATION_RECEIVED]: 'Donation Received',
      [TransactionType.REFUND]: 'Refund',
      [TransactionType.ADJUSTMENT]: 'Adjustment',
      [TransactionType.EXPIRE]: 'Expired',
    };
    return labels[type] || type.replace(/_/g, ' ');
  };

  const getTransactionIcon = (_type: TransactionType, amount: number) => {
    return amount > 0 ? (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-green-50 dark:bg-green-900/20 p-2 rounded-full"
      >
        <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
      </motion.div>
    ) : (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-red-50 dark:bg-red-900/20 p-2 rounded-full"
      >
        <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-400" />
      </motion.div>
    );
  };

  const getTransactionStatusBadge = (status: TransactionStatus) => {
    const statusConfig: Record<TransactionStatus, { icon: any; className: string }> = {
      [TransactionStatus.COMPLETED]: {
        icon: CheckCircle,
        className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
      },
      [TransactionStatus.PENDING]: {
        icon: Clock,
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
      },
      [TransactionStatus.FAILED]: {
        icon: XCircle,
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
      },
      [TransactionStatus.RESERVED]: {
        icon: Clock,
        className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
      },
      [TransactionStatus.CANCELLED]: {
        icon: XCircle,
        className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
      },
      [TransactionStatus.REJECTED]: {
        icon: XCircle,
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
      },
    };

    const config = statusConfig[status] || {
      icon: Info,
      className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
    };

    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Badge
          variant="outline"
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium ${config.className}`}
        >
          <config.icon className="h-3.5 w-3.5" />
          {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
        </Badge>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto px-4 py-8 space-y-8"
      >
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Transactions
          </Button>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-4xl font-bold tracking-tight"
        >
          Transaction Details
        </motion.h1>

        <Card className="overflow-hidden border-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl shadow-lg">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle>
              {isLoading ? (
                <Skeleton className="h-8 w-48" />
              ) : transaction ? (
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.type, transaction.amount)}
                  <span className="text-xl font-semibold">
                    {getTransactionTypeLabel(transaction.type)}
                  </span>
                </div>
              ) : (
                'Transaction Not Found'
              )}
            </CardTitle>
            <CardDescription>
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : transaction ? (
                <div className="flex items-center gap-3 mt-2">
                  {getTransactionStatusBadge(transaction.status)}
                  <span className="text-sm text-muted-foreground">
                    {formatDate(transaction.createdAt)}
                  </span>
                </div>
              ) : null}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : transaction ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20"
                  >
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Amount</h3>
                    <p className={`text-3xl font-bold ${transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} MyPts
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
                  >
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Balance After Transaction</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {transaction.balance.toLocaleString()} MyPts
                    </p>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction ID</h3>
                    <p className="font-mono text-sm break-all bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                      {transaction._id}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</h3>
                    <p className="text-sm bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>

                {transaction.metadata && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="space-y-2"
                  >
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Additional Information</h3>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <pre className="text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(transaction.metadata, null, 2)}
                      </pre>
                    </div>
                  </motion.div>
                )}

                {transaction.description && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="space-y-2"
                  >
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                    <p className="text-sm bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      {transaction.description}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ) : noProfileSelected ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <div className="mb-6 text-amber-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">No Profile Selected</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Please select a profile to view transaction details.
                </p>
                <Button
                  onClick={() => router.push('/dashboard/profiles')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  Go to Profiles
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center text-gray-500 dark:text-gray-400"
              >
                Transaction not found or you don't have permission to view it.
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </MainLayout>
  );
}
