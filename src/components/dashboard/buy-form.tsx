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
import { StripePayment } from "../payment/stripe-payment";
import { AnimatedButton } from "../ui/animated-button";
// No longer need dialog for invoice
import { InvoicePreview } from "./invoice-preview";
import { DEFAULT_MYPTS_VALUE } from "@/lib/constants";
import { PaymentMethodSelector } from "../payment/payment-method-selector";

// Define form validation schema
const formSchema = z.object({
  amount: z.coerce.number().positive({
    message: "Amount must be greater than 0",
  }),
  paymentMethod: z.enum(["credit", "debit"], {
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
    amount: number; // Amount in cents, confirmed for Stripe payment
    currency: string;
    stripePaymentIntentId: string; // ID from Stripe, not our local transaction ID
    myPtsAmount?: number; // The quantity of MyPts this payment is for
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
    if (!calculatedAmountCents || calculatedAmountCents <= 0) {
      toast.error("Invalid amount", {
        description: "The calculated amount for payment is invalid.",
      });
      return;
    }
    setIsSubmitting(true);
    setActualPaymentAmount(null); // Reset actual payment amount before new attempt

    try {
      console.log(
        `Preparing Stripe payment for ${qty} MyPts, calculated amount: ${calculatedAmountCents} cents`
      );

      // NEW: Call an API that only creates Stripe Payment Intent and returns clientSecret
      // Assumes myPtsApi.prepareStripePaymentIntent(myPtsQuantity, totalAmountCents, paymentMethod)
      // The backend should use `calculatedAmountCents` as the authoritative amount for the Stripe intent.
      const intentResponse = await myPtsApi.prepareStripePaymentIntent(
        qty,
        calculatedAmountCents,
        formData.paymentMethod
      );

      if (
        intentResponse.success &&
        intentResponse.data?.clientSecret &&
        intentResponse.data?.stripePaymentIntentId &&
        intentResponse.data?.amount // Amount confirmed by backend for Stripe
      ) {
        console.log(
          "Stripe Payment Intent created successfully.",
          "Client Secret and Stripe Payment Intent ID received.",
          "Amount for Stripe: ", intentResponse.data.amount
        );

        setPaymentInfo({
          clientSecret: intentResponse.data.clientSecret,
          amount: intentResponse.data.amount, // Use amount confirmed by backend for Stripe
          currency: intentResponse.data.currency || "USD",
          stripePaymentIntentId: intentResponse.data.stripePaymentIntentId,
          myPtsAmount: qty,
        });
        setActualPaymentAmount(intentResponse.data.amount / 100); // For display/confirmation
        setCurrentStep("payment");
      } else {
        toast.error("Failed to prepare payment", {
          description:
            intentResponse.message || "Could not set up payment with Stripe.",
        });
      }
    } catch (error) {
      console.error("Error preparing Stripe payment:", error);
      toast.error("Payment preparation failed", {
        description: "An unexpected error occurred while setting up payment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle successful payment (called by StripePayment component)
  const handlePaymentSuccess = async () => {
    if (!paymentInfo || !paymentInfo.stripePaymentIntentId || !paymentInfo.myPtsAmount) {
      toast.error("Critical: Payment confirmation error", {
        description: "Missing payment information to finalize your purchase. Please contact support.",
        duration: 10000,
      });
      // Reset to avoid inconsistent state, guide user
      setCurrentStep("form");
      setPaymentInfo(null);
      form.reset();
      return;
    }

    console.log(
      `Stripe payment successful for intent ID: ${paymentInfo.stripePaymentIntentId}. Finalizing purchase.`
    );
    setIsSubmitting(true); // Indicate finalization processing

    try {
      // NEW: Call backend API to finalize purchase, create local transaction, and update balance
      // Assumes myPtsApi.finalizeMyPtsPurchase(stripePaymentIntentId, myPtsQuantity, amountPaidCents)
      const finalizeResponse = await myPtsApi.finalizeMyPtsPurchase(
        paymentInfo.stripePaymentIntentId,
        paymentInfo.myPtsAmount,
        paymentInfo.amount // This is the amount (in cents) that Stripe processed
      );

      if (finalizeResponse.success) {
        toast.success("Purchase successful!", {
          description: `Your purchase of ${paymentInfo.myPtsAmount} MyPts is complete. Your balance has been updated.`,
        });

        // Call onSuccess callback (e.g., to refresh user balance display)
        if (onSuccess) {
          await onSuccess();
        }
      } else {
        // CRITICAL: Stripe payment succeeded, but backend finalization failed.
        // This requires careful handling. The user has paid.
        toast.error("Purchase Confirmation Issue", {
          description:
            finalizeResponse.message ||
            "Your payment was successful, but there was an issue confirming your purchase. Please contact support with your payment details.",
          duration: 15000, // Longer duration for critical user guidance
        });
        console.error(
          "Failed to finalize MyPts purchase after successful Stripe payment:",
          { paymentInfo, error: finalizeResponse.message }
        );
        // Do NOT reset form here if finalization failed but payment went through.
        // The user might need the info, or we might retry.
        // For now, we will clear paymentInfo to prevent re-submission of this specific payment.
      }
    } catch (error) {
      console.error("Error finalizing MyPts purchase:", error);
      toast.error("Purchase Confirmation Error", {
        description:
          "An unexpected error occurred while confirming your purchase. Please contact support.",
        duration: 15000,
      });
    } finally {
      // Reset form and payment state after attempting finalization
      form.reset();
      setCurrentStep("form");
      setPaymentInfo(null);
      setIsSubmitting(false); // Reset submitting state
    }
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
                      <FormControl>
                        <PaymentMethodSelector
                          value={field.value}
                          onChange={field.onChange}
                          options={[
                            {
                              id: "credit",
                              name: "Credit Card",
                              icon: "/images/payment/visa.svg",
                              description: "Visa, Mastercard, Amex"
                            },
                            {
                              id: "debit",
                              name: "Debit Card",
                              icon: "/images/payment/mastercard.svg",
                              description: "Direct from your bank"
                            },
                            {
                              id: "paypal-disabled",
                              name: "PayPal",
                              icon: "/images/payment/paypal.svg",
                              description: "Coming Soon"
                            }
                          ]}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] mt-1">
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
                    disabled={
                      isSubmitting ||
                      !form.formState.isValid ||
                      form.watch("amount") <= 0
                    }
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
