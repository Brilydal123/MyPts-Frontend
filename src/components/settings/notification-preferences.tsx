'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Bell, Mail, CreditCard, AlertCircle, MessageCircle } from 'lucide-react';
import { notificationApi } from '@/lib/api/notification-api';

// Lazy load the PushNotificationSettings component
const PushNotificationSettingsLazy = lazy(() =>
  import('./push-notification-settings').then(mod => ({
    default: mod.PushNotificationSettings
  }))
);

interface NotificationPreferences {
  email: {
    transactions: boolean;
    transactionUpdates: boolean;
    purchaseConfirmations: boolean;
    saleConfirmations: boolean;
    security: boolean;
    marketing: boolean;
    profileViews: boolean;
    connectionRequests: boolean;
    messages: boolean;
    endorsements: boolean;
    accountUpdates: boolean;
  };
  push: {
    transactions: boolean;
    transactionUpdates: boolean;
    purchaseConfirmations: boolean;
    saleConfirmations: boolean;
    security: boolean;
    profileViews: boolean;
    connectionRequests: boolean;
    messages: boolean;
    endorsements: boolean;
    accountUpdates: boolean;
  };
  telegram: {
    enabled: boolean;
    username: string;
    transactions: boolean;
    transactionUpdates: boolean;
    purchaseConfirmations: boolean;
    saleConfirmations: boolean;
    security: boolean;
    connectionRequests: boolean;
    messages: boolean;
  };
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      transactions: true,
      transactionUpdates: true,
      purchaseConfirmations: true,
      saleConfirmations: true,
      security: true,
      marketing: false,
      profileViews: true,
      connectionRequests: true,
      messages: true,
      endorsements: true,
      accountUpdates: true
    },
    push: {
      transactions: true,
      transactionUpdates: true,
      purchaseConfirmations: true,
      saleConfirmations: true,
      security: true,
      profileViews: true,
      connectionRequests: true,
      messages: true,
      endorsements: true,
      accountUpdates: true
    },
    telegram: {
      enabled: false,
      username: '',
      transactions: true,
      transactionUpdates: true,
      purchaseConfirmations: true,
      saleConfirmations: true,
      security: true,
      connectionRequests: false,
      messages: false
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch user's notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setIsLoading(true);
        const response = await notificationApi.getUserNotificationPreferences();

        if (response && response.success) {
          setPreferences(response.data);
        }
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
        // Don't show error toast on initial load
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Save notification preferences
  const savePreferences = async () => {
    try {
      setIsSaving(true);
      const response = await notificationApi.updateUserNotificationPreferences(preferences);

      if (response && response.success) {
        toast.success('Notification preferences saved');
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle preference changes
  const handleEmailPrefChange = (key: keyof typeof preferences.email) => {
    setPreferences(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: !prev.email[key]
      }
    }));
  };

  const handlePushPrefChange = (key: keyof typeof preferences.push) => {
    setPreferences(prev => ({
      ...prev,
      push: {
        ...prev.push,
        [key]: !prev.push[key]
      }
    }));
  };

  const handleTelegramPrefChange = (key: keyof typeof preferences.telegram) => {
    if (key === 'username') return; // Handle username separately

    setPreferences(prev => ({
      ...prev,
      telegram: {
        ...prev.telegram,
        [key]: !prev.telegram[key]
      }
    }));
  };

  const handleTelegramUsernameChange = (username: string) => {
    setPreferences(prev => ({
      ...prev,
      telegram: {
        ...prev.telegram,
        username
      }
    }));
  };

  // Verify Telegram connection
  const verifyTelegramConnection = async () => {
    let username = preferences.telegram.username;

    if (!username) {
      toast.error('Please enter your Telegram username or ID');
      return;
    }

    try {
      setIsVerifying(true);

      // Check if the input is a Telegram ID (numeric) or a username
      const isNumericId = /^\d+$/.test(username);

      if (isNumericId) {
        // If it's a numeric ID, we'll send it as both username and telegramId
        toast.info('Using Telegram ID for verification', {
          description: 'Attempting to send verification message using your Telegram ID',
          duration: 3000
        });

        // Continue with the verification process
        // The backend will handle this as a Telegram ID
      } else {
        // Clean up username (remove @ if present)
        if (username.startsWith('@')) {
          username = username.substring(1);
          // Update the input field to show the cleaned username
          handleTelegramUsernameChange(username);
          toast.info('Note: We\'ve removed the @ symbol from your username', {
            description: 'Telegram usernames should be entered without the @ symbol',
            duration: 3000
          });
        }
      }

      // Skip username validation for numeric IDs
      if (!isNumericId) {
        // Basic validation before sending to server
        const usernameRegex = /^[a-zA-Z0-9_]{5,32}$/;
        if (!usernameRegex.test(username)) {
          toast.error('Invalid Telegram username format', {
            description: 'Usernames must be 5-32 characters and can only contain letters, numbers, and underscores',
            duration: 5000
          });
          setIsVerifying(false);
          return;
        }
      }

      // Show a helpful message about what to expect
      toast.info('Sending verification message...', {
        description: 'Please make sure you have started a chat with @MyPtsBot on Telegram',
        duration: 3000
      });

      // If it's a numeric ID, pass it as both username and telegramId
      const response = isNumericId
        ? await notificationApi.verifyTelegramConnection(username, username)
        : await notificationApi.verifyTelegramConnection(username);

      if (response && response.success) {
        const method = response.method || 'default';
        if (method === 'telegram_id') {
          toast.success('Verification message sent to your Telegram account using ID', {
            description: 'Please check your Telegram app for the message',
            duration: 5000
          });
        } else {
          toast.success('Verification message sent to your Telegram account', {
            description: 'Please check your Telegram app for the message',
            duration: 5000
          });
        }
      } else {
        toast.error(response?.message || 'Failed to send verification message');
      }
    } catch (error: any) {
      console.error('Error verifying Telegram connection:', error);

      // Get the error details from the response
      const errorData = error?.response?.data || {};
      const errorMessage = errorData.message ||
                          'Failed to send verification message. Make sure you have started a chat with @MyPtsBot';
      const errorReason = errorData.reason || '';

      // Show a more helpful error message based on the reason
      if (errorReason === 'bot_chat_not_started' || errorMessage.includes('bot can\'t initiate conversation')) {
        toast.error('You need to start a chat with @MyPtsBot first', {
          description: 'Open Telegram, search for @MyPtsBot, and click "Start"',
          duration: 6000
        });
      } else if (errorReason === 'Username not found' || errorMessage.includes('username was not found') || errorMessage.includes('chat not found')) {
        toast.error('Telegram username not found', {
          description: 'Please check that you entered your username correctly. Remember to use your username, not your display name.',
          duration: 6000,
          action: {
            label: 'How to find my username?',
            onClick: () => window.open('https://telegram.org/faq#usernames-and-t-me', '_blank')
          }
        });
      } else if (errorMessage.includes('Invalid username format')) {
        toast.error('Invalid Telegram username format', {
          description: 'Usernames must be 5-32 characters and can only contain letters, numbers, and underscores',
          duration: 5000
        });
      } else if (errorMessage.includes('chat not found')) {
        toast.error('Telegram username not found', {
          description: 'Please check that you entered your username correctly and have started a chat with @MyPtsBot. Try entering your username without the @ symbol.',
          duration: 8000,
          action: {
            label: 'Open Telegram',
            onClick: () => window.open('https://t.me/MyPtsBot', '_blank')
          }
        });
      } else if (errorMessage.includes('bot can\'t initiate conversation')) {
        toast.error('Bot conversation not started', {
          description: 'You need to start a chat with @MyPtsBot first before we can send you messages. Click the button below to open Telegram.',
          duration: 8000,
          action: {
            label: 'Open Telegram',
            onClick: () => window.open('https://t.me/MyPtsBot', '_blank')
          }
        });
      } else if (errorMessage.includes('Error contacting Telegram')) {
        toast.error('Error connecting to Telegram', {
          description: 'There was a problem contacting Telegram. Please try again later.',
          duration: 6000,
          action: {
            label: 'Open Telegram',
            onClick: () => window.open('https://t.me/MyPtsBot', '_blank')
          }
        });
      } else {
        toast.error('Telegram verification failed', {
          description: 'Please make sure you have entered your correct Telegram username and have started a chat with @MyPtsBot. See the troubleshooting tips below.',
          duration: 8000,
          action: {
            label: 'Open Telegram',
            onClick: () => window.open('https://t.me/MyPtsBot', '_blank')
          }
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose how you want to be notified about transactions and other activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Email Notifications */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Email Notifications</h3>
              </div>
              <Separator className="mb-4" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-transactions">All Transaction Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about all MyPts transactions
                    </p>
                  </div>
                  <Switch
                    id="email-transactions"
                    checked={preferences.email.transactions}
                    onCheckedChange={() => handleEmailPrefChange('transactions')}
                  />
                </div>

                {preferences.email.transactions && (
                  <div className="ml-6 space-y-4 border-l-2 pl-4 border-muted">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-transaction-updates">Transaction Status Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive emails when your transaction status changes
                        </p>
                      </div>
                      <Switch
                        id="email-transaction-updates"
                        checked={preferences.email.transactionUpdates}
                        onCheckedChange={() => handleEmailPrefChange('transactionUpdates')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-purchase-confirmations">Purchase Confirmations</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive emails when you buy MyPts
                        </p>
                      </div>
                      <Switch
                        id="email-purchase-confirmations"
                        checked={preferences.email.purchaseConfirmations}
                        onCheckedChange={() => handleEmailPrefChange('purchaseConfirmations')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-sale-confirmations">Sale Confirmations</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive emails when you sell MyPts
                        </p>
                      </div>
                      <Switch
                        id="email-sale-confirmations"
                        checked={preferences.email.saleConfirmations}
                        onCheckedChange={() => handleEmailPrefChange('saleConfirmations')}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-security">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about security-related events
                    </p>
                  </div>
                  <Switch
                    id="email-security"
                    checked={preferences.email.security}
                    onCheckedChange={() => handleEmailPrefChange('security')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-profile-views">Profile Views</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails when someone views your profile
                    </p>
                  </div>
                  <Switch
                    id="email-profile-views"
                    checked={preferences.email.profileViews}
                    onCheckedChange={() => handleEmailPrefChange('profileViews')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-connection-requests">Connection Requests</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about new connection requests
                    </p>
                  </div>
                  <Switch
                    id="email-connection-requests"
                    checked={preferences.email.connectionRequests}
                    onCheckedChange={() => handleEmailPrefChange('connectionRequests')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-messages">Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about new messages
                    </p>
                  </div>
                  <Switch
                    id="email-messages"
                    checked={preferences.email.messages}
                    onCheckedChange={() => handleEmailPrefChange('messages')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-endorsements">Endorsements</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails when you receive endorsements
                    </p>
                  </div>
                  <Switch
                    id="email-endorsements"
                    checked={preferences.email.endorsements}
                    onCheckedChange={() => handleEmailPrefChange('endorsements')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-account-updates">Account Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about account updates and changes
                    </p>
                  </div>
                  <Switch
                    id="email-account-updates"
                    checked={preferences.email.accountUpdates}
                    onCheckedChange={() => handleEmailPrefChange('accountUpdates')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-marketing">Marketing & Promotions</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about new features and promotions
                    </p>
                  </div>
                  <Switch
                    id="email-marketing"
                    checked={preferences.email.marketing}
                    onCheckedChange={() => handleEmailPrefChange('marketing')}
                  />
                </div>
              </div>
            </div>

            {/* Push Notifications */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Push Notifications</h3>
              </div>
              <Separator className="mb-4" />

              {/* Device Management Section */}
              <div className="mb-6">
                <h4 className="text-md font-medium mb-2">Device Management</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Register your devices to receive push notifications.
                </p>

                {/* Lazy load the PushNotificationSettings component */}
                <div className="mt-4">
                  <Suspense fallback={<div className="p-4 text-center">Loading device management...</div>}>
                    <PushNotificationSettingsLazy />
                  </Suspense>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="mt-6 mb-4">
                <h4 className="text-md font-medium mb-2">Notification Preferences</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose which types of notifications you want to receive.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-transactions">All Transaction Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications for all MyPts transactions
                    </p>
                  </div>
                  <Switch
                    id="push-transactions"
                    checked={preferences.push.transactions}
                    onCheckedChange={() => handlePushPrefChange('transactions')}
                  />
                </div>

                {preferences.push.transactions && (
                  <div className="ml-6 space-y-4 border-l-2 pl-4 border-muted">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-transaction-updates">Transaction Status Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications when your transaction status changes
                        </p>
                      </div>
                      <Switch
                        id="push-transaction-updates"
                        checked={preferences.push.transactionUpdates}
                        onCheckedChange={() => handlePushPrefChange('transactionUpdates')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-purchase-confirmations">Purchase Confirmations</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications when you buy MyPts
                        </p>
                      </div>
                      <Switch
                        id="push-purchase-confirmations"
                        checked={preferences.push.purchaseConfirmations}
                        onCheckedChange={() => handlePushPrefChange('purchaseConfirmations')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-sale-confirmations">Sale Confirmations</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications when you sell MyPts
                        </p>
                      </div>
                      <Switch
                        id="push-sale-confirmations"
                        checked={preferences.push.saleConfirmations}
                        onCheckedChange={() => handlePushPrefChange('saleConfirmations')}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-security">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications for security events
                    </p>
                  </div>
                  <Switch
                    id="push-security"
                    checked={preferences.push.security}
                    onCheckedChange={() => handlePushPrefChange('security')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-profile-views">Profile Views</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications when someone views your profile
                    </p>
                  </div>
                  <Switch
                    id="push-profile-views"
                    checked={preferences.push.profileViews}
                    onCheckedChange={() => handlePushPrefChange('profileViews')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-connection-requests">Connection Requests</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications about new connection requests
                    </p>
                  </div>
                  <Switch
                    id="push-connection-requests"
                    checked={preferences.push.connectionRequests}
                    onCheckedChange={() => handlePushPrefChange('connectionRequests')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-messages">Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications about new messages
                    </p>
                  </div>
                  <Switch
                    id="push-messages"
                    checked={preferences.push.messages}
                    onCheckedChange={() => handlePushPrefChange('messages')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-endorsements">Endorsements</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications when you receive endorsements
                    </p>
                  </div>
                  <Switch
                    id="push-endorsements"
                    checked={preferences.push.endorsements}
                    onCheckedChange={() => handlePushPrefChange('endorsements')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-account-updates">Account Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications about account updates and changes
                    </p>
                  </div>
                  <Switch
                    id="push-account-updates"
                    checked={preferences.push.accountUpdates}
                    onCheckedChange={() => handlePushPrefChange('accountUpdates')}
                  />
                </div>
              </div>
            </div>

            {/* Telegram Notifications */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="h-5 w-5  text-blue-500" />
                <h3 className="text-lg font-medium">Telegram Notifications</h3>
              </div>
              <Separator className="mb-4" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="telegram-enabled">Enable Telegram Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive transaction notifications via Telegram
                    </p>
                  </div>
                  <Switch
                    id="telegram-enabled"
                    checked={preferences.telegram.enabled}
                    onCheckedChange={() => handleTelegramPrefChange('enabled')}
                  />
                </div>

                {preferences.telegram.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="telegram-username">Telegram Username</Label>
                      <div className="flex gap-2">
                        <Input
                          id="telegram-username"
                          placeholder="username (without @)"
                          value={preferences.telegram.username}
                          onChange={(e) => handleTelegramUsernameChange(e.target.value)}
                        />
                        <Button
                          variant="outline"
                          onClick={verifyTelegramConnection}
                          disabled={isVerifying}
                        >
                          {isVerifying ? 'Sending...' : 'Verify'}
                        </Button>
                      </div>
                      <div className="space-y-1 mt-1">
                        <p className="text-xs text-muted-foreground">
                          <strong>Important:</strong> Follow these steps to connect Telegram:
                        </p>
                        <ol className="text-xs text-muted-foreground list-decimal pl-5">
                          <li>
                            <a
                              href="https://t.me/MyPtsBot"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              Open @MyPtsBot in Telegram
                            </a> and click "Start" or send a message
                          </li>
                          <li>
                            <strong>Important:</strong> Send the message <code>/start</code> to the bot
                          </li>
                          <li>Enter your Telegram username (without the @ symbol)</li>
                          <li>Make sure your username is set in Telegram Settings → Username</li>
                          <li>Return here and click "Verify" to test the connection</li>
                        </ol>

                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            <strong>Troubleshooting:</strong> If verification fails, try these steps:
                          </p>
                          <ul className="text-xs text-blue-600 dark:text-blue-400 list-disc pl-5 mt-1">
                            <li>Make sure you've started a chat with @MyPtsBot</li>
                            <li><strong>Send the message "/start" to the bot</strong> - this is crucial!</li>
                            <li>Check that your Telegram username is correct</li>
                            <li>Try entering your username without the @ symbol</li>
                            <li>Ensure your Telegram privacy settings allow bot messages</li>
                            <li>Try closing and reopening Telegram, then send "/start" again</li>
                            <li>If using Telegram Web, try using the mobile app instead</li>
                          </ul>

                          <details className="mt-2">
                            <summary className="text-xs text-blue-700 dark:text-blue-300 cursor-pointer">
                              <strong>Advanced: Use Telegram ID instead</strong>
                            </summary>
                            <div className="mt-2 pl-2">
                              <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                                If username verification isn't working, you can find your Telegram ID by:
                              </p>
                              <ol className="text-xs text-blue-600 dark:text-blue-400 list-decimal pl-5">
                                <li>Messaging @userinfobot on Telegram</li>
                                <li>Copy your ID number (e.g., 7935903970)</li>
                                <li>Enter it in the username field above</li>
                              </ol>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                The system will detect numeric IDs automatically.
                              </p>
                            </div>
                          </details>

                          <div className="mt-2">
                            <a
                              href="https://t.me/MyPtsBot"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <span>Click here to open Telegram and start a chat with our bot</span>
                            </a>
                          </div>
                        </div>
                        <div className="mt-2">
                          <a
                            href="https://t.me/MyPtsBot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                          >
                            <span>Click here to open Telegram and start a chat with our bot</span>
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>Note:</strong> Your Telegram username is different from your display name.
                          You can find it in Telegram Settings → Username.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>Tip:</strong> If you've previously verified your Telegram account,
                          we'll use your Telegram ID for verification, which is more reliable than username-based verification.
                        </p>
                      </div>
                    </div>

                    <div className="ml-0 space-y-4 mt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="telegram-transactions">All Transaction Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive Telegram messages for all MyPts transactions
                          </p>
                        </div>
                        <Switch
                          id="telegram-transactions"
                          checked={preferences.telegram.transactions}
                          onCheckedChange={() => handleTelegramPrefChange('transactions')}
                        />
                      </div>

                      {preferences.telegram.transactions && (
                        <div className="ml-6 space-y-4 border-l-2 pl-4 border-muted">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="telegram-transaction-updates">Transaction Status Updates</Label>
                              <p className="text-sm text-muted-foreground">
                                Receive Telegram messages when your transaction status changes
                              </p>
                            </div>
                            <Switch
                              id="telegram-transaction-updates"
                              checked={preferences.telegram.transactionUpdates}
                              onCheckedChange={() => handleTelegramPrefChange('transactionUpdates')}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="telegram-purchase-confirmations">Purchase Confirmations</Label>
                              <p className="text-sm text-muted-foreground">
                                Receive Telegram messages when you buy MyPts
                              </p>
                            </div>
                            <Switch
                              id="telegram-purchase-confirmations"
                              checked={preferences.telegram.purchaseConfirmations}
                              onCheckedChange={() => handleTelegramPrefChange('purchaseConfirmations')}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="telegram-sale-confirmations">Sale Confirmations</Label>
                              <p className="text-sm text-muted-foreground">
                                Receive Telegram messages when you sell MyPts
                              </p>
                            </div>
                            <Switch
                              id="telegram-sale-confirmations"
                              checked={preferences.telegram.saleConfirmations}
                              onCheckedChange={() => handleTelegramPrefChange('saleConfirmations')}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="telegram-security">Security Alerts</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive Telegram messages for security events
                          </p>
                        </div>
                        <Switch
                          id="telegram-security"
                          checked={preferences.telegram.security}
                          onCheckedChange={() => handleTelegramPrefChange('security')}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="telegram-connection-requests">Connection Requests</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive Telegram messages about new connection requests
                          </p>
                        </div>
                        <Switch
                          id="telegram-connection-requests"
                          checked={preferences.telegram.connectionRequests}
                          onCheckedChange={() => handleTelegramPrefChange('connectionRequests')}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="telegram-messages">Messages</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive Telegram notifications about new messages
                          </p>
                        </div>
                        <Switch
                          id="telegram-messages"
                          checked={preferences.telegram.messages}
                          onCheckedChange={() => handleTelegramPrefChange('messages')}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={savePreferences}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
