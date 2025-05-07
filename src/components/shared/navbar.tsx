"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  X as CloseIcon,
  Menu as MenuIcon,
  Search,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import UserButton from "./user-button";

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
  const { user, isAuthenticated } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div
      className={`fixed top-0 left-0 right-0 lg:right-0 z-20 ${
        sidebarOpen ? "lg:left-64" : "lg:left-20"
      } transition-all duration-300`}
    >
      <div className="bg-white border-b px-4">
        <div className="h-16 flex items-center justify-between gap-4 relative w-full">
          {/* Toggle buttons */}
          <div className="flex items-center gap-4 flex-1">
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
              className="hidden lg:flex hover:bg-primary-gray/80"
              onClick={onSidebarToggle}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? (
                <ChevronLeftIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
            </Button>
            <div className="flex-1 max-w-xl relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className={`w-full pl-9  rounded-full border  bg-primary-gray ${
                  isSearchOpen ? "ring-1 ring-ring" : ""
                }`}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => setIsSearchOpen(false)}
              />
            </div>
          </div>

          {/* No need to check if the user if authenticated because we're checking both in the middleware.ts*/}
          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        </div>
      </div>
    </div>
  );
}
