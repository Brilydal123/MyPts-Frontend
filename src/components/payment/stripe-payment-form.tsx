"use client";

import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { StripeElementsOptions } from "@stripe/stripe-js";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { AnimatedButton } from "../ui/animated-button";
import { myPtsApi } from "@/lib/api/mypts-api";

// Props for the payment form
interface StripePaymentFormProps {
  amount: number; // Amount in cents
  currency: string;
  myPtsAmount: number;
  paymentMethod: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// The inner payment form component
function PaymentForm({
  amount,
  currency,
  myPtsAmount,
  paymentMethod,
  onSuccess,
  onCancel,
}: StripePaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  // Handle form submission - this is where we create the payment intent
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe is not ready", {
        description: "Please try again in a moment",
      });
      return;
    }

    if (!isFormComplete) {
      toast.error("Please complete the payment form", {
        description: "All fields are required",
      });
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // First, submit the elements form to validate all fields
      // This MUST be called before any asynchronous work (like creating a payment intent)
      // This is required by Stripe when using automatic payment methods
      const { error: submitError } = await elements.submit();

      if (submitError) {
        console.error("Error submitting payment form:", submitError);
        setErrorMessage(submitError.message || "Please check your payment information");
        toast.error("Payment form error", {
          description: submitError.message || "Please check your payment information",
        });
        return;
      }

      // Now create the payment intent - THIS IS THE KEY CHANGE
      // We only create the payment intent after the user has entered their card details and clicked "Pay"
      console.log(`Creating payment intent for ${myPtsAmount} MyPts (${amount} cents in ${currency})`);

      const response = await myPtsApi.buyMyPts(myPtsAmount, paymentMethod);

      if (!response.success || !response.data?.clientSecret) {
        throw new Error(response.message || "Failed to create payment intent");
      }

      const clientSecret = response.data.clientSecret;

      // Show toast before processing payment
      toast.info("Processing payment", {
        description: "Please do not close this window while your payment is being processed.",
      });

      // Confirm the payment with the client secret
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/buy/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("Payment error:", error);
        setErrorMessage(error.message || "Payment failed");
        toast.error("Payment failed", {
          description: error.message || "There was an issue processing your payment. Please try again.",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Call onSuccess first to refresh the balance before showing the toast
        onSuccess();

        toast.success("Payment successful", {
          description: `Your payment of ${(amount / 100).toFixed(2)} ${currency.toUpperCase()} was successful.`,
        });
      } else {
        // Payment requires additional action or is processing
        toast.info("Payment is processing", {
          description: "Your payment is being processed. Please wait...",
        });

        // Check if we need to redirect to success page
        if (
          paymentIntent &&
          (paymentIntent.status === "processing" || paymentIntent.status === "requires_capture")
        ) {
          // Redirect to success page to handle the processing status
          window.location.href = `${window.location.origin}/buy/success?payment_intent=${paymentIntent.id}&redirect_status=${paymentIntent.status}`;
        }
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setErrorMessage(error.message || "An unexpected error occurred");
      toast.error("Payment error", {
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for changes in the payment element
  const handlePaymentElementChange = (event: any) => {
    setIsFormComplete(event.complete);
    if (event.error) {
      setErrorMessage(event.error.message);
    } else {
      setErrorMessage(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Purchase</CardTitle>
        <CardDescription>
          Enter your payment details to purchase {myPtsAmount} MyPts
        </CardDescription>
        <div className="mt-2 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
              {myPtsAmount} MyPts
            </span>
            <span className="text-sm text-muted-foreground">
              Total charge: {(amount / 100).toFixed(2)} {currency.toUpperCase()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <PaymentElement onChange={handlePaymentElementChange} />
          </div>

          {errorMessage && (
            <div className="text-red-500 mb-4 text-sm">{errorMessage}</div>
          )}

          <div className="flex justify-between space-x-4">
            <AnimatedButton
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full"
            >
              Cancel
            </AnimatedButton>

            <AnimatedButton
              type="submit"
              className={`auth-button ${isFormComplete && !isLoading ? "active" : ""} w-full`}
              disabled={!stripe || !elements || !isFormComplete || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                  Processing...
                </>
              ) : (
                `Pay ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
              )}
            </AnimatedButton>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Payments are processed securely by Stripe.
        </p>
      </CardFooter>
    </Card>
  );
}

// Wrapper component that loads Stripe Elements
export function StripePaymentForm(props: StripePaymentFormProps) {
  const [stripePromise] = useState(() => getStripe());

  // Configure Stripe Elements with the correct options
  // Make sure it's compatible with automatic_payment_methods on the backend
  const options: StripeElementsOptions = {
    mode: "payment" as const,
    currency: props.currency.toLowerCase(),
    amount: props.amount,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0A2540',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Manrope, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    }
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  );
}
