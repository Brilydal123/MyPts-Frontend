import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Bell, BellOff, Smartphone, Trash2, Send } from 'lucide-react';
import {
  isPushNotificationSupported,
  initializePushNotifications,
  getUserDevices,
  unregisterDevice,
  testPushNotification
} from '@/lib/push-notifications';
import { useAuth } from '@/hooks/use-auth';

// Firebase VAPID key
const FIREBASE_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'FIREBASE_VAPID_KEY_PLACEHOLDER';

export function PushNotificationSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    console.log('PushNotificationSettings component mounted or user changed');

    // Create a safety timeout to reset loading state if it gets stuck
    const safetyTimeout = setTimeout(() => {
      console.log('Safety timeout triggered for initial loading');
      setIsLoading(false);
    }, 10000); // 10 seconds safety timeout

    // Check if push notifications are supported
    const checkSupport = () => {
      const supported = isPushNotificationSupported();
      console.log('Push notifications supported:', supported);
      setIsSupported(supported);
      return supported;
    };

    // Load devices
    const loadDevices = async () => {
      console.log('Loading devices...');

      try {
        setIsLoading(true);

        // Check if we have cached devices and they're not too old (less than 1 minute old)
        const cachedDevices = localStorage.getItem('push_notification_devices');
        const cachedTimestamp = localStorage.getItem('push_notification_devices_timestamp');

        if (cachedDevices && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          const oneMinute = 60 * 1000;

          // Use cached devices if they're less than 1 minute old
          if (now - timestamp < oneMinute) {
            console.log('Using cached devices from localStorage');
            const parsedDevices = JSON.parse(cachedDevices);
            console.log(`Found ${parsedDevices.length} cached devices`);
            setDevices(parsedDevices);
            setIsLoading(false);
            return;
          } else {
            console.log('Cached devices expired, fetching fresh data');
          }
        } else {
          console.log('No cached devices found, fetching from API');
        }

        // Fetch devices from API
        console.log('Fetching devices from API...');
        const response = await getUserDevices();
        const deviceList = response.devices || [];
        console.log(`Fetched ${deviceList.length} devices from API`);

        // Cache the devices
        localStorage.setItem('push_notification_devices', JSON.stringify(deviceList));
        localStorage.setItem('push_notification_devices_timestamp', Date.now().toString());
        console.log('Devices cached in localStorage');

        setDevices(deviceList);
      } catch (error) {
        console.error('Error loading devices:', error);
        toast.error("Error", {
          description: 'Failed to load registered devices. Please try again.',
        });
      } finally {
        console.log('Device loading completed, resetting loading state');
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    // Only load devices if push notifications are supported and user is logged in
    if (checkSupport() && user) {
      loadDevices();
    } else {
      console.log('Not loading devices: support=', checkSupport(), 'user=', !!user);
      setIsLoading(false);
      clearTimeout(safetyTimeout);
    }

    // Clean up function
    return () => {
      console.log('PushNotificationSettings component unmounting');
      clearTimeout(safetyTimeout);
    };
  }, [user]); // Only depend on user, not isLoading

  // Helper function to reset notification permissions (for debugging)
  const resetNotificationPermissions = async () => {
    try {
      // This is only possible in Chrome and only works in development
      if (typeof window !== 'undefined' && 'chrome' in window && 'permissions' in navigator) {
        // @ts-ignore - This is a Chrome-specific API
        await navigator.permissions.query({ name: 'notifications' }).then(async (permissionStatus) => {
          console.log('Current permission status:', permissionStatus.state);

          // Try to reset the permission
          if ('permissions' in navigator && 'revoke' in navigator.permissions) {
            try {
              // @ts-ignore - This is a Chrome-specific API
              await navigator.permissions.revoke({ name: 'notifications' });
              console.log('Permission reset attempted');

              // Force a refresh to update the UI
              window.location.reload();
            } catch (resetError) {
              console.error('Failed to reset permission:', resetError);

              toast.info("Manual Reset Required", {
                description: 'Please reset notification permissions manually in your browser settings.',
                action: {
                  label: 'How To',
                  onClick: () => window.open('https://documentation.onesignal.com/docs/clearing-cache-and-resetting-push-permissions', '_blank')
                }
              });
            }
          } else {
            toast.info("Manual Reset Required", {
              description: 'Please reset notification permissions manually in your browser settings.',
              action: {
                label: 'How To',
                onClick: () => window.open('https://documentation.onesignal.com/docs/clearing-cache-and-resetting-push-permissions', '_blank')
              }
            });
          }
        });
      } else {
        toast.info("Manual Reset Required", {
          description: 'Please reset notification permissions manually in your browser settings.',
          action: {
            label: 'How To',
            onClick: () => window.open('https://documentation.onesignal.com/docs/clearing-cache-and-resetting-push-permissions', '_blank')
          }
        });
      }
    } catch (error) {
      console.error('Error resetting permissions:', error);
      toast.error("Error", {
        description: 'Failed to reset notification permissions'
      });
    }
  };

  const handleRegisterDevice = async () => {
    // Create a safety timeout to reset the loading state if something goes wrong
    const safetyTimeout = setTimeout(() => {
      console.log('Safety timeout triggered - resetting loading state');
      setIsRegistering(false);
    }, 30000); // 30 seconds safety timeout

    try {
      console.log('Starting device registration process...');
      setIsRegistering(true);

      // Determine if we're in production or development
      const isProduction = window.location.hostname !== 'localhost' &&
                           window.location.hostname !== '127.0.0.1';

      console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
      console.log('Current hostname:', window.location.hostname);
      console.log('Current origin:', window.location.origin);

      // Log VAPID key for debugging
      console.log('Using VAPID key:', FIREBASE_VAPID_KEY ? `${FIREBASE_VAPID_KEY.substring(0, 10)}...` : 'Missing');

      // Check if we're in a secure context (required for service workers in production)
      if (isProduction && !window.isSecureContext) {
        console.error('Not in a secure context, service workers may not work');
        toast.error("Security Error", {
          description: 'Push notifications require a secure (HTTPS) connection in production.',
        });
        return;
      }

      if (!FIREBASE_VAPID_KEY) {
        toast.error("Configuration Error", {
          description: 'Firebase VAPID key is missing. Please check your environment variables.',
        });
        return;
      }

      // Check if the browser supports push notifications
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast.error("Browser Not Supported", {
          description: 'Your browser does not support push notifications. Please try a different browser.',
        });
        return;
      }

      // Check if permission is denied, and if so, show instructions to reset
      if (Notification.permission === 'denied') {
        toast.error("Permission Denied", {
          description: 'Notification permission was previously denied. Please reset permissions in your browser settings.',
          action: {
            label: 'How To Reset',
            onClick: () => window.open('https://documentation.onesignal.com/docs/clearing-cache-and-resetting-push-permissions', '_blank')
          }
        });
        return;
      }

      // Check if Firebase is properly initialized
      try {
        const firebaseModule = await import('@/lib/firebase');
        if (!firebaseModule.firebaseApp) {
          console.error('Firebase app not initialized');
          toast.error("Firebase Error", {
            description: 'Firebase not properly initialized. Please check your configuration.',
          });
          return;
        }

        console.log('Firebase app initialized:', !!firebaseModule.firebaseApp);
        console.log('Firebase messaging initialized:', !!firebaseModule.messaging);
      } catch (firebaseError: any) {
        console.error('Error importing Firebase:', firebaseError);
        toast.error("Firebase Error", {
          description: 'Failed to load Firebase: ' + (firebaseError.message || 'Unknown error'),
        });
        return;
      }

      // Check current notification permission status
      const currentPermission = Notification.permission;
      console.log('Current notification permission:', currentPermission);

      // If permission is not determined yet, show the browser's native permission prompt
      if (currentPermission === 'default') {
        console.log('Requesting notification permission from browser...');
        try {
          // This will trigger the browser's native permission prompt
          const newPermission = await Notification.requestPermission();
          console.log('Permission after request:', newPermission);

          // If permission is still not granted after the prompt
          if (newPermission !== 'granted') {
            // If permission was explicitly denied, show instructions on how to enable
            if (newPermission === 'denied') {
              toast.error("Permission Denied", {
                description: 'Notification permission denied. Please enable notifications in your browser settings.',
                action: {
                  label: 'How to Enable',
                  onClick: () => window.open('https://support.google.com/chrome/answer/3220216?hl=en', '_blank')
                }
              });
            } else {
              // For other cases (like default), show a more generic message
              toast.error("Permission Required", {
                description: 'Notification permission is required for push notifications.',
              });
            }
            return;
          }
        } catch (permError) {
          console.error('Error requesting notification permission:', permError);
          return;
        }
      } else if (currentPermission !== 'granted') {
        // If permission was already denied before we even tried
        if (currentPermission === 'denied') {
          toast.error("Permission Denied", {
            description: 'Notification permission denied. Please enable notifications in your browser settings.',
            action: {
              label: 'How to Enable',
              onClick: () => window.open('https://support.google.com/chrome/answer/3220216?hl=en', '_blank')
            }
          });
        } else {
          // For other cases, show a more generic message
          toast.error("Permission Required", {
            description: 'Notification permission is required for push notifications.',
          });
        }
        return;
      }

      try {
        // Show a loading toast
        const loadingToast = toast.loading("Registering device...");

        // Add a timeout to prevent hanging
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Registration timed out after 15 seconds. Please try again.'));
          }, 15000);
        });

        // Race between the initialization and the timeout
        const token = await Promise.race([
          initializePushNotifications(FIREBASE_VAPID_KEY),
          timeoutPromise
        ]);

        if (token) {
          // Dismiss the loading toast
          console.log('Registration successful, dismissing loading toast');
          toast.dismiss(loadingToast);

          // Show success message
          console.log('Showing success toast');
          toast.success("Success", {
            description: 'Device registered for push notifications successfully!',
          });

          // Show a test notification to verify everything is working
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              const testNotification = new Notification('Push Notifications Enabled', {
                body: 'You will now receive notifications from MyPts',
                icon: '/logo192.png'
              });

              // Close the notification after 3 seconds
              setTimeout(() => testNotification.close(), 3000);
            }
          } catch (notifyError) {
            console.error('Error showing test notification:', notifyError);
            // Continue anyway, this is just a test
          }

          // Refresh the device list
          console.log('Refreshing device list after successful registration');
          const response = await getUserDevices();
          console.log('Device list refreshed:', response.devices?.length || 0, 'devices found');
          setDevices(response.devices || []);
        } else {
          // Dismiss the loading toast
          console.log('No token received, dismissing loading toast');
          toast.dismiss(loadingToast);

          console.log('Showing error toast for no token');
          toast.error("Registration Failed", {
            description: 'Failed to register device for push notifications. No token received.',
          });
        }
      } catch (error: any) {
        console.error('Error in push notification initialization:', error);

        // Make sure to dismiss any loading toast that might be showing
        toast.dismiss();

        // Provide more specific error messages based on the error
        let errorMessage = 'Failed to register device for push notifications';
        let errorTitle = "Registration Failed";

        if (error.message) {
          if (error.message.includes('Firebase')) {
            errorTitle = "Firebase Error";
            errorMessage = 'Firebase configuration error: ' + error.message;
          } else if (error.message.includes('permission')) {
            errorTitle = "Permission Error";
            errorMessage = 'Notification permission denied. Please enable notifications in your browser settings.';
          } else if (error.message.includes('token')) {
            errorTitle = "Token Error";
            errorMessage = 'Failed to get notification token: ' + error.message;
          } else if (error.message.includes('service worker')) {
            errorTitle = "Service Worker Error";
            errorMessage = 'Service worker registration failed: ' + error.message;
          } else if (error.message.includes('timed out')) {
            errorTitle = "Timeout Error";
            errorMessage = 'The registration process took too long. Please try again.';
          } else {
            errorMessage = error.message;
          }
        }

        console.log(`Showing error toast: ${errorTitle} - ${errorMessage}`);
        toast.error(errorTitle, {
          description: errorMessage,
        });
      }
    } catch (error: any) {
      console.error('Unexpected error registering device:', error);

      // Make sure to dismiss any loading toast that might be showing
      toast.dismiss();

      toast.error("Error", {
        description: 'Unexpected error: ' + (error.message || 'Unknown error'),
      });
    } finally {
      // Clear the safety timeout
      clearTimeout(safetyTimeout);

      // Ensure we reset the loading state
      console.log('Registration process completed, resetting loading state');
      setIsRegistering(false);

      // Refresh the device list even if there was an error
      try {
        console.log('Refreshing device list...');
        const response = await getUserDevices();
        console.log('Device list refreshed:', response.devices?.length || 0, 'devices found');
        setDevices(response.devices || []);
      } catch (refreshError) {
        console.error('Error refreshing device list:', refreshError);
      }

      // Force a re-render to ensure UI is updated
      setIsLoading(true);
      setTimeout(() => {
        console.log('Forcing UI refresh');
        setIsLoading(false);
      }, 100);
    }
  };

  const handleUnregisterDevice = async (deviceId: string) => {
    try {
      await unregisterDevice(deviceId);

      // Remove the device from the list
      setDevices(devices.filter(device => device.id !== deviceId));

      toast.success("Success",{
        // title: 'Success',
        description: 'Device registered for push notifications',
      });
    } catch (error) {
      console.error('Error unregistering device:', error);
      toast.error("Error",{
        // title: 'Error',
        description: 'Failed to register device for push notifications',
        // variant: 'destructive'
      });
    }
  };

  const handleTestNotification = async (deviceId: string) => {
    try {
      setIsTesting(true);
      setSelectedDevice(deviceId);

      console.log(`Testing notification for device: ${deviceId}`);

      // Create a safety timeout to reset the testing state if something goes wrong
      const safetyTimeout = setTimeout(() => {
        console.log('Safety timeout triggered for test notification');
        setIsTesting(false);
        setSelectedDevice(null);
      }, 15000); // 15 seconds safety timeout

      try {
        // Try to send a test notification via the backend
        // Our enhanced testPushNotification function will try multiple approaches
        const result = await testPushNotification(deviceId);
        console.log('Test notification result:', result);

        // Check if we need to show a local notification only
        if (result.showLocalNotification) {
          console.log('API instructed to show local notification only');

          // Show a toast with information about the local notification
          toast.success("Local Notification Sent", {
            description: 'Using local notification instead of push notification due to environment limitations.',
          });

          // Show a local notification
          if ('Notification' in window && Notification.permission === 'granted') {
            console.log('Showing local notification as instructed by API');
            const notification = new Notification('Test Notification (Local)', {
              body: 'This is a local test notification from MyPts. Push notifications may not be available in this environment.',
              icon: '/logo192.png',
              tag: 'test-notification-local'
            });

            // Close the notification after 5 seconds
            setTimeout(() => notification.close(), 5000);
          }
        } else {
          // Show a toast with more detailed information about the push notification
          toast.success("Test Notification Sent", {
            description: `${result.source === 'backend' ? 'Backend' : 'Frontend'} API call successful. Check your device for the notification.`,
          });

          // Always show a local notification as well to ensure the user sees something
          if ('Notification' in window && Notification.permission === 'granted') {
            console.log('Showing local notification to confirm functionality');
            const notification = new Notification('Test Notification (Local)', {
              body: 'This is a local test notification from MyPts. You should also receive a push notification.',
              icon: '/logo192.png',
              tag: 'test-notification-local'
            });

            // Close the notification after 5 seconds
            setTimeout(() => notification.close(), 5000);
          }
        }

        clearTimeout(safetyTimeout);
      } catch (backendError: any) {
        console.warn('Backend notification failed, using local notification instead:', backendError);

        // Clear the safety timeout since we're handling the error
        clearTimeout(safetyTimeout);

        // If backend fails, show a local notification instead
        if ('Notification' in window && Notification.permission === 'granted') {
          console.log('Showing local notification as fallback');
          const notification = new Notification('Test Notification', {
            body: 'This is a test notification from MyPts',
            icon: '/logo192.png',
            tag: 'test-notification'
          });

          // Close the notification after 5 seconds
          setTimeout(() => notification.close(), 5000);

          toast.success("Success", {
            description: 'Local test notification shown (backend notification failed)',
          });
        } else {
          console.error('Cannot show local notification: permission not granted');
          throw new Error('Cannot show local notification: permission not granted');
        }
      }
    } catch (error: any) {
      console.error('Error testing notification:', error);
      toast.error("Error", {
        description: error.message || 'Failed to show test notification',
      });
    } finally {
      setIsTesting(false);
      setSelectedDevice(null);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>Receive notifications on this device</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <BellOff className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Not Supported</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Push notifications are not supported in this browser.
                Try using a modern browser like Chrome, Firefox, or Edge.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 sm:border shadow-none sm:shadow">
      <CardHeader className="px-0 sm:px-6 pt-0 sm:pt-6">
        <CardTitle>Push Notifications</CardTitle>
        <CardDescription>Receive notifications on this device</CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {isLoading ? (
          <div className="flex justify-center p-4 sm:p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {devices.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Registered Devices</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('Manual refresh requested');
                        setIsLoading(true);
                        getUserDevices()
                          .then(response => {
                            console.log(`Refreshed ${response.devices?.length || 0} devices`);
                            setDevices(response.devices || []);

                            // Update cache
                            localStorage.setItem('push_notification_devices', JSON.stringify(response.devices || []));
                            localStorage.setItem('push_notification_devices_timestamp', Date.now().toString());

                            toast.success("Refreshed", {
                              description: 'Device list refreshed successfully'
                            });
                          })
                          .catch(error => {
                            console.error('Error refreshing devices:', error);
                            toast.error("Error", {
                              description: 'Failed to refresh device list'
                            });
                          })
                          .finally(() => {
                            setIsLoading(false);
                          });
                      }}
                      className="h-8 w-8 p-0"
                      title="Refresh device list"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                        <path d="M3 21v-5h5" />
                      </svg>
                    </Button>
                  </div>
                  {devices.map((device) => (
                    <div key={device.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-3 sm:p-4 gap-3 sm:gap-0">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{device.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Last active: {new Date(device.lastActive).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestNotification(device.id)}
                          disabled={isTesting && selectedDevice === device.id}
                          className="h-8 px-2 sm:px-3"
                        >
                          {isTesting && selectedDevice === device.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          <span className="ml-1 sm:ml-2 text-xs sm:text-sm">Test</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnregisterDevice(device.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center p-4 sm:p-6">
                  <div className="text-center">
                    <Bell className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                    <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-medium">No Devices Registered</h3>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                      Register this device to receive push notifications.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="flex flex-col space-y-4 pt-4 px-0 sm:px-6">
        {/* Show notification permission status */}
        {typeof window !== 'undefined' && 'Notification' in window && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3 sm:gap-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Notification Permission:</span>
              {Notification.permission === 'granted' ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Granted
                </Badge>
              ) : Notification.permission === 'denied' ? (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Denied
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Not Requested
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Reset permissions button - always show this */}
              <Button
                onClick={resetNotificationPermissions}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm h-8"
              >
                Reset Permissions
              </Button>

              {/* Show request permission button if permission is not granted */}
              {(typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') && (
                <Button
                  onClick={() => {
                    try {
                      console.log('Requesting notification permission...');

                      // Create a user interaction to trigger the permission prompt
                      if ('Notification' in window) {
                        // First, try to reset any existing permission state
                        // This is especially important if the permission was previously denied
                        try {
                          // Create a direct user interaction to trigger the permission prompt
                          // This is the key part - we need to call this directly from a user interaction
                          const permissionPromise = Notification.requestPermission();

                          // Show a loading toast while waiting for permission
                          const loadingToast = toast.loading("Requesting permission...");

                          permissionPromise.then(permission => {
                            // Dismiss the loading toast
                            toast.dismiss(loadingToast);

                            console.log('Permission after request:', permission);

                            if (permission === 'granted') {
                              toast.success("Permission Granted", {
                                description: 'Notification permission has been granted!'
                              });

                              // Show a test notification
                              try {
                                const notification = new Notification('Notifications Enabled', {
                                  body: 'You will now receive notifications from MyPts',
                                  icon: '/logo192.png'
                                });

                                // Close the notification after 3 seconds
                                setTimeout(() => notification.close(), 3000);
                              } catch (notifyError) {
                                console.error('Error showing test notification:', notifyError);
                              }
                            } else if (permission === 'denied') {
                              toast.error("Permission Denied", {
                                description: 'Notification permission was denied. Please enable in browser settings.',
                                action: {
                                  label: 'How to Enable',
                                  onClick: () => window.open('https://support.google.com/chrome/answer/3220216?hl=en', '_blank')
                                }
                              });
                            } else {
                              // Default state - user didn't make a choice
                              toast.warning("Permission Not Decided", {
                                description: 'You need to allow notifications to receive updates.'
                              });
                            }

                            // Force a re-render to update the UI
                            setIsLoading(true);
                            setTimeout(() => setIsLoading(false), 100);
                          });
                        } catch (permError) {
                          console.error('Error with promise-based permission request:', permError);

                          // Try the callback-based API for older browsers
                          Notification.requestPermission(function(permission) {
                            console.log('Permission from callback:', permission);

                            if (permission === 'granted') {
                              toast.success("Permission Granted", {
                                description: 'Notification permission has been granted!'
                              });
                            } else {
                              toast.error("Permission Not Granted", {
                                description: 'You need to allow notifications to receive updates.'
                              });
                            }

                            // Force a re-render to update the UI
                            setIsLoading(true);
                            setTimeout(() => setIsLoading(false), 100);
                          });
                        }
                      } else {
                        toast.error("Not Supported", {
                          description: 'Notifications are not supported in this browser'
                        });
                      }
                    } catch (error) {
                      console.error('Error requesting permission:', error);
                      toast.error("Error", {
                        description: 'Failed to request notification permission'
                      });
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm h-8"
                >
                  Request Permission
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between w-full gap-4 sm:gap-0">
          <div className="flex items-center space-x-2">
            <Switch id="push-enabled" />
            <Label htmlFor="push-enabled">Enable push notifications</Label>
          </div>
          <Button
            onClick={handleRegisterDevice}
            disabled={isRegistering || (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted')}
            className="w-full sm:w-auto"
          >
            {isRegistering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>Register This Device</>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
