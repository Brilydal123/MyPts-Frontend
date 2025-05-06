"use client";

import { ReactNode, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminNotificationCenter } from "@/components/admin/admin-notification-center";
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
  const { isAdmin, isLoading } = useAuth();
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
      localStorage.clear();

      sessionStorage.clear();

      const cookiesToClear = document.cookie.split(";");
      const paths = ["/", "/api", ""];
      const domains = [
        window.location.hostname,
        `.${window.location.hostname}`,
        "",
      ];

      cookiesToClear.forEach((cookie) => {
        const [name] = cookie.trim().split("=");
        if (!name) return;

        paths.forEach((path) => {
          domains.forEach((domain) => {
            if (domain) {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
            } else {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
            }
          });
        });

        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=none;`;
      });

      [
        "next-auth.session-token",
        "next-auth.callback-url",
        "next-auth.csrf-token",
        "__Secure-next-auth.session-token",
        "accesstoken",
        "refreshtoken",
      ].forEach((cookieName) => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
      });

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      await signOut({ redirect: false });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      window.location.href = "/login";
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
            <nav className="flex-1 space-y-1 px-2 pb-4 pt-20 overflow-y-auto">
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
            <div className={`p-2 mt-auto border-t border-neutral-800 ${isSidebarOpen ? "px-4" : "px-2"
              }`}>
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

          <aside
            className={`fixed inset-0 z-40 flex lg:hidden transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
          >
            <div className="w-64 bg-black border-r border-neutral-800 p-4 pt-20 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <Link href="/admin" className="flex items-center gap-2 text-xl font-bold text-primary">
                  MyAdmin
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
                      onClick={() => isMobileSidebarOpen && toggleMobileSidebar()}
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
            {isMobileSidebarOpen && (
              <div
                className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                onClick={toggleMobileSidebar}
              ></div>
            )}
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
