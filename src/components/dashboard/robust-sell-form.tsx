'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { AlertCircle, CreditCard, HelpCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CreditCardInput } from '@/components/payment/credit-card-input';
import { ExpiryDateInput } from '@/components/payment/expiry-date-input';
import { CVCInput } from '@/components/payment/cvc-input';
import { CardPreview } from '@/components/payment/card-preview';

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
    if (balance?.value) {
      setConversionRate(balance.value.valuePerMyPt);
    }
  }, [balance, currency]);

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sell MyPts</CardTitle>
        <CardDescription>Convert your MyPts to real currency</CardDescription>
      </CardHeader>
      <CardContent>
        {showForm ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">How it works</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Your sell request will be reviewed by an admin. Once approved, you'll receive payment via your selected method within 1-3 business days.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Currency</FormLabel>
                  <CurrencySelector
                    value={currency}
                    onChange={onCurrencyChange}
                    className="w-[140px]"
                  />
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field: { onChange, ...fieldProps } }) => (
                        <FormItem>
                          <FormLabel>Amount in MyPts</FormLabel>
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
                            />
                          </FormControl>
                          <FormDescription>
                            Available balance: {balance.balance.toLocaleString()} MyPts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-2">
                    <FormLabel>Estimated Value</FormLabel>
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl font-bold">
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
                            <p>Conversion rate: 1 MyPt = {getCurrencySymbol(currency)}{conversionRate.toFixed(4)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormDescription>
                      This is an estimate. Final amount may vary slightly.
                    </FormDescription>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <FormLabel>Payment Method</FormLabel>
                <Tabs value={activeTab} onValueChange={handlePaymentMethodChange} className="w-full">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="bank_transfer">Bank Transfer</TabsTrigger>
                    <TabsTrigger value="paypal">PayPal</TabsTrigger>
                    <TabsTrigger value="stripe">Card</TabsTrigger>
                    <TabsTrigger value="crypto">Crypto</TabsTrigger>
                  </TabsList>

                  {/* Bank Transfer Tab */}
                  <TabsContent value="bank_transfer" className="space-y-4 mt-4">
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

                    <FormField
                      control={form.control}
                      name="accountDetails.accountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Holder Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="accountDetails.accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input placeholder="123456789" {...field} />
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
                              <Input placeholder="987654321" {...field} />
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
                            <Input placeholder="Bank of America" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  {/* PayPal Tab */}
                  <TabsContent value="paypal" className="space-y-4 mt-4">
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

                    <FormField
                      control={form.control}
                      name="accountDetails.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PayPal Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your-email@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Make sure this is the email associated with your PayPal account
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  {/* Stripe/Card Tab */}
                  <TabsContent value="stripe" className="space-y-4 mt-4">
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
                    <div className="mb-6">
                      <CardPreview
                        cardNumber={form.watch('accountDetails.cardNumber') || ''}
                        cardholderName={form.watch('accountDetails.cardholderName') || ''}
                        expiryDate={form.watch('accountDetails.expiryDate') || ''}
                        cvc={form.watch('accountDetails.cvc') || ''}
                        flipped={!!(form.formState.errors.accountDetails?.cvc || form.formState.touchedFields.accountDetails?.cvc)}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="accountDetails.cardholderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cardholder Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
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
                          <FormLabel>Card Number</FormLabel>
                          <CreditCardInput
                            value={field.value || ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            error={!!form.formState.errors.accountDetails?.cardNumber}
                          />
                          <FormDescription>
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
                            <FormLabel>Expiry Date</FormLabel>
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
                            <FormLabel>CVC</FormLabel>
                            <CVCInput
                              value={field.value || ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              error={!!form.formState.errors.accountDetails?.cvc}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* Crypto Tab */}
                  <TabsContent value="crypto" className="space-y-4 mt-4">
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

                    <FormField
                      control={form.control}
                      name="accountDetails.cryptoType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cryptocurrency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select cryptocurrency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
                              <SelectItem value="eth">Ethereum (ETH)</SelectItem>
                              <SelectItem value="usdt">Tether (USDT)</SelectItem>
                              <SelectItem value="usdc">USD Coin (USDC)</SelectItem>
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
                          <FormLabel>Wallet Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your cryptocurrency wallet address"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Double-check your wallet address to avoid loss of funds
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              {formErrors.length > 0 && (
                <Alert variant="destructive">
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
              )}

              <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Your MyPts will remain in your account until your sell request is approved by an admin. You'll be notified once your payment is processed.
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                className="w-full"
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
                    <CreditCard className="h-4 w-4" /> Sell {myPtsAmount.toLocaleString()} MyPts
                  </span>
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            {transactionId && (
              <TransactionStatus
                transactionId={transactionId}
                onRefresh={onSuccess}
              />
            )}
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={handleReset}
            >
              Sell More MyPts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
