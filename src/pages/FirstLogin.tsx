import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Eye, EyeOff, CheckCircle, XCircle, Lock, UserCircle, Mail } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_code: string;
  user_type: string;
  college_id: string;
}

interface OnboardingRecord {
  id: string;
  temp_password: string;
  password_reset_required: boolean;
  first_login_completed: boolean;
  onboarding_completed: boolean;
}

const FirstLogin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [onboardingRecord, setOnboardingRecord] = useState<OnboardingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    checkAuthAndOnboarding();
  }, []);

  useEffect(() => {
    if (newPassword) {
      calculatePasswordStrength(newPassword);
      validatePassword(newPassword);
    } else {
      setPasswordStrength(0);
      setValidationErrors([]);
    }
  }, [newPassword]);

  const checkAuthAndOnboarding = async () => {
    try {
      setIsLoading(true);

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to continue',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setSession(session);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        toast({
          title: 'Profile Error',
          description: 'Unable to load user profile',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setUserProfile(profile);

      // Get onboarding record
      const { data: onboarding, error: onboardingError } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (onboardingError || !onboarding) {
        toast({
          title: 'Onboarding Error',
          description: 'No onboarding record found',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setOnboardingRecord(onboarding);

      // Check if password reset is required
      if (!onboarding.password_reset_required) {
        // User has already completed first login
        redirectToDashboard(profile.user_type);
        return;
      }

    } catch (error) {
      console.error('Error checking auth and onboarding:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    
    setPasswordStrength(Math.min(strength, 100));
  };

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    setValidationErrors(errors);
  };

  const handlePasswordChange = async () => {
    try {
      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all password fields',
          variant: 'destructive',
        });
        return;
      }

      if (!onboardingRecord) {
        toast({
          title: 'Error',
          description: 'Onboarding record not found',
          variant: 'destructive',
        });
        return;
      }

      // Verify current password matches temporary password
      if (currentPassword !== onboardingRecord.temp_password) {
        toast({
          title: 'Invalid Password',
          description: 'Current password does not match the temporary password',
          variant: 'destructive',
        });
        return;
      }

      if (validationErrors.length > 0) {
        toast({
          title: 'Password Requirements Not Met',
          description: validationErrors[0],
          variant: 'destructive',
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        toast({
          title: 'Password Mismatch',
          description: 'New password and confirmation do not match',
          variant: 'destructive',
        });
        return;
      }

      if (newPassword === currentPassword) {
        toast({
          title: 'Same Password',
          description: 'New password must be different from temporary password',
          variant: 'destructive',
        });
        return;
      }

      setIsSubmitting(true);

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Update onboarding record
      const { error: onboardingUpdateError } = await supabase
        .from('user_onboarding')
        .update({
          password_reset_required: false,
          first_login_completed: true,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', onboardingRecord.id);

      if (onboardingUpdateError) {
        throw onboardingUpdateError;
      }

      toast({
        title: 'Success!',
        description: 'Password changed successfully. Redirecting to your dashboard...',
      });

      // Wait a moment then redirect
      setTimeout(() => {
        if (userProfile) {
          redirectToDashboard(userProfile.user_type);
        }
      }, 2000);

    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: 'Password Change Failed',
        description: error.message || 'An error occurred while changing your password',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const redirectToDashboard = (userType: string) => {
    const routes: Record<string, string> = {
      'student': '/student',
      'teacher': '/teacher',
      'faculty': '/faculty',
      'admin': '/admin',
      'super_admin': '/admin',
      'parent': '/parent',
      'alumni': '/alumni',
      'staff': '/staff'
    };

    const route = routes[userType] || '/student';
    navigate(route);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            First Login Setup
          </h1>
          <p className="text-muted-foreground">
            Welcome! Please change your temporary password
          </p>
        </div>

        {/* User Info Card */}
        {userProfile && (
          <Card className="mb-6 border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {userProfile.first_name} {userProfile.last_name}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground space-x-2">
                    <Mail className="w-3 h-3" />
                    <span>{userProfile.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    User Code: {userProfile.user_code}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Password Change Form */}
        <Card className="border-border bg-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Create a strong, secure password for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                Temporary Password
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your temporary password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                This is the password sent to your email
              </p>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password Strength:</span>
                    <span className={`font-medium ${
                      passwordStrength < 40 ? 'text-red-500' :
                      passwordStrength < 70 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <Progress value={passwordStrength} className="h-2" />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 flex items-center space-x-1">
                  <XCircle className="w-3 h-3" />
                  <span>Passwords do not match</span>
                </p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-xs text-green-500 flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Passwords match</span>
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Password Requirements:</p>
              <div className="space-y-1">
                {[
                  { text: 'At least 8 characters long', met: newPassword.length >= 8 },
                  { text: 'Contains uppercase letter', met: /[A-Z]/.test(newPassword) },
                  { text: 'Contains lowercase letter', met: /[a-z]/.test(newPassword) },
                  { text: 'Contains number', met: /[0-9]/.test(newPassword) },
                  { text: 'Contains special character', met: /[^a-zA-Z0-9]/.test(newPassword) },
                ].map((req, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    {req.met ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handlePasswordChange}
              disabled={isSubmitting || validationErrors.length > 0 || newPassword !== confirmPassword || !currentPassword}
              className="w-full h-12"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                  <span>Updating Password...</span>
                </div>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password & Continue
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            Having trouble? Contact your administrator for support
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirstLogin;