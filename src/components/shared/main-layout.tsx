"use client";

import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
// Removed unused dropdown menu imports
import { Button } from "@/components/ui/button";
// Removed unused avatar imports
import { UserAvatar } from "@/components/shared/user-avatar";
import { GoogleAvatar } from "@/components/shared/google-avatar";
import { NotificationCenter } from "@/components/shared/notification-center";
import Image from "next/image";
import {
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  LayoutDashboard as LayoutDashboardIcon,
  PanelTop as DashboardIcon,
  ShoppingBag as BuyIcon,
  DollarSign as SellIcon,
  History as TransactionsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  X as CloseIcon,
} from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Debug user object
  useEffect(() => {
    if (user) {
      console.log("User object in MainLayout:", user);
      console.log("User properties:", Object.keys(user));
      console.log("User profile image:", user.profileImage);
      console.log("User name:", user.name, user.fullName);
    }
  }, [user]);

  // User avatar is now handled by the UserAvatar component

  // Navigation items
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboardIcon className="h-5 w-5" />,
    },
    { name: "Buy", href: "/buy", icon: <BuyIcon className="h-5 w-5" /> },
    { name: "Sell", href: "/sell", icon: <SellIcon className="h-5 w-5" /> },
    {
      name: "Transactions",
      href: "/transactions",
      icon: <TransactionsIcon className="h-5 w-5" />,
    },
    ...(isAdmin
      ? [
        {
          name: "Admin",
          href: "/admin",
          icon: <DashboardIcon className="h-5 w-5" />,
          isAdmin: true,
        },
      ]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-40  ">
        <Button
          variant="outline"
          size="icon"
          className={`${mobileMenuOpen ? "absolute  -right-[16rem] top-[1rem]" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? (
            <CloseIcon className="h-5 w-5" />
          ) : (
            <MenuIcon className="h-5 w-5 " />
          )}
        </Button>
      </div>
      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed left-0 top-0 h-full w-72 bg-black shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-24  items-center border-b px-6">
              <Link
                href="/"
                className="flex items-center space-x-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Image
                  src="/profilewhite.png"
                  alt="MyPts"
                  width={50}
                  height={50}
                  className="h-14 w-14 object-contain"
                />
              </Link>
            </div>
            <div className="py-4 px-4">
              <nav className="flex flex-col space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md ${pathname === item.href
                      ? "bg-white text-black"
                      : "text-white hover:bg-muted"
                      } ${item.isAdmin ? "text-primary" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
              <div className="border-t my-4"></div>
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center p-3 ">
                    <GoogleAvatar
                      profileImageUrl={user?.profileImage || ""}
                      fallbackText={user?.fullName || user?.name || "User"}
                      size={32}
                      className="mr-3"
                    />
                    <div className="text-sm text-white">
                      <p className="font-medium">
                        {user?.fullName || user?.name || "User"}
                      </p>
                      <p className="text-white text-xs">{user?.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/settings"
                    className="flex items-center px-3 py-2 rounded-md text-white hover:text-black w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <SettingsIcon className="mr-3 h-5 w-5" />
                    <span className="text-white">Settings</span>
                  </Link>
                  <div className="px-3 py-2">
                    <NotificationCenter />
                  </div>
                  <Button
                    variant="ghost"
                    className="flex items-center px-3 py-2 rounded-md text-white hover:bg-muted w-full justify-start"
                    onClick={async () => {
                      // Import the new logout function
                      const { logout: logoutFunction } = await import(
                        "@/lib/logout"
                      );
                      await logoutFunction();
                    }}
                  >
                    <LogOutIcon className="mr-3 h-5 w-5" />
                    <span>Log out</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register">Sign up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:block fixed left-0 top-0 h-full ${sidebarOpen ? "w-64" : "w-20"
          } dark:bg-white bg-black    transition-all duration-300 z-30`}
      >
        <div
          className={`relative ${sidebarOpen
            ? "w-flex  pb-5 items-center -b px-6 justify-between "
            : "flex  justify-center items-center mx-auto pt-[2rem] "
            } `}
        >
          {sidebarOpen ? (
            <Link href="/" className="flex items-center space-x-2  pt-7">
              <Image
                src="/profilewhite.png"
                alt="MyPts"
                width={50}
                height={50}
                className="h-[3.7rem] w-[3.7rem] object-contain"
              />
              <div className="flex justify-center items-center relative place-items-center">
                <span className="text-white text-3xl font-extrabold">My</span>
                <span className="text-white text-2xl font-extralight">
                  Profile
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/" className="flex items-center space-x-2 relative">
              <Image
                src="/profilewhite.png"
                alt="MyPts"
                width={32}
                height={32}
                className="h-[1.7rem] w-[1.7rem] "
              />
            </Link>
          )}
          <Button
            // variant="dest"
            // size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className={`bg-black absolute -right-[2.6rem] text-white  cursor-pointer hover:text-black,${!sidebarOpen ? "w-full " : "relative  top-[1.8rem]"
              }`}
          >
            {sidebarOpen ? (
              <ChevronLeftIcon className="h-5 w-5" />
            ) : (
              <ChevronRightIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="py-4 px-4">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center ${sidebarOpen ? "px-3" : "justify-center"
                  } py-2 rounded-md ${pathname === item.href
                    ? "bg-white text-black"
                    : "text-white hover:bg-muted hover:text-black"
                  } ${item.isAdmin ? "text-primary" : ""}`}
              >
                <span className={sidebarOpen ? "mr-3" : ""}>{item.icon}</span>
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>
          <div className="border-t my-4"></div>
          {isAuthenticated ? (
            <div className="space-y-2">
              {sidebarOpen && (
                <div className="flex items-center p-3">
                  <GoogleAvatar
                    profileImageUrl={user?.profileImage || ""}
                    fallbackText={user?.fullName || user?.name || "User"}
                    size={32}
                    className="mr-3"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-white">
                      {user?.fullName || user?.name || "User"}
                    </p>
                    <p className="text-white text-xs truncate">{user?.email}</p>
                  </div>
                </div>
              )}
              {!sidebarOpen && (
                <div className="flex justify-center p-2">
                  <GoogleAvatar
                    profileImageUrl={user?.profileImage || ""}
                    fallbackText={user?.fullName || user?.name || "User"}
                    size={32}
                  />
                </div>
              )}
              <Link
                href="/settings"
                className={`flex items-center ${sidebarOpen ? "px-3" : "justify-center"
                  } py-2 rounded-md text-white hover:bg-muted hover:text-black`}
              >
                <span className={sidebarOpen ? "mr-3" : ""}>
                  <SettingsIcon className="h-5 w-5" />
                </span>
                {sidebarOpen && <span>Settings</span>}
              </Link>
              <div
                className={`relative ${sidebarOpen ? "px-3" : "flex justify-center"
                  } py-2`}
              >
                <NotificationCenter />
              </div>
              <Button
                variant="ghost"
                className={`flex items-center  ${sidebarOpen ? "px-3" : "justify-center"
                  } py-2 rounded-md text-white hover:bg-muted w-full ${sidebarOpen ? "justify-start" : "justify-center"
                  }`}
                onClick={() => logout()}
              >
                <span className={sidebarOpen ? "mr-2" : ""}>
                  <LogOutIcon className="h-5 w-5 -rotate-180" />
                </span>
                {sidebarOpen && <span>Log out</span>}
              </Button>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {sidebarOpen ? (
                <>
                  {/* <Button asChild className="w-full" variant="outline">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register">Sign up</Link>
                  </Button> */}
                </>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Link href="/login">
                    <Button size="icon" variant="outline">
                      <LogOutIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Main Content with padding for sidebar */}
      <main
        className={`flex-1 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"
          } transition-all duration-300 p-4 lg:p-6`}
      >
        {children}
      </main>
      {/* Footer */}
      <footer
        className={`border-t py-6 md:py-0 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"
          } transition-all duration-300`}
      >
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-white">
            &copy; {new Date().getFullYear()} MyPts. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-white hover:underline">
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-white hover:underline"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
