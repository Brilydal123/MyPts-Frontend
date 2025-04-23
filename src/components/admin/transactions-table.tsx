import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow, format } from 'date-fns';
import { Info, ArrowUpDown } from 'lucide-react';
import { TransactionType, TransactionStatus } from '@/types/mypts';

interface TransactionsTableProps {
  transactions: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function TransactionsTable({ transactions, isLoading, onRefresh }: TransactionsTableProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return <Badge variant="success">Completed</Badge>;
      case TransactionStatus.PENDING:
        return <Badge variant="warning">Pending</Badge>;
      case TransactionStatus.FAILED:
        return <Badge variant="destructive">Failed</Badge>;
      case TransactionStatus.CANCELLED:
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case TransactionType.BUY_MYPTS:
        return <Badge variant="default">Buy</Badge>;
      case TransactionType.SELL_MYPTS:
        return <Badge variant="secondary">Sell</Badge>;
      case TransactionType.EARN_MYPTS:
        return <Badge variant="success">Earn</Badge>;
      case TransactionType.PURCHASE_PRODUCT:
        return <Badge variant="destructive">Purchase</Badge>;
      case TransactionType.RECEIVE_PRODUCT_PAYMENT:
        return <Badge variant="success">Payment</Badge>;
      case TransactionType.DONATION_SENT:
        return <Badge variant="warning">Donation Sent</Badge>;
      case TransactionType.DONATION_RECEIVED:
        return <Badge variant="success">Donation Received</Badge>;
      case TransactionType.REFUND:
        return <Badge variant="outline">Refund</Badge>;
      case TransactionType.ADJUSTMENT:
        return <Badge variant="secondary">Adjustment</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    );
  }

  // Sort transactions
  const sortedTransactions = [...transactions].sort((a, b) => {
    if (sortField === 'amount') {
      return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    } else if (sortField === 'createdAt') {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }
    return 0;
  });

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center">
                  Date
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center">
                  Amount
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Profile</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.map((transaction) => (
              <TableRow key={transaction._id}>
                <TableCell>
                  {formatDate(transaction.createdAt)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {transaction._id}
                </TableCell>
                <TableCell>
                  {getTypeBadge(transaction.type)}
                </TableCell>
                <TableCell className="font-medium">
                  {transaction.amount.toLocaleString()} MyPts
                </TableCell>
                <TableCell>
                  {transaction.profileId}
                </TableCell>
                <TableCell>
                  {getStatusBadge(transaction.status)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    <Info className="h-4 w-4" />
                    <span className="sr-only">View details</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Transaction details dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              {selectedTransaction && formatDate(selectedTransaction.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
                <p className="font-mono text-xs break-all">{selectedTransaction._id}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <div>{getTypeBadge(selectedTransaction.type)}</div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Amount</p>
                <p className="font-medium">{selectedTransaction.amount.toLocaleString()} MyPts</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div>{getStatusBadge(selectedTransaction.status)}</div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Profile ID</p>
                <p className="font-mono text-xs break-all">{selectedTransaction.profileId}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Balance After</p>
                <p className="font-medium">{selectedTransaction.balance.toLocaleString()} MyPts</p>
              </div>
              
              {selectedTransaction.description && (
                <div className="col-span-2 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p>{selectedTransaction.description}</p>
                </div>
              )}
              
              {selectedTransaction.metadata && (
                <div className="col-span-2 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Metadata</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
