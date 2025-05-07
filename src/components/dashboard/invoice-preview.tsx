import React, { useState, useEffect } from "react";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatedButton } from "@/components/ui/animated-button";
import { motion } from "framer-motion";
import Image from "next/image";

interface InvoicePreviewProps {
  myPtsAmount: number;
  conversionRate: number; // cents per MyPt
  paymentMethod: "credit" | "debit" | "paypal";
  onCancel: () => void;
  onProceed: (updatedMyPtsAmount: number, totalAmountCents: number) => void;
  isLoading?: boolean; // Optional loading state
  actualPaymentAmount?: number | null; // Optional actual amount from API
}

export function InvoicePreview({
  myPtsAmount: initialMyPtsAmount,
  conversionRate,
  paymentMethod,
  onCancel,
  onProceed,
  isLoading = false,
}: InvoicePreviewProps) {
  const [myPtsAmount, setMyPtsAmount] = useState(initialMyPtsAmount);

  // Calculate amounts
  const totalCents = myPtsAmount * conversionRate;
  const usdAmount = totalCents / 100;
  const stripeFeeCents = totalCents * 0.029;
  const totalFeeCents = stripeFeeCents; // Only include Stripe fees
  const totalChargeCents = totalCents + totalFeeCents;

  // Recalculate when amount changes
  useEffect(() => {
    console.log(
      `Invoice preview updated: ${myPtsAmount} MyPts at rate ${conversionRate} cents per MyPt`
    );
  }, [myPtsAmount, conversionRate]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.04, 0.62, 0.23, 0.98],
        height: { duration: 0.4 }
      }}
      className="overflow-hidden"
    >
      <CardContent className="space-y-6 p-4 sm:p-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-primary/5 p-4 rounded-lg border border-primary/20"
        >
          <label className="block text-sm font-medium mb-2">
            Quantity (MyPts)
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={myPtsAmount}
              min={1}
              onChange={(e) => setMyPtsAmount(Number(e.target.value))}
              className="w-full text-lg font-medium"
            />
            <span className="text-lg font-medium">MyPts</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Edit quantity if needed
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="border rounded-lg overflow-hidden shadow-sm"
        >
          <table className="w-full">
            <tbody>
              <tr className="border-b">
                <td className="p-2 sm:p-3 text-xs sm:text-sm">
                  Base Price ({myPtsAmount} MyPts)
                </td>
                <td className="p-2 sm:p-3 text-xs sm:text-sm text-right font-medium">
                  ${usdAmount.toFixed(2)}
                </td>
              </tr>
              {/* <tr className="border-b bg-muted/30">
                <td className="p-2 sm:p-3 text-xs sm:text-sm flex items-center">
                  <div className="relative h-4 w-6 mr-1.5">
                    <Image
                      src={
                        paymentMethod === "paypal"
                          ? "/images/payment/paypal.svg"
                          : paymentMethod === "debit"
                            ? "/images/payment/mastercard.svg"
                            : "/images/payment/visa.svg"
                      }
                      alt={paymentMethod}
                      fill
                      className="object-contain"
                    />
                  </div>
                  {paymentMethod === "paypal"
                    ? "PayPal Fee (2.9%)"
                    : "Stripe Fee (2.9%)"}
                </td>
                <td className="p-2 sm:p-3 text-xs sm:text-sm text-right font-medium">
                  ${(stripeFeeCents / 100).toFixed(2)}
                </td>
              </tr> */}
              <tr className="border-b bg-muted/50">
                <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium"> Fees</td>
                <td className="p-2 sm:p-3 text-xs sm:text-sm text-right font-medium">
                  ${(totalFeeCents / 100).toFixed(2)}
                </td>
              </tr>
              <tr className="bg-primary/5">
                <td className="p-2 sm:p-3 text-sm font-semibold">Total Charge</td>
                <td className="p-2 sm:p-3 text-right font-bold text-primary">
                  ${(totalChargeCents / 100).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-xs text-muted-foreground"
        >
          {/* <p>• Stripe processing fees are non-refundable</p>
          <p>• All prices are in USD</p> */}
        </motion.div>
      </CardContent>

      <CardFooter className="flex  sm:flex-row justify-between gap-3 pt-4 sm:pt-6 border-t p-4 sm:p-6">
        <motion.div
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="w-full sm:w-auto"
        >
          <AnimatedButton
            variant="outline"
            onClick={onCancel}
            className="h-12 w-full sm:w-auto"
          >
            Back
          </AnimatedButton>
        </motion.div>

        <motion.div
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="w-full sm:w-auto"
        >
          <AnimatedButton
            className="auth-button active h-12 px-4 sm:px-6 w-full"
            onClick={() => {
              console.log(`Proceeding to payment form with ${myPtsAmount} MyPts, total charge: ${totalChargeCents} cents`);
              // Just proceed to the payment form - no payment intent is created yet
              onProceed(myPtsAmount, Math.round(totalChargeCents)); // Pass the total amount in cents, rounded to integer
            }}
            disabled={myPtsAmount <= 0 || isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                Processing...
              </>
            ) : (
              "Continue to Payment Form"
            )}
          </AnimatedButton>
        </motion.div>
      </CardFooter>
    </motion.div>
  );
}
