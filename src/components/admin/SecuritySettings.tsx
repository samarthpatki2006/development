
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Lock, Shield, Key, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SecuritySetting {
  id: string;
  two_factor_enabled: boolean;
  last_login_at: string;
  login_attempts: number;
  locked_until: string;
  password_expires_at: string;
}

interface SecuritySettingsProps {
  userProfile: any;
}

const SecuritySettings = ({ userProfile }: SecuritySettingsProps) => {
  const [securitySettings, setSecuritySettings] = useState<SecuritySetting | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('college_id', userProfile.college_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading security settings:', error);
      } else if (data) {
        setSecuritySettings(data);
        setTwoFactorEnabled(data.two_factor_enabled);
      } else {
        // Create default security settings
        const { data: newSettings, error: createError } = await supabase
          .from('security_settings')
          .insert({
            user_id: userProfile.id,
            college_id: userProfile.college_id,
            two_factor_enabled: false
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating security settings:', createError);
        } else {
          setSecuritySettings(newSettings);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggle2FA = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('security_settings')
        .upsert({
          user_id: userProfile.id,
          college_id: userProfile.college_id,
          two_factor_enabled: enabled,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating 2FA:', error);
        toast({
          title: "Error",
          description: "Failed to update two-factor authentication.",
          variant: "destructive",
        });
      } else {
        setTwoFactorEnabled(enabled);
        
        // Log the security action
        await supabase.rpc('log_admin_action', {
          college_uuid: userProfile.college_id,
          admin_uuid: userProfile.id,
          target_uuid: userProfile.id,
          action_type_param: enabled ? '2fa_enabled' : '2fa_disabled',
          action_desc: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`,
          module_param: 'security'
        });

        toast({
          title: "Success",
          description: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}.`,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update security settings.",
        variant: "destructive",
      });
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error changing password:', error);
        toast({
          title: "Error",
          description: "Failed to change password.",
          variant: "destructive",
        });
      } else {
        // Log the security action
        await supabase.rpc('log_admin_action', {
          college_uuid: userProfile.college_id,
          admin_uuid: userProfile.id,
          target_uuid: userProfile.id,
          action_type_param: 'password_changed',
          action_desc: 'Password changed successfully',
          module_param: 'security'
        });

        toast({
          title: "Success",
          description: "Password changed successfully.",
        });

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to change password.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading security settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Account Security</span>
          </CardTitle>
          <CardDescription>
            Manage your account security settings and authentication methods.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium">Account Status</span>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Lock className="w-4 h-4 text-blue-500" />
                <span className="font-medium">2FA Status</span>
              </div>
              <Badge variant={twoFactorEnabled ? "default" : "secondary"}>
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Key className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Last Login</span>
              </div>
              <span className="text-sm text-gray-600">
                {securitySettings?.last_login_at 
                  ? new Date(securitySettings.last_login_at).toLocaleDateString()
                  : 'Never'
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Two-Factor Authentication</span>
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with 2FA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Two-Factor Authentication</Label>
              <div className="text-sm text-gray-500">
                Require a verification code in addition to your password when signing in.
              </div>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={toggle2FA}
            />
          </div>
          
          {twoFactorEnabled && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Two-factor authentication is enabled
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your account is protected with an additional security layer.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Password Management</span>
          </CardTitle>
          <CardDescription>
            Change your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
            />
          </div>
          <Button 
            onClick={changePassword} 
            disabled={!currentPassword || !newPassword || !confirmPassword}
          >
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Security Alerts</span>
          </CardTitle>
          <CardDescription>
            Monitor security events and potential threats to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-sm">Login Attempts</div>
                <div className="text-xs text-gray-500">Failed login attempts in the last 24 hours</div>
              </div>
              <Badge variant="outline">
                {securitySettings?.login_attempts || 0}
              </Badge>
            </div>
            
            {securitySettings?.locked_until && new Date(securitySettings.locked_until) > new Date() && (
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <div className="font-medium text-sm text-red-800">Account Locked</div>
                  <div className="text-xs text-red-600">
                    Account locked until {new Date(securitySettings.locked_until).toLocaleString()}
                  </div>
                </div>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;
