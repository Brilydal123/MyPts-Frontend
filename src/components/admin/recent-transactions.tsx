'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, Clock } from 'lucide-react';
import { myPtsHubApi } from '@/lib/api/mypts-api';
import { useRouter } from 'next/navigation';

// Define the transaction interface based on actual backend response
interface SupplyLogEntry {
  _id: string;
  action: string;
  amount: number;
  adminId: string;
  adminName?: string;
  reason: string;
  timestamp?: string;
  createdAt: string;
  totalSupplyBefore: number;
  totalSupplyAfter: number;
  circulatingSupplyBefore: number;
  circulatingSupplyAfter: number;
  reserveSupplyBefore: number;
  reserveSupplyAfter: number;
  valuePerMyPt: number;
  metadata?: {
    profileId?: {
      $oid: string;
    } | string;
    transactionId?: {
      $oid: string;
    } | string;
    [key: string]: any;
  };
}

interface RecentTransactionsProps {
  limit?: number;
}

export function RecentTransactions({ limit = 5 }: RecentTransactionsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<SupplyLogEntry[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<SupplyLogEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Fetch recent transactions
  const fetchTransactions = async () => {
    setIsLoading(true);
    
    try {
      // Pagination parameters
      const pagination = {
        limit,
        offset: 0
      };
      
      // Call the API
      const response = await myPtsHubApi.getSupplyLogs({}, pagination);
      
      if (response.success && response.data && Array.isArray(response.data.logs)) {
        setTransactions(response.data.logs);
      } else {
        console.error('Failed to fetch recent transactions:', response.message);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch transactions on component mount
  useEffect(() => {
    fetchTransactions();
  }, []);
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      // Show relative time for recent transactions
      if (diffMins < 60) {
        return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      }
      
      // Show formatted date for older transactions
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Get badge variant based on action type
  const getActionVariant = (action: string) => {
    switch (action) {
      case 'ISSUE': return 'default';
      case 'MOVE_TO_CIRCULATION': return 'secondary';
      case 'MOVE_TO_RESERVE': return 'outline';
      case 'ADJUST_MAX_SUPPLY': return 'default';
      case 'UPDATE_VALUE': return 'secondary';
      case 'RECONCILE': return 'destructive';
      default: return 'outline';
    }
  };
  
  // Format action name for display
  const formatActionName = (action: string) => {
    switch (action) {
      case 'ISSUE': return 'Issue';
      case 'MOVE_TO_CIRCULATION': return 'To Circulation';
      case 'MOVE_TO_RESERVE': return 'To Reserve';
      case 'ADJUST_MAX_SUPPLY': return 'Adjust Max';
      case 'UPDATE_VALUE': return 'Update Value';
      case 'RECONCILE': return 'Reconcile';
      default: return action.replace(/_/g, ' ').toLowerCase();
    }
  };

  // View transaction details
  const handleViewTransaction = (transaction: SupplyLogEntry) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
    console.log('Viewing transaction details:', transaction);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Recent Transactions</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-muted-foreground"
          onClick={() => router.push('/admin/transactions')}
        >
          <Clock className="mr-1 h-4 w-4" />
          View All
        </Button>
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
                <TableHead className="w-[30%]">Action</TableHead>
                <TableHead className="w-[40%]">Reason</TableHead>
                <TableHead className="w-[15%]">Amount</TableHead>
                <TableHead className="w-[15%]">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewTransaction(tx)}>
                  <TableCell className="align-top">
                    <Badge variant={getActionVariant(tx.action)} className="w-fit">
                      {formatActionName(tx.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground break-words" style={{ wordBreak: 'break-word', display: 'block', maxHeight: '60px', overflowY: 'auto' }}>
                      {tx.reason || 'No reason provided'}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium align-top">
                    {tx.amount?.toLocaleString() || 0} MyPts
                  </TableCell>
                  <TableCell className="text-muted-foreground align-top">
                    <span className="text-xs whitespace-nowrap">
                      {formatDate(tx.createdAt || tx.timestamp)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            No recent transactions found
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => router.push('/admin/transactions')}
        >
          View All Transactions
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>

      {/* Transaction details dialog */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) setSelectedTransaction(null);
      }}>
        <DialogContent className="w-[calc(100vw-2rem)] mx-auto backdrop-blur-sm bg-background/95">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="flex items-center">
                  Transaction Details
                  {selectedTransaction && (
                    <Badge
                      className="ml-2"
                      variant={getActionVariant(selectedTransaction.action)}
                    >
                      {formatActionName(selectedTransaction.action)}
                    </Badge>
                  )}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedTransaction && formatDate(
                    selectedTransaction.createdAt ||
                      selectedTransaction.timestamp
                  )}
                </p>
              </div>
            </div>
          </DialogHeader>
          {selectedTransaction && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Transaction ID
                </h4>
                <p className="text-sm font-mono">{selectedTransaction._id}</p>
                <h4 className="text-sm font-medium text-muted-foreground mt-4">
                  Admin
                </h4>
                <p className="text-sm">
                  {selectedTransaction.adminName || "Unknown"}
                  <span className="text-xs text-muted-foreground block">
                    ID: {selectedTransaction.adminId}
                  </span>
                </p>
                <h4 className="text-sm font-medium text-muted-foreground mt-4">
                  Amount
                </h4>
                <p className="text-lg font-bold">
                  {selectedTransaction.amount?.toLocaleString() || 0} MyPts
                </p>
                <h4 className="text-sm font-medium text-muted-foreground mt-4">
                  Reason
                </h4>
                <p className="text-sm">{selectedTransaction.reason}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Supply Change
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="font-medium">Total Supply</div>
                    <div className="flex justify-between">
                      <span>Before:</span>
                      <span className="font-medium">
                        {selectedTransaction.totalSupplyBefore?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>After:</span>
                      <span className="font-medium">
                        {selectedTransaction.totalSupplyAfter?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="font-medium">Circulating</div>
                    <div className="flex justify-between">
                      <span>Before:</span>
                      <span className="font-medium">
                        {selectedTransaction.circulatingSupplyBefore?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>After:</span>
                      <span className="font-medium">
                        {selectedTransaction.circulatingSupplyAfter?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="font-medium">Reserve</div>
                    <div className="flex justify-between">
                      <span>Before:</span>
                      <span className="font-medium">
                        {selectedTransaction.reserveSupplyBefore?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>After:</span>
                      <span className="font-medium">
                        {selectedTransaction.reserveSupplyAfter?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {selectedTransaction.metadata?.profileId && (
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Related Profile
                  </h4>
                  <p className="text-sm font-mono">
                    {typeof selectedTransaction.metadata.profileId === 'object' && selectedTransaction.metadata.profileId.$oid ? 
                      selectedTransaction.metadata.profileId.$oid : 
                      String(selectedTransaction.metadata.profileId)}
                  </p>
                </div>
              )}
              {selectedTransaction.metadata?.transactionId && (
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Related Transaction
                  </h4>
                  <p className="text-sm font-mono">
                    {typeof selectedTransaction.metadata.transactionId === 'object' && selectedTransaction.metadata.transactionId.$oid ? 
                      selectedTransaction.metadata.transactionId.$oid : 
                      String(selectedTransaction.metadata.transactionId)}
                  </p>
                </div>
              )}
              {selectedTransaction.metadata && (
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Metadata
                  </h4>
                  <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
