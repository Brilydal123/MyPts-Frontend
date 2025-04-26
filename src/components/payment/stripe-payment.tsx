'use client';

import { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface CheckoutFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// The form that collects payment details
function CheckoutForm({ clientSecret, amount, currency, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/buy/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message);
        toast.error('Payment failed', {
          description: error.message,
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Call onSuccess first to refresh the balance before showing the toast
        onSuccess();

        toast.success('Payment successful', {
          description: `Your payment of ${(amount / 100).toFixed(2)} ${currency.toUpperCase()} was successful.`,
        });
      } else {
        // Payment requires additional action or is processing
        toast.info('Payment is processing', {
          description: 'Your payment is being processed. Please wait...',
        });

        // Check if we need to redirect to success page
        if (paymentIntent && (paymentIntent.status === 'processing' || paymentIntent.status === 'requires_capture')) {
          // Redirect to success page to handle the processing status
          window.location.href = `${window.location.origin}/buy/success?payment_intent=${paymentIntent.id}&redirect_status=${paymentIntent.status}`;
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      toast.error('Payment error', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {errorMessage && <div className="text-red-500 mt-4">{errorMessage}</div>}
      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isLoading}>
          {isLoading ? 'Processing...' : `Pay ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`}
        </Button>
      </div>
    </form>
  );
}

interface StripePaymentProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
  myPtsAmount?: number; // Add myPtsAmount to show how many MyPts are being purchased
}

export function StripePayment({ clientSecret, amount, currency, onSuccess, onCancel, myPtsAmount }: StripePaymentProps) {
  const [stripePromise, setStripePromise] = useState(() => getStripe());

  if (!clientSecret) {
    return <div>Loading payment information...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Purchase</CardTitle>
        {myPtsAmount && (
          <div className="mt-2 text-center">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
              {myPtsAmount} MyPts for {(amount / 100).toFixed(2)} {currency.toUpperCase()}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm
            clientSecret={clientSecret}
            amount={amount}
            currency={currency}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </Elements>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Payments are processed securely by Stripe.
        </p>
      </CardFooter>
    </Card>
  );
}
