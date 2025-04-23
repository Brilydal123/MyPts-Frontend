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
  
  // Initialize the form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 100,
      paymentMethod: 'credit',
    },
  });

  // Define what happens when the form is submitted
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      // Log the data being sent
      console.log('Buying MyPts with data:', data);
      
      // Call the API to purchase MyPts
      // Based on the API implementation, buyMyPts expects (amount, paymentMethod, paymentId?)
      const response = await myPtsApi.buyMyPts(
        data.amount,
        data.paymentMethod,
        // Optional third parameter for payment ID if needed
        undefined
      );
      
      if (response.success) {
        toast.success('Purchase successful', {
          description: `You have purchased ${data.amount} MyPts`,
        });
        
        // Reset the form
        form.reset();
        
        // Call onSuccess callback if provided
        if (onSuccess) onSuccess();
      } else {
        toast.error('Purchase failed', {
          description: response.message || 'An error occurred during the purchase',
        });
      }
    } catch (error) {
      console.error('Error purchasing MyPts:', error);
      toast.error('Purchase failed', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
                        placeholder="100"
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
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Buy Now'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Payments are processed securely.
        </p>
      </CardFooter>
    </Card>
  );
}