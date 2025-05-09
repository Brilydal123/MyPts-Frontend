"use client";

import { useState, useEffect } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { AnimatedButton } from "../ui/animated-button";
import { useRefreshBalance } from "@/hooks/use-mypts-data";

interface CheckoutFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// The form that collects payment details
function CheckoutForm({
  clientSecret,
  amount,
  currency,
  onSuccess,
  onCancel,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [isStripeReady, setIsStripeReady] = useState(false);
  const [isStripeLoading, setIsStripeLoading] = useState(true);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const refreshBalance = useRefreshBalance();

  // Check when Stripe is ready
  useEffect(() => {
    if (stripe && elements) {
      console.log("Stripe and elements are ready");
      setIsStripeReady(true);
      // Give a small delay to ensure the UI is fully rendered
      const timer = setTimeout(() => {
        setIsStripeLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      console.log("Waiting for Stripe to initialize...");
      setIsStripeLoading(true);
    }
  }, [stripe, elements]);

  // Add event listener to check if the form is complete
  useEffect(() => {
    if (!stripe || !elements) return;

    const paymentElement = elements.getElement("payment");
    if (!paymentElement) return;

    // Listen for changes in the payment element
    const onChange = (event: any) => {
      setIsFormComplete(event.complete);
      if (event.error) {
        setErrorMessage(event.error.message);
      } else {
        setErrorMessage(undefined);
      }
    };

    paymentElement.on("change", onChange);

    // Cleanup
    return () => {
      paymentElement.off("change", onChange);
    };
  }, [stripe, elements]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements || isStripeLoading) {
      // Stripe.js hasn't loaded yet or is still loading
      toast.error("Payment system is not ready yet", {
        description:
          "Please wait for the payment form to fully load before proceeding.",
      });
      return;
    }

    // Check if the form is complete
    if (!isFormComplete) {
      toast.error("Payment information incomplete", {
        description:
          "Please fill in all required payment information before proceeding.",
      });
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      toast.info("Processing payment", {
        description:
          "Please do not close this window while your payment is being processed.",
      });

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/buy/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("Payment error:", error);
        setErrorMessage(error.message);
        toast.error("Payment failed", {
          description:
            error.message ||
            "There was an issue processing your payment. Please try again.",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // First refresh the balance from the backend
        try {
          console.log("Payment succeeded, refreshing balance from backend...");
          await refreshBalance.mutateAsync(currency);
          console.log("Balance refreshed successfully");
        } catch (refreshError) {
          console.error("Error refreshing balance:", refreshError);
          // Continue even if refresh fails
        }

        // Then call onSuccess to update the UI
        onSuccess();

        toast.success("Payment successful", {
          description: `Your payment of ${(amount / 100).toFixed(
            2
          )} ${currency.toUpperCase()} was successful.`,
        });
      } else {
        // Payment requires additional action or is processing
        toast.info("Payment is processing", {
          description: "Your payment is being processed. Please wait...",
        });

        // Check if we need to redirect to success page
        if (
          paymentIntent &&
          (paymentIntent.status === "processing" ||
            paymentIntent.status === "requires_capture")
        ) {
          // Redirect to success page to handle the processing status
          window.location.href = `${window.location.origin}/buy/success?payment_intent=${paymentIntent.id}&redirect_status=${paymentIntent.status}`;
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      toast.error("Payment error", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      // Small delay before removing loading state to prevent UI flicker
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {isStripeLoading && (
        <div className="mb-4 p-4 bg-primary/5 rounded-lg text-sm text-center">
          <p className="font-medium">Loading payment interface...</p>
          <div className="mt-3 w-full flex justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Please wait while we prepare your payment form
          </p>
        </div>
      )}
      <div className={isStripeLoading ? "opacity-50 pointer-events-none" : ""}>
        <PaymentElement />
      </div>
      {errorMessage && <div className="text-red-500 mt-4">{errorMessage}</div>}
      <div className="flex justify-between md:px-10 px-2 space-x-5 mt-6">
        {/* <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button> */}

        <div className="max-w-[14rem]">
          <AnimatedButton
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || isStripeLoading}
            className="px-[4rem] h-12 relative"
          >
            Cancel
            {(isLoading || isStripeLoading) && (
              <span className="absolute inset-0 bg-black/5 rounded-md"></span>
            )}
          </AnimatedButton>
        </div>
        <div className="max-w-[14rem] w-full">
          <AnimatedButton
            type="submit"
            className={`auth-button ${!isStripeLoading && !isLoading && isFormComplete ? "active" : ""
              } px-[4rem] h-12 relative`}
            disabled={
              !isStripeReady || isLoading || isStripeLoading || !isFormComplete
            }
          >
            {isLoading || isStripeLoading ? (
              <span className="flex items-center justify-center">
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                {isLoading ? "Processing..." : "Preparing..."}
              </span>
            ) : (
              `Pay ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
            )}
            {(isLoading || isStripeLoading) && (
              <span className="absolute inset-0 bg-black/5 rounded-md"></span>
            )}
          </AnimatedButton>
        </div>

        {/* <Button type="submit" disabled={!stripe || isLoading}>

        </Button> */}
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

export function StripePayment({
  clientSecret,
  amount,
  currency,
  onSuccess,
  onCancel,
  myPtsAmount,
}: StripePaymentProps) {
  const [stripePromise, setStripePromise] = useState(() => getStripe());

  // Log when component mounts
  useEffect(() => {
    console.log("Stripe payment component mounted, initializing...");
  }, []);

  if (!clientSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preparing Payment</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
            <p>Loading payment information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Purchase</CardTitle>
        {myPtsAmount && (
          <div className="mt-2 text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                {myPtsAmount} MyPts
              </span>
              <span className="text-sm text-muted-foreground">
                Total charge: {(amount / 100).toFixed(2)}{" "}
                {currency.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-1 border-0">
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
