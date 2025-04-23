'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { myPtsHubApi } from '@/lib/api/mypts-api';
import { MyPtsTransaction, TransactionType } from '@/types/mypts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, RefreshCw, Calendar, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

// Create a client
const queryClient = new QueryClient();

// Wrapper component with QueryClientProvider
export default function ProfileTransactionsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileTransactions />
    </QueryClientProvider>
  );
}

// Main component with the actual implementation
function ProfileTransactions() {
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // State for selected transaction
  const [selectedTransaction, setSelectedTransaction] = useState<MyPtsTransaction | null>(null);

  // Calculate offset for pagination
  const offset = (currentPage - 1) * pageSize;

  // Fetch transactions
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['profileTransactions', offset, pageSize, selectedType, selectedProfileId, dateRange],
    queryFn: async () => {
      try {
        const params: any = {
          offset,
          limit: pageSize,
        };

        if (selectedType && selectedType !== 'all') {
          params.type = selectedType;
        }

        if (selectedProfileId) {
          params.profileId = selectedProfileId;
        }

        if (dateRange?.from) {
          params.startDate = dateRange.from;
        }

        if (dateRange?.to) {
          params.endDate = dateRange.to;
        }

        const response = await myPtsHubApi.getAllProfileTransactions(params);
        console.log('Profile transactions response:', response);

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch transactions');
        }

        // Handle different response formats
        if (response.data && response.data.transactions) {
          return response.data;
        } else if (response.data && Array.isArray(response.data)) {
          // If the API returns an array directly
          return {
            transactions: response.data,
            pagination: {
              total: response.data.length,
              limit: pageSize,
              offset: offset,
              hasMore: false
            }
          };
        } else {
          console.error('Unexpected response format:', response.data);
          return {
            transactions: [],
            pagination: {
              total: 0,
              limit: pageSize,
              offset: offset,
              hasMore: false
            }
          };
        }
      } catch (error) {
        console.error('Error fetching profile transactions:', error);
        return {
          transactions: [],
          pagination: {
            total: 0,
            limit: pageSize,
            offset: offset,
            hasMore: false
          }
        };
      }
    },
    refetchOnWindowFocus: false,
  });

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get transaction type badge color
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case TransactionType.BUY_MYPTS:
        return 'bg-green-100 text-green-800';
      case TransactionType.SELL_MYPTS:
        return 'bg-red-100 text-red-800';
      case TransactionType.DONATION_SENT:
        return 'bg-purple-100 text-purple-800';
      case TransactionType.DONATION_RECEIVED:
        return 'bg-indigo-100 text-indigo-800';
      case TransactionType.PURCHASE_PRODUCT:
        return 'bg-blue-100 text-blue-800';
      case TransactionType.RECEIVE_PRODUCT_PAYMENT:
        return 'bg-teal-100 text-teal-800';
      case TransactionType.EARN_MYPTS:
        return 'bg-emerald-100 text-emerald-800';
      // case TransactionType.WITHDRAW_MYPTS:
      //   return 'bg-amber-100 text-amber-800';
      case TransactionType.ADJUSTMENT:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Apply search filter locally
  const filteredTransactions = data?.transactions ? data.transactions.filter(tx => {
    if (!searchQuery) return true;

    return (
      tx._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.profileId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) : [];

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Profile Transactions</h1>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter transactions by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID or description"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Transaction Type</label>
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(TransactionType).map((type) => (
                    <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Profile ID</label>
              <Input
                placeholder="Enter Profile ID"
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <DateRangePicker
                value={dateRange || { from: undefined, to: undefined }}
                onChange={setDateRange}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4 space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');  // This will be converted to 'all' in the Select component
                setSelectedProfileId('');
                setDateRange(undefined);
                setCurrentPage(1);
              }}
            >
              Reset Filters
            </Button>
            <Button onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex space-x-2">
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="10 per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profile ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-8 w-8 bg-muted rounded-full ml-auto animate-pulse"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Error loading transactions. Please try again.
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell className="font-mono text-xs">
                      {transaction.profileId.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge className={getTransactionTypeColor(transaction.type)}>
                        {transaction.type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {transaction.balance.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {formatDate(transaction.createdAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {transaction._id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedTransaction(transaction)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Transaction Details</DialogTitle>
                            <div className="text-xs font-mono text-muted-foreground mt-1">
                              ID: {selectedTransaction?._id}
                            </div>
                          </DialogHeader>

                          {selectedTransaction && (
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Profile ID</h4>
                                <p className="text-sm font-mono">{selectedTransaction.profileId}</p>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                                <Badge className={getTransactionTypeColor(selectedTransaction.type)}>
                                  {selectedTransaction.type.replace(/_/g, ' ')}
                                </Badge>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Amount</h4>
                                <p className={selectedTransaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {selectedTransaction.amount >= 0 ? '+' : ''}{selectedTransaction.amount.toLocaleString()} MyPts
                                </p>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Balance After</h4>
                                <p>{selectedTransaction.balance.toLocaleString()} MyPts</p>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                                <p>{formatDate(selectedTransaction.createdAt)}</p>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                                <Badge variant={selectedTransaction.status === 'COMPLETED' ? 'default' : 'outline'}>
                                  {selectedTransaction.status}
                                </Badge>
                              </div>

                              <div className="col-span-2">
                                <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                                <p>{selectedTransaction.description}</p>
                              </div>

                              {selectedTransaction.hubLogId && (
                                <div className="col-span-2">
                                  <h4 className="text-sm font-medium text-muted-foreground">Hub Log ID</h4>
                                  <p className="text-sm font-mono">{selectedTransaction.hubLogId}</p>
                                </div>
                              )}

                              {selectedTransaction.relatedTransaction && (
                                <div className="col-span-2">
                                  <h4 className="text-sm font-medium text-muted-foreground">Related Transaction</h4>
                                  <p className="text-sm font-mono">{selectedTransaction.relatedTransaction}</p>
                                </div>
                              )}

                              {selectedTransaction.referenceId && (
                                <div className="col-span-2">
                                  <h4 className="text-sm font-medium text-muted-foreground">Reference ID</h4>
                                  <p className="text-sm font-mono">{selectedTransaction.referenceId}</p>
                                </div>
                              )}

                              {selectedTransaction.metadata && (
                                <div className="col-span-2">
                                  <h4 className="text-sm font-medium text-muted-foreground">Metadata</h4>
                                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {data && data.pagination && data.pagination.total > 0 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      aria-disabled={currentPage === 1}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, Math.ceil(data.pagination.total / pageSize)) }).map((_, i) => {
                    const pageNumber = currentPage <= 3
                      ? i + 1
                      : currentPage + i - 2;

                    if (pageNumber > Math.ceil(data.pagination.total / pageSize)) {
                      return null;
                    }

                    return (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNumber)}
                          isActive={currentPage === pageNumber}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      aria-disabled={currentPage === 1}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <div className="text-sm text-muted-foreground text-center mt-2">
                Showing {offset + 1} to {Math.min(offset + filteredTransactions.length, data.pagination.total)} of {data.pagination.total} transactions
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
