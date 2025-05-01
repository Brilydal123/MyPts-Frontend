"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleAvatar } from "@/components/shared/google-avatar";
import { NotificationCenter } from "@/components/shared/notification-center";
import {
  Search,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  X as CloseIcon,
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
  const { user, isAuthenticated, logout } = useAuth();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className={`w-full pl-9 bg-background/50 rounded-full border ${isSearchFocused ? "ring-1 ring-ring" : ""
                  }`}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
            </div>
          </div>

          {/* Actions section */}
          <div className="flex items-center gap-4 px-4">
            {isAuthenticated ? (
              <>
                <NotificationCenter />
                <div className="flex items-center gap-2">
                  <GoogleAvatar
                    profileImageUrl={user?.profileImage || ""}
                    fallbackText={user?.fullName || user?.name || "User"}
                    size={32}
                  />
                  <span className="hidden md:inline-block text-sm text-black">
                    {user?.fullName || user?.name}
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
