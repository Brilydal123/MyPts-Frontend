"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface ExchangeRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  valuePerMyPt: number;
  isUsingFallbackRates: boolean;
}

export function ExchangeRateModal({
  isOpen,
  onClose,
  currency,
  valuePerMyPt,
  isUsingFallbackRates,
}: ExchangeRateModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  // Effect to detect mobile/tablet devices
  useState(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  });

  const handleCopy = () => {
    // Copy the exact value to clipboard
    navigator.clipboard.writeText(valuePerMyPt.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Shared content component to avoid duplication
  const ModalContent = () => (
    <div className="p-6">
      <div className="flex flex-col items-center justify-center space-y-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-gradient-to-br from-primary/5 to-background p-6 rounded-xl border border-primary/10 shadow-sm"
        >
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium text-primary">Complete Exchange Rate Value</h3>
            <p className="text-sm text-muted-foreground">
              {isUsingFallbackRates ? 'Using fallback rates' : 'Live rates from ExchangeRate-API'}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">1 MyPt equals</p>
              <div className="flex flex-col items-center justify-center mt-1">
                <div className="flex items-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent break-all text-center max-w-full overflow-x-auto">
                    {valuePerMyPt.toString()}
                  </div>
                  <span className="ml-2 text-xl">{currency}</span>
                </div>
                <div className="w-full overflow-x-auto mt-2 pb-2">
                  <code className="text-sm font-mono bg-muted/30 p-2 rounded block whitespace-nowrap">
                    {valuePerMyPt.toString()}
                  </code>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {formatCurrency(valuePerMyPt, currency)}
                </p>
              </div>
            </div>

            <Button
              onClick={handleCopy}
              variant="outline"
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-full"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied to clipboard!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy exact value
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <SheetContent side="bottom" className="h-[74vh] p-0 overflow-hidden border-0 shadow-2xl">
            <SheetHeader className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
              <SheetTitle className="text-xl font-bold tracking-tight">Exchange Rate Details</SheetTitle>
              <SheetDescription className="text-base mt-2 opacity-90">
                View the complete exchange rate value for MyPts
              </SheetDescription>
            </SheetHeader>
            <ModalContent />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl">
            <DialogHeader className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
              <DialogTitle className="text-xl font-bold tracking-tight">Exchange Rate Details</DialogTitle>
              <DialogDescription className="text-base mt-2 opacity-90">
                View the complete exchange rate value for MyPts
              </DialogDescription>
            </DialogHeader>
            <ModalContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default ExchangeRateModal;
