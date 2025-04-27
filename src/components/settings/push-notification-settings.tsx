import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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

  const handleRegisterDevice = async () => {
    try {
      setIsRegistering(true);

      // Log VAPID key for debugging
      console.log('Using VAPID key:', FIREBASE_VAPID_KEY ? 'Provided' : 'Missing');

      // Check if Firebase is properly initialized
      try {
        const firebaseModule = await import('@/lib/firebase');
        if (!firebaseModule.firebaseApp) {
          console.error('Firebase app not initialized');
          toast.error("Error", {
            description: 'Firebase not properly initialized. Please check your configuration.',
          });
          return;
        }
      } catch (firebaseError: any) {
        console.error('Error importing Firebase:', firebaseError);
        toast.error("Error", {
          description: 'Failed to load Firebase: ' + (firebaseError.message || 'Unknown error'),
        });
        return;
      }

      try {
        const token = await initializePushNotifications(FIREBASE_VAPID_KEY);

        if (token) {
          toast.success("Success", {
            description: 'Device registered for push notifications',
          });

          // Refresh the device list
          const response = await getUserDevices();
          setDevices(response.devices || []);
        } else {
          toast.error("Error", {
            description: 'Failed to register device for push notifications. No token received.',
          });
        }
      } catch (error: any) {
        console.error('Error in push notification initialization:', error);

        // Provide more specific error messages based on the error
        let errorMessage = 'Failed to register device for push notifications';

        if (error.message) {
          if (error.message.includes('Firebase')) {
            errorMessage = 'Firebase configuration error: ' + error.message;
          } else if (error.message.includes('permission')) {
            errorMessage = 'Notification permission denied. Please enable notifications in your browser settings.';
          } else if (error.message.includes('token')) {
            errorMessage = 'Failed to get notification token: ' + error.message;
          } else {
            errorMessage = error.message;
          }
        }

        toast.error("Error", {
          description: errorMessage,
        });
      }
    } catch (error: any) {
      console.error('Unexpected error registering device:', error);
      toast.error("Error", {
        description: 'Unexpected error: ' + (error.message || 'Unknown error'),
      });
    } finally {
      setIsRegistering(false);
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
      <CardFooter className="flex justify-between pt-4">
        <div className="flex items-center space-x-2">
          <Switch id="push-enabled" />
          <Label htmlFor="push-enabled">Enable push notifications</Label>
        </div>
        <Button
          onClick={handleRegisterDevice}
          disabled={isRegistering}
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
      </CardFooter>
    </Card>
  );
}
