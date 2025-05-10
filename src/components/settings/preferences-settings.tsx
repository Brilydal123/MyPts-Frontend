'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, Moon, Sun, Monitor, Palette, Globe, Bell, Clock, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';

export function PreferencesSettings() {
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    theme: theme || 'system',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    soundEnabled: true,
    autoUpdates: true,
    compactMode: false,
    highContrastMode: false,
    reducedMotion: false,
    performanceMode: false
  });

  const handleThemeChange = (value: string) => {
    setPreferences(prev => ({ ...prev, theme: value }));
    setTheme(value);
  };

  const handleToggleChange = (field: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-0 sm:border shadow-none sm:shadow max-md:dark:bg-transparent">
      <CardHeader className="px-0 sm:px-6 pt-0 sm:pt-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Customize your application experience
            </CardDescription>
          </div>
          <Button
            onClick={handleSavePreferences}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Preferences'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6 space-y-6">
        {/* Appearance Settings */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">Appearance</h3>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <RadioGroup
                value={preferences.theme}
                onValueChange={handleThemeChange}
                className="flex flex-col sm:flex-row gap-2 sm:gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="theme-light" />
                  <Label htmlFor="theme-light" className="flex items-center gap-1.5">
                    <Sun className="h-4 w-4" />
                    Light
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Label htmlFor="theme-dark" className="flex items-center gap-1.5">
                    <Moon className="h-4 w-4" />
                    Dark
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="theme-system" />
                  <Label htmlFor="theme-system" className="flex items-center gap-1.5">
                    <Monitor className="h-4 w-4" />
                    System
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="high-contrast">High Contrast Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Increase contrast for better visibility
                </p>
              </div>
              <Switch
                id="high-contrast"
                checked={preferences.highContrastMode}
                onCheckedChange={(checked) => handleToggleChange('highContrastMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reduced-motion">Reduced Motion</Label>
                <p className="text-sm text-muted-foreground">
                  Minimize animations throughout the interface
                </p>
              </div>
              <Switch
                id="reduced-motion"
                checked={preferences.reducedMotion}
                onCheckedChange={(checked) => handleToggleChange('reducedMotion', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compact-mode">Compact Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Reduce spacing and size of UI elements
                </p>
              </div>
              <Switch
                id="compact-mode"
                checked={preferences.compactMode}
                onCheckedChange={(checked) => handleToggleChange('compactMode', checked)}
              />
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">Regional Settings</h3>
          </div>
          <Separator className="mb-4" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) => handleSelectChange('language', value)}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Time Zone</Label>
              <Select
                value={preferences.timezone}
                onValueChange={(value) => handleSelectChange('timezone', value)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select time zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                  <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                  <SelectItem value="CST">CST (Central Standard Time)</SelectItem>
                  <SelectItem value="MST">MST (Mountain Standard Time)</SelectItem>
                  <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                  <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-format">Date Format</Label>
              <Select
                value={preferences.dateFormat}
                onValueChange={(value) => handleSelectChange('dateFormat', value)}
              >
                <SelectTrigger id="date-format">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="YYYY/MM/DD">YYYY/MM/DD</SelectItem>
                  <SelectItem value="DD-MMM-YYYY">DD-MMM-YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">System Settings</h3>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-enabled">Sound Effects</Label>
                <p className="text-sm text-muted-foreground">
                  Enable sound effects for notifications and actions
                </p>
              </div>
              <Switch
                id="sound-enabled"
                checked={preferences.soundEnabled}
                onCheckedChange={(checked) => handleToggleChange('soundEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-updates">Automatic Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically update the application when new versions are available
                </p>
              </div>
              <Switch
                id="auto-updates"
                checked={preferences.autoUpdates}
                onCheckedChange={(checked) => handleToggleChange('autoUpdates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="performance-mode">Performance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Optimize for performance on lower-end devices
                </p>
              </div>
              <Switch
                id="performance-mode"
                checked={preferences.performanceMode}
                onCheckedChange={(checked) => handleToggleChange('performanceMode..', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
