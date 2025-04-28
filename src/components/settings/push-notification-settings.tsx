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
    const checkSupport = () => {
      const supported = isPushNotificationSupported();
      setIsSupported(supported);
      return supported;
    };

    const loadDevices = async () => {
      try {
        setIsLoading(true);
        const response = await getUserDevices();
        setDevices(response.devices || []);
      } catch (error) {
        console.error('Error loading devices:', error);
        toast.error("Error",{
          // title: 'Error',
          description: 'Failed to load registered devices',
          // variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (checkSupport() && user) {
      loadDevices();
    } else {
      setIsLoading(false);
    }
  }, [user]);

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
    try {
      setIsRegistering(true);

      // Log VAPID key for debugging
      console.log('Using VAPID key:', FIREBASE_VAPID_KEY ? `${FIREBASE_VAPID_KEY.substring(0, 10)}...` : 'Missing');

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

        // Initialize push notifications
        const token = await initializePushNotifications(FIREBASE_VAPID_KEY);

        if (token) {
          // Dismiss the loading toast
          toast.dismiss(loadingToast);

          toast.success("Success", {
            description: 'Device registered for push notifications successfully!',
          });

          // Refresh the device list
          const response = await getUserDevices();
          setDevices(response.devices || []);
        } else {
          // Dismiss the loading toast
          toast.dismiss(loadingToast);

          toast.error("Registration Failed", {
            description: 'Failed to register device for push notifications. No token received.',
          });
        }
      } catch (error: any) {
        console.error('Error in push notification initialization:', error);

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
          } else {
            errorMessage = error.message;
          }
        }

        toast.error(errorTitle, {
          description: errorMessage,
        });
      }
    } catch (error: any) {
      console.error('Unexpected error registering device:', error);
      toast.error("Error", {
        description: 'Unexpected error: ' + (error.message || 'Unknown error'),
      });
    } finally {
      // Ensure we reset the loading state
      setIsRegistering(false);

      // Refresh the device list even if there was an error
      try {
        const response = await getUserDevices();
        setDevices(response.devices || []);
      } catch (refreshError) {
        console.error('Error refreshing device list:', refreshError);
      }
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

      await testPushNotification(deviceId);


      toast.success("Success",{
        // title: 'Success',
        description: 'Device registered for push notifications',
      });
    } catch (error) {
      console.error('Error testing notification:', error);
      toast.error("Error",{
        // title: 'Error',
        description: 'Failed to register device for push notifications',
        // variant: 'destructive'
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
    <Card>
      <CardHeader>
        <CardTitle>Push Notifications</CardTitle>
        <CardDescription>Receive notifications on this device</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {devices.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Registered Devices</h3>
                  {devices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center space-x-4">
                        <Smartphone className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{device.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Last active: {new Date(device.lastActive).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestNotification(device.id)}
                          disabled={isTesting && selectedDevice === device.id}
                        >
                          {isTesting && selectedDevice === device.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          <span className="ml-2">Test</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnregisterDevice(device.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center p-6">
                  <div className="text-center">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No Devices Registered</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
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
      <CardFooter className="flex flex-col space-y-4 pt-4">
        {/* Show notification permission status */}
        {typeof window !== 'undefined' && 'Notification' in window && (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
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

            <div className="flex space-x-2">
              {/* Reset permissions button - always show this */}
              <Button
                onClick={resetNotificationPermissions}
                variant="outline"
                size="sm"
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
                >
                  Request Permission
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between w-full">
          <div className="flex items-center space-x-2">
            <Switch id="push-enabled" />
            <Label htmlFor="push-enabled">Enable push notifications</Label>
          </div>
          <Button
            onClick={handleRegisterDevice}
            disabled={isRegistering || (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted')}
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
