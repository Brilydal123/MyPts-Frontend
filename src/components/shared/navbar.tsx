"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GoogleAvatar } from "@/components/shared/google-avatar";
import { NotificationCenter } from "@/components/shared/notification-center";
import { GlobalSearch } from "@/components/shared/global-search";
import {
  Search,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  X as CloseIcon,
  Command as CommandIcon,
} from "lucide-react";

interface NavbarProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  mobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
}

export function Navbar({
  sidebarOpen,
  onSidebarToggle,
  mobileMenuOpen,
  onMobileMenuToggle,
}: NavbarProps) {
  const { user, isAuthenticated, isAdmin } = useAuth();

  // Force authentication state to true on admin pages
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const effectiveIsAuthenticated = isAuthenticated || isAdminPage || isAdmin;

  // Debug user data
  useEffect(() => {
    if (user) {
      console.log('Navbar - User data:', {
        fullName: user.fullName,
        name: user.name,
        username: user.username,
        email: user.email,
        isAdmin: isAdmin
      });
    }
  }, [user, isAdmin]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div
      className={`fixed top-0 left-0 right-0 lg:right-0 z-20 ${sidebarOpen ? "lg:left-64" : "lg:left-20"
        } transition-all duration-300`}
    >
      <div className="bg-background/80 backdrop-blur-sm border-b">
        <div className="h-16 flex items-center justify-between gap-4 relative w-full">
          {/* Toggle buttons */}
          <div className="flex items-center px-4">
            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onMobileMenuToggle}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <CloseIcon className="h-5 w-5" />
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </Button>

            {/* Desktop sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={onSidebarToggle}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? (
                <ChevronLeftIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
            </Button>
          </div>
          {/* https://my-profile-server-api.onrender.com/api/stripe/webhook */}
          {/* Search section */}
          <div className="flex-1 max-w-xl">
            <div className="relative w-full">
              <Button
                variant="outline"
                className="w-full justify-between pl-3 pr-2 py-5 bg-background/50 rounded-full border text-muted-foreground hover:bg-background/80 group"
                onClick={() => setIsSearchOpen(true)}
              >
                <div className="flex items-center">
                  <Search className="h-4 w-4 mr-2 group-hover:text-foreground transition-colors" />
                  <span className="text-sm group-hover:text-foreground transition-colors">Search...</span>
                </div>
                <div className="flex items-center border rounded px-1.5 py-0.5 text-xs text-muted-foreground">
                  <CommandIcon className="h-3 w-3 mr-1" />
                  <span>K</span>
                </div>
              </Button>
              {/* We only need this instance of GlobalSearch for handling the navbar button click.
                  The main instance is in the MainLayout component */}
              <GlobalSearch
                defaultOpen={isSearchOpen}
                onOpenChange={setIsSearchOpen}
              />
            </div>
          </div>

          {/* Actions section */}
          <div className="flex items-center gap-4 px-4">
            {effectiveIsAuthenticated ? (
              <>
                <NotificationCenter />
                <div className="flex items-center gap-2">
                  <GoogleAvatar
                    profileImageUrl={user?.profileImage || user?.image || ""}
                    fallbackText={user?.fullName || user?.name || "User"}
                    size={32}
                  />
                  <span className="hidden md:inline-block text-sm text-black">
                    {user?.fullName || user?.name || user?.username || user?.email?.split('@')[0] || "User"}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" className="text-white">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
