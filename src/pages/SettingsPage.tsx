import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, Moon, Globe, Bell, Shield, Download, Trash2, 
  User, Mail, Phone, Save, AlertCircle, LogOut 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser, useClerk } from '@clerk/clerk-react';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  
  // Clerk Hooks
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  // --- FIX: Safe Storage Loading ---
  const [userSettings, setUserSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('user_preferences');
      if (saved && saved !== "undefined") {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to parse user settings, resetting to default.");
      localStorage.removeItem('user_preferences');
    }
    return {
      notifications: { email: true, push: false, reminders: true },
      privacy: { shareData: false, analytics: true },
      phone: ''
    };
  });

  const [profileName, setProfileName] = useState('');

  // Sync User Data when loaded
  useEffect(() => {
    if (isLoaded && user) {
      setProfileName(user.fullName || '');
    }
  }, [isLoaded, user]);

  // Persist Settings
  useEffect(() => {
    localStorage.setItem('user_preferences', JSON.stringify(userSettings));
  }, [userSettings]);

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिन्दी' },
    { value: 'kn', label: 'ಕನ್ನಡ' },
    { value: 'ta', label: 'தமிழ்' },
    { value: 'te', label: 'తెలుగు' },
    { value: 'ja', label: '日本語' }
  ];

  const handleSaveProfile = () => {
    toast({
      title: "Profile Saved",
      description: "Your preferences have been updated locally.",
    });
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setUserSettings((prev: any) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setUserSettings((prev: any) => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value }
    }));
  };

  const handleExportData = () => {
    try {
      const history = localStorage.getItem('clarity_scan_history');
      const blob = new Blob([history || '[]'], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = "my_health_data.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "Your data has been downloaded.",
      });
    } catch (e) {
      toast({ title: "Export Failed", description: "Could not generate export file.", variant: "destructive" });
    }
  };

  const handleDeleteAllData = () => {
    if (window.confirm("Are you sure? This will wipe your local scan history permanently.")) {
      localStorage.removeItem('clarity_scan_history');
      localStorage.removeItem('user_preferences');
      toast({
        title: "Data Deleted",
        description: "All local data has been wiped. Refreshing...",
        variant: "destructive",
      });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  if (!isLoaded) {
    return <div className="flex h-[50vh] items-center justify-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            {t('settings') || 'Settings'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your account preferences and app settings.
          </p>
        </div>

        {/* Theme & Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" /> Appearance
            </CardTitle>
            <CardDescription>Customize display settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Theme</Label>
                <div className="text-sm text-muted-foreground">Switch between light and dark mode</div>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                <Moon className="h-4 w-4" />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Language</Label>
                <div className="text-sm text-muted-foreground">Select your preferred language</div>
              </div>
              <Select value={currentLanguage} onValueChange={setLanguage}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {languageOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Personal Information</CardTitle>
            <CardDescription>Managed via your secure account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={profileName} 
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  value={user?.primaryEmailAddress?.emailAddress || ''} 
                  disabled 
                  className="bg-slate-100 text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="+1 234 567 890"
                  value={userSettings.phone || ''}
                  onChange={(e) => setUserSettings((prev: any) => ({ ...prev, phone: e.target.value }))} 
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} className="bg-slate-900 text-white hover:bg-slate-800">
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <div className="text-sm text-muted-foreground">Receive updates via email</div>
                </div>
                <Switch 
                  checked={userSettings.notifications?.email ?? true} 
                  onCheckedChange={(c) => handleNotificationChange('email', c)} 
                />
            </div>
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Health Reminders</Label>
                  <div className="text-sm text-muted-foreground">Periodic check-up reminders</div>
                </div>
                <Switch 
                  checked={userSettings.notifications?.reminders ?? true} 
                  onCheckedChange={(c) => handleNotificationChange('reminders', c)} 
                />
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Data & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Share Anonymous Data</Label>
                <div className="text-sm text-muted-foreground">Allow anonymized data for research</div>
              </div>
              <Switch 
                checked={userSettings.privacy?.shareData ?? false} 
                onCheckedChange={(c) => handlePrivacyChange('shareData', c)} 
              />
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button variant="outline" onClick={handleExportData} className="flex-1">
                <Download className="h-4 w-4 mr-2" /> Export Data (JSON)
              </Button>
              <Button variant="destructive" onClick={handleDeleteAllData} className="flex-1">
                <Trash2 className="h-4 w-4 mr-2" /> Delete All History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <div className="flex justify-center pt-4 pb-8">
            <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
        </div>

      </motion.div>
    </div>
  );
};

export default SettingsPage;
