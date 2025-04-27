'use client';

import { ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationCenter } from '@/components/shared/notification-center';
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
  Home as HomeIcon
} from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  // Navigation items
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboardIcon className="h-5 w-5" /> },
    { name: 'Buy', href: '/buy', icon: <BuyIcon className="h-5 w-5" /> },
    { name: 'Sell', href: '/sell', icon: <SellIcon className="h-5 w-5" /> },
    { name: 'Transactions', href: '/transactions', icon: <TransactionsIcon className="h-5 w-5" /> },
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: <DashboardIcon className="h-5 w-5" />, isAdmin: true }] : [])
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? (
            <CloseIcon className="h-5 w-5" />
          ) : (
            <MenuIcon className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="fixed left-0 top-0 h-full w-72 bg-background shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center border-b px-6">
              <Link href="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                <span className="font-bold text-xl">MyPts</span>
              </Link>
            </div>
            <div className="py-4 px-4">
              <nav className="flex flex-col space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md ${pathname === item.href ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'} ${item.isAdmin ? 'text-primary' : ''}`}
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
                  <div className="flex items-center p-3">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium">{user?.name || 'User'}</p>
                      <p className="text-muted-foreground text-xs">{user?.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/settings"
                    className="flex items-center px-3 py-2 rounded-md text-muted-foreground hover:bg-muted w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <SettingsIcon className="mr-3 h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                  <div className="px-3 py-2">
                    <NotificationCenter />
                  </div>
                  <Button
                    variant="ghost"
                    className="flex items-center px-3 py-2 rounded-md text-muted-foreground hover:bg-muted w-full justify-start"
                    onClick={() => logout()}
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
      <div className={`hidden lg:block fixed left-0 top-0 h-full ${sidebarOpen ? 'w-64' : 'w-20'} bg-background border-r transition-all duration-300 z-30`}>
        <div className="flex h-16 items-center border-b px-6 justify-between">
          {sidebarOpen && (
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">MyPts</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className={!sidebarOpen ? 'w-full' : 'ml-auto'}
          >
            {sidebarOpen ? <ChevronLeftIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
          </Button>
        </div>
        <div className="py-4 px-4">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center ${sidebarOpen ? 'px-3' : 'justify-center'} py-2 rounded-md ${pathname === item.href ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'} ${item.isAdmin ? 'text-primary' : ''}`}
              >
                <span className={sidebarOpen ? 'mr-3' : ''}>{item.icon}</span>
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>
          <div className="border-t my-4"></div>
          {isAuthenticated ? (
            <div className="space-y-2">
              {sidebarOpen && (
                <div className="flex items-center p-3">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">{user?.name || 'User'}</p>
                    <p className="text-muted-foreground text-xs truncate">{user?.email}</p>
                  </div>
                </div>
              )}
              {!sidebarOpen && (
                <div className="flex justify-center p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </div>
              )}
              <Link
                href="/settings"
                className={`flex items-center ${sidebarOpen ? 'px-3' : 'justify-center'} py-2 rounded-md text-muted-foreground hover:bg-muted`}
              >
                <span className={sidebarOpen ? 'mr-3' : ''}><SettingsIcon className="h-5 w-5" /></span>
                {sidebarOpen && <span>Settings</span>}
              </Link>
              <div className={`relative ${sidebarOpen ? 'px-3' : 'flex justify-center'} py-2`}>
                <NotificationCenter />
              </div>
              <Button
                variant="ghost"
                className={`flex items-center ${sidebarOpen ? 'px-3' : 'justify-center'} py-2 rounded-md text-muted-foreground hover:bg-muted w-full ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
                onClick={() => logout()}
              >
                <span className={sidebarOpen ? 'mr-3' : ''}><LogOutIcon className="h-5 w-5" /></span>
                {sidebarOpen && <span>Log out</span>}
              </Button>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {sidebarOpen ? (
                <>
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register">Sign up</Link>
                  </Button>
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
      <main className={`flex-1 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300 p-4 lg:p-6`}>

        {children}
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 md:py-0 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300`}>
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MyPts. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
