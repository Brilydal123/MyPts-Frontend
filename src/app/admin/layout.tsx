'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  PieChart
} from 'lucide-react';
import Link from 'next/link';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Admin navigation items
  const adminNav = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: <BarChart3 className="h-5 w-5" />,
      exact: true
    },
    {
      name: 'Supply Management',
      href: '/admin/supply',
      icon: <DollarSign className="h-5 w-5" />
    },
    // {
    //   name: 'User Management',
    //   href: '/admin/users',
    //   icon: <Users className="h-5 w-5" />
    // },
    {
      name: 'Profile Management',
      href: '/admin/profiles',
      icon: <UserCircle className="h-5 w-5" />
    },
    {
      name: 'Reward MyPts',
      href: '/admin/reward',
      icon: <ShieldAlert className="h-5 w-5" />
    },
    {
      name: 'Transaction History',
      href: '/admin/transactions',
      icon: <History className="h-5 w-5" />
    },
    {
      name: 'Profile Transactions',
      href: '/admin/profile-transactions',
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      name: 'MyPts Statistics',
      href: '/admin/mypts-stats',
      icon: <PieChart className="h-5 w-5" />
    },
    {
      name: 'System Verification',
      href: '/admin/system',
      icon: <AlertTriangle className="h-5 w-5" />
    },
    {
      name: 'Exchange Rates',
      href: '/admin/exchange-rates',
      icon: <Globe className="h-5 w-5" />
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />
    },
  ];

  // Store admin status in localStorage for other pages to use
  useEffect(() => {
    if (isAdmin && typeof window !== 'undefined') {
      localStorage.setItem('isAdmin', 'true');
      console.log('Admin layout - stored isAdmin in localStorage');
    }
  }, [isAdmin]);

  // If not admin, redirect to home
  if (!isAdmin) {
    // Check if we're still loading admin status
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen flex-col gap-4">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking admin permissions...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <div className="p-8 border border-red-200 rounded-lg bg-red-50 max-w-md text-center">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
          <p className="text-red-600 mb-6">
            You don't have permission to access the admin area.
          </p>
          <Button onClick={() => router.push('/')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Check if the current path matches a navigation item
  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Admin header */}
      <header className="bg-primary text-primary-foreground py-3 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <h1 className="text-xl font-bold">MyPts Admin</h1>
            <Badge variant="outline" className="ml-2 text-primary-foreground border-primary-foreground">
              Admin Area
            </Badge>
          </div>
          <div>
            <Button variant="secondary" size="sm" onClick={() => router.push('/')}>
              Exit Admin
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-muted/50 border-r p-4 hidden md:block">
          <nav className="space-y-1">
            {adminNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  isActive(item.href, item.exact)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile navigation */}
        <div className="md:hidden border-b sticky top-0 bg-background z-10">
          <div className="px-4 py-2 overflow-x-auto flex gap-2 whitespace-nowrap">
            {adminNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive(item.href, item.exact)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
