"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { myPtsApi } from "@/lib/api/mypts-api";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StripePayment } from "@/components/payment/stripe-payment";
import { AnimatedButton } from "../ui/animated-button";
// No longer need dialog for invoice
import { InvoicePreview } from "./invoice-preview";
import { DEFAULT_MYPTS_VALUE } from "@/lib/constants";

// Define form validation schema
const formSchema = z.object({
  amount: z.coerce.number().positive({
    message: "Amount must be greater than 0",
  }),
  paymentMethod: z.enum(["credit", "debit", "paypal"], {
    required_error: "Please select a payment method",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface BuyFormProps {
  onSuccess?: () => void;
}

export function BuyForm({ onSuccess }: BuyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Payment form state is now managed by currentStep
  const [paymentInfo, setPaymentInfo] = useState<{
    clientSecret: string;
    amount: number;
    currency: string;
    transactionId: string;
    myPtsAmount?: number; // Add myPtsAmount to track the actual MyPts being purchased
  } | null>(null);

  // Flow state management
  const [currentStep, setCurrentStep] = useState<
    "form" | "invoice" | "payment"
  >("form");
  const invoiceConversionRate = DEFAULT_MYPTS_VALUE * 100; // cents per MyPt
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [actualPaymentAmount, setActualPaymentAmount] = useState<number | null>(
    null
  );

  // Initialize the form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: "credit",
    },
  });

  // Show invoice preview when continuing from the form
  const handleContinue = (data: FormData) => {
    console.log("Moving to invoice preview with data:", data);
    setFormData(data);
    setCurrentStep("invoice");
    // No payment intent creation at this step - we'll only create it when the user confirms the invoice
  };

  // Go back to the form
  const handleBackToForm = () => {
    setCurrentStep("form");
  };

  // Proceed to payment after invoice confirmation
  const proceedToPayment = async (
    qty: number,
    calculatedAmountCents?: number
  ) => {
    if (!formData) return;
    setIsSubmitting(true);

    // Always create a new payment intent with the calculated amount
    try {
      console.log(
        "Creating payment intent with invoice calculated amount:",
        calculatedAmountCents
      );

      // Create payment intent with the calculated amount
      console.log(
        `Sending calculated amount to API: ${calculatedAmountCents} cents for ${qty} MyPts`
      );

      // Use standard API but override the amount in the response
      const response = await myPtsApi.buyMyPts(qty, formData.paymentMethod);

      // If we have a successful response, override the amount with our calculated amount
      if (
        response.success &&
        response.data?.clientSecret &&
        calculatedAmountCents
      ) {
        console.log(
          `Overriding API amount ${response.data.amount} with calculated amount ${calculatedAmountCents}`
        );
        // Store the original amount for reference
        const originalAmount = response.data.amount;
        // Override the amount with our calculated amount
        response.data.amount = calculatedAmountCents;
      }

      if (response.success && response.data?.clientSecret) {
        console.log(
          "Payment intent created with amount:",
          response.data.amount
        );
        setPaymentInfo({
          clientSecret: response.data.clientSecret,
          amount: response.data.amount, // Use the amount from the API response
          currency: response.data.currency || "USD",
          transactionId: response.data.transactionId,
          myPtsAmount: qty,
        });

        // We've already overridden the amount, so no need to log discrepancy
        setCurrentStep("payment");
      } else {
        toast.error("Failed to initiate payment", {
          description: response.message || "Error setting up payment",
        });
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      toast.error("Payment setup failed", {
        description: "An unexpected error occurred",
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
      toast.success("Purchase successful", {
        description: `Your purchase of ${paymentInfo.myPtsAmount} MyPts was completed successfully! Your balance has been updated.`,
      });
    } else {
      toast.success("Purchase successful", {
        description: `Your MyPts purchase was completed successfully! Your balance has been updated.`,
      });
    }

    // Reset the form and payment state
    form.reset();
    setCurrentStep("form");
    setPaymentInfo(null);
  };

  // Handle payment cancellation
  const handlePaymentCancel = () => {
    setCurrentStep("form");
    setPaymentInfo(null);
    toast.info("Payment cancelled", {
      description: "You can try again when you're ready.",
    });
  };

  return (
    <>
      {currentStep === "payment" && paymentInfo ? (
        <StripePayment
          clientSecret={paymentInfo.clientSecret}
          amount={paymentInfo.amount}
          currency={paymentInfo.currency}
          myPtsAmount={paymentInfo.myPtsAmount}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      ) : currentStep === "invoice" && formData ? (
        <Card>
          <CardHeader>
            <CardTitle>Review Your Invoice</CardTitle>
            <CardDescription>
              Please review your invoice details before proceeding to payment.
            </CardDescription>
          </CardHeader>
          <InvoicePreview
            myPtsAmount={formData.amount}
            conversionRate={invoiceConversionRate}
            paymentMethod={formData.paymentMethod}
            onCancel={handleBackToForm}
            onProceed={proceedToPayment}
            isLoading={isSubmitting}
            actualPaymentAmount={actualPaymentAmount} // Pass the actual amount from API
          />
        </Card>
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
              <form
                onSubmit={form.handleSubmit(handleContinue)}
                className="space-y-6"
              >
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
                            placeholder="0"
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
                    type="submit"
                    className="auth-button active px-[4rem] h-12"
                    disabled={isSubmitting || !form.formState.isValid || form.watch("amount") <= 0}
                  >
                    {isSubmitting ? "Processing..." : "Continue to Payment"}
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
