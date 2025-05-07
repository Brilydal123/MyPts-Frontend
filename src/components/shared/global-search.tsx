"use client";

import { useEffect, useState } from "react";
import {
  Command,
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
  Loader2,
  X,
  Clock
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { profileApi } from "@/lib/api/profile-api";
import { myPtsApi } from "@/lib/api/mypts-api";
import { useAuth } from "@/hooks/use-auth";
import { DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface GlobalSearchProps {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Storage key for recent searches
const RECENT_SEARCHES_KEY = 'mypts-recent-searches';

// Helper to get recent searches from localStorage
const getRecentSearches = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error reading recent searches:', e);
    return [];
  }
};

// Helper to save recent searches to localStorage
const saveRecentSearch = (query: string) => {
  if (typeof window === 'undefined' || !query.trim()) return;
  try {
    const searches = getRecentSearches();
    // Remove if already exists (to move to top)
    const filtered = searches.filter(s => s !== query);
    // Add to beginning and limit to 5 items
    const updated = [query, ...filtered].slice(0, 5);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving recent search:', e);
  }
};

// Helper to clear all recent searches
const clearRecentSearches = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (e) {
    console.error('Error clearing recent searches:', e);
  }
};

export function GlobalSearch({ defaultOpen = false, onOpenChange }: GlobalSearchProps) {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(defaultOpen ?? false);
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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

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
        // Run searches in parallel for better performance
        const [profilesResponse, transactionsResponse] = await Promise.all([
          // Search profiles
          profileApi.searchProfiles(debouncedQuery),
          // Get transactions
          myPtsApi.getTransactions(10, 0)
        ]);

        // Process profiles
        if (profilesResponse.success && profilesResponse.data) {
          setProfiles(profilesResponse.data.slice(0, 5));
        } else {
          setProfiles([]);
        }

        // Process transactions with improved filtering
        if (transactionsResponse.success &&
          transactionsResponse.data &&
          transactionsResponse.data.transactions) {

          const query = debouncedQuery.toLowerCase();

          // More sophisticated filtering with relevance scoring
          const scoredTransactions = transactionsResponse.data.transactions
            .map((tx: any) => {
              let score = 0;

              // Check description match (highest priority)
              if (tx.description?.toLowerCase().includes(query)) {
                score += 10;
                // Exact match gets higher score
                if (tx.description.toLowerCase() === query) {
                  score += 5;
                }
              }

              // Check transaction ID match
              if (tx.transactionId?.toLowerCase().includes(query)) {
                score += 8;
              }

              // Check amount match
              if (tx.amount?.toString() === query) {
                score += 7;
              }

              // Check status match
              if (tx.status?.toLowerCase().includes(query)) {
                score += 6;
              }

              // Check date match (if query looks like a date)
              const txDate = new Date(tx.createdAt).toLocaleDateString();
              if (txDate.includes(query)) {
                score += 5;
              }

              return { ...tx, relevanceScore: score };
            })
            .filter((tx: any) => tx.relevanceScore > 0)
            .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
            .slice(0, 5);

          setTransactions(scoredTransactions);
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
        setProfiles([]);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [debouncedQuery]);

  // Load recent searches when dialog opens
  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
    }
  }, [open]);

  // Save search query when user performs a search
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      saveRecentSearch(debouncedQuery);
    }
  }, [debouncedQuery]);

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
      <VisuallyHidden>
        <DialogTitle>Global Search</DialogTitle>
      </VisuallyHidden>
      <Command>
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

          {/* Recent Searches - only show when no query and we have recent searches */}
          {!query && recentSearches.length > 0 && (
            <CommandGroup heading="Recent Searches">
              <div className="flex items-center justify-end mb-1">
                <button
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearRecentSearches();
                    setRecentSearches([]);
                  }}
                >
                  Clear
                  <X className="ml-1 h-3 w-3" />
                </button>
              </div>
              {recentSearches.map((searchTerm) => (
                <CommandItem
                  key={searchTerm}
                  value={`search-${searchTerm}`}
                  onSelect={() => {
                    setQuery(searchTerm);
                    saveRecentSearch(searchTerm);
                    setOpen(false);
                  }}
                  className="flex items-center py-2 px-2 cursor-pointer transition-colors"
                >
                  <div className="bg-muted/30 p-1.5 rounded-md mr-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span>{searchTerm}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Quick Navigation */}
          <CommandGroup heading="Quick Navigation">
            {commonPages.map((page) => (
              <CommandItem
                key={page.path}
                value={page.path}
                onSelect={() => {
                  window.location.href = page.path;
                  setOpen(false);
                }}
                className="flex items-center py-2 px-2 cursor-pointer transition-colors hover:bg-slate-500"
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
                  value={`profile-${profile._id}`}
                  onSelect={() => {
                    window.location.href = `/profiles/${profile._id}`;
                    setOpen(false);
                  }}
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
                  value={`transaction-${transaction.transactionId}`}
                  onSelect={() => {
                    window.location.href = `/transactions/${transaction.transactionId}`;
                    setOpen(false);
                  }}
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
      </Command>
    </CommandDialog>
  );
}
