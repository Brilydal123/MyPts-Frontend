'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { myPtsValueApi, myPtsHubApi } from '@/lib/api/mypts-api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Save
} from 'lucide-react';

// Create a client
const queryClient = new QueryClient();

// Wrapper component with QueryClientProvider
export default function ExchangeRatesPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ExchangeRates />
    </QueryClientProvider>
  );
}

interface Currency {
  code: string;
  symbol: string;
  isBase: boolean;
  rate?: number;
}

interface ExchangeRate {
  currency: string;
  rate: number;
  symbol: string;
}

function ExchangeRates() {
  // Using sonner toast directly

  // State for the new currency form
  const [newCurrency, setNewCurrency] = useState<ExchangeRate>({
    currency: '',
    rate: 0,
    symbol: ''
  });

  // State for editing currencies
  const [editingCurrencies, setEditingCurrencies] = useState<Record<string, number>>({});

  // State for the dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // State for active tab
  const [activeTab, setActiveTab] = useState<'current' | 'api'>('current');

  // State for base value management
  const [baseValue, setBaseValue] = useState<number>(0.024);

  // Fetch supported currencies
  const {
    // data not used but kept for reference
    data: _currenciesData,
    isLoading: isLoadingCurrencies,
    isError: isErrorCurrencies,
    refetch: refetchCurrencies
  } = useQuery({
    queryKey: ['supportedCurrencies'],
    queryFn: async () => {
      const response = await myPtsValueApi.getSupportedCurrencies();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch supported currencies');
      }
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Fetch exchange rates from ExchangeRate API
  const {
    data: apiRatesData,
    isLoading: isLoadingApiRates,
    isError: isErrorApiRates,
    refetch: refetchApiRates
  } = useQuery({
    queryKey: ['exchangeRateApiRates'],
    queryFn: async () => {
      try {
        // Add cache-busting parameter
        const response = await fetch(`/api/exchange-rates/latest/USD?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.data) {
          throw new Error('Invalid response from ExchangeRate API');
        }

        return data.data;
      } catch (error) {
        console.error('Error fetching from ExchangeRate API:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    refetchInterval: 3600000, // Refetch every hour
  });

  // Fetch current value to get exchange rates
  const {
    data: valueData,
    isLoading: isLoadingValue,
    isError: isErrorValue,
    refetch: refetchValue
  } = useQuery({
    queryKey: ['currentValue'],
    queryFn: async () => {
      const response = await myPtsValueApi.getCurrentValue();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch current value');
      }
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Initialize editing currencies when data is loaded
  useEffect(() => {
    if (valueData?.exchangeRates) {
      const initialEditingState: Record<string, number> = {};
      valueData.exchangeRates.forEach(rate => {
        initialEditingState[rate.currency] = rate.rate;
      });
      setEditingCurrencies(initialEditingState);
    }
  }, [valueData]);

  // Mutation for updating exchange rates
  const updateRatesMutation = useMutation({
    mutationFn: async (exchangeRates: ExchangeRate[]) => {
      const response = await myPtsValueApi.updateExchangeRates(exchangeRates);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update exchange rates');
      }
      return response.data;
    },
    onSuccess: () => {
      // Refetch data after successful update
      refetchCurrencies();
      refetchValue();
    }
  });

  // Mutation for updating base value
  const updateBaseValueMutation = useMutation({
    mutationFn: async (value: number) => {
      const response = await myPtsHubApi.updateValuePerMyPt(value);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update base value');
      }
      return response.data;
    },
    onSuccess: () => {
      // Refetch data after successful update
      refetchValue();
      refetchApiRates();

      // Show success message
      console.log('[ADMIN] Base value updated successfully');
    }
  });

  // Initialize base value when data is loaded
  useEffect(() => {
    if (valueData?.valuePerPts) {
      setBaseValue(valueData.valuePerPts);
    }
  }, [valueData?.valuePerPts]);

  // Handle adding a new currency
  const handleAddCurrency = async () => {
    if (!newCurrency.currency || !newCurrency.symbol) {
      return;
    }

    try {
      // Show loading state
      toast.loading("Fetching exchange rate...");

      // Get the currency code in uppercase
      const currencyCode = newCurrency.currency.toUpperCase();

      // Fetch the exchange rate from the API
      const response = await fetch(`/api/exchange-rates/latest/USD?_t=${Date.now()}`);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.data || !data.data.rates) {
        throw new Error('Invalid response from ExchangeRate API');
      }

      // Get the rate for the requested currency
      const apiRate = data.data.rates[currencyCode];

      if (!apiRate) {
        toast.error(`Currency ${currencyCode} not found in ExchangeRate API`);
        return;
      }

      // Calculate the MyPts rate based on the base value
      const baseValueInUsd = valueData?.valuePerPts || 0.024; // 1 MyPt = 0.024 USD
      const calculatedRate = baseValueInUsd * apiRate;

      console.log(`[ADMIN] Adding currency ${currencyCode} with rate ${calculatedRate} (1 USD = ${apiRate} ${currencyCode}, 1 MyPt = ${baseValueInUsd} USD)`);

      // Prepare the exchange rates to update
      const exchangeRates: ExchangeRate[] = [
        {
          currency: currencyCode,
          rate: calculatedRate,
          symbol: newCurrency.symbol
        }
      ];

      // Check if we need to create a new MyPts value entry
      if (!valueData) {
        // If no MyPts value data exists, we need to create a new entry with default values
        try {
          // Create a default MyPts value entry with the new currency
          const initResponse = await myPtsHubApi.initialize({
            baseValue: 0.024,
            baseCurrency: 'USD',
            baseSymbol: '$',
            totalSupply: 1000000000, // 1 billion
            exchangeRates: [{
              currency: currencyCode,
              rate: apiRate,
              symbol: newCurrency.symbol
            }]
          });

          if (!initResponse.success) {
            throw new Error(initResponse.message || 'Failed to initialize MyPts value');
          }

          // Refetch data after successful initialization
          refetchCurrencies();
          refetchValue();

          toast.success(`Initialized MyPts value system with ${currencyCode}`);
        } catch (initError) {
          console.error('Error initializing MyPts value:', initError);
          toast.error(initError instanceof Error ? initError.message : 'Failed to initialize MyPts value');
          return;
        }
      } else {
        // If MyPts value data exists, just update the exchange rates
        updateRatesMutation.mutate(exchangeRates);
      }

      // Reset form
      setNewCurrency({
        currency: '',
        rate: 0,
        symbol: ''
      });

      // Close dialog
      setIsDialogOpen(false);

      // Show success message
      toast.success(`Added ${currencyCode} with rate ${calculatedRate.toFixed(6)}`);
    } catch (error) {
      console.error('Error adding currency:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add currency');
    }
  };

  // Handle updating exchange rates
  const handleUpdateRates = () => {
    if (!valueData?.exchangeRates) return;

    // Prepare the exchange rates to update
    const exchangeRates: ExchangeRate[] = valueData.exchangeRates.map(rate => ({
      currency: rate.currency,
      rate: editingCurrencies[rate.currency] || rate.rate,
      symbol: rate.symbol
    }));

    // Update exchange rates
    updateRatesMutation.mutate(exchangeRates);
  };

  // Handle input change for editing rates
  const handleRateChange = (currency: string, value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      setEditingCurrencies(prev => ({
        ...prev,
        [currency]: numericValue
      }));
    }
  };

  // Handle input change for new currency form
  const handleNewCurrencyChange = (field: keyof ExchangeRate, value: string) => {
    if (field === 'rate') {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        setNewCurrency(prev => ({
          ...prev,
          [field]: numericValue
        }));
      }
    } else {
      setNewCurrency(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Calculate USD value for a currency
  const getUsdValue = (rate: number): number => {
    if (!valueData) return 0;
    return valueData.valuePerPts * rate;
  };

  // Handle updating base value
  const handleUpdateBaseValue = () => {
    if (!baseValue || baseValue <= 0) return;

    // Update base value
    updateBaseValueMutation.mutate(baseValue);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Exchange Rates Management</h1>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Supported Currencies</CardTitle>
              <CardDescription>
                Manage exchange rates for different currencies
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => {
                refetchCurrencies();
                refetchValue();
                refetchApiRates();
              }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh All
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Currency
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Currency</DialogTitle>
                    <DialogDescription>
                      Add a new currency and its exchange rate relative to USD
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="currencyCode">Currency Code</Label>
                        <Input
                          id="currencyCode"
                          placeholder="e.g., EUR, GBP"
                          value={newCurrency.currency}
                          onChange={(e) => handleNewCurrencyChange('currency', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Use standard 3-letter currency codes
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currencySymbol">Currency Symbol</Label>
                        <Input
                          id="currencySymbol"
                          placeholder="e.g., €, £"
                          value={newCurrency.symbol}
                          onChange={(e) => handleNewCurrencyChange('symbol', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          The symbol used to display amounts
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        The exchange rate will be automatically fetched from the ExchangeRate API.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        The rate will be calculated based on the current base value of 1 MyPt = {valueData?.valuePerPts ? valueData.valuePerPts.toFixed(4) : '0.024'} USD.
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCurrency} disabled={!newCurrency.currency || !newCurrency.symbol}>
                      Add Currency
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {updateRatesMutation.isSuccess && (
              <Alert variant="default" className="mb-4">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Exchange rates updated successfully
                </AlertDescription>
              </Alert>
            )}

            {updateRatesMutation.isError && (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {updateRatesMutation.error instanceof Error
                    ? updateRatesMutation.error.message
                    : 'Failed to update exchange rates'}
                </AlertDescription>
              </Alert>
            )}

            {/* Tabs for different views */}
            <div className="mt-4">
              <div className="border-b mb-4">
                <div className="flex space-x-4">
                  <button
                    className={`pb-2 px-1 ${!activeTab || activeTab === 'current'
                      ? 'border-b-2 border-primary font-medium text-primary'
                      : 'text-muted-foreground'
                      }`}
                    onClick={() => setActiveTab('current')}
                  >
                    Current Rates
                  </button>
                  <button
                    className={`pb-2 px-1 ${activeTab === 'api'
                      ? 'border-b-2 border-primary font-medium text-primary'
                      : 'text-muted-foreground'
                      }`}
                    onClick={() => setActiveTab('api')}
                  >
                    ExchangeRate API
                  </button>
                </div>
              </div>

              {/* Current Rates Tab */}
              {(!activeTab || activeTab === 'current') && (
                <>
                  {(isLoadingCurrencies || isLoadingValue) ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      <span className="ml-3">Loading currencies...</span>
                    </div>
                  ) : (isErrorCurrencies || isErrorValue) ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        Failed to load currencies. Please try again.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <Card className="mb-6">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Base Value Management</CardTitle>
                          <CardDescription>
                            Update the base value of MyPts in USD. This affects all currency conversions.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-end gap-4">
                            <div className="space-y-1 flex-1 max-w-xs">
                              <Label htmlFor="base-value">Base Value (1 MyPt in USD)</Label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="base-value"
                                  type="number"
                                  step="0.0001"
                                  min="0.0001"
                                  className="pl-9"
                                  placeholder="0.024"
                                  value={baseValue}
                                  onChange={(e) => setBaseValue(parseFloat(e.target.value))}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Current value: {valueData ? `${valueData.baseSymbol}${valueData.valuePerPts.toFixed(4)}` : '$0.0240'}
                              </p>
                            </div>
                            <Button
                              onClick={handleUpdateBaseValue}
                              disabled={updateBaseValueMutation.isPending || !baseValue || baseValue === valueData?.valuePerPts}
                            >
                              {updateBaseValueMutation.isPending ? (
                                <>
                                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Update Base Value
                                </>
                              )}
                            </Button>
                          </div>

                          {updateBaseValueMutation.isSuccess && (
                            <Alert variant="default" className="mt-4">
                              <CheckCircle className="h-4 w-4" />
                              <AlertTitle>Success</AlertTitle>
                              <AlertDescription>
                                Base value updated successfully
                              </AlertDescription>
                            </Alert>
                          )}

                          {updateBaseValueMutation.isError && (
                            <Alert variant="destructive" className="mt-4">
                              <XCircle className="h-4 w-4" />
                              <AlertTitle>Error</AlertTitle>
                              <AlertDescription>
                                {updateBaseValueMutation.error instanceof Error
                                  ? updateBaseValueMutation.error.message
                                  : 'Failed to update base value'}
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>

                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">
                          Base currency: <span className="font-medium">{valueData?.baseCurrency || 'USD'} ({valueData?.baseSymbol || '$'})</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Base value per MyPt: <span className="font-medium">{valueData ? `${valueData.baseSymbol}${valueData.valuePerPts.toFixed(4)}` : '$0.0240'}</span>
                        </p>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Currency</TableHead>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Exchange Rate</TableHead>
                            <TableHead>Value per MyPt</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Base currency row */}
                          <TableRow className="bg-muted/50">
                            <TableCell className="font-medium">{valueData?.baseCurrency || 'USD'}</TableCell>
                            <TableCell>{valueData?.baseSymbol || '$'}</TableCell>
                            <TableCell>1.0 (Base)</TableCell>
                            <TableCell>{valueData ? `${valueData.baseSymbol}${valueData.valuePerPts.toFixed(4)}` : '$0.0240'}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" disabled>
                                <Edit className="h-4 w-4 mr-1" />
                                Base
                              </Button>
                            </TableCell>
                          </TableRow>

                          {/* Other currencies */}
                          {valueData?.exchangeRates?.map((rate) => (
                            <TableRow key={rate.currency}>
                              <TableCell className="font-medium">{rate.currency}</TableCell>
                              <TableCell>{rate.symbol}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    step="0.001"
                                    min="0.001"
                                    className="w-24"
                                    value={editingCurrencies[rate.currency] || rate.rate}
                                    onChange={(e) => handleRateChange(rate.currency, e.target.value)}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    (1 {valueData.baseCurrency} = {editingCurrencies[rate.currency] || rate.rate} {rate.currency})
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {rate.symbol}{getUsdValue(editingCurrencies[rate.currency] || rate.rate).toFixed(4)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={rate.rate === editingCurrencies[rate.currency]}
                                  onClick={() => {
                                    // Update just this currency
                                    updateRatesMutation.mutate([{
                                      currency: rate.currency,
                                      rate: editingCurrencies[rate.currency] || rate.rate,
                                      symbol: rate.symbol
                                    }]);
                                  }}
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </>
              )}

              {/* ExchangeRate API Tab */}
              {activeTab === 'api' && (
                <>
                  {isLoadingApiRates ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      <span className="ml-3">Loading API rates...</span>
                    </div>
                  ) : isErrorApiRates ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        Failed to load ExchangeRate API rates. Please try again.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="mb-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Base currency: <span className="font-medium">USD ($)</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Last updated: <span className="font-medium">{apiRatesData?.lastUpdated ? new Date(apiRatesData.lastUpdated).toLocaleString() : 'Unknown'}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Next update: <span className="font-medium">{apiRatesData?.nextUpdate ? new Date(apiRatesData.nextUpdate).toLocaleString() : 'Unknown'}</span>
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            // Force refresh the API rates by bypassing cache
                            try {
                              // Make a direct request with force=true to bypass cache
                              await fetch(`/api/exchange-rates/latest/USD?force=true&_t=${Date.now()}`, {
                                cache: 'no-store',
                                headers: {
                                  'Cache-Control': 'no-cache',
                                },
                              });

                              // Then refetch the data
                              refetchApiRates();

                              toast.success("Exchange rates have been refreshed from the API");
                            } catch (error) {
                              console.error('Error refreshing rates:', error);
                              toast.error("Failed to refresh exchange rates");
                            }
                          }}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh API Rates
                        </Button>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Sync Exchange Rates from API</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          This will update your system's exchange rates based on the latest data from the ExchangeRate API.
                          The rates will be calculated using the current base value of 1 MyPt = {valueData?.valuePerPts ? `$${valueData.valuePerPts.toFixed(4)}` : '$0.0240'} USD.
                        </p>
                        <Button
                          onClick={() => {
                            // Prepare the exchange rates to update
                            if (!apiRatesData?.rates || !valueData?.exchangeRates) return;

                            const baseValueInUsd = valueData?.valuePerPts || 0.024; // Use actual base value
                            const exchangeRates: ExchangeRate[] = [];

                            // Get existing currency symbols
                            const symbolMap: Record<string, string> = {};
                            valueData.exchangeRates.forEach(rate => {
                              symbolMap[rate.currency] = rate.symbol;
                            });

                            // Default symbols for common currencies
                            const defaultSymbols: Record<string, string> = {
                              'USD': '$',
                              'EUR': '€',
                              'GBP': '£',
                              'JPY': '¥',
                              'CNY': '¥',
                              'INR': '₹',
                              'NGN': '₦',
                              'PKR': '₨',
                              'XAF': 'FCFA',
                              'CAD': 'CA$',
                              'AUD': 'A$'
                            };

                            // Process each currency in the API data
                            Object.entries(apiRatesData.rates).forEach(([currency, rate]) => {
                              // Only include currencies that are already in our system
                              const existingRate = valueData.exchangeRates.find(r => r.currency === currency);
                              if (existingRate) {
                                const calculatedRate = baseValueInUsd * (rate as number);
                                exchangeRates.push({
                                  currency,
                                  rate: calculatedRate,
                                  symbol: symbolMap[currency] || defaultSymbols[currency] || currency
                                });
                              }
                            });

                            // Update exchange rates
                            if (exchangeRates.length > 0) {
                              updateRatesMutation.mutate(exchangeRates);
                            }
                          }}
                          disabled={updateRatesMutation.isPending || !apiRatesData?.rates || !valueData?.exchangeRates}
                        >
                          {updateRatesMutation.isPending ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Sync All Rates from API
                            </>
                          )}
                        </Button>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Currency</TableHead>
                            <TableHead>API Rate (1 USD =)</TableHead>
                            <TableHead>Calculated (1 MyPt =)</TableHead>
                            <TableHead>Current System Value</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {apiRatesData?.rates && valueData?.exchangeRates && Object.entries(apiRatesData.rates)
                            .filter(([currency]) => {
                              // Only show currencies that are already in our system
                              return valueData.exchangeRates.some(rate => rate.currency === currency);
                            })
                            .map(([currency, apiRate]) => {
                              const systemRate = valueData.exchangeRates.find(rate => rate.currency === currency);
                              const baseValueInUsd = valueData?.valuePerPts || 0.024; // Use actual base value
                              const calculatedRate = baseValueInUsd * (apiRate as number);

                              // Determine if the rates are in sync (within 1%)
                              const isInSync = systemRate &&
                                Math.abs((systemRate.rate - calculatedRate) / systemRate.rate) < 0.01;

                              return (
                                <TableRow key={currency}>
                                  <TableCell className="font-medium">{currency}</TableCell>
                                  <TableCell>{(apiRate as number).toFixed(6)}</TableCell>
                                  <TableCell>{calculatedRate.toFixed(6)}</TableCell>
                                  <TableCell>
                                    {systemRate ? systemRate.rate.toFixed(6) : 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    {systemRate ? (
                                      isInSync ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          In Sync
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          Out of Sync
                                        </span>
                                      )
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        Not in System
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {systemRate && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          // Update just this currency
                                          updateRatesMutation.mutate([{
                                            currency,
                                            rate: calculatedRate,
                                            symbol: systemRate.symbol
                                          }]);
                                        }}
                                        disabled={updateRatesMutation.isPending || isInSync}
                                      >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Update
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              {valueData?.exchangeRates.length} currencies supported in addition to {valueData?.baseCurrency}
            </p>

            <Button
              onClick={handleUpdateRates}
              disabled={
                updateRatesMutation.isPending ||
                !valueData?.exchangeRates ||
                valueData.exchangeRates.every(rate => rate.rate === editingCurrencies[rate.currency])
              }
            >
              {updateRatesMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save All Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
