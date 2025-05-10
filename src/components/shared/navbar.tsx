"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GoogleAvatar } from "@/components/shared/google-avatar";
import { NotificationCenter } from "@/components/shared/notification-center";
import { GlobalSearch } from "@/components/shared/global-search";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  X,
  X as CloseIcon,
  Command as CommandIcon,
  User,
  Settings,
  LogOut,
  CreditCard,
  UserPlus,
  HelpCircle,
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
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const router = useRouter();

  // Force authentication state to true on admin pages
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const effectiveIsAuthenticated = isAuthenticated || isAdminPage || isAdmin;

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Handle keyboard events for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isProfileMenuOpen) {
        setIsProfileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileMenuOpen]);

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
                <div className="relative">
                  <Button
                    variant="ghost"
                    className={`relative h-9 w-9 rounded-full p-0 transition-all duration-200 ${isProfileMenuOpen
                      ? 'bg-accent/20 ring-2 ring-accent/30 shadow-md'
                      : 'hover:bg-accent/10 focus:ring-2 focus:ring-accent/20'
                      }`}
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  >
                    <motion.div
                      animate={{
                        scale: isProfileMenuOpen ? 0.92 : 1,
                        rotate: isProfileMenuOpen ? 0 : 0
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <GoogleAvatar
                        profileImageUrl={user?.profileImage || user?.image || ""}
                        fallbackText={user?.fullName || user?.name || "User"}
                        size={32}
                      />
                    </motion.div>
                  </Button>

                  {/* Blur overlay when menu is open - covers entire screen */}
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setIsProfileMenuOpen(false)}
                        style={{
                          pointerEvents: "auto",
                          position: "fixed",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          width: "100vw",
                          height: "100vh"
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Profile dropdown menu */}
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        className={`
                          ${isMobile
                            ? 'fixed top-16 left-1/2 -translate-x-1/2 w-[90vw] max-w-[400px] rounded-xl'
                            : 'absolute mt-2 right-0 w-72 rounded-xl'
                          }
                          overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
                          shadow-lg border border-gray-200 dark:border-gray-800 z-50
                          max-h-[85vh] overflow-y-auto sm:max-h-[600px]
                        `}
                        initial={{
                          opacity: 0,
                          y: isMobile ? 20 : -10,
                          scale: isMobile ? 1 : 0.95
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1
                        }}
                        exit={{
                          opacity: 0,
                          y: isMobile ? 20 : -10,
                          scale: isMobile ? 1 : 0.95
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 25
                        }}
                      >
                        {/* Mobile close button - only visible on small screens */}
                        <div className="sm:hidden flex justify-end p-2">
                          <button
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Close menu"
                          >
                            <X className="h-5 w-5 text-gray-500" />
                          </button>
                        </div>

                        {/* User info section */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                          <div className="flex items-center gap-3">
                            <GoogleAvatar
                              profileImageUrl={user?.profileImage || user?.image || ""}
                              fallbackText={user?.fullName || user?.name || "User"}
                              size={40}
                            />
                            <div className="flex flex-col">
                              <p className="text-sm font-medium">
                                {user?.fullName || user?.name || user?.username || user?.email?.split('@')[0] || "User"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px] sm:max-w-[220px]">
                                {user?.email || ""}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="p-2">
                          <button
                            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => {
                              router.push('/dashboard');
                              setIsProfileMenuOpen(false);
                            }}
                          >
                            <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm">Dashboard</span>
                          </button>

                          <button
                            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => {
                              router.push('/transactions');
                              setIsProfileMenuOpen(false);
                            }}
                          >
                            <CreditCard className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm">Transactions</span>
                          </button>

                          <button
                            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => {
                              router.push('/settings');
                              setIsProfileMenuOpen(false);
                            }}
                          >
                            <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm">Settings</span>
                          </button>

                          {isAdmin && (
                            <button
                              className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              onClick={() => {
                                router.push('/admin');
                                setIsProfileMenuOpen(false);
                              }}
                            >
                              <UserPlus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="text-sm">Admin Panel</span>
                            </button>
                          )}
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-800 p-2">
                          <button
                            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => {
                              router.push('/help');
                              setIsProfileMenuOpen(false);
                            }}
                          >
                            <HelpCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm">Help & Support</span>
                          </button>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-800 p-2">
                          <button
                            className="flex items-center gap-3 w-full p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            onClick={() => {
                              handleLogout();
                              setIsProfileMenuOpen(false);
                            }}
                          >
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm font-medium">Log out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
