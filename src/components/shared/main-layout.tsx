"use client";

import { GoogleAvatar } from "@/components/shared/google-avatar";
import { Navbar } from "@/components/shared/navbar";
import { GlobalSearch } from "@/components/shared/global-search";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut as LogOutIcon, Settings as SettingsIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useLogoutModal } from "@/hooks/use-logout";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { setIsOpen } = useLogoutModal();
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

  const handleLogout = () => {
    setIsOpen(true);
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
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md",
                      pathname === item.href
                        ? "bg-white text-black"
                        : "text-white hover:bg-muted",
                      item.isAdmin && "text-primary"
                    )}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:block fixed left-0 top-0 h-full",
          sidebarOpen ? "w-64" : "w-20",
          "dark:bg-white bg-black transition-all duration-300 z-30"
        )}
      >
        <div
          className={cn(
            "relative",
            sidebarOpen
              ? "flex pb-5 items-center px-6 justify-between pt-7"
              : "flex justify-center items-center pt-7"
          )}
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
                className={cn(
                  "flex items-center",
                  sidebarOpen ? "px-3" : "justify-center",
                  "py-2 rounded-md",
                  pathname === item.href
                    ? "bg-white text-black"
                    : "text-white hover:bg-muted hover:text-black",
                  item.isAdmin && "text-primary"
                )}
              >
                <span className={cn(sidebarOpen && "mr-3")}>
                  {<item.icon className="size-5" />}
                </span>
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>

          {/* User info, settings, and logout at the bottom */}
          <div className="mt-auto pt-4">
            <div className="border-t my-4 border-white/10"></div>
            <div className="space-y-2">
              <Link
                href="/settings"
                className={cn(
                  "flex items-center",
                  sidebarOpen ? "px-3" : "justify-center",
                  "py-2 rounded-md text-white hover:bg-muted hover:text-black"
                )}
              >
                <span className={cn(sidebarOpen && "mr-3")}>
                  <SettingsIcon className="h-5 w-5" />
                </span>
                {sidebarOpen && <span>Settings</span>}
              </Link>
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center",
                  sidebarOpen ? "px-3" : "justify-center",
                  "py-2 rounded-md text-white hover:bg-muted w-full",
                  sidebarOpen ? "justify-start" : "justify-center"
                )}
                onClick={handleLogout}
              >
                <span className={cn(sidebarOpen && "mr-2")}>
                  <LogOutIcon className="h-5 w-5 -rotate-180" />
                </span>
                {sidebarOpen && <span>Log out</span>}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with padding for sidebar */}
      <main
        className={cn(
          "flex-1",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20",
          "transition-all duration-300 p-4 lg:p-6"
        )}
      >
        <div className="w-full  mx-auto">{children}</div>
      </main>

      {/* Footer */}
      <footer
        className={cn(
          "border-t py-6 md:py-0",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20",
          "transition-all duration-300"
        )}
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

      {/* Global search component - available throughout the app */}
      <GlobalSearch defaultOpen={false} />
    </div>
  );
}
