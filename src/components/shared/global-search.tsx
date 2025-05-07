"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import {
  Search,
  User,
  CreditCard,
  BarChart,
  Settings,
  Loader2
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { profileApi } from "@/lib/api/profile-api";
import { myPtsApi } from "@/lib/api/mypts-api";
import { useAuth } from "@/hooks/use-auth";

interface GlobalSearchProps {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GlobalSearch({ defaultOpen, onOpenChange }: GlobalSearchProps = {}) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(defaultOpen || false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  // Handle external open state changes
  useEffect(() => {
    if (defaultOpen !== undefined && defaultOpen !== open) {
      setOpen(defaultOpen);
    }
  }, [defaultOpen]);

  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setProfiles([]);
      setTransactions([]);
      return;
    }

    const fetchSearchResults = async () => {
      setIsLoading(true);
      try {
        // Search profiles
        const profilesResponse = await profileApi.searchProfiles(debouncedQuery);
        if (profilesResponse.success && profilesResponse.data) {
          setProfiles(profilesResponse.data.slice(0, 5));
        }

        // Search transactions (simplified for now)
        const transactionsResponse = await myPtsApi.getTransactions(5, 0);
        if (transactionsResponse.success && transactionsResponse.data && transactionsResponse.data.transactions) {
          // Filter transactions by query (client-side for now)
          const filteredTransactions = transactionsResponse.data.transactions.filter(
            (tx: any) =>
              tx.description?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
              tx.transactionId?.toLowerCase().includes(debouncedQuery.toLowerCase())
          );
          setTransactions(filteredTransactions.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [debouncedQuery]);

  const onSelect = (item: any, type: string) => {
    setOpen(false);

    if (type === "profile") {
      router.push(`/profiles/${item._id}`);
    } else if (type === "transaction") {
      router.push(`/transactions/${item.transactionId}`);
    } else if (type === "page") {
      router.push(item.path);
    }
  };

  // Common pages for quick navigation
  const commonPages = [
    { name: "Dashboard", path: "/dashboard", icon: BarChart },
    { name: "Buy MyPts", path: "/buy", icon: CreditCard },
    { name: "Sell MyPts", path: "/sell", icon: CreditCard },
    { name: "Transactions", path: "/transactions", icon: CreditCard },
    { name: "Settings", path: "/settings", icon: Settings },
    ...(isAdmin ? [{ name: "Admin Dashboard", path: "/admin", icon: Settings }] : []),
  ];

  // Handle open state changes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }

    // Reset query when closing
    if (!newOpen) {
      setQuery("");
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder="Search for anything..."
        value={query}
        onValueChange={setQuery}
        className="border-none focus:ring-0"
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Searching...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mb-2 opacity-50" />
              <p>No results found.</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </CommandEmpty>

        {/* Quick Navigation */}
        <CommandGroup heading="Quick Navigation">
          {commonPages.map((page) => (
            <CommandItem
              key={page.path}
              onSelect={() => onSelect(page, "page")}
              className="flex items-center py-2 px-2 cursor-pointer transition-colors"
            >
              <div className="bg-muted/50 p-1.5 rounded-md mr-3">
                <page.icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{page.name}</span>
                <span className="text-xs text-muted-foreground">
                  Navigate to {page.name.toLowerCase()}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Profiles */}
        {profiles.length > 0 && (
          <CommandGroup heading="Profiles">
            {profiles.map((profile) => (
              <CommandItem
                key={profile._id}
                onSelect={() => onSelect(profile, "profile")}
                className="flex items-center py-2 px-2 cursor-pointer transition-colors"
              >
                <div className="bg-blue-50 p-1.5 rounded-md mr-3">
                  <User className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{profile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {profile.type || "Profile"}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Transactions */}
        {transactions.length > 0 && (
          <CommandGroup heading="Transactions">
            {transactions.map((transaction) => (
              <CommandItem
                key={transaction.transactionId}
                onSelect={() => onSelect(transaction, "transaction")}
                className="flex items-center py-2 px-2 cursor-pointer transition-colors"
              >
                <div className="bg-green-50 p-1.5 rounded-md mr-3">
                  <CreditCard className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">
                      {transaction.description || transaction.transactionId}
                    </span>
                    <span className={`ml-2 text-sm font-medium ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount} MyPts
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate">
                    {transaction.transactionId}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <div className="py-2 px-2 text-xs flex items-center justify-between text-muted-foreground border-t mt-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <span className="px-1.5 py-0.5 border rounded mr-1">↑</span>
              <span className="px-1.5 py-0.5 border rounded">↓</span>
              <span className="ml-1">to navigate</span>
            </div>
            <div className="flex items-center">
              <span className="px-1.5 py-0.5 border rounded mr-1">Enter</span>
              <span>to select</span>
            </div>
          </div>
          <div className="flex items-center">
            <span className="px-1.5 py-0.5 border rounded mr-1">Esc</span>
            <span>to close</span>
          </div>
        </div>
      </CommandList>
    </CommandDialog>
  );
}
