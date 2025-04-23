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
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="hidden md:table-cell">Balance</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden lg:table-cell">Transaction ID</TableHead>
              <TableHead className="text-right">Details</TableHead>
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
                <TableRow key={transaction._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.type, transaction.amount)}
                      <span>{getTransactionTypeLabel(transaction.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                    {transaction.amount > 0 ? '+' : ''}
                    {transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {transaction.balance.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {getTransactionStatusBadge(transaction.status)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(transaction.createdAt)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-xs">
                    {transaction._id.substring(0, 10)}...
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
                          <span className="sr-only">View details</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Transaction Details</DialogTitle>
                          <div className="text-xs font-mono text-muted-foreground mt-1">
                            ID: {selectedTransaction?._id}
                          </div>
                        </DialogHeader>
                        {selectedTransaction && (
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Type</p>
                                <p className="text-sm font-semibold">
                                  {getTransactionTypeLabel(selectedTransaction.type)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Status</p>
                                <p className="text-sm font-semibold">
                                  {getTransactionStatusBadge(selectedTransaction.status)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Amount</p>
                                <p
                                  className={`text-sm font-semibold ${
                                    selectedTransaction.amount > 0
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {selectedTransaction.amount > 0 ? '+' : ''}
                                  {selectedTransaction.amount.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Balance</p>
                                <p className="text-sm font-semibold">
                                  {selectedTransaction.balance.toLocaleString()}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">Date</p>
                                <p className="text-sm font-semibold">
                                  {formatDate(selectedTransaction.createdAt)}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                  Description
                                </p>
                                <p className="text-sm">{selectedTransaction.description}</p>
                              </div>
                              {selectedTransaction.referenceId && (
                                <div className="col-span-2">
                                  <p className="text-sm font-medium text-muted-foreground">
                                    Reference ID
                                  </p>
                                  <p className="text-sm font-mono">
                                    {selectedTransaction.referenceId}
                                  </p>
                                </div>
                              )}
                              {selectedTransaction.hubLogId && (
                                <div className="col-span-2">
                                  <p className="text-sm font-medium text-muted-foreground">
                                    Hub Log ID
                                  </p>
                                  <p className="text-sm font-mono">
                                    {selectedTransaction.hubLogId}
                                  </p>
                                </div>
                              )}
                              {selectedTransaction.metadata && (
                                <div className="col-span-2">
                                  <p className="text-sm font-medium text-muted-foreground">
                                    Additional Information
                                  </p>
                                  <pre className="text-xs p-2 bg-muted rounded-md overflow-auto max-h-32">
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {pagination.offset + 1}-
            {Math.min(pagination.offset + transactions.length, pagination.total)} of{' '}
            {pagination.total} transactions
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={pagination.offset === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!pagination.hasMore}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
