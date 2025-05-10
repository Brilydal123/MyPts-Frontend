import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MyPtsTransaction, TransactionStatus, TransactionType } from '@/types/mypts';
import { ArrowUpRight, ArrowDownRight, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface TransactionListProps {
  transactions: MyPtsTransaction[];
  isLoading?: boolean;
  isFetching?: boolean; // Added to show fetching state
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  onPageChange?: (offset: number) => void;
}

export function TransactionList({
  transactions,
  isLoading = false,
  isFetching = false,
  pagination,
  onPageChange,
}: TransactionListProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<MyPtsTransaction | null>(null);

  const getTransactionTypeLabel = (type: TransactionType): string => {
    switch (type) {
      case TransactionType.BUY_MYPTS:
        return 'Buy MyPts';
      case TransactionType.SELL_MYPTS:
        return 'Sell MyPts';
      case TransactionType.EARN_MYPTS:
        return 'Earn MyPts';
      case TransactionType.PURCHASE_PRODUCT:
        return 'Purchase Product';
      case TransactionType.RECEIVE_PRODUCT_PAYMENT:
        return 'Product Payment';
      case TransactionType.DONATION_SENT:
        return 'Donation Sent';
      case TransactionType.DONATION_RECEIVED:
        return 'Donation Received';
      case TransactionType.REFUND:
        return 'Refund';
      case TransactionType.EXPIRE:
        return 'Expired';
      case TransactionType.ADJUSTMENT:
        return 'Adjustment';
      default:
        return type;
    }
  };

  const getTransactionStatusBadge = (status: TransactionStatus): any => {
    let bgColor = '';
    let textColor = '';

    switch (status) {
      case TransactionStatus.COMPLETED:
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      case TransactionStatus.PENDING:
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        break;
      case TransactionStatus.FAILED:
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        break;
      case TransactionStatus.CANCELLED:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        break;
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {status}
      </span>
    );
  };

  const getTransactionIcon = (type: TransactionType, amount: number): any => {
    if (amount > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    } else {
      return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handlePrevPage = () => {
    if (pagination && pagination.offset > 0 && onPageChange) {
      const newOffset = Math.max(0, pagination.offset - pagination.limit);
      onPageChange(newOffset);
    }
  };

  const handleNextPage = () => {
    if (pagination && pagination.hasMore && onPageChange) {
      const newOffset = pagination.offset + pagination.limit;
      onPageChange(newOffset);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      <div className={`rounded-md border transition-all duration-300 hover:shadow-lg shadow-md bg-card overflow-hidden overflow-x-auto w-full relative ${isFetching ? 'opacity-70' : ''}`}>
        {/* Fetching indicator overlay */}
        {isFetching && !isLoading && (
          <div className="absolute top-0 right-0 m-2 z-10 flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium animate-pulse">
            <div className="h-2 w-2 rounded-full bg-primary animate-ping"></div>
            Updating...
          </div>
        )}

        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap">Type</TableHead>
              <TableHead className="text-xs sm:text-sm whitespace-nowrap">Amount</TableHead>
              <TableHead className="hidden md:table-cell text-xs sm:text-sm whitespace-nowrap">Balance</TableHead>
              <TableHead className="hidden md:table-cell text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
              <TableHead className="hidden md:table-cell text-xs sm:text-sm whitespace-nowrap">Date</TableHead>
              <TableHead className="hidden lg:table-cell text-xs sm:text-sm whitespace-nowrap">Transaction ID</TableHead>
              <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-8 w-8 bg-muted rounded-full ml-auto animate-pulse"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction._id} className="hover:bg-muted/50 transition-colors text-xs sm:text-sm">
                  <TableCell className="py-2 sm:py-3">
                    <div className="flex items-center gap-1 sm:gap-2">
                      {getTransactionIcon(transaction.type, transaction.amount)}
                      <span className="text-xs sm:text-sm whitespace-nowrap">{getTransactionTypeLabel(transaction.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell className={`py-2 sm:py-3 text-xs sm:text-sm ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}
                    {transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-2 sm:py-3 text-xs sm:text-sm">
                    {transaction.balance.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-2 sm:py-3">
                    {getTransactionStatusBadge(transaction.status)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">
                    {formatDate(transaction.createdAt)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-xs py-2 sm:py-3">
                    {transaction._id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="text-right py-2 sm:py-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedTransaction(transaction)}
                          className="hover:bg-primary/10 h-7 w-7 sm:h-8 sm:w-8"
                        >
                          <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="sr-only">View details</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[90vw] sm:max-w-[425px] shadow-lg">
                        <DialogHeader>
                          <DialogTitle className="text-base sm:text-lg">Transaction Details</DialogTitle>
                          <div className="text-[10px] sm:text-xs font-mono text-muted-foreground mt-1 break-all">
                            ID: {selectedTransaction?._id}
                          </div>
                        </DialogHeader>
                        {selectedTransaction && (
                          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
                            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                              <div>
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Type</p>
                                <p className="text-xs sm:text-sm font-semibold">
                                  {getTransactionTypeLabel(selectedTransaction.type)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Status</p>
                                <p className="text-xs sm:text-sm font-semibold">
                                  {getTransactionStatusBadge(selectedTransaction.status)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Amount</p>
                                <p
                                  className={`text-xs sm:text-sm font-semibold ${selectedTransaction.amount > 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                    }`}
                                >
                                  {selectedTransaction.amount > 0 ? '+' : ''}
                                  {selectedTransaction.amount.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Balance</p>
                                <p className="text-xs sm:text-sm font-semibold">
                                  {selectedTransaction.balance.toLocaleString()}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Date</p>
                                <p className="text-xs sm:text-sm font-semibold">
                                  {formatDate(selectedTransaction.createdAt)}
                                </p>
                              </div>
                              {selectedTransaction.description && (
                                <div className="col-span-2">
                                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                                    Description
                                  </p>
                                  <p className="text-xs sm:text-sm">{selectedTransaction.description}</p>
                                </div>
                              )}
                              {selectedTransaction.referenceId && (
                                <div className="col-span-2">
                                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                                    Reference ID
                                  </p>
                                  <p className="text-xs sm:text-sm font-mono break-all">
                                    {selectedTransaction.referenceId}
                                  </p>
                                </div>
                              )}
                              {selectedTransaction.hubLogId && (
                                <div className="col-span-2">
                                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                                    Hub Log ID
                                  </p>
                                  <p className="text-xs sm:text-sm font-mono break-all">
                                    {selectedTransaction.hubLogId}
                                  </p>
                                </div>
                              )}
                              {selectedTransaction.metadata && (
                                <div className="col-span-2">
                                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                                    Additional Information
                                  </p>
                                  <pre className="text-[10px] sm:text-xs p-1 sm:p-2 bg-muted rounded-md overflow-auto max-h-24 sm:max-h-32">
                                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
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
      </div>

      {pagination && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Showing {pagination.offset + 1}-
            {Math.min(pagination.offset + transactions.length, pagination.total)} of{' '}
            {pagination.total} transactions
          </p>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={pagination.offset === 0}
              className="shadow-sm hover:shadow text-xs sm:text-sm h-8 sm:h-9"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!pagination.hasMore}
              className="shadow-sm hover:shadow text-xs sm:text-sm h-8 sm:h-9"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
