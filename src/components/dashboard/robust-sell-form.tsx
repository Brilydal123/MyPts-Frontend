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
import {
  AlertCircle,
  CreditCard,
  HelpCircle,
  Info,
  Building2 as Bank,
  Wallet,
  Bitcoin,
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
  const [activeTab, setActiveTab] = useState('bank_transfer');
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
      paymentMethod: 'bank_transfer',
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
    setActiveTab(value);
    form.setValue('paymentMethod', value);
    form.setValue('accountDetails', {});
    setFormErrors([]);
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
        <CardHeader className="bg-primary  text-primary-foreground rounded-t-xl p-6">
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
                  <FormLabel className="text-base font-medium">Payment Method</FormLabel>
                  <Tabs value={activeTab} onValueChange={handlePaymentMethodChange} className="w-full">
                    <div className="mb-4">
                      <h3 className="text-base font-medium mb-2 text-gray-700 dark:text-gray-300">Select Payment Method</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Bank Transfer Option */}
                        <div
                          className={`relative cursor-pointer transition-all duration-300 ${activeTab === 'bank_transfer'
                            ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]'
                            : 'hover:scale-[1.02] hover:shadow-md'
                            }`}
                          onClick={() => handlePaymentMethodChange('bank_transfer')}
                        >
                          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 p-3 flex flex-col items-center justify-center h-full">
                            <img
                              src="/images/payment/bank-transfer.svg"
                              alt="Bank Transfer"
                              className="w-12 h-12 mb-2"
                            />
                            <span className="text-sm font-medium text-center">Bank Transfer</span>
                          </div>
                          {activeTab === 'bank_transfer' && (
                            <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-1 shadow-md">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* PayPal Option */}
                        <div
                          className={`relative cursor-pointer transition-all duration-300 ${activeTab === 'paypal'
                            ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]'
                            : 'hover:scale-[1.02] hover:shadow-md'
                            }`}
                          onClick={() => handlePaymentMethodChange('paypal')}
                        >
                          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 p-3 flex flex-col items-center justify-center h-full">
                            <img
                              src="/images/payment/paypal.svg"
                              alt="PayPal"
                              className="w-12 h-12 mb-2"
                            />
                            <span className="text-sm font-medium text-center">PayPal</span>
                          </div>
                          {activeTab === 'paypal' && (
                            <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-1 shadow-md">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Credit Card Option */}
                        <div
                          className={`relative cursor-pointer transition-all duration-300 ${activeTab === 'stripe'
                            ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]'
                            : 'hover:scale-[1.02] hover:shadow-md'
                            }`}
                          onClick={() => handlePaymentMethodChange('stripe')}
                        >
                          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 p-3 flex flex-col items-center justify-center h-full">
                            <img
                              src="/images/payment/stripe.svg"
                              alt="Credit Card"
                              className="w-12 h-12 mb-2"
                            />
                            <span className="text-sm font-medium text-center">Credit Card</span>
                          </div>
                          {activeTab === 'stripe' && (
                            <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-1 shadow-md">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Crypto Option */}
                        <div
                          className={`relative cursor-pointer transition-all duration-300 ${activeTab === 'crypto'
                            ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]'
                            : 'hover:scale-[1.02] hover:shadow-md'
                            }`}
                          onClick={() => handlePaymentMethodChange('crypto')}
                        >
                          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 p-3 flex flex-col items-center justify-center h-full">
                            <img
                              src="/images/payment/crypto.svg"
                              alt="Cryptocurrency"
                              className="w-12 h-12 mb-2"
                            />
                            <span className="text-sm font-medium text-center">Cryptocurrency</span>
                          </div>
                          {activeTab === 'crypto' && (
                            <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-1 shadow-md">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hidden TabsList for functionality */}
                    <TabsList className="hidden">
                      <TabsTrigger value="bank_transfer">Bank Transfer</TabsTrigger>
                      <TabsTrigger value="paypal">PayPal</TabsTrigger>
                      <TabsTrigger value="stripe">Card</TabsTrigger>
                      <TabsTrigger value="crypto">Crypto</TabsTrigger>
                    </TabsList>

                    {/* Bank Transfer Tab */}
                    <TabsContent value="bank_transfer" className="space-y-4 mt-4">
                      <motion.div variants={tabContentVariants} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem className="hidden">
                              <FormControl>
                                <Input {...field} value="bank_transfer" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Bank Account Details</h3>
                            <img src="/images/payment/bank-transfer.svg" alt="Bank Transfer" className="h-8" />
                          </div>

                          <FormField
                            control={form.control}
                            name="accountDetails.accountName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Holder Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="John Doe"
                                    {...field}
                                    className="rounded-lg border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="accountDetails.accountNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Number</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="123456789"
                                      {...field}
                                      className="rounded-lg border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="accountDetails.routingNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Routing Number</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="987654321"
                                      {...field}
                                      className="rounded-lg border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="accountDetails.bankName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Bank of America"
                                    {...field}
                                    className="rounded-lg border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Your banking information is secure and encrypted</span>
                          </div>
                        </div>
                      </motion.div>
                    </TabsContent>

                    {/* PayPal Tab */}
                    <TabsContent value="paypal" className="space-y-4 mt-4">
                      <motion.div variants={tabContentVariants} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem className="hidden">
                              <FormControl>
                                <Input {...field} value="paypal" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">PayPal Account</h3>
                            <img src="/images/payment/paypal.svg" alt="PayPal" className="h-8" />
                          </div>

                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                            <div className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                You'll be redirected to PayPal to complete your payment once your sell request is approved.
                              </p>
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name="accountDetails.email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">PayPal Email</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="your-email@example.com"
                                    {...field}
                                    className="rounded-lg border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                                  />
                                </FormControl>
                                <FormDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Make sure this is the email associated with your PayPal account
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Your payment information is secure and encrypted</span>
                          </div>
                        </div>
                      </motion.div>
                    </TabsContent>

                    {/* Stripe/Card Tab */}
                    <TabsContent value="stripe" className="space-y-4 mt-4">
                      <motion.div variants={tabContentVariants} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem className="hidden">
                              <FormControl>
                                <Input {...field} value="stripe" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* Card Preview */}
                        <div className="mb-6 perspective-1000">
                          <motion.div
                            initial={{ rotateY: 0 }}
                            animate={{
                              rotateY: !!(form.formState.errors.accountDetails?.cvc || form.formState.touchedFields.accountDetails?.cvc) ? 180 : 0
                            }}
                            transition={{ duration: 0.6, type: "spring", stiffness: 300, damping: 20 }}
                            className="relative w-full h-52 preserve-3d"
                          >
                            <CardPreview
                              cardNumber={form.watch('accountDetails.cardNumber') || ''}
                              cardholderName={form.watch('accountDetails.cardholderName') || ''}
                              expiryDate={form.watch('accountDetails.expiryDate') || ''}
                              cvc={form.watch('accountDetails.cvc') || ''}
                              flipped={!!(form.formState.errors.accountDetails?.cvc || form.formState.touchedFields.accountDetails?.cvc)}
                            />
                          </motion.div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Card Information</h3>
                            <div className="flex items-center space-x-2">
                              <img src="/images/payment/visa.svg" alt="Visa" className="h-6" />
                              <img src="/images/payment/mastercard.svg" alt="Mastercard" className="h-6" />
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name="accountDetails.cardholderName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Cardholder Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="John Doe"
                                    {...field}
                                    className="rounded-lg border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="accountDetails.cardNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Card Number</FormLabel>
                                <CreditCardInput
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  error={!!form.formState.errors.accountDetails?.cardNumber}
                                  className="rounded-lg border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                                />
                                <FormDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  For testing, use 4242 4242 4242 4242
                                </FormDescription>
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
                                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</FormLabel>
                                  <ExpiryDateInput
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    error={!!form.formState.errors.accountDetails?.expiryDate}
                                  />
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="accountDetails.cvc"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <div className="flex items-center">
                                      <span>CVC</span>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                                              <HelpCircle className="h-3 w-3" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-xs">3-4 digit code on the back of your card</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </FormLabel>
                                  <CVCInput
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    error={!!form.formState.errors.accountDetails?.cvc}
                                    className="rounded-lg border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                                  />
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Your payment information is secure and encrypted</span>
                          </div>
                        </div>
                      </motion.div>
                    </TabsContent>

                    {/* Crypto Tab */}
                    <TabsContent value="crypto" className="space-y-4 mt-4">
                      <motion.div variants={tabContentVariants} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem className="hidden">
                              <FormControl>
                                <Input {...field} value="crypto" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Cryptocurrency Wallet</h3>
                            <img src="/images/payment/crypto.svg" alt="Cryptocurrency" className="h-8" />
                          </div>

                          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mb-4">
                            <div className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <p className="text-sm text-amber-700 dark:text-amber-300">
                                Double-check your wallet address before submitting. Cryptocurrency transactions cannot be reversed.
                              </p>
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name="accountDetails.cryptoType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Cryptocurrency</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="rounded-lg border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200">
                                      <SelectValue placeholder="Select cryptocurrency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <div className="p-2">
                                      <SelectItem value="btc" className="flex items-center gap-2 rounded-lg p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-[#F7931A] flex items-center justify-center text-white font-bold text-xs">₿</div>
                                          <span>Bitcoin (BTC)</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="eth" className="flex items-center gap-2 rounded-lg p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-[#627EEA] flex items-center justify-center text-white font-bold text-xs">Ξ</div>
                                          <span>Ethereum (ETH)</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="usdt" className="flex items-center gap-2 rounded-lg p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-[#26A17B] flex items-center justify-center text-white font-bold text-xs">₮</div>
                                          <span>Tether (USDT)</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="usdc" className="flex items-center gap-2 rounded-lg p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-[#2775CA] flex items-center justify-center text-white font-bold text-xs">$</div>
                                          <span>USD Coin (USDC)</span>
                                        </div>
                                      </SelectItem>
                                    </div>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="accountDetails.walletAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Wallet Address</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Your cryptocurrency wallet address"
                                    {...field}
                                    className="rounded-lg border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 font-mono text-sm"
                                  />
                                </FormControl>
                                <FormDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Double-check your wallet address to avoid loss of funds
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Your wallet information is secure and encrypted</span>
                          </div>
                        </div>
                      </motion.div>
                    </TabsContent>
                  </Tabs>
                </motion.div>

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
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-lg py-6 shadow-md hover:shadow-lg transition-all duration-300"
                    disabled={isLoading || myPtsAmount <= 0}
                    onClick={(e) => {
                      if (!validatePaymentMethod()) {
                        e.preventDefault();
                        toast.error('Incomplete payment information', {
                          description: 'Please complete all required payment method fields before proceeding.',
                        });
                      }
                    }}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span> Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" /> Sell {myPtsAmount.toLocaleString()} MyPts
                      </span>
                    )}
                  </Button>
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
