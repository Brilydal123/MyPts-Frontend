"use client";

import { GoogleAvatar } from "@/components/shared/google-avatar";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut as LogOutIcon, Settings as SettingsIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { Icons } from "../ui/icons";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Icons.dashboard,
    },
    { name: "Buy", href: "/buy", icon: Icons.buy },
    { name: "Sell", href: "/sell", icon: Icons.sell },
    {
      name: "Transactions",
      href: "/transactions",
      icon: Icons.transactions,
    },
    {
      name: "Referrals",
      href: "/dashboard/referrals",
      icon: Icons.refers,
    },
    ...(isAdmin
      ? [
          {
            name: "Admin",
            href: "/admin",
            icon: Icons.dashboard,
            isAdmin: true,
          },
        ]
      : []),
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

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
            <div className="flex h-24 items-center border-b px-6">
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
                  className="h-[2.7rem] w-[2.7rem] object-contain"
                />
                <div className="flex justify-center items-center">
                  <span className="text-white text-3xl font-extrabold">My</span>
                  <span className="text-white text-2xl font-extralight">
                    Profile
                  </span>
                </div>
              </Link>
            </div>
            <div className="py-4 px-4 flex flex-col h-[calc(100%-6rem)]">
              {/* Navigation items at the top */}
              <nav className="flex flex-col space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md ${
                      pathname === item.href
                        ? "bg-white text-black"
                        : "text-white hover:bg-muted"
                    } ${item.isAdmin ? "text-primary" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mr-3">
                      {<item.icon className="size-5" />}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>

              {/* User info, settings, and logout at the bottom */}
              <div className="mt-auto pt-4">
                <div className="border- my-4"></div>
                <div className="space-y-2">
                  <Link
                    href="/settings"
                    className="flex items-center px-3 py-2 rounded-md text-white hover:bg-muted w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <SettingsIcon className="mr-3 h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                  <Button
                    variant="ghost"
                    className="flex items-center px-3 py-2 rounded-md text-white hover:bg-muted w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOutIcon className="mr-3 h-5 w-5" />
                    <span>Log out</span>
                  </Button>

                  {/* User profile at the very bottom */}
                  <div className="flex items-center p-3 mt-2">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:block fixed left-0 top-0 h-full ${
          sidebarOpen ? "w-64" : "w-20"
        } dark:bg-white bg-black transition-all duration-300 z-30`}
      >
        <div
          className={`relative ${
            sidebarOpen
              ? "flex pb-5 items-center px-6 justify-between pt-7"
              : "flex justify-center items-center pt-7"
          }`}
        >
          {sidebarOpen ? (
            <Link href="/" className="flex items-center space-x-2">
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
            <Link href="/" className="flex items-center">
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

        <div className="py-4 px-4 flex flex-col h-[calc(100%-5rem)]">
          {/* Navigation items at the top */}
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center ${
                  sidebarOpen ? "px-3" : "justify-center"
                } py-2 rounded-md ${
                  pathname === item.href
                    ? "bg-white text-black"
                    : "text-white hover:bg-muted hover:text-black"
                } ${item.isAdmin ? "text-primary" : ""}`}
              >
                <span className={sidebarOpen ? "mr-3" : ""}>
                  {<item.icon className="size-5" />}
                </span>
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>

          {/* User info, settings, and logout at the bottom */}
          <div className="mt-auto pt-4">
            <div className="border-t my-4"></div>
            <div className="space-y-2">
              <Link
                href="/settings"
                className={`flex items-center ${
                  sidebarOpen ? "px-3" : "justify-center"
                } py-2 rounded-md text-white hover:bg-muted hover:text-black`}
              >
                <span className={sidebarOpen ? "mr-3" : ""}>
                  <SettingsIcon className="h-5 w-5" />
                </span>
                {sidebarOpen && <span>Settings</span>}
              </Link>
              <Button
                variant="ghost"
                className={`flex items-center ${
                  sidebarOpen ? "px-3" : "justify-center"
                } py-2 rounded-md text-white hover:bg-muted w-full ${
                  sidebarOpen ? "justify-start" : "justify-center"
                }`}
                onClick={handleLogout}
              >
                <span className={sidebarOpen ? "mr-2" : ""}>
                  <LogOutIcon className="h-5 w-5 -rotate-180" />
                </span>
                {sidebarOpen && <span>Log out</span>}
              </Button>

              {/* User profile at the very bottom */}
              {sidebarOpen && (
                <div className="flex items-center p-3 mt-2">
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
                <div className="flex justify-center p-2 mt-2">
                  <GoogleAvatar
                    profileImageUrl={user?.profileImage || ""}
                    fallbackText={user?.fullName || user?.name || "User"}
                    size={32}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with padding for sidebar */}
      <main
        className={`flex-1 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        } transition-all duration-300 p-4 lg:p-6`}
      >
        {children}
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-6 md:py-0 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
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
