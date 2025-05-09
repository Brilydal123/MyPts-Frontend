'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/shared/main-layout';
import { TransactionList } from '@/components/shared/transaction-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { MyPtsTransaction, TransactionType } from '@/types/mypts';
import { toast } from 'sonner';
import { useTransactions, useTransactionsByType } from '@/hooks/use-mypts-data';

export default function TransactionsPage() {
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
  });
  const [activeTab, setActiveTab] = useState('all');
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null);

  // Use React Query hooks based on active tab
  const {
    data: allTransactionsData,
    isLoading: isAllTransactionsLoading,
    refetch: refetchAllTransactions
  } = useTransactions(pagination.limit, pagination.offset);

  const {
    data: typeTransactionsData,
    isLoading: isTypeTransactionsLoading,
    refetch: refetchTypeTransactions
  } = useTransactionsByType(selectedType, pagination.limit, pagination.offset);

  // Determine which data to use based on active tab
  const transactions = activeTab === 'all'
    ? allTransactionsData?.transactions || []
    : typeTransactionsData?.transactions || [];

  // Get pagination from the active data source
  const currentPagination = activeTab === 'all'
    ? allTransactionsData?.pagination
    : typeTransactionsData?.pagination;

  // Combined loading state
  const isLoading = activeTab === 'all' ? isAllTransactionsLoading : isTypeTransactionsLoading;

  // Function to refresh the current data
  const refreshData = () => {
    if (activeTab === 'all') {
      refetchAllTransactions();
    } else {
      refetchTypeTransactions();
    }
    toast.success('Refreshing transactions...');
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPagination((prev) => ({ ...prev, offset: 0 })); // Reset pagination when tab changes
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value as TransactionType);
    setPagination((prev) => ({ ...prev, offset: 0 })); // Reset pagination when type changes
  };

  const handlePageChange = (offset: number) => {
    setPagination((prev) => ({ ...prev, offset }));
  };

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Transaction History</h1>
          <Button
            onClick={refreshData}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <Card className="w-full border-0 shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg md:text-xl">My Transactions</CardTitle>
            <CardDescription className="text-xs sm:text-sm">View your transaction history</CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <TabsList className="mb-3 sm:mb-0">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">All Transactions</TabsTrigger>
                  <TabsTrigger value="type" className="text-xs sm:text-sm">By Type</TabsTrigger>
                </TabsList>

                {activeTab === 'type' && (
                  <Select value={selectedType || ''} onValueChange={handleTypeChange}>
                    <SelectTrigger className="w-full sm:w-[200px] text-xs sm:text-sm">
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransactionType.BUY_MYPTS}>Buy MyPts</SelectItem>
                      <SelectItem value={TransactionType.SELL_MYPTS}>Sell MyPts</SelectItem>
                      <SelectItem value={TransactionType.EARN_MYPTS}>Earn MyPts</SelectItem>
                      <SelectItem value={TransactionType.PURCHASE_PRODUCT}>Purchase Product</SelectItem>
                      <SelectItem value={TransactionType.RECEIVE_PRODUCT_PAYMENT}>Product Payment</SelectItem>
                      <SelectItem value={TransactionType.DONATION_SENT}>Donation Sent</SelectItem>
                      <SelectItem value={TransactionType.DONATION_RECEIVED}>Donation Received</SelectItem>
                      <SelectItem value={TransactionType.REFUND}>Refund</SelectItem>
                      <SelectItem value={TransactionType.ADJUSTMENT}>Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <TabsContent value="all" className="mt-0">
                <TransactionList
                  transactions={transactions}
                  isLoading={isLoading}
                  pagination={currentPagination || {
                    total: 0,
                    limit: pagination.limit,
                    offset: pagination.offset,
                    hasMore: false
                  }}
                  onPageChange={handlePageChange}
                />
              </TabsContent>

              <TabsContent value="type" className="mt-0">
                {selectedType ? (
                  <TransactionList
                    transactions={transactions}
                    isLoading={isLoading}
                    pagination={currentPagination || {
                      total: 0,
                      limit: pagination.limit,
                      offset: pagination.offset,
                      hasMore: false
                    }}
                    onPageChange={handlePageChange}
                  />
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Please select a transaction type
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
