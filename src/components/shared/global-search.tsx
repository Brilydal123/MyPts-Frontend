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

export function GlobalSearch() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

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

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search for anything..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            "No results found."
          )}
        </CommandEmpty>

        {/* Quick Navigation */}
        <CommandGroup heading="Quick Navigation">
          {commonPages.map((page) => (
            <CommandItem
              key={page.path}
              onSelect={() => onSelect(page, "page")}
              className="flex items-center"
            >
              <page.icon className="mr-2 h-4 w-4" />
              <span>{page.name}</span>
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
                className="flex items-center"
              >
                <User className="mr-2 h-4 w-4" />
                <span>{profile.name}</span>
                {profile.type && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {profile.type}
                  </span>
                )}
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
                className="flex items-center"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                <span className="truncate">
                  {transaction.description || transaction.transactionId}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {transaction.amount} MyPts
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
