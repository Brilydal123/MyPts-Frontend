'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationPreferences } from '@/components/settings/notification-preferences';
import { AccountSettings } from '@/components/settings/account-settings';
import { PreferencesSettings } from '@/components/settings/preferences-settings';
import { MainLayout } from '@/components/shared/main-layout';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('account');

  return (
    <MainLayout>
      <div className="container px-4 sm:px-6 mx-auto py-4 sm:py-6 max-w-full sm:max-w-7xl">
        <h1 className="text-2xl font-bold mb-4 md:mb-6">Settings</h1>

        <Tabs defaultValue="account" className="w-full" onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2 mb-2">
            <TabsList className="w-full sm:w-auto flex sm:inline-flex whitespace-nowrap">
              <TabsTrigger value="account" className="flex-1 sm:flex-none">Account</TabsTrigger>
              <TabsTrigger value="notifications" className="flex-1 sm:flex-none">Notifications</TabsTrigger>
              <TabsTrigger value="preferences" className="flex-1 sm:flex-none">Preferences</TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-4 sm:mt-6">
            <TabsContent value="account">
              <AccountSettings />
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationPreferences />
            </TabsContent>

            <TabsContent value="preferences">
              <PreferencesSettings />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
