'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { myPtsApi } from '@/lib/api/mypts-api';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StripePayment } from '@/components/payment/stripe-payment';
import { AnimatedButton } from '../ui/animated-button';

// Define form validation schema
const formSchema = z.object({
  amount: z.coerce.number().positive({
    message: 'Amount must be greater than 0',
  }),
  paymentMethod: z.enum(['credit', 'debit', 'paypal'], {
    required_error: 'Please select a payment method',
  }),
});

type FormData = z.infer<typeof formSchema>;

interface BuyFormProps {
  onSuccess?: () => void;
}

export function BuyForm({ onSuccess }: BuyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    clientSecret: string;
    amount: number;
    currency: string;
    transactionId: string;
    myPtsAmount?: number; // Add myPtsAmount to track the actual MyPts being purchased
  } | null>(null);
  const [conversionRate, setConversionRate] = useState<number | null>(null); // Track the conversion rate

  // Initialize the form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 50,
      paymentMethod: 'credit',
    },
  });

  // Define what happens when the form is submitted
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Log the data being sent
      console.log('Initiating MyPts purchase with data:', data);

      // Call the API to create a payment intent
      const response = await myPtsApi.buyMyPts(
        data.amount,
        data.paymentMethod
      );

      if (response.success && response.data?.clientSecret) {
        // Calculate conversion rate (cents per MyPt)
        const rate = response.data.amount / data.amount;
        setConversionRate(rate);

        // Store payment information and show payment form
        setPaymentInfo({
          clientSecret: response.data.clientSecret,
          amount: response.data.amount,
          currency: response.data.currency,
          transactionId: response.data.transactionId,
          myPtsAmount: data.amount // Store the actual MyPts amount being purchased
        });
        setShowPaymentForm(true);

        // Log the conversion for debugging
        console.log(`Converting ${data.amount} MyPts to ${response.data.amount} cents (${response.data.currency})`);
        console.log(`Rate: ${rate} cents per MyPt`);
      } else {
        toast.error('Failed to initiate payment', {
          description: response.message || 'An error occurred while setting up the payment',
        });
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Payment setup failed', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async () => {
    // Call onSuccess callback immediately to refresh the balance
    if (onSuccess) {
      await onSuccess();
    }

    // Show success message with the updated balance
    if (paymentInfo?.myPtsAmount) {
      toast.success('Purchase successful', {
        description: `Your purchase of ${paymentInfo.myPtsAmount} MyPts was completed successfully! Your balance has been updated.`,
      });
    } else {
      toast.success('Purchase successful', {
        description: `Your MyPts purchase was completed successfully! Your balance has been updated.`,
      });
    }

    // Reset the form and payment state
    form.reset();
    setShowPaymentForm(false);
    setPaymentInfo(null);
  };

  // Handle payment cancellation
  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setPaymentInfo(null);
    toast.info('Payment cancelled', {
      description: 'You can try again when you\'re ready.',
    });
  };

  return (
    <>
      {showPaymentForm && paymentInfo ? (
        <StripePayment
          clientSecret={paymentInfo.clientSecret}
          amount={paymentInfo.amount}
          currency={paymentInfo.currency}
          myPtsAmount={paymentInfo.myPtsAmount}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Buy MyPts</CardTitle>
            <CardDescription>
              Purchase MyPts using your preferred payment method.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            placeholder="50"
                            {...field}
                            min={1}
                          />
                          <span className="ml-2">MyPts</span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter the amount of MyPts you want to purchase.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="credit">Credit Card</SelectItem>
                          <SelectItem value="debit">Debit Card</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select your preferred payment method.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="max-w-[14rem] mx-auto ">

                <AnimatedButton
                  type="submit" className=" auth-button active px-[4rem] h-12" disabled={isSubmitting}

                >
                  {isSubmitting ? 'Processing...' : 'Continue to Payment'}
                </AnimatedButton>
</div>

              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Payments are processed securely by Stripe.
            </p>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
