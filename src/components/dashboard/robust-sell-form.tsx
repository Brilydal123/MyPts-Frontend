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
import { Textarea } from '@/components/ui/textarea';
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
  HelpCircle,
  Info,
  DollarSign,
  ArrowRightLeft
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { motion } from 'framer-motion';

// Define schemas for each payment method
const bankTransferSchema = z.object({
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  routingNumber: z.string().min(1, 'Routing number is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  country: z.string().min(1, 'Country is required'),
  accountType: z.enum(['checking', 'savings']).default('checking'),
  swiftCode: z.string().optional(),
});

const paypalSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
});

const cryptoSchema = z.object({
  cryptoType: z.string().min(1, 'Cryptocurrency type is required'),
  walletAddress: z.string().min(1, 'Wallet address is required'),
});

const mobileMoneySchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  mobileNumber: z.string().min(1, 'Mobile number is required'),
  accountName: z.string().min(1, 'Account name is required'),
  country: z.string().min(1, 'Country is required'),
  transactionId: z.string().optional(),
  proofOfPayment: z.any().optional(), // For file upload
});

const pakistaniLocalSchema = z.object({
  methodType: z.string().min(1, 'Method type is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  accountName: z.string().min(1, 'Account name is required'),
  additionalDetails: z.string().optional(),
  transactionId: z.string().optional(),
  proofOfPayment: z.any().optional(), // For file upload
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
      accountDetails: {
        accountType: 'checking'
      },
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
    // Allow bank_transfer, mobile_money, and pakistani_local selection
    if (['bank_transfer', 'mobile_money', 'pakistani_local'].includes(value)) {
      setActiveTab(value);
      form.setValue('paymentMethod', value);

      // Set default values based on payment method
      if (value === 'bank_transfer') {
        form.setValue('accountDetails', {
          accountType: 'checking'
        });
      } else if (value === 'mobile_money') {
        form.setValue('accountDetails', {
          provider: 'mtn',
          country: 'NG' // Default to Nigeria
        });
      } else if (value === 'pakistani_local') {
        form.setValue('accountDetails', {
          methodType: 'easypaisa'
        });
      } else {
        form.setValue('accountDetails', {});
      }

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
      } else if (activeTab === 'crypto') {
        cryptoSchema.parse(accountDetails);
      } else if (activeTab === 'mobile_money') {
        mobileMoneySchema.parse(accountDetails);
      } else if (activeTab === 'pakistani_local') {
        pakistaniLocalSchema.parse(accountDetails);
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
      className="w-full"
    >
      <Card className="w-full border-0 shadow-md rounded-md from-card to-background p-0">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-xl p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <CardTitle className="text-base sm:text-lg md:text-xl">Sell MyPts</CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/90 bg-primary text-xs sm:text-sm">
            Convert your MyPts to real currency with secure payment methods
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 md:p-4 lg:p-6">
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <FormLabel className="text-base font-medium">Currency</FormLabel>
                    <CurrencySelector
                      value={currency}
                      onChange={onCurrencyChange}
                      className="w-full sm:w-[140px]"
                    />
                  </div>

                  <div className="grid gap-4 sm:gap-6 p-3 sm:p-4 bg-muted/30 rounded-xl border border-muted">
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

                <motion.div variants={itemVariants} className="space-y-4 w-full">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Payment Method</FormLabel>
                        <FormControl>
                          <div className="w-full overflow-x-auto pb-2">
                            <div className="min-w-[300px]">
                              <PaymentMethodSelector
                                value={activeTab}
                                onChange={handlePaymentMethodChange}
                                options={[
                                  {
                                    id: "bank_transfer",
                                    name: "Bank Transfer",
                                    icon: "/images/payment/bank-transfer.svg",
                                    description: "Direct to your bank",
                                    disabled: false
                                  },
                                  {
                                    id: "mobile_money",
                                    name: "Mobile Money",
                                    icon: "/images/payment-methods/mtn-mobile-money.png",
                                    description: "MTN Mobile Money",
                                    disabled: false
                                  },
                                  {
                                    id: "pakistani_local",
                                    name: "Pakistani Methods",
                                    icon: "/images/payment-methods/pakistani-local.png",
                                    description: "EasyPaisa & JazzCash",
                                    disabled: false
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
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs mt-1">
                          Bank transfer, Mobile Money, and Pakistani local payment methods are available.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Tabs value={activeTab} onValueChange={handlePaymentMethodChange} className="w-full">
                    {/* Hidden TabsList for functionality */}
                    <TabsList className="hidden">
                      <TabsTrigger value="bank_transfer">Bank Transfer</TabsTrigger>
                      <TabsTrigger value="mobile_money">Mobile Money</TabsTrigger>
                      <TabsTrigger value="pakistani_local">Pakistani Methods</TabsTrigger>
                      <TabsTrigger value="paypal">PayPal</TabsTrigger>
                      <TabsTrigger value="crypto">Cryptocurrency</TabsTrigger>
                    </TabsList>


                    <TabsContent value="mobile_money" className="mt-4">
                      <motion.div
                        variants={tabContentVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                      >
                        <Alert className="bg-blue-50 border-blue-200 shadow-sm">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertTitle className="text-blue-800">Mobile Money Information</AlertTitle>
                          <AlertDescription className="text-blue-700">
                            Please provide your mobile money details for receiving payment. Your request will be processed manually by our team.
                          </AlertDescription>
                        </Alert>

                        <FormField
                          control={form.control}
                          name="accountDetails.provider"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile Money Provider</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value || "mtn"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select provider" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="mtn">
                                    <div className="flex items-center gap-2">
                                      <img src="/images/payment-methods/mtn.png" alt="MTN" className="h-4 w-4 object-contain" />
                                      MTN Mobile Money
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="airtel">
                                    <div className="flex items-center gap-2">
                                      <img src="/images/payment-methods/airtel.png" alt="Airtel" className="h-4 w-4 object-contain" />
                                      Airtel Money
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="orange">
                                    <div className="flex items-center gap-2">
                                      <img src="/images/payment-methods/orange-money.png" alt="Orange" className="h-4 w-4 object-contain" />
                                      Orange Money
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="other">Other (specify in notes)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="accountDetails.mobileNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your mobile money number" {...field} />
                              </FormControl>
                              <FormDescription>
                                Include country code (e.g., +234 for Nigeria)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="accountDetails.accountName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Name on your mobile money account" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="accountDetails.country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value || "NG"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="NG">Nigeria</SelectItem>
                                  <SelectItem value="GH">Ghana</SelectItem>
                                  <SelectItem value="KE">Kenya</SelectItem>
                                  <SelectItem value="UG">Uganda</SelectItem>
                                  <SelectItem value="ZA">South Africa</SelectItem>
                                  <SelectItem value="RW">Rwanda</SelectItem>
                                  <SelectItem value="TZ">Tanzania</SelectItem>
                                  <SelectItem value="CM">Cameroon</SelectItem>
                                  <SelectItem value="CI">Côte d'Ivoire</SelectItem>
                                  <SelectItem value="SN">Senegal</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="accountDetails.additionalNotes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Any additional information we should know"
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-gray-600 dark:text-gray-400">Your mobile money information is secure and encrypted</span>
                        </div>
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="pakistani_local" className="mt-4">
                      <motion.div
                        variants={tabContentVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                      >
                        <Alert className="bg-blue-50 border-blue-200 shadow-sm">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertTitle className="text-blue-800">Pakistani Payment Methods</AlertTitle>
                          <AlertDescription className="text-blue-700">
                            Please provide your payment details for receiving money through Pakistani local payment methods. Your request will be processed manually by our team.
                          </AlertDescription>
                        </Alert>

                        <FormField
                          control={form.control}
                          name="accountDetails.methodType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Method</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value || "easypaisa"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select payment method" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="easypaisa">
                                    <div className="flex items-center gap-2">
                                      <img src="/images/payment-methods/easypaisa.png" alt="EasyPaisa" className="h-4 w-4 object-contain" />
                                      EasyPaisa
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="jazzcash">
                                    <div className="flex items-center gap-2">
                                      <img src="/images/payment-methods/jazzcash.png" alt="JazzCash" className="h-4 w-4 object-contain" />
                                      JazzCash
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="ubl">UBL</SelectItem>
                                  <SelectItem value="hbl">HBL</SelectItem>
                                  <SelectItem value="meezan">Meezan Bank</SelectItem>
                                  <SelectItem value="other">Other (specify in notes)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="accountDetails.accountNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Number / IBAN</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your account number or IBAN" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="accountDetails.accountName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Name on your account" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="accountDetails.additionalDetails"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Details (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Any additional information we should know"
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-gray-600 dark:text-gray-400">Your payment information is secure and encrypted</span>
                        </div>
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="bank_transfer" className="mt-4">
                      <motion.div
                        variants={tabContentVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                      >
                        <Alert className="bg-blue-50 border-blue-200 shadow-sm">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertTitle className="text-blue-800">Bank Transfer Information</AlertTitle>
                          <AlertDescription className="text-blue-700">
                            Please provide your bank account details for receiving payment. All information is encrypted and secure.
                          </AlertDescription>
                        </Alert>

                        <FormField
                          control={form.control}
                          name="accountDetails.accountName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Holder Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Full name on account" {...field} />
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
                                <FormLabel>Account Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Account number" {...field} />
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
                                <FormLabel>Routing Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="ACH routing number" {...field} />
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
                              <FormLabel>Bank Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Bank name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="accountDetails.country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="US">United States</SelectItem>
                                    <SelectItem value="CA">Canada</SelectItem>
                                    <SelectItem value="GB">United Kingdom</SelectItem>
                                    <SelectItem value="AU">Australia</SelectItem>
                                    <SelectItem value="FR">France</SelectItem>
                                    <SelectItem value="DE">Germany</SelectItem>
                                    <SelectItem value="JP">Japan</SelectItem>
                                    <SelectItem value="SG">Singapore</SelectItem>
                                    <SelectItem value="HK">Hong Kong</SelectItem>
                                    <SelectItem value="CN">China</SelectItem>
                                    <SelectItem value="IN">India</SelectItem>
                                    <SelectItem value="BR">Brazil</SelectItem>
                                    <SelectItem value="MX">Mexico</SelectItem>
                                    <SelectItem value="ZA">South Africa</SelectItem>
                                    <SelectItem value="NG">Nigeria</SelectItem>
                                    <SelectItem value="KE">Kenya</SelectItem>
                                    <SelectItem value="GH">Ghana</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="accountDetails.swiftCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SWIFT/BIC Code (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="For international transfers" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="accountDetails.accountType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value || "checking"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select account type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="checking">Checking</SelectItem>
                                  <SelectItem value="savings">Savings</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-gray-600 dark:text-gray-400">Your bank account information is secure and encrypted</span>
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
                    className="mt-6 sm:mt-8 mb-2 sm:mb-4 relative z-10"
                  >
                    <Button
                      type="submit"
                      variant="default"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base sm:text-lg py-4 sm:py-6 h-auto shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
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
                          <ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5" /> Sell {myPtsAmount > 0 ? myPtsAmount.toLocaleString() : '0'} MyPts
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </form>
            </Form>
          ) : (
            <motion.div
              className="space-y-4 sm:space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            >
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-xl border border-green-200 shadow-sm">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                >
                  <ArrowRightLeft className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </motion.div>
                <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-1 sm:mb-2">Request Submitted!</h3>
                <p className="text-sm sm:text-base text-green-700 mb-2 sm:mb-4">
                  Your sell request has been submitted successfully and is awaiting admin approval.
                </p>
              </div>

              {transactionId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="w-full"
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
                className="w-full"
              >
                <Button
                  variant="outline"
                  className="w-full mt-2 sm:mt-4 py-4 sm:py-6 text-base sm:text-lg border-primary text-primary hover:bg-primary/5"
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
