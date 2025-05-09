'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCachedExchangeRates } from '@/hooks/use-cached-exchange-rates';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CurrencySelector } from '@/components/shared/currency-selector';
import { myPtsApi } from '@/lib/api/mypts-api';
import { getCurrencySymbol } from '@/lib/currency';
import { toast } from 'sonner';
import { MyPtsBalance } from '@/types/mypts';
import { TransactionStatus } from '@/components/dashboard/transaction-status';
import { PaymentMethodSelector } from '@/components/payment/payment-method-selector';
import {
  AlertCircle,
  CreditCard,
  HelpCircle,
  Info,
  DollarSign,
  ArrowRightLeft
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CreditCardInput } from '@/components/payment/credit-card-input';
import { ExpiryDateInput } from '@/components/payment/expiry-date-input';
import { CVCInput } from '@/components/payment/cvc-input';
import { CardPreview } from '@/components/payment/card-preview';
import { motion } from 'framer-motion';

// Define schemas for each payment method
const bankTransferSchema = z.object({
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  routingNumber: z.string().min(1, 'Routing number is required'),
  bankName: z.string().min(1, 'Bank name is required'),
});

const paypalSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
});

const stripeSchema = z.object({
  cardholderName: z.string().min(1, 'Cardholder name is required'),
  cardNumber: z.string().min(1, 'Card number is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  cvc: z.string().min(1, 'CVC is required'),
});

const cryptoSchema = z.object({
  cryptoType: z.string().min(1, 'Cryptocurrency type is required'),
  walletAddress: z.string().min(1, 'Wallet address is required'),
});

// Main form schema
const formSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least 1'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  accountDetails: z.record(z.string()).optional(),
});

interface SellFormProps {
  balance: MyPtsBalance;
  onSuccess?: () => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
}

