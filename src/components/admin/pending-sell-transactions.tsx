'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { myPtsHubApi } from '@/lib/api/mypts-api';
import { TransactionStatus, TransactionType } from '@/types/mypts';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, CreditCard, DollarSign } from 'lucide-react';

interface PendingSellTransactionsProps {
  limit?: number;
}

export function PendingSellTransactions({ limit = 5 }: PendingSellTransactionsProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [count, setCount] = useState(0);

  // Fetch pending sell transactions
  const fetchPendingSellTransactions = async () => {
    setIsLoading(true);

    try {
      // Call the API
      const response = await myPtsHubApi.getAllProfileTransactions({
        type: TransactionType.SELL_MYPTS,
        status: TransactionStatus.RESERVED,
        limit
      });

      if (response.success && response.data) {
        if (Array.isArray(response.data.transactions)) {
          setTransactions(response.data.transactions);
          setCount(response.data.pagination.total);
        } else if (Array.isArray(response.data)) {
          setTransactions(response.data);
          setCount(response.data.length);
        } else {
          console.error('Unexpected response format:', response.data);
          setTransactions([]);
          setCount(0);
        }
      } else {
        console.error('Failed to fetch pending sell transactions:', response.message);
        setTransactions([]);
        setCount(0);
      }
    } catch (error) {
      console.error('Error fetching pending sell transactions:', error);
      setTransactions([]);
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch transactions on component mount
  useEffect(() => {
    fetchPendingSellTransactions();
  }, []);

  // Format date helper
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-md font-medium">Pending Sell Requests</CardTitle>
          <CardDescription>Sell transactions awaiting approval</CardDescription>
        </div>
        {count > 0 && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {count} pending
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Profile ID</TableHead>
                <TableHead className="w-[30%]">Amount</TableHead>
                <TableHead className="w-[30%]">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow
                  key={tx._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/sell-transactions?id=${tx._id}`)}
                >
                  <TableCell className="font-mono text-xs">
                    {tx.profileId.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-red-500" />
                      <span>{Math.abs(tx.amount).toLocaleString()} MyPts</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="text-xs whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="bg-blue-50 p-3 rounded-full mb-3">
                <CreditCard className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-gray-600">No pending sell requests</p>
              <p className="text-xs text-gray-400 mt-1">All sell requests have been processed</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => router.push('/admin/sell-transactions')}
        >
          View All Sell Transactions
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
