'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { myPtsHubApi } from '@/lib/api/mypts-api';
import { adminApi } from '@/lib/api/admin-api';
import { MyPtsTransaction, TransactionStatus, TransactionType } from '@/types/mypts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, RefreshCw, Calendar, ChevronLeft, ChevronRight, Info, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Create a client
const queryClient = new QueryClient();

// Wrapper component with QueryClientProvider
export default function SellTransactionsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <SellTransactions />
    </QueryClientProvider>
  );
}

// Main component with the actual implementation
function SellTransactions() {
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('RESERVED');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // State for selected transaction
  const [selectedTransaction, setSelectedTransaction] = useState<MyPtsTransaction | null>(null);

  // State for approval dialog
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate offset for pagination
  const offset = (currentPage - 1) * pageSize;

  // Fetch transactions
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sellTransactions', offset, pageSize, selectedStatus, selectedProfileId, dateRange],
    queryFn: async () => {
      try {
        const params: any = {
          offset,
          limit: pageSize,
          type: TransactionType.SELL_MYPTS,
        };

        if (selectedStatus && selectedStatus !== 'all') {
          params.status = selectedStatus;
        }

        if (selectedProfileId && selectedProfileId.trim() !== '') {
          params.profileId = selectedProfileId;
        }

        if (dateRange?.from) {
          params.startDate = dateRange.from;
        }

        if (dateRange?.to) {
          params.endDate = dateRange.to;
        }

        const response = await myPtsHubApi.getAllProfileTransactions(params);
        console.log('Sell transactions response:', response);

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
        console.error('Error fetching sell transactions:', error);
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case TransactionStatus.PENDING:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case TransactionStatus.RESERVED:
        return <Badge className="bg-blue-100 text-blue-800">Reserved</Badge>;
      case TransactionStatus.FAILED:
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case TransactionStatus.CANCELLED:
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      case TransactionStatus.REJECTED:
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
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

  // Handle transaction approval
  const handleApproveTransaction = async () => {
    if (!selectedTransaction) return;

    setIsProcessing(true);

    try {
      const response = await adminApi.processSellTransaction(
        selectedTransaction._id,
        paymentReference,
        notes
      );

      if (response.success) {
        toast.success('Transaction approved successfully', {
          description: `Transaction ${selectedTransaction._id.substring(0, 8)}... has been approved.`
        });

        // Close dialog and reset form
        setIsApprovalDialogOpen(false);
        setPaymentReference('');
        setNotes('');
        setSelectedTransaction(null);

        // Refresh the data
        refetch();
      } else {
        toast.error('Failed to approve transaction', {
          description: response.message || 'An error occurred'
        });
      }
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast.error('Failed to approve transaction', {
        description: 'An unexpected error occurred'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle transaction rejection
  const handleRejectTransaction = async () => {
    if (!selectedTransaction) return;

    setIsProcessing(true);

    try {
      const response = await adminApi.rejectSellTransaction(
        selectedTransaction._id,
        rejectionReason
      );

      if (response.success) {
        toast.success('Transaction rejected successfully', {
          description: `Transaction ${selectedTransaction._id.substring(0, 8)}... has been rejected.`
        });

        // Close dialog and reset form
        setIsRejectionDialogOpen(false);
        setRejectionReason('');
        setSelectedTransaction(null);

        // Refresh the data
        refetch();
      } else {
        toast.error('Failed to reject transaction', {
          description: response.message || 'An error occurred'
        });
      }
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast.error('Failed to reject transaction', {
        description: 'An unexpected error occurred'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Sell Transactions</h1>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter sell transactions by various criteria</CardDescription>
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
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={TransactionStatus.RESERVED}>Reserved</SelectItem>
                  <SelectItem value={TransactionStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={TransactionStatus.REJECTED}>Rejected</SelectItem>
                  <SelectItem value={TransactionStatus.FAILED}>Failed</SelectItem>
                  <SelectItem value={TransactionStatus.CANCELLED}>Cancelled</SelectItem>
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
                setSelectedStatus('RESERVED');
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
            <CardTitle>Sell Transactions</CardTitle>
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
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                      <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
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
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Error loading transactions. Please try again.
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell className="font-mono text-xs">
                      {transaction.profileId.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="text-red-600">
                      {Math.abs(transaction.amount).toLocaleString()} MyPts
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell>
                      {formatDate(transaction.createdAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {transaction._id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        {transaction.status === TransactionStatus.RESERVED && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setIsApprovalDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span className="sr-only">Approve</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setIsRejectionDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                              <span className="sr-only">Reject</span>
                            </Button>
                          </>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedTransaction(transaction)}
                            >
                              <Info className="h-4 w-4" />
                              <span className="sr-only">View details</span>
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
                                  <Badge className="bg-red-100 text-red-800">
                                    {selectedTransaction.type.replace(/_/g, ' ')}
                                  </Badge>
                                </div>

                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Amount</h4>
                                  <p className="text-red-600">
                                    {Math.abs(selectedTransaction.amount).toLocaleString()} MyPts
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
                                  {getStatusBadge(selectedTransaction.status)}
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

                                    {/* Stripe Payment Error Alert */}
                                    {selectedTransaction.metadata.paymentResult?.status === 'error' ||
                                     selectedTransaction.metadata.paymentResult?.status === 'manual_required' ? (
                                      <div className="mb-3 bg-amber-50 border border-amber-200 p-3 rounded-md">
                                        <h5 className="text-sm font-medium text-amber-800 flex items-center">
                                          <AlertTriangle className="h-4 w-4 mr-1" />
                                          Stripe Payout Error
                                        </h5>
                                        <p className="text-sm text-amber-700 mt-1">
                                          {selectedTransaction.metadata.paymentResult.error || 'An error occurred with the Stripe payout'}
                                        </p>

                                        {selectedTransaction.metadata.paymentResult.adminNotes && (
                                          <div className="mt-2 p-2 bg-white/50 rounded border border-amber-200">
                                            <p className="text-xs text-amber-800 whitespace-pre-wrap">
                                              {selectedTransaction.metadata.paymentResult.adminNotes}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    ) : null}

                                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                      {JSON.stringify(selectedTransaction.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {selectedTransaction.status === TransactionStatus.RESERVED && (
                                  <div className="col-span-2 mt-4">
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        className="border-green-500 text-green-600 hover:bg-green-50"
                                        onClick={() => {
                                          setIsApprovalDialogOpen(true);
                                        }}
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve Transaction
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="border-red-500 text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                          setIsRejectionDialogOpen(true);
                                        }}
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject Transaction
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
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

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Sell Transaction</DialogTitle>
            <DialogDescription>
              Approving this transaction will deduct the MyPts from the user's balance and process the payment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-4">
                <label className="text-sm font-medium mb-1 block">Payment Reference</label>
                <Input
                  placeholder="Enter payment reference (e.g., transfer ID)"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>
              <div className="col-span-4">
                <label className="text-sm font-medium mb-1 block">Notes</label>
                <Textarea
                  placeholder="Enter any notes about this transaction"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-amber-50 p-4 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-800">Important</h4>
                    <p className="text-sm text-amber-700">
                      Make sure you have sent the payment to the user before approving this transaction.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              {selectedTransaction?.metadata?.accountDetails?.paymentMethod === 'stripe' && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Stripe Payout Information</h4>
                      <p className="text-sm text-blue-700">
                        This transaction will attempt to create a Stripe payout. For this to work:
                      </p>
                      <ul className="text-sm text-blue-700 list-disc ml-5 mt-1">
                        <li>Your Stripe account must have an external account (bank account) set up for USD payouts</li>
                        <li>Your Stripe account must have sufficient funds to cover the payout amount</li>
                        <li>If using Stripe Connect, the destination account must be properly configured</li>
                      </ul>
                      <p className="text-sm text-blue-700 mt-1">
                        If any of these conditions are not met, the transaction will still be marked as completed,
                        but you'll need to process the payment manually.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveTransaction}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Processing...' : 'Approve Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Sell Transaction</DialogTitle>
            <DialogDescription>
              Rejecting this transaction will cancel the sell request. The user's MyPts will not be deducted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-4">
                <label className="text-sm font-medium mb-1 block">Reason for Rejection</label>
                <Textarea
                  placeholder="Enter reason for rejecting this transaction"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This reason will be visible to the user.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectionDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectTransaction}
              disabled={isProcessing}
              variant="destructive"
            >
              {isProcessing ? 'Processing...' : 'Reject Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
