import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Printer, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RewardInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: {
    id: string;
    name: string;
    type?: string;
    category?: string;
    balanceBefore: number;
    balanceAfter: number;
  };
  hubData: {
    reserveSupplyBefore: number;
    reserveSupplyAfter: number;
    circulatingSupplyBefore: number;
    circulatingSupplyAfter: number;
  };
  transactionData: {
    id: string;
    amount: number;
    reason: string;
    timestamp: Date;
    admin?: {
      name?: string;
      email?: string;
    };
  };
}

export function RewardInvoice({
  isOpen,
  onClose,
  profileData,
  hubData,
  transactionData,
}: RewardInvoiceProps) {
  // Format currency values
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  // Handle print functionality
  const handlePrint = () => {
    window.print();
  };

  // Handle download as PDF
  const handleDownload = () => {
    // This would typically use a library like jsPDF or html2canvas
    // For now, we'll just trigger print which allows saving as PDF
    window.print();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl print:shadow-none"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <Card className="border-0 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2 print:pb-4">
                <div>
                  <CardTitle className="text-xl font-bold print:text-2xl">MyPts Award Invoice</CardTitle>
                  <p className="text-sm text-muted-foreground print:text-base">
                    Transaction ID: {transactionData.id}
                  </p>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrint}
                    title="Print Invoice"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDownload}
                    title="Download as PDF"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onClose}
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-2">
                {/* Transaction Details */}
                <div className="rounded-lg border p-4 bg-muted/20">
                  <h3 className="font-semibold mb-2 text-sm">Transaction Details</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="text-muted-foreground">Date & Time:</div>
                    <div>{formatDate(transactionData.timestamp)}</div>
                    
                    <div className="text-muted-foreground">Amount:</div>
                    <div className="font-medium">{formatNumber(transactionData.amount)} MyPts</div>
                    
                    <div className="text-muted-foreground">Reason:</div>
                    <div>{transactionData.reason}</div>
                    
                    {transactionData.admin?.name && (
                      <>
                        <div className="text-muted-foreground">Awarded By:</div>
                        <div>{transactionData.admin.name}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Profile Information */}
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2 text-sm">Profile Information</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="text-muted-foreground">Profile Name:</div>
                    <div className="font-medium">{profileData.name}</div>
                    
                    <div className="text-muted-foreground">Profile ID:</div>
                    <div className="text-xs font-mono">{profileData.id}</div>
                    
                    {profileData.type && (
                      <>
                        <div className="text-muted-foreground">Type:</div>
                        <div>{profileData.type}</div>
                      </>
                    )}
                    
                    {profileData.category && (
                      <>
                        <div className="text-muted-foreground">Category:</div>
                        <div>{profileData.category}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Balance Changes */}
                <div className="rounded-lg border p-4 bg-primary/5">
                  <h3 className="font-semibold mb-3 text-sm">Balance Changes</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Profile Balance</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Before:</span>
                        <span className="font-medium">{formatNumber(profileData.balanceBefore)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">After:</span>
                        <span className="font-medium">{formatNumber(profileData.balanceAfter)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="text-xs font-medium">Change:</span>
                        <span className="font-semibold text-green-600">
                          +{formatNumber(profileData.balanceAfter - profileData.balanceBefore)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Reserve Supply</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Before:</span>
                        <span className="font-medium">{formatNumber(hubData.reserveSupplyBefore)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">After:</span>
                        <span className="font-medium">{formatNumber(hubData.reserveSupplyAfter)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="text-xs font-medium">Change:</span>
                        <span className="font-semibold text-red-600">
                          {formatNumber(hubData.reserveSupplyAfter - hubData.reserveSupplyBefore)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Circulating Supply</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Before:</span>
                        <span className="font-medium">{formatNumber(hubData.circulatingSupplyBefore)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">After:</span>
                        <span className="font-medium">{formatNumber(hubData.circulatingSupplyAfter)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="text-xs font-medium">Change:</span>
                        <span className="font-semibold text-green-600">
                          +{formatNumber(hubData.circulatingSupplyAfter - hubData.circulatingSupplyBefore)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legal Footer */}
                <div className="text-xs text-muted-foreground pt-4 border-t">
                  <p>This is an official record of MyPts awarded to the profile by an administrator.</p>
                  <p>Generated on {new Date().toLocaleString()}</p>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end pt-4 print:hidden">
                <Button
                  variant="default"
                  onClick={onClose}
                  className="bg-black hover:bg-slate-700 text-white"
                >
                  Close Invoice
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
