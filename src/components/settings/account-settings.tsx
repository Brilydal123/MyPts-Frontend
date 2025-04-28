'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, User, Mail, Phone, Shield, Key, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AccountSettings() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    twoFactorEnabled: false,
    emailVerified: !!(session?.user as any)?.emailVerified,
    profileImage: session?.user?.image || ''
  });

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
      router.push('/auth/signout');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 sm:border shadow-none sm:shadow">
      <CardHeader className="px-0 sm:px-6 pt-0 sm:pt-6">
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
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.profileImage} alt={formData.name} />
                <AvatarFallback className="text-lg">{getInitials(formData.name)}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" className="mt-2">
                Change Photo
              </Button>
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
                    />
                  </div>
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
                    />
                  </div>
                  {!formData.emailVerified && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      Email not verified. <Button variant="link" className="h-auto p-0 text-xs">Resend verification</Button>
                    </p>
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
                onCheckedChange={(checked) => handleToggleChange('twoFactorEnabled', checked)}
              />
            </div>
            
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
