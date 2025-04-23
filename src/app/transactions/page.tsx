'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/shared/main-layout';
import { TransactionList } from '@/components/shared/transaction-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { myPtsApi } from '@/lib/api/mypts-api';
import { MyPtsTransaction, TransactionType } from '@/types/mypts';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<MyPtsTransaction[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const [activeTab, setActiveTab] = useState('all');
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      let response;
      
      if (activeTab === 'all') {
        response = await myPtsApi.getTransactions(pagination.limit, pagination.offset);
      } else if (activeTab === 'type' && selectedType) {
        response = await myPtsApi.getTransactionsByType(selectedType, pagination.limit, pagination.offset);
      } else {
        // Default to all transactions
        response = await myPtsApi.getTransactions(pagination.limit, pagination.offset);
      }
      
      if (response.success && response.data) {
        setTransactions(response.data.transactions);
        setPagination(response.data.pagination);
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

  useEffect(() => {
    fetchTransactions();
  }, [activeTab, selectedType, pagination.offset, pagination.limit]);

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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Transaction History</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>My Transactions</CardTitle>
            <CardDescription>View your transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="all">All Transactions</TabsTrigger>
                  <TabsTrigger value="type">By Type</TabsTrigger>
                </TabsList>
                
                {activeTab === 'type' && (
                  <Select value={selectedType || ''} onValueChange={handleTypeChange}>
                    <SelectTrigger className="w-[200px]">
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
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              </TabsContent>
              
              <TabsContent value="type" className="mt-0">
                {selectedType ? (
                  <TransactionList 
                    transactions={transactions} 
                    isLoading={isLoading} 
                    pagination={pagination}
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
