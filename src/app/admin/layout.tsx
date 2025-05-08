"use client";

import { ReactNode, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminNotificationCenter } from "@/components/admin/admin-notification-center";
import { GoogleAvatar } from "@/components/shared/google-avatar";
import Image from "next/image";
import {
  DollarSign,
  BarChart3,
  Users,
  Settings,
  History,
  AlertTriangle,
  ShieldAlert,
  Lock,
  UserCircle,
  CreditCard,
  Globe,
  PieChart,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const adminNav = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: <BarChart3 className="h-5 w-5" />,
      exact: true,
    },
    {
      name: "Supply Management",
      href: "/admin/supply",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      name: "Profile Management",
      href: "/admin/profiles",
      icon: <UserCircle className="h-5 w-5" />,
    },
    {
      name: "Award MyPts",
      href: "/admin/reward",
      icon: <ShieldAlert className="h-5 w-5" />,
    },
    {
      name: "Redeemed Transactions",
      href: "/admin/sell-transactions",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      name: "Supply Transactions ",
      href: "/admin/transactions",
      icon: <History className="h-5 w-5" />,
    },
    {
      name: "Profile Transactions",
      href: "/admin/profile-transactions",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      name: "MyPts Statistics",
      href: "/admin/mypts-stats",
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      name: "System Verification",
      href: "/admin/system",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      name: "Exchange Rates",
      href: "/admin/exchange-rates",
      icon: <Globe className="h-5 w-5" />,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  useEffect(() => {
    if (isAdmin && typeof window !== "undefined") {
      localStorage.setItem("isAdmin", "true");
      console.log("Admin layout - stored isAdmin in localStorage");
    }
  }, [isAdmin]);

  if (!isAdmin) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen flex-col gap-4">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Checking admin permissions...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <div className="p-8 border border-red-200 rounded-lg bg-red-50 max-w-md text-center">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            Access Denied
          </h1>
          <p className="text-red-600 mb-6">
            You don't have permission to access the admin area.
          </p>
          <Button onClick={() => router.push("/")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname ? pathname.startsWith(href) : false;
  };

  const handleLogout = async () => {
    console.log("Logging out from admin page...");

    try {
      // Import the enhanced logout function
      const { logout: enhancedLogout } = await import('@/lib/logout');
      await enhancedLogout();
      // The enhanced logout function handles redirection with proper parameters
    } catch (error) {
      console.error("Logout error:", error);

      // Fallback to basic logout if enhanced version fails
      try {
        localStorage.clear();
        sessionStorage.clear();

        // Clear cookies
        const cookiesToClear = document.cookie.split(";");
        cookiesToClear.forEach((cookie) => {
          const [name] = cookie.trim().split("=");
          if (name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });

        // Call logout API
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });

        // Sign out from NextAuth
        await signOut({ redirect: false });

        // Redirect with cache-busting parameter
        window.location.href = `/login?logout=true&t=${Date.now()}`;
      } catch (fallbackError) {
        console.error("Fallback logout error:", fallbackError);
        window.location.href = `/login?logout=true&error=1&t=${Date.now()}`;
      }
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Verifying your access...
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
        <Navbar
          sidebarOpen={isSidebarOpen}
          onSidebarToggle={toggleSidebar}
          mobileMenuOpen={isMobileSidebarOpen}
          onMobileMenuToggle={toggleMobileSidebar}
        />

        <div className="flex flex-1 pt-16">
          <aside
            className={`hidden lg:flex flex-col bg-black border-r border-neutral-800 transition-all duration-300 ease-in-out fixed top-0 bottom-0 z-10 ${isSidebarOpen ? "w-64" : "w-20"
              }`}
          >
            <div
              className={`relative ${isSidebarOpen
                ? "flex pb-5 items-center px-6 justify-between pt-7"
                : "flex justify-center items-center pt-7"
                }`}
            >
              {isSidebarOpen ? (
                <Link href="/admin" className="flex items-center space-x-2">
                  <Image
                    src="/profilewhite.png"
                    alt="MyPts"
                    width={50}
                    height={50}
                    className="h-[2.7rem] w-[2.7rem] object-contain"
                  />
                  <div className="flex justify-center items-center">
                    <span className="text-white text-3xl font-extrabold">My</span>
                    <span className="text-white text-2xl font-extralight">
                      Profile
                    </span>
                  </div>
                </Link>
              ) : (
                <Link href="/admin" className="flex items-center">
                  <Image
                    src="/profilewhite.png"
                    alt="MyPts"
                    width={32}
                    height={32}
                    className="h-[1.7rem] w-[1.7rem]"
                  />
                </Link>
              )}
            </div>

            <nav className="flex-1 space-y-1 px-2 pb-4 pt-4 overflow-y-auto">
              {adminNav.map((item) => (
                <Link key={item.name} href={item.href} passHref>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive(item.href, item.exact) ? "secondary" : "ghost"}
                        className={`w-full flex items-center text-sm font-medium rounded-md group ${isSidebarOpen ? "justify-start" : "justify-center"
                          }`}
                      >
                        <div className={`transition-colors duration-200 ${isActive(item.href, item.exact) ? "text-primary" : "text-neutral-400 group-hover:text-white"}`}>
                          {item.icon}
                        </div>
                        {isSidebarOpen && (
                          <span className={`ml-3 transition-opacity duration-200 ${isActive(item.href, item.exact) ? "text-primary font-semibold" : "text-neutral-300 group-hover:text-white"}`}>
                            {item.name}
                          </span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    {!isSidebarOpen && (
                      <TooltipContent side="right" sideOffset={5}>
                        {item.name}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </Link>
              ))}
            </nav>
            <div className={`mt-auto border-t border-neutral-800 ${isSidebarOpen ? "px-4" : "px-2"
              }`}>
              {/* User profile section */}
              {isSidebarOpen ? (
                <div className="flex items-center p-3 mt-2">
                  <GoogleAvatar
                    profileImageUrl={user?.profileImage || user?.image || ""}
                    fallbackText={user?.fullName || user?.name || "Admin"}
                    size={32}
                    className="mr-3"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-white">
                      {user?.fullName || user?.name || "Admin"}
                    </p>
                    <p className="text-white text-xs truncate">{user?.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center p-2 mt-2">
                  <GoogleAvatar
                    profileImageUrl={user?.profileImage || user?.image || ""}
                    fallbackText={user?.fullName || user?.name || "Admin"}
                    size={32}
                  />
                </div>
              )}

              {/* Logout button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full flex items-center text-sm font-medium rounded-md group ${isSidebarOpen ? "justify-start" : "justify-center"
                      }`}
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5 text-neutral-400 group-hover:text-red-400" />
                    {isSidebarOpen && (
                      <span className="ml-3 text-neutral-300 group-hover:text-red-400">
                        Logout
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                {!isSidebarOpen && (
                  <TooltipContent side="right" sideOffset={5}>
                    Logout
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </aside>

          {/* Mobile sidebar overlay */}
          {isMobileSidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={toggleMobileSidebar}
            ></div>
          )}

          {/* Mobile sidebar */}
          <aside
            className={`fixed inset-y-0 left-0 z-40 w-64 lg:hidden transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
          >
            <div className="h-full bg-black border-r border-neutral-800 p-4 pt-20 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <Link href="/admin" className="flex items-center space-x-2">
                  <Image
                    src="/profilewhite.png"
                    alt="MyPts"
                    width={40}
                    height={40}
                    className="h-[2.2rem] w-[2.2rem] object-contain"
                  />
                  <div className="flex justify-center items-center">
                    <span className="text-white text-2xl font-extrabold">My</span>
                    <span className="text-white text-xl font-extralight">
                      Profile
                    </span>
                  </div>
                </Link>
                <Button variant="ghost" size="icon" onClick={toggleMobileSidebar} className="lg:hidden">
                  <X className="h-6 w-6 text-neutral-400" />
                </Button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto">
                {adminNav.map((item) => (
                  <Link key={item.name} href={item.href} passHref>
                    <Button
                      variant={isActive(item.href, item.exact) ? "secondary" : "ghost"}
                      className="w-full flex items-center justify-start text-sm font-medium rounded-md group p-2"
                      onClick={() => setIsMobileSidebarOpen(false)}
                    >
                      <div className={`transition-colors duration-200 ${isActive(item.href, item.exact) ? "text-primary" : "text-neutral-400 group-hover:text-white"}`}>
                        {item.icon}
                      </div>
                      <span className={`ml-3 transition-opacity duration-200 ${isActive(item.href, item.exact) ? "text-primary font-semibold" : "text-neutral-300 group-hover:text-white"}`}>
                        {item.name}
                      </span>
                    </Button>
                  </Link>
                ))}
              </nav>
              <div className="mt-auto pt-4 border-t border-neutral-800">
                {/* User profile section for mobile */}
                <div className="flex items-center p-3 mb-2">
                  <GoogleAvatar
                    profileImageUrl={user?.profileImage || user?.image || ""}
                    fallbackText={user?.fullName || user?.name || "Admin"}
                    size={32}
                    className="mr-3"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-white">
                      {user?.fullName || user?.name || "Admin"}
                    </p>
                    <p className="text-white text-xs truncate">{user?.email}</p>
                  </div>
                </div>

                {/* Logout button */}
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start text-sm font-medium rounded-md group p-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 text-neutral-400 group-hover:text-red-400" />
                  <span className="ml-3 text-neutral-300 group-hover:text-red-400">
                    Logout
                  </span>
                </Button>
              </div>
            </div>
          </aside>

          <main
            className={`flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 ease-in-out overflow-y-auto ${isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
              }`}
          >
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
