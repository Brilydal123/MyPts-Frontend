"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Calendar,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { myPtsHubApi } from "@/lib/api/mypts-api";

// Define the transaction interface based on actual backend response
interface SupplyLogEntry {
  _id: string;
  action: string;
  amount: number;
  adminId: string;
  adminName?: string;
  reason: string;
  metadata?: any;
  timestamp?: string;
  createdAt: string;
  totalSupplyBefore: number;
  totalSupplyAfter: number;
  circulatingSupplyBefore: number;
  circulatingSupplyAfter: number;
  reserveSupplyBefore: number;
  reserveSupplyAfter: number;
  valuePerMyPt: number;
}

export default function TransactionsPage() {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<SupplyLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<SupplyLogEntry | null>(null);

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Date range for filtering
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Fetch transactions from the backend
  const fetchTransactions = async () => {
    setIsLoading(true);

    try {
      // Prepare filter parameters
      const filter: any = {};

      if (actionFilter !== "all") {
        filter.action = actionFilter;
      }

      if (dateRange.from && dateRange.to) {
        filter.startDate = dateRange.from;
        filter.endDate = dateRange.to;
      }

      // Pagination parameters
      const pagination = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };

      // Call the API
      const response = await myPtsHubApi.getSupplyLogs(filter, pagination);

      if (response.success && response.data) {
        console.log("Supply logs fetched successfully:", response.data);

        if (Array.isArray(response.data.logs)) {
          setTransactions(response.data.logs);
          setTotalCount(response.data.pagination.total);
        } else {
          console.error(
            "API response logs is not an array:",
            response.data.logs
          );
          toast.error("Invalid response format from server");
          setTransactions([]);
          setTotalCount(0);
        }
      } else {
        console.error("Failed to fetch supply logs:", response.message);
        toast.error("Failed to fetch transaction history");
        setTransactions([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching supply logs:", error);
      toast.error("Failed to fetch transaction history");
      setTransactions([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch transactions whenever filters or pagination changes
  useEffect(() => {
    fetchTransactions();
  }, [currentPage, actionFilter, dateRange.from, dateRange.to]);

  // Filter transactions by search query
  const filteredTransactions = transactions.filter((tx) => {
    if (!searchQuery) return true;

    return (
      tx._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.adminName &&
        tx.adminName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";

    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get badge variant based on action type
  const getActionVariant = (action: string) => {
    switch (action) {
      case "ISSUE":
        return "default";
      case "MOVE_TO_CIRCULATION":
        return "secondary";
      case "MOVE_TO_RESERVE":
        return "outline";
      case "ADJUST_MAX_SUPPLY":
        return "default";
      case "UPDATE_VALUE":
        return "secondary";
      case "RECONCILE":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Format action name for display
  const formatActionName = (action: string) => {
    switch (action) {
      case "ISSUE":
        return "Issue";
      case "MOVE_TO_CIRCULATION":
        return "To Circulation";
      case "MOVE_TO_RESERVE":
        return "To Reserve";
      case "ADJUST_MAX_SUPPLY":
        return "Adjust Max";
      case "UPDATE_VALUE":
        return "Update Value";
      case "RECONCILE":
        return "Reconcile";
      default:
        return action.replace(/_/g, " ").toLowerCase();
    }
  };

  // View transaction details
  const handleViewTransaction = (transaction: SupplyLogEntry) => {
    setSelectedTransaction(transaction);
    // Open the modal dialog
    setIsModalOpen(true);
  };

  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className={`space-y-6 transition-all ${isModalOpen ? 'blur-sm' : ''}`}>
      <h1 className="text-3xl font-bold">Transaction History</h1>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transactions..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Date Range</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const today = new Date();
                      const lastWeek = new Date();
                      lastWeek.setDate(today.getDate() - 7);
                      setDateRange({ from: lastWeek, to: today });
                    }}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const today = new Date();
                      const lastMonth = new Date();
                      lastMonth.setMonth(today.getMonth() - 1);
                      setDateRange({ from: lastMonth, to: today });
                    }}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setDateRange({ from: undefined, to: undefined })
                    }
                  >
                    Clear dates
                  </Button>
                </div>
                {dateRange.from && dateRange.to && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Selected range:</p>
                    <p className="font-medium">
                      {dateRange.from.toLocaleDateString()} -{" "}
                      {dateRange.to.toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="ISSUE">Issue</SelectItem>
              <SelectItem value="MOVE_TO_CIRCULATION">
                To Circulation
              </SelectItem>
              <SelectItem value="MOVE_TO_RESERVE">To Reserve</SelectItem>
              <SelectItem value="ADJUST_MAX_SUPPLY">Adjust Max</SelectItem>
              <SelectItem value="UPDATE_VALUE">Update Value</SelectItem>
              <SelectItem value="RECONCILE">Reconcile</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button variant="outline" size="sm" onClick={fetchTransactions}>
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Transaction table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`loading-${i}`}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={`loading-cell-${i}-${j}`}>
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredTransactions.length > 0 ? (
                // Show transactions when data is available
                filteredTransactions.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell>
                      {formatDate(tx.createdAt || tx.timestamp)}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {tx._id.substring(0, 10)}...
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionVariant(tx.action)}>
                        {formatActionName(tx.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {tx.amount?.toLocaleString() || 0} MyPts
                    </TableCell>
                    <TableCell>{tx.adminName || "Admin"}</TableCell>
                    <TableCell
                      className="max-w-[200px] truncate"
                      title={tx.reason}
                    >
                      {tx.reason}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewTransaction(tx)}
                      >
                        <Info className="h-4 w-4" />
                        <span className="sr-only md:not-sr-only md:inline-block ml-2">
                          View
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                // Show empty state when no data
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No transactions found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4">
          <div className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading transactions..."
              : `Showing ${filteredTransactions.length} of ${totalCount} transactions`}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      </div>
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
                <p className="font-mono text-sm break-all">
                  {selectedTransaction._id}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Admin
                </h4>
                <p>
                  {selectedTransaction.adminName || selectedTransaction.adminId}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Amount
                </h4>
                <p className="text-xl font-bold">
                  {selectedTransaction.amount?.toLocaleString() || 0} MyPts
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Value per MyPt
                </h4>
                <p>${selectedTransaction.valuePerMyPt?.toFixed(6) || 0} USD</p>
              </div>
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Reason
                </h4>
                <p>{selectedTransaction.reason}</p>
              </div>
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Supply Change
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="font-medium">Total Supply</div>
                    <div className="flex justify-between">
                      <span>Before:</span>
                      <span>
                        {selectedTransaction.totalSupplyBefore?.toLocaleString() ||
                          0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>After:</span>
                      <span>
                        {selectedTransaction.totalSupplyAfter?.toLocaleString() ||
                          0}
                      </span>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="font-medium">Circulating</div>
                    <div className="flex justify-between">
                      <span>Before:</span>
                      <span>
                        {selectedTransaction.circulatingSupplyBefore?.toLocaleString() ||
                          0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>After:</span>
                      <span>
                        {selectedTransaction.circulatingSupplyAfter?.toLocaleString() ||
                          0}
                      </span>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="font-medium">Reserve</div>
                    <div className="flex justify-between">
                      <span>Before:</span>
                      <span>
                        {selectedTransaction.reserveSupplyBefore?.toLocaleString() ||
                          0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>After:</span>
                      <span>
                        {selectedTransaction.reserveSupplyAfter?.toLocaleString() ||
                          0}
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
                    {selectedTransaction.metadata.profileId.$oid || selectedTransaction.metadata.profileId}
                  </p>
                </div>
              )}
              {selectedTransaction.metadata?.transactionId && (
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Related Transaction
                  </h4>
                  <p className="text-sm font-mono">
                    {selectedTransaction.metadata.transactionId.$oid || selectedTransaction.metadata.transactionId}
                  </p>
                </div>
              )}
              {selectedTransaction.metadata && (
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Additional Metadata
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
    </>
  );
}
