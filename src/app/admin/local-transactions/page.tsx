'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useProfiles } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  Info,
  Loader2,
  RefreshCcw,
  Search,
  X
} from 'lucide-react';
import { myPtsApi } from '@/lib/api/mypts-api';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getCurrencySymbol } from '@/lib/currency';

export default function LocalTransactionsPage() {
  const router = useRouter();
  const { fetchProfileById, getProfile } = useProfiles();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [profilesLoaded, setProfilesLoaded] = useState(false);

  // Fetch transactions on component mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Apply filters when search query or filters change
  useEffect(() => {
    applyFilters();
  }, [searchQuery, statusFilter, paymentMethodFilter, transactions]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await myPtsApi.getLocalTransactions();
      if (response.success && response.data) {
        setTransactions(response.data);

        // Load profile data for each transaction to get secondary IDs
        await loadProfileData(response.data);
      } else {
        toast.error('Failed to fetch transactions', {
          description: response.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load profile data for all transactions
  const loadProfileData = async (transactionsData: any[]) => {
    try {
      // Create a set of unique profile IDs
      const profileIds = new Set(transactionsData.map(t => t.profileId));

      // Fetch profile data for each unique profile ID
      const fetchPromises = Array.from(profileIds).map(async (profileId) => {
        try {
          // Try to get profile from context first
          let profile = getProfile(profileId);

          // If not found, fetch it
          if (!profile) {
            profile = await fetchProfileById(profileId);
          }

          return { profileId, profile };
        } catch (error) {
          console.warn(`Error fetching profile ${profileId}:`, error);
          return { profileId, profile: null };
        }
      });

      // Wait for all profile fetches to complete
      const profileResults = await Promise.all(fetchPromises);

      // Create a map of profile IDs to secondary IDs
      const profileMap = new Map();
      profileResults.forEach(({ profileId, profile }) => {
        if (profile) {
          profileMap.set(profileId, profile.secondaryId || null);
        }
      });

      // Update transactions with secondary IDs
      const updatedTransactions = transactionsData.map(transaction => {
        const secondaryId = profileMap.get(transaction.profileId);
        if (secondaryId && (!transaction.metadata || !transaction.metadata.profileSecondaryId)) {
          return {
            ...transaction,
            metadata: {
              ...(transaction.metadata || {}),
              profileSecondaryId: secondaryId
            }
          };
        }
        return transaction;
      });

      // Update state with the enhanced transactions
      setTransactions(updatedTransactions);
      setProfilesLoaded(true);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (transaction) =>
          transaction.profileId?.toLowerCase().includes(query) ||
          transaction._id?.toLowerCase().includes(query) ||
          transaction.metadata?.profileSecondaryId?.toLowerCase().includes(query) ||
          transaction.metadata?.accountDetails?.accountName?.toLowerCase().includes(query) ||
          transaction.metadata?.accountDetails?.mobileNumber?.toLowerCase().includes(query) ||
          transaction.metadata?.accountDetails?.accountNumber?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((transaction) => transaction.status === statusFilter);
    }

    // Apply payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(
        (transaction) => transaction.metadata?.paymentMethod === paymentMethodFilter
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleViewDetails = async (transaction: any) => {
    // If the transaction doesn't have a secondary ID, try to get it from the profile context
    if (!transaction.metadata?.profileSecondaryId) {
      try {
        // Try to get profile from context first
        let profile = getProfile(transaction.profileId);

        // If not found, fetch it
        if (!profile) {
          profile = await fetchProfileById(transaction.profileId);
        }

        if (profile && profile.secondaryId) {
          // Update the transaction with the secondary ID
          transaction = {
            ...transaction,
            metadata: {
              ...(transaction.metadata || {}),
              profileSecondaryId: profile.secondaryId
            }
          };
        }
      } catch (error) {
        console.warn(`Could not fetch secondary ID for profile ${transaction.profileId}:`, error);
      }
    }

    setSelectedTransaction(transaction);
    setIsDetailsDialogOpen(true);
  };

  const handleApproveTransaction = async (transaction: any) => {
    // If the transaction doesn't have a secondary ID, try to get it from the profile context
    if (!transaction.metadata?.profileSecondaryId) {
      try {
        // Try to get profile from context first
        let profile = getProfile(transaction.profileId);

        // If not found, fetch it
        if (!profile) {
          profile = await fetchProfileById(transaction.profileId);
        }

        if (profile && profile.secondaryId) {
          // Update the transaction with the secondary ID
          transaction = {
            ...transaction,
            metadata: {
              ...(transaction.metadata || {}),
              profileSecondaryId: profile.secondaryId
            }
          };
        }
      } catch (error) {
        console.warn(`Could not fetch secondary ID for profile ${transaction.profileId}:`, error);
      }
    }

    setSelectedTransaction(transaction);
    setPaymentReference('');
    setAdminNotes('');
    setIsApprovalDialogOpen(true);
  };

  const handleProcessTransaction = async () => {
    if (!paymentReference) {
      toast.error('Payment reference is required');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await myPtsApi.processLocalTransaction(
        selectedTransaction._id,
        paymentReference,
        adminNotes
      );

      if (response.success) {
        toast.success('Transaction processed successfully!');
        setIsApprovalDialogOpen(false);
        fetchTransactions();
      } else {
        toast.error('Failed to process transaction', {
          description: response.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      toast.error('Failed to process transaction', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'RESERVED':
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Reserved</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500">Failed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="text-gray-500 border-gray-500">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'mobile_money':
        return 'Mobile Money';
      case 'pakistani_local':
        return 'Pakistani Local';
      case 'local':
        return 'Local Payment';
      default:
        return method;
    }
  };

  const getPaymentMethodImage = (method: string, provider?: string) => {
    // Default image path
    let imagePath = '/images/payment-methods/default-payment.png';

    // Determine image based on method and provider
    if (method === 'mobile_money') {
      if (provider?.toLowerCase().includes('mtn')) {
        imagePath = '/images/payment-methods/mtn-mobile-money.png';
      } else if (provider?.toLowerCase().includes('orange')) {
        imagePath = '/images/payment-methods/orange-money.png';
      } else if (provider?.toLowerCase().includes('airtel')) {
        imagePath = '/images/payment-methods/airtel.png';
      } else {
        imagePath = '/images/payment-methods/mobile-money.png';
      }
    } else if (method === 'pakistani_local') {
      if (provider?.toLowerCase().includes('easypaisa')) {
        imagePath = '/images/payment-methods/easypaisa-logo.png';
      } else if (provider?.toLowerCase().includes('jazzcash')) {
        imagePath = '/images/payment-methods/jazzcash.png';
      } else {
        imagePath = '/images/payment-methods/pakistani-local.png';
      }
    } else if (method === 'local') {
      imagePath = '/images/payment-methods/local-payment.png';
    }

    // Return a placeholder if the image doesn't exist
    return imagePath;
  };

  // Function to get country flag URL based on country code or name
  const getCountryFlag = (country?: string) => {
    if (!country) return null;

    // Map common country names to ISO codes
    const countryMap: Record<string, string> = {
      'cameroon': 'cm',
      'pakistan': 'pk',
      'nigeria': 'ng',
      'ghana': 'gh',
      'kenya': 'ke',
      'south africa': 'za',
      'uganda': 'ug',
      'tanzania': 'tz',
      'rwanda': 'rw',
      'zambia': 'zm',
      'zimbabwe': 'zw',
      'ethiopia': 'et',
      'egypt': 'eg',
      'morocco': 'ma',
      'algeria': 'dz',
      'tunisia': 'tn',
      'senegal': 'sn',
      'ivory coast': 'ci',
      'cote d\'ivoire': 'ci',
      'mali': 'ml',
      'burkina faso': 'bf',
      'benin': 'bj',
      'togo': 'tg',
      'niger': 'ne',
      'chad': 'td',
      'sudan': 'sd',
      'south sudan': 'ss',
      'somalia': 'so',
      'djibouti': 'dj',
      'eritrea': 'er',
      'liberia': 'lr',
      'sierra leone': 'sl',
      'guinea': 'gn',
      'guinea-bissau': 'gw',
      'gambia': 'gm',
      'mauritania': 'mr',
      'libya': 'ly',
      'congo': 'cg',
      'dr congo': 'cd',
      'democratic republic of congo': 'cd',
      'central african republic': 'cf',
      'gabon': 'ga',
      'equatorial guinea': 'gq',
      'burundi': 'bi',
      'malawi': 'mw',
      'mozambique': 'mz',
      'angola': 'ao',
      'namibia': 'na',
      'botswana': 'bw',
      'lesotho': 'ls',
      'swaziland': 'sz',
      'eswatini': 'sz',
      'madagascar': 'mg',
      'mauritius': 'mu',
      'comoros': 'km',
      'seychelles': 'sc',
      'cape verde': 'cv',
      'sao tome and principe': 'st'
    };

    // Try to get the country code
    let countryCode = country.toLowerCase();

    // If it's a full country name, convert to code
    if (countryMap[countryCode]) {
      countryCode = countryMap[countryCode];
    }

    // If it's already a 2-letter code, use it directly
    if (countryCode.length === 2) {
      return `https://flagcdn.com/w80/${countryCode}.png`;
    }

    // If we couldn't determine the country code, return null
    return null;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Local Payment Transactions</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => loadProfileData(transactions)}
            variant="outline"
            className="gap-2"
            disabled={isLoading || !profilesLoaded}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Profiles
          </Button>
          <Button onClick={fetchTransactions} variant="outline" className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search local payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by ID, Secondary ID, name, or account number"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="RESERVED">Reserved</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment-method-filter">Payment Method</Label>
              <Select
                value={paymentMethodFilter}
                onValueChange={setPaymentMethodFilter}
              >
                <SelectTrigger id="payment-method-filter">
                  <SelectValue placeholder="Filter by payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="pakistani_local">Pakistani Local</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Local Payment Transactions</CardTitle>
          <CardDescription>
            Manage and process local payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading transactions...</span>
            </div>
          ) : !profilesLoaded ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading profile data...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Profile ID</TableHead>
                    <TableHead>Secondary ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {transaction.profileId}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium">
                        {transaction.metadata?.profileSecondaryId || '-'}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {Math.abs(transaction.amount).toLocaleString()} MyPts
                        </span>
                        <br />
                        <span className="text-xs text-muted-foreground">
                          ≈ {getCurrencySymbol(transaction.metadata?.currency || 'usd')}
                          {(Math.abs(transaction.amount) * (transaction.metadata?.valuePerMyPt || 0.024)).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-white shadow-sm border border-gray-200 flex items-center justify-center p-1">
                            <img
                              src={getPaymentMethodImage(
                                transaction.metadata?.paymentMethod,
                                transaction.metadata?.accountDetails?.provider
                              )}
                              alt={getPaymentMethodLabel(transaction.metadata?.paymentMethod)}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                // If image fails to load, replace with a default icon
                                (e.target as HTMLImageElement).src = '/images/payment-methods/default-payment.png';
                              }}
                            />
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">
                                {getPaymentMethodLabel(transaction.metadata?.paymentMethod)}
                              </span>

                              {/* Country flag */}
                              {transaction.metadata?.accountDetails?.country && getCountryFlag(transaction.metadata.accountDetails.country) && (
                                <div className="w-5 h-3.5 overflow-hidden rounded-sm border border-gray-200 shadow-sm ml-1">
                                  <img
                                    src={getCountryFlag(transaction.metadata.accountDetails.country) || undefined}
                                    alt={transaction.metadata.accountDetails.country}
                                    className="w-full h-full object-cover"
                                    title={transaction.metadata.accountDetails.country}
                                  />
                                </div>
                              )}
                            </div>

                            {transaction.metadata?.accountDetails?.provider && (
                              <span className="block text-xs text-muted-foreground">
                                {transaction.metadata.accountDetails.provider}
                                {transaction.metadata?.accountDetails?.country && !getCountryFlag(transaction.metadata.accountDetails.country) && (
                                  <span className="ml-1">({transaction.metadata.accountDetails.country})</span>
                                )}
                              </span>
                            )}

                            {transaction.metadata?.accountDetails?.methodType && (
                              <span className="block text-xs text-muted-foreground">
                                {transaction.metadata.accountDetails.methodType}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(transaction)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {transaction.status === 'RESERVED' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApproveTransaction(transaction)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              View detailed information about this transaction
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm">Transaction ID</h3>
                  <p className="font-mono text-xs">{selectedTransaction._id}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Status</h3>
                  <div>{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Profile ID</h3>
                  <p className="font-mono text-xs">{selectedTransaction.profileId}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Secondary ID</h3>
                  <p className="font-mono text-xs">{selectedTransaction.metadata?.profileSecondaryId || '-'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Created At</h3>
                  <p>{formatDateTime(selectedTransaction.createdAt)}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Updated At</h3>
                  <p>{formatDateTime(selectedTransaction.updatedAt)}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Amount</h3>
                  <p className="font-medium">{Math.abs(selectedTransaction.amount).toLocaleString()} MyPts</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Value</h3>
                  <p>
                    {getCurrencySymbol(selectedTransaction.metadata?.currency || 'usd')}
                    {(Math.abs(selectedTransaction.amount) * (selectedTransaction.metadata?.valuePerMyPt || 0.024)).toFixed(2)}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Payment Details</h3>
                <div className="bg-muted p-3 rounded-md">
                  {/* Payment Method with Image */}
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
                    <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-white shadow-sm border border-gray-200 flex items-center justify-center p-1.5">
                      <img
                        src={getPaymentMethodImage(
                          selectedTransaction.metadata?.paymentMethod,
                          selectedTransaction.metadata?.accountDetails?.provider
                        )}
                        alt={getPaymentMethodLabel(selectedTransaction.metadata?.paymentMethod)}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // If image fails to load, replace with a default icon
                          (e.target as HTMLImageElement).src = '/images/payment-methods/default-payment.png';
                        }}
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-1">
                        <p className="font-medium">
                          {getPaymentMethodLabel(selectedTransaction.metadata?.paymentMethod)}
                        </p>

                        {/* Country flag */}
                        {selectedTransaction.metadata?.accountDetails?.country && getCountryFlag(selectedTransaction.metadata.accountDetails.country) && (
                          <div className="w-6 h-4 overflow-hidden rounded-sm border border-gray-200 shadow-sm ml-1">
                            <img
                              src={getCountryFlag(selectedTransaction.metadata.accountDetails.country) || undefined}
                              alt={selectedTransaction.metadata.accountDetails.country}
                              className="w-full h-full object-cover"
                              title={selectedTransaction.metadata.accountDetails.country}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center">
                        {selectedTransaction.metadata?.accountDetails?.provider && (
                          <span className="block text-xs text-muted-foreground">
                            {selectedTransaction.metadata.accountDetails.provider}
                          </span>
                        )}

                        {selectedTransaction.metadata?.accountDetails?.country && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({selectedTransaction.metadata.accountDetails.country})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedTransaction.metadata?.paymentMethod === 'mobile_money' && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <span className="text-sm font-medium">Provider:</span>
                        <span className="text-sm ml-2">{selectedTransaction.metadata.accountDetails?.provider}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Mobile Number:</span>
                        <span className="text-sm ml-2">{selectedTransaction.metadata.accountDetails?.mobileNumber}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Account Name:</span>
                        <span className="text-sm ml-2">{selectedTransaction.metadata.accountDetails?.accountName}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Country:</span>
                        <span className="text-sm ml-2">{selectedTransaction.metadata.accountDetails?.country}</span>
                      </div>
                      {selectedTransaction.metadata.accountDetails?.additionalNotes && (
                        <div className="col-span-2">
                          <span className="text-sm font-medium">Additional Notes:</span>
                          <p className="text-sm mt-1">{selectedTransaction.metadata.accountDetails.additionalNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTransaction.metadata?.paymentMethod === 'pakistani_local' && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <span className="text-sm font-medium">Method Type:</span>
                        <span className="text-sm ml-2">{selectedTransaction.metadata.accountDetails?.methodType}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Account Number:</span>
                        <span className="text-sm ml-2">{selectedTransaction.metadata.accountDetails?.accountNumber}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Account Name:</span>
                        <span className="text-sm ml-2">{selectedTransaction.metadata.accountDetails?.accountName}</span>
                      </div>
                      {selectedTransaction.metadata.accountDetails?.additionalDetails && (
                        <div className="col-span-2">
                          <span className="text-sm font-medium">Additional Details:</span>
                          <p className="text-sm mt-1">{selectedTransaction.metadata.accountDetails.additionalDetails}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {selectedTransaction.metadata?.paymentResult && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Payment Result</h3>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <span className="text-sm font-medium">Status:</span>
                          <span className="text-sm ml-2">{selectedTransaction.metadata.paymentResult.status}</span>
                        </div>
                        {selectedTransaction.metadata.paymentResult.reference && (
                          <div>
                            <span className="text-sm font-medium">Reference:</span>
                            <span className="text-sm ml-2">{selectedTransaction.metadata.paymentResult.reference}</span>
                          </div>
                        )}
                        {selectedTransaction.metadata.adminNotes && (
                          <div className="col-span-2">
                            <span className="text-sm font-medium">Admin Notes:</span>
                            <p className="text-sm mt-1">{selectedTransaction.metadata.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedTransaction?.status === 'RESERVED' && (
              <Button onClick={() => {
                setIsDetailsDialogOpen(false);
                handleApproveTransaction(selectedTransaction);
              }}>
                Process Transaction
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Local Payment Transaction</DialogTitle>
            <DialogDescription>
              Confirm that you have processed this payment manually
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Manual Processing Required</h4>
                    <p className="text-sm text-blue-700">
                      This transaction requires manual processing. Please follow these steps:
                    </p>
                    <ol className="text-sm text-blue-700 list-decimal ml-5 mt-1">
                      <li>Verify the payment details provided by the user</li>
                      <li>Process the payment using the appropriate local payment method</li>
                      <li>Enter the payment reference and any notes below</li>
                      <li>Click "Process Transaction" to complete the transaction</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Payment Method Display */}
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-white shadow-sm border border-gray-200 flex items-center justify-center p-1.5">
                    <img
                      src={getPaymentMethodImage(
                        selectedTransaction.metadata?.paymentMethod,
                        selectedTransaction.metadata?.accountDetails?.provider
                      )}
                      alt={getPaymentMethodLabel(selectedTransaction.metadata?.paymentMethod)}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // If image fails to load, replace with a default icon
                        (e.target as HTMLImageElement).src = '/images/payment-methods/default-payment.png';
                      }}
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-1">
                      <p className="font-medium">
                        {getPaymentMethodLabel(selectedTransaction.metadata?.paymentMethod)}
                      </p>

                      {/* Country flag */}
                      {selectedTransaction.metadata?.accountDetails?.country && getCountryFlag(selectedTransaction.metadata.accountDetails.country) && (
                        <div className="w-6 h-4 overflow-hidden rounded-sm border border-gray-200 shadow-sm ml-1">
                          <img
                            src={getCountryFlag(selectedTransaction.metadata.accountDetails.country) || undefined}
                            alt={selectedTransaction.metadata.accountDetails.country}
                            className="w-full h-full object-cover"
                            title={selectedTransaction.metadata.accountDetails.country}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center">
                      {selectedTransaction.metadata?.accountDetails?.provider && (
                        <span className="block text-xs text-muted-foreground">
                          {selectedTransaction.metadata.accountDetails.provider}
                        </span>
                      )}

                      {selectedTransaction.metadata?.accountDetails?.country && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({selectedTransaction.metadata.accountDetails.country})
                        </span>
                      )}
                    </div>

                    {selectedTransaction.metadata?.accountDetails?.methodType && (
                      <span className="block text-xs text-muted-foreground">
                        {selectedTransaction.metadata.accountDetails.methodType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Account Details Summary */}
                {selectedTransaction.metadata?.accountDetails?.accountName && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium">Account Details:</p>
                    <p className="text-sm">
                      {selectedTransaction.metadata.accountDetails.accountName}
                      {selectedTransaction.metadata.accountDetails.accountNumber && (
                        <span className="ml-1">({selectedTransaction.metadata.accountDetails.accountNumber})</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="payment-reference">Payment Reference (Required)</Label>
                  <Input
                    id="payment-reference"
                    placeholder="Enter payment reference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="Enter any notes about this transaction"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessTransaction}
              disabled={isProcessing || !paymentReference}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Transaction'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
