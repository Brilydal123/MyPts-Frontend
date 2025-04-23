'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { myPtsValueApi } from '@/lib/api/mypts-api';
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
  
  // Fetch supported currencies
  const { 
    data: currenciesData, 
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
  
  // Handle adding a new currency
  const handleAddCurrency = () => {
    if (!newCurrency.currency || !newCurrency.symbol || newCurrency.rate <= 0) {
      return;
    }
    
    // Prepare the exchange rates to update
    const exchangeRates: ExchangeRate[] = [
      {
        currency: newCurrency.currency.toUpperCase(),
        rate: newCurrency.rate,
        symbol: newCurrency.symbol
      }
    ];
    
    // Update exchange rates
    updateRatesMutation.mutate(exchangeRates);
    
    // Reset form
    setNewCurrency({
      currency: '',
      rate: 0,
      symbol: ''
    });
    
    // Close dialog
    setIsDialogOpen(false);
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
    return valueData.baseValue * rate;
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
              }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
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
                      <Label htmlFor="exchangeRate">Exchange Rate (relative to USD)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="exchangeRate"
                          type="number"
                          step="0.001"
                          min="0.001"
                          className="pl-9"
                          placeholder="1.0"
                          value={newCurrency.rate || ''}
                          onChange={(e) => handleNewCurrencyChange('rate', e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Rate relative to USD (e.g., 0.91 for EUR means 1 USD = 0.91 EUR)
                      </p>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCurrency} disabled={!newCurrency.currency || !newCurrency.symbol || newCurrency.rate <= 0}>
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
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Base currency: <span className="font-medium">{valueData?.baseCurrency} ({valueData?.baseSymbol})</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Base value per MyPt: <span className="font-medium">{valueData?.baseSymbol}{valueData?.baseValue.toFixed(4)}</span>
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
                      <TableCell className="font-medium">{valueData?.baseCurrency}</TableCell>
                      <TableCell>{valueData?.baseSymbol}</TableCell>
                      <TableCell>1.0 (Base)</TableCell>
                      <TableCell>{valueData?.baseSymbol}{valueData?.baseValue.toFixed(4)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled>
                          <Edit className="h-4 w-4 mr-1" />
                          Base
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {/* Other currencies */}
                    {valueData?.exchangeRates.map((rate) => (
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