export function RobustSellForm({ balance, onSuccess, currency, onCurrencyChange }: SellFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [myPtsAmount, setMyPtsAmount] = useState(0);
  const [currencyAmount, setCurrencyAmount] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [showForm, setShowForm] = useState(true);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('stripe');
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Use cached exchange rates to ensure consistency with other components
  const {
    exchangeRates,
    isLoading: isLoadingRates,
    getValuePerMyPt
  } = useCachedExchangeRates();

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: 'stripe',
      accountDetails: {},
    },
  });

  // Update conversion rate when currency changes
  useEffect(() => {
    // Use the getValuePerMyPt function from useCachedExchangeRates
    // This ensures consistency with other components
    const newRate = getValuePerMyPt(currency);
    setConversionRate(newRate);
  }, [currency, getValuePerMyPt]);

  // Update currency amount when conversion rate changes or MyPts amount changes
  useEffect(() => {
    setCurrencyAmount(myPtsAmount * conversionRate);
  }, [myPtsAmount, conversionRate]);

  // Handle MyPts amount change
  const handleMyPtsAmountChange = (value: string) => {
    const amount = parseInt(value, 10) || 0;
    setMyPtsAmount(amount);
    form.setValue('amount', amount);
    setCurrencyAmount(amount * conversionRate);
  };

  // Handle payment method change
  const handlePaymentMethodChange = (value: string) => {
    // Only allow stripe (credit card) selection
    if (value === 'stripe') {
      setActiveTab(value);
      form.setValue('paymentMethod', value);
      form.setValue('accountDetails', {});
      setFormErrors([]);
    }
  };

  // Validate payment method details
  const validatePaymentMethod = () => {
    const accountDetails = form.getValues('accountDetails') || {};
    let errors: string[] = [];

    try {
      if (activeTab === 'bank_transfer') {
        bankTransferSchema.parse(accountDetails);
      } else if (activeTab === 'paypal') {
        paypalSchema.parse(accountDetails);
      } else if (activeTab === 'stripe') {
        stripeSchema.parse(accountDetails);
      } else if (activeTab === 'crypto') {
        cryptoSchema.parse(accountDetails);
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors = error.errors.map(err => err.message);
        setFormErrors(errors);
      }
      return false;
    }
  };

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Validate amount
    if (values.amount > balance.balance) {
      toast.error('Insufficient balance', {
        description: `You only have ${balance.balance.toLocaleString()} MyPts available.`,
      });
      return;
    }

    // Validate payment method details
    if (!validatePaymentMethod()) {
      toast.error('Incomplete payment information', {
        description: 'Please complete all required payment method fields before proceeding.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await myPtsApi.sellMyPts(
        values.amount,
        values.paymentMethod,
        values.accountDetails || {}
      );

      if (response.success && response.data) {
        setTransactionId(response.data.transaction._id);
        setShowForm(false);

        toast.success('Sell request submitted successfully!', {
          description: `Your request to sell ${values.amount.toLocaleString()} MyPts for ${getCurrencySymbol(currency)}${currencyAmount.toFixed(2)} is pending admin approval.`,
        });

        form.reset();
        setMyPtsAmount(0);
        setCurrencyAmount(0);

        if (onSuccess) {
          onSuccess();
        }
      } else {
        if (response.errors && Array.isArray(response.errors)) {
          response.errors.forEach(error => {
            if (error.path) {
              const fieldPath = error.path.split('.');
              if (fieldPath.length > 1 && fieldPath[0] === 'accountDetails') {
                form.setError(`accountDetails.${fieldPath[1]}` as any, {
                  type: 'manual',
                  message: error.message
                });
              } else {
                form.setError(fieldPath[0] as any, {
                  type: 'manual',
                  message: error.message
                });
              }
            }
          });

          toast.error('Please fix the errors in the form', {
            description: 'There are validation errors that need to be corrected.',
          });
        } else {
          toast.error('Failed to sell MyPts', {
            description: response.message || 'An error occurred',
          });
        }
      }
    } catch (error) {
      console.error('Error selling MyPts:', error);
      toast.error('Failed to sell MyPts', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setShowForm(true);
    setTransactionId(null);
    form.reset();
    setMyPtsAmount(0);
    setCurrencyAmount(0);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  // Animation for tab content
  const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full"
    >
      <Card className="w-full h-full border-0 shadow-md rounded-md from-card to-background">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-xl p-6">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            <CardTitle>Sell MyPts</CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/90 bg-primary">
            Convert your MyPts to real currency with secure payment methods
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {showForm ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Alert className="bg-blue-50 border-blue-200 shadow-sm">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">How it works</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      Your sell request will be reviewed by an admin. Once approved, you'll receive payment via your selected method within 1-3 business days.
                    </AlertDescription>
                  </Alert>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-base font-medium">Currency</FormLabel>
                    <CurrencySelector
                      value={currency}
                      onChange={onCurrencyChange}
                      className="w-[140px]"
                    />
                  </div>

                  <div className="grid gap-6 p-4 bg-muted/30 rounded-xl border border-muted">
                    <motion.div variants={itemVariants} className="grid gap-2">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field: { onChange, ...fieldProps } }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-primary" />
                              Amount in MyPts
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max={balance.balance}
                                step="1"
                                onChange={(e) => handleMyPtsAmountChange(e.target.value)}
                                placeholder="0"
                                {...fieldProps}
                                value={myPtsAmount > 0 ? myPtsAmount : ''}
                                className="text-lg font-medium"
                              />
                            </FormControl>
                            <FormDescription>
                              Available balance: <span className="font-medium">{balance.balance.toLocaleString()}</span> MyPts
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    <motion.div variants={itemVariants} className="grid gap-2">
                      <FormLabel className="text-base font-medium flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4 text-primary" />
                        Estimated Value
                      </FormLabel>
                      <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded-lg">
                        <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                          {getCurrencySymbol(currency)}{currencyAmount.toFixed(2)}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <HelpCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Conversion rate: 1 MyPt = {getCurrencySymbol(currency)}{conversionRate.toFixed(8)}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {isLoadingRates ? 'Loading rates...' : exchangeRates ? 'Using live rates from ExchangeRate-API' : 'Using fallback rates'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <FormDescription>
                        This is an estimate. Final amount may vary slightly.
                      </FormDescription>
                    </motion.div>
                  </div>
                </motion.div>

                <Separator className="my-6" />

                <motion.div variants={itemVariants} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Payment Method</FormLabel>
                        <FormControl>
                          <PaymentMethodSelector
                            value={activeTab}
                            onChange={handlePaymentMethodChange}
                            options={[
                              {
                                id: "stripe",
                                name: "Credit Card",
                                icon: "/images/payment/stripe.svg",
                                description: "Visa, Mastercard, Amex"
                              },
                              {
                                id: "bank_transfer-disabled",
                                name: "Bank Transfer",
                                icon: "/images/payment/bank-transfer.svg",
                                description: "Coming Soon",
                                disabled: true
                              },
                              {
                                id: "paypal-disabled",
                                name: "PayPal",
                                icon: "/images/payment/paypal.svg",
                                description: "Coming Soon",
                                disabled: true
                              },
                              {
                                id: "crypto-disabled",
                                name: "Cryptocurrency",
                                icon: "/images/payment/crypto.svg",
                                description: "Coming Soon",
                                disabled: true
                              }
                            ]}
                          />
                        </FormControl>
                        <FormDescription className="text-xs mt-1">
                          Currently, only credit card payments are available. More options coming soon.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Hidden TabsList for functionality */}
                  <TabsList className="hidden">
                    <TabsTrigger value="bank_transfer">Bank Transfer</TabsTrigger>
                    <TabsTrigger value="paypal">PayPal</TabsTrigger>
                    <TabsTrigger value="stripe">Credit Card</TabsTrigger>
                    <TabsTrigger value="crypto">Cryptocurrency</TabsTrigger>
                  </TabsList>

                  <Tabs value={activeTab} onValueChange={handlePaymentMethodChange} className="w-full">
                    <TabsContent value="stripe" className="mt-4">
                      <motion.div
                        variants={tabContentVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="accountDetails.cardholderName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cardholder Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="John Doe"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      form.setValue('accountDetails.cardholderName', e.target.value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="md:row-span-3">
                            {/* <CardPreview
                              cardNumber={form.watch('accountDetails.cardNumber') || ''}
                              cardholderName={form.watch('accountDetails.cardholderName') || ''}
                              expiryDate={form.watch('accountDetails.expiryDate') || ''}
                            /> */}
                          </div>

                          <FormField
                            control={form.control}
                            name="accountDetails.cardNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Card Number</FormLabel>
                                <FormControl>
                                  <CreditCardInput
                                    value={field.value || ''}
                                    onChange={(value) => {
                                      field.onChange(value);
                                      form.setValue('accountDetails.cardNumber', value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="accountDetails.expiryDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Expiry Date</FormLabel>
                                  <FormControl>
                                    <ExpiryDateInput
                                      value={field.value || ''}
                                      onChange={(value) => {
                                        field.onChange(value);
                                        form.setValue('accountDetails.expiryDate', value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="accountDetails.cvc"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CVC</FormLabel>
                                  <FormControl>
                                    <CVCInput
                                      value={field.value || ''}
                                      onChange={(value) => {
                                        field.onChange(value);
                                        form.setValue('accountDetails.cvc', value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-gray-600 dark:text-gray-400">Your card information is secure and encrypted</span>
                        </div>
                      </motion.div>
                    </TabsContent>
                  </Tabs>

                  {formErrors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert variant="destructive" className="shadow-sm">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Please fix the following errors:</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc pl-5 mt-2">
                            {formErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  <motion.div variants={itemVariants}>
                    <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800 shadow-sm">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertTitle>Important</AlertTitle>
                      <AlertDescription>
                        Your MyPts will remain in your account until your sell request is approved by an admin. You'll be notified once your payment is processed.
                      </AlertDescription>
                    </Alert>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-8 mb-4 relative z-10"
                  >
                    <Button
                      type="submit"
                      variant="default"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 h-auto shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
                      disabled={isLoading || myPtsAmount <= 0}
                      onClick={(e) => {
                        if (!validatePaymentMethod()) {
                          e.preventDefault();
                          toast.error('Incomplete payment information', {
                            description: 'Please complete all required payment method fields before proceeding.',
                          });
                        }
                      }}
                      style={{ zIndex: 10, position: 'relative' }}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin">⏳</span> Processing...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <CreditCard className="h-5 w-5" /> Sell {myPtsAmount > 0 ? myPtsAmount.toLocaleString() : '0'} MyPts
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </form>
            </Form>
          ) : (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            >
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200 shadow-sm">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CreditCard className="h-8 w-8 text-green-600" />
                </motion.div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Request Submitted!</h3>
                <p className="text-green-700 mb-4">
                  Your sell request has been submitted successfully and is awaiting admin approval.
                </p>
              </div>

              {transactionId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <TransactionStatus
                    transactionId={transactionId}
                    onRefresh={onSuccess}
                  />
                </motion.div>
              )}

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  className="w-full mt-4 py-6 text-lg border-primary text-primary hover:bg-primary/5"
                  onClick={handleReset}
                >
                  Sell More MyPts
                </Button>
              </motion.div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
