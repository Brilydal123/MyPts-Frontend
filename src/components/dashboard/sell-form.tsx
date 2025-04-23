import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CurrencySelector, getCurrencySymbol } from '@/components/shared/currency-selector';
import { myPtsApi, myPtsValueApi } from '@/lib/api/mypts-api';
import { toast } from 'sonner';
import { MyPtsBalance } from '@/types/mypts';

const formSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least 1'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  accountDetails: z.record(z.string()).superRefine((data, ctx) => {
    // Different validation based on payment method
    const paymentMethod = ctx.path[0] === 'accountDetails' ?
      ctx.path[2]?.toString() : undefined;

    if (paymentMethod === 'bank_transfer') {
      // For bank transfer, require account name, number, and bank name
      if (!data.accountName || data.accountName.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Account name is required',
          path: ['accountName']
        });
      }
      if (!data.accountNumber || data.accountNumber.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Account number is required',
          path: ['accountNumber']
        });
      }
      if (!data.bankName || data.bankName.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Bank name is required',
          path: ['bankName']
        });
      }
      // Swift code is optional
    } else if (paymentMethod === 'paypal') {
      // For PayPal, only require email
      if (!data.email || data.email.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'PayPal email is required',
          path: ['email']
        });
      }
    } else if (paymentMethod === 'crypto') {
      // For crypto, require crypto type and wallet address
      if (!data.cryptoType || data.cryptoType.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cryptocurrency type is required',
          path: ['cryptoType']
        });
      }
      if (!data.walletAddress || data.walletAddress.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Wallet address is required',
          path: ['walletAddress']
        });
      }
    }
  }),
});

interface SellFormProps {
  balance: MyPtsBalance;
  onSuccess?: () => void;
}

export function SellForm({ balance, onSuccess }: SellFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [myPtsAmount, setMyPtsAmount] = useState(0);
  const [currencyAmount, setCurrencyAmount] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: 'bank_transfer',
      accountDetails: {},
    },
  });

  const amount = form.watch('amount');

  useEffect(() => {
    const fetchConversionRate = async () => {
      try {
        const response = await myPtsValueApi.getCurrentValue();
        if (response.success && response.data) {
          const value:any = response.data;
          let rate = value.baseValue; // Default USD rate

          // Find the exchange rate for the selected currency
          if (currency !== 'USD') {
            const exchangeRate = value.exchangeRates.find((er: { currency: string; }) => er.currency === currency);
            if (exchangeRate) {
              rate = value.baseValue * exchangeRate.rate;
            }
          }

          setConversionRate(rate);
        }
      } catch (error) {
        console.error('Error fetching conversion rate:', error);
      }
    };

    fetchConversionRate();
  }, [currency]);

  useEffect(() => {
    if (amount > 0 && conversionRate > 0) {
      setCurrencyAmount(amount * conversionRate);
    } else {
      setCurrencyAmount(0);
    }
  }, [amount, conversionRate]);

  const handleCurrencyAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && conversionRate > 0) {
      const pts = numValue / conversionRate;
      setMyPtsAmount(pts);
      form.setValue('amount', Math.round(pts));
    } else {
      setMyPtsAmount(0);
      form.setValue('amount', 0);
    }
  };

  const handleMyPtsAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setMyPtsAmount(numValue);
      form.setValue('amount', numValue);
    } else {
      setMyPtsAmount(0);
      form.setValue('amount', 0);
    }
  };

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value);
    form.setValue('paymentMethod', value);

    // Reset account details when payment method changes
    form.setValue('accountDetails', {});

    // Log the payment method change for debugging
    console.log('Payment method changed to:', value);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('Form submission values:', values);

    if (values.amount > balance.balance) {
      toast.error('Insufficient balance', {
        description: `You only have ${balance.balance.toLocaleString()} MyPts available.`,
      });
      return;
    }

    // Validate account details based on payment method
    let isValid = true;
    const details = values.accountDetails;

    if (values.paymentMethod === 'bank_transfer') {
      if (!details.accountName || !details.accountNumber || !details.bankName) {
        toast.error('Missing bank details', {
          description: 'Please provide all required bank account details',
        });
        isValid = false;
      }
    } else if (values.paymentMethod === 'paypal') {
      if (!details.email) {
        toast.error('Missing PayPal email', {
          description: 'Please provide your PayPal email address',
        });
        isValid = false;
      }
    } else if (values.paymentMethod === 'crypto') {
      if (!details.cryptoType || !details.walletAddress) {
        toast.error('Missing crypto details', {
          description: 'Please provide cryptocurrency type and wallet address',
        });
        isValid = false;
      }
    }

    if (!isValid) return;

    setIsLoading(true);
    try {
      console.log('Sending sell request with:', {
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        accountDetails: values.accountDetails,
        currency
      });

      const response = await myPtsApi.sellMyPts(values.amount, values.paymentMethod, values.accountDetails);
      console.log('Sell response:', response);

      if (response.success && response.data) {
        toast.success('Successfully sold MyPts!', {
          description: `You sold ${values.amount.toLocaleString()} MyPts for ${getCurrencySymbol(currency)}${currencyAmount.toFixed(2)}.`,
        });
        form.reset();
        setMyPtsAmount(0);
        setCurrencyAmount(0);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error('Failed to sell MyPts', {
          description: response.message || 'An error occurred',
        });
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

  const renderAccountDetailsFields = () => {
    switch (paymentMethod) {
      case 'bank_transfer':
        return (
          <>
            <FormField
              control={form.control}
              name="accountDetails.accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Account holder name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="accountDetails.swiftCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SWIFT/BIC Code (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="SWIFT or BIC code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 'paypal':
        return (
          <>
            <FormField
              control={form.control}
              name="accountDetails.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PayPal Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="PayPal email address"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Set the required bankName and accountNumber fields for server validation
                        form.setValue('accountDetails.bankName', 'PayPal');
                        form.setValue('accountDetails.accountNumber', e.target.value);
                        console.log('PayPal email changed:', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the email address associated with your PayPal account
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 'crypto':
        return (
          <>
            <FormField
              control={form.control}
              name="accountDetails.cryptoType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cryptocurrency</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Set the required bankName field for server validation
                      form.setValue('accountDetails.bankName', `Crypto-${value.toUpperCase()}`);
                    }}
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
                      placeholder="Cryptocurrency wallet address"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Set the required accountNumber field for server validation
                        form.setValue('accountDetails.accountNumber', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sell MyPts</CardTitle>
        <CardDescription>Convert your MyPts to real currency</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Currency</FormLabel>
                <CurrencySelector
                  value={currency}
                  onChange={setCurrency}
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
                  <FormLabel>Amount in {currency}</FormLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {getCurrencySymbol(currency)}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="pl-8"
                      value={currencyAmount > 0 ? currencyAmount.toFixed(2) : ''}
                      onChange={(e) => handleCurrencyAmountChange(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <FormDescription>
                    You will receive this amount in {currency}
                  </FormDescription>
                </div>
              </div>

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      onValueChange={handlePaymentMethodChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose how you want to receive your payment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Account Details</h3>
                {renderAccountDetailsFields()}
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Rate:</span>
                <span>1 MyPt = {getCurrencySymbol(currency)}{conversionRate.toFixed(6)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">MyPts to sell:</span>
                <span>{myPtsAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2 mt-2">
                <span>You will receive:</span>
                <span>{getCurrencySymbol(currency)}{currencyAmount.toFixed(2)}</span>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || amount <= 0}>
              {isLoading ? 'Processing...' : 'Sell MyPts'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
