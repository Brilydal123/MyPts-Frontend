'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GoogleAvatar } from '@/components/shared/google-avatar';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Loader2, User, Mail, Phone, Shield, Key, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AccountSettings() {
  const { data: session, update } = useSession();
  const { user, logout, isAuthenticated, isSocialAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.fullName || user?.name || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    twoFactorEnabled: user?.isTwoFactorEnabled || false,
    profileImage: user?.profileImage || user?.image || ''
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.fullName || user.name || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        twoFactorEnabled: user.isTwoFactorEnabled || false,
        profileImage: user.profileImage || user.image || ''
      });
    }
  }, [user]);

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update session
      await update({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
          email: formData.email
        }
      });

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    toast.info('Password reset email sent', {
      description: 'Check your email for instructions to reset your password'
    });
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      // Import the new logout function
      const { logout: logoutFunction } = await import('@/lib/logout');
      await logoutFunction();
      // The new logout function handles everything including redirect
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 sm:border shadow-none sm:shadow max-md:dark:bg-transparent">
      <CardHeader className="sm:px-6 pt-0 sm:pt-6">
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>
          Manage your account information and profile details
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6 space-y-6">
        {/* Profile Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Profile Information</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          </div>
          <Separator className="mb-4" />

          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <GoogleAvatar
                  profileImageUrl={formData.profileImage}
                  fallbackText={formData.name}
                  size={96}
                  className="border-2 border-primary/10"
                />
                {isSocialAuthenticated && (
                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    Google
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={isSocialAuthenticated}
                onClick={() => {
                  if (isSocialAuthenticated) {
                    toast.info("Profile photo is managed by your Google account");
                  } else {
                    toast.info("Photo upload functionality coming soon");
                  }
                }}
              >
                Change Photo
              </Button>
              {isSocialAuthenticated && (
                <p className="text-xs text-muted-foreground mt-1 text-center max-w-[200px]">
                  Your profile photo is managed by your Google account
                </p>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-8"
                      disabled={isSocialAuthenticated}
                    />
                  </div>
                  {isSocialAuthenticated && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Name is managed by your Google account
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-8"
                      disabled={isSocialAuthenticated}
                    />
                  </div>
                  {isSocialAuthenticated ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Email is managed by your Google account
                    </p>
                  ) : (
                    <div className="flex items-center mt-1">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Email verified
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="Your phone number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add your phone number for additional security
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div>
          <h3 className="text-lg font-medium mb-4">Security</h3>
          <Separator className="mb-4" />

          <div className="space-y-4">
            {isSocialAuthenticated && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <Label>Google Authentication</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your account is secured with Google authentication
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-green-600 dark:text-green-400">Active</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                id="two-factor"
                checked={formData.twoFactorEnabled}
                onCheckedChange={(checked) => {
                  if (isSocialAuthenticated) {
                    toast.info("Two-factor authentication is managed by your Google account");
                    return;
                  }
                  handleToggleChange('twoFactorEnabled', checked);
                }}
                disabled={isSocialAuthenticated}
              />
            </div>

            {!isSocialAuthenticated && (
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <Label>Password</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Change your password
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleChangePassword}>
                  Change Password
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Account Actions */}
        <div>
          <h3 className="text-lg font-medium mb-4">Account Actions</h3>
          <Separator className="mb-4" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  <Label>Sign Out</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sign out from your account
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing Out...
                  </>
                ) : 'Sign Out'}
              </Button>
            </div>

            <div className="pt-2">
              <Button variant="link" className="text-destructive p-0 h-auto text-sm">
                Delete Account
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
