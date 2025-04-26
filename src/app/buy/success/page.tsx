'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/shared/main-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { myPtsApi } from '@/lib/api/mypts-api';
import { toast } from 'sonner';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'success' | 'processing' | 'error'>('processing');
  const [message, setMessage] = useState('Verifying your payment...');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Function to fetch the current balance
  const fetchBalance = async () => {
    try {
      const response = await myPtsApi.getBalance('USD');
      if (response.success && response.data) {
        setBalance(response.data.balance);
        return response.data.balance;
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
    return null;
  };

  // Function to check transaction status
  const checkTransactionStatus = async (paymentIntentId: string) => {
    try {
      const response = await myPtsApi.getTransactionByReference(paymentIntentId);
      if (response.success && response.data) {
        const transaction = response.data;
        setTransactionId(transaction._id);

        if (transaction.status === 'COMPLETED') {
          setStatus('success');
          setMessage('Your payment was successful! Your MyPts have been added to your account.');
          // Fetch the updated balance
          const newBalance = await fetchBalance();
          if (newBalance !== null) {
            toast.success(`Your new balance is ${newBalance} MyPts`);
          }
          return true;
        } else if (transaction.status === 'PENDING') {
          setStatus('processing');
          setMessage('Your payment is still processing. We\'ll update your account once the payment is complete.');
          return false;
        } else if (transaction.status === 'FAILED') {
          setStatus('error');
          setMessage('Your payment failed. Please try again or contact support.');
          return false;
        }
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
    }
    return false;
  };

  // Function to manually refresh the transaction status
  const refreshTransactionStatus = async () => {
    setIsRefreshing(true);
    const paymentIntent = searchParams?.get('payment_intent');

    if (paymentIntent) {
      await checkTransactionStatus(paymentIntent);
    }

    setIsRefreshing(false);
  };

  useEffect(() => {
    // Get payment_intent and payment_intent_client_secret from URL
    const paymentIntent = searchParams?.get('payment_intent');
    const paymentIntentClientSecret = searchParams?.get('payment_intent_client_secret');
    const redirectStatus = searchParams?.get('redirect_status');

    if (!paymentIntent || !paymentIntentClientSecret) {
      setStatus('error');
      setMessage('Invalid payment information. Please try again.');
      return;
    }

    // Initial status based on redirect_status
    if (redirectStatus === 'succeeded') {
      setStatus('success');
      setMessage('Your payment was successful! Your MyPts have been added to your account.');

      // Check the actual transaction status and get the updated balance
      checkTransactionStatus(paymentIntent);
      fetchBalance();
    } else if (redirectStatus === 'processing') {
      setStatus('processing');
      setMessage('Your payment is processing. We\'ll update your account once the payment is complete.');

      // Set up polling to check transaction status
      const intervalId = setInterval(async () => {
        const isComplete = await checkTransactionStatus(paymentIntent);
        if (isComplete) {
          clearInterval(intervalId);
        }
      }, 5000); // Check every 5 seconds

      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    } else {
      setStatus('error');
      setMessage('There was an issue with your payment. Please try again or contact support.');
    }
  }, [searchParams]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleTryAgain = () => {
    router.push('/buy');
  };

  return (
    <MainLayout>
      <div className="container max-w-md py-12">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              {status === 'success' && <CheckCircle className="h-16 w-16 text-green-500" />}
              {status === 'processing' && <div className="h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />}
              {status === 'error' && <AlertCircle className="h-16 w-16 text-red-500" />}
            </div>
            <CardTitle className="text-center text-2xl">
              {status === 'success' && 'Payment Successful'}
              {status === 'processing' && 'Payment Processing'}
              {status === 'error' && 'Payment Failed'}
            </CardTitle>
            <CardDescription className="text-center">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              {status === 'success' && 'Thank you for your purchase. Your MyPts are now available in your account.'}
              {status === 'processing' && 'Your payment is being processed. This may take a moment.'}
              {status === 'error' && 'We encountered an issue processing your payment. Please try again or contact support.'}
            </p>

            {/* Show balance if available */}
            {balance !== null && status === 'success' && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
                <p className="text-sm font-medium text-muted-foreground">Your Current Balance</p>
                <p className="text-2xl font-bold text-primary">{balance.toLocaleString()} MyPts</p>
              </div>
            )}

            {/* Show refresh button for processing status */}
            {status === 'processing' && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={refreshTransactionStatus}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Checking...' : 'Check Status'}
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            {status === 'success' && (
              <>
                <Button variant="outline" onClick={refreshTransactionStatus} disabled={isRefreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Balance
                </Button>
                <Button onClick={handleGoToDashboard}>Go to Dashboard</Button>
              </>
            )}
            {status === 'error' && (
              <>
                <Button variant="outline" onClick={handleGoToDashboard}>Go to Dashboard</Button>
                <Button onClick={handleTryAgain}>Try Again</Button>
              </>
            )}
            {status === 'processing' && (
              <Button variant="outline" onClick={handleGoToDashboard}>Go to Dashboard</Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="container max-w-md py-12">
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              </div>
              <CardTitle className="text-center text-2xl">Loading</CardTitle>
              <CardDescription className="text-center">
                Verifying your payment...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground mb-4">
                Please wait while we verify your payment details.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
