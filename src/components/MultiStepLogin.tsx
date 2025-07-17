import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface CollegeData {
  id: string;
  code: string;
  name: string;
  logo: string;
  primary_color: string;
  secondary_color: string;
}

const MultiStepLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [collegeCode, setCollegeCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [collegeData, setCollegeData] = useState<CollegeData | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Set up auth state listener
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // If user is authenticated, fetch their profile and redirect
        if (session?.user) {
          setTimeout(() => {
            handleAuthenticatedUser(session.user);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthenticatedUser = async (user: User) => {
    try {
      // Get user profile data from user_profiles table
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        console.error('Error fetching user profile:', error);
        toast({
          title: 'Profile Error',
          description: 'Could not load user profile. Please contact support.',
          variant: 'destructive',
        });
        return;
      }

      // Store user data for legacy compatibility
      const userData = {
        user_id: profile.id,
        user_type: profile.user_type,
        first_name: profile.first_name,
        last_name: profile.last_name,
        college_id: profile.college_id,
        user_code: profile.user_code,
        email: profile.email
      };

      localStorage.setItem('colcord_user', JSON.stringify(userData));

      // Redirect based on user type
      const userRoutes = {
        'student': '/student',
        'faculty': '/teacher',
        'teacher': '/teacher',
        'admin': '/admin',
        'super_admin': '/admin',
        'parent': '/parent',
        'alumni': '/alumni'
      };

      const route = userRoutes[profile.user_type as keyof typeof userRoutes] || '/student';
      navigate(route);
    } catch (error) {
      console.error('Error handling authenticated user:', error);
    }
  };

  const handleCollegeCodeSubmit = async () => {
    if (!collegeCode) {
      toast({
        title: 'College Code Required',
        description: 'Please enter your college code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_college_by_code', { college_code: collegeCode });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: 'Invalid College Code',
          description: 'No college found with this code',
          variant: 'destructive',
        });
        return;
      }

      setCollegeData(data[0] as CollegeData);
      setStep(2);
    } catch (error) {
      console.error('College code validation error:', error);
      toast({
        title: 'College Code Error',
        description: 'Failed to validate college code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserCodeSubmit = async () => {
    if (!userCode) {
      toast({
        title: 'User Code Required',
        description: 'Please enter your user code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get user email using the new secure function
      const { data, error } = await supabase.rpc('get_user_email_for_auth', {
        college_code: collegeData?.code || '',
        user_code: userCode
      });

      if (error) throw error;

      const userResult = data?.[0];

      if (!userResult?.email) {
        toast({
          title: 'Invalid User Code',
          description: 'This user code does not exist in this college',
          variant: 'destructive',
        });
        return;
      }

      setUserEmail(userResult.email);
      setStep(3);
    } catch (error) {
      console.error('User code validation error:', error);
      toast({
        title: 'User Code Error',
        description: 'Failed to validate user code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password) {
      toast({
        title: 'Password Required',
        description: 'Please enter your password',
        variant: 'destructive',
      });
      return;
    }

    if (!userEmail) {
      toast({
        title: 'Error',
        description: 'User email not found. Please start over.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use Supabase auth with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password
      });

      if (error) {
        console.error('Login error:', error);
        
        // Handle specific auth errors
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Login Failed',
            description: 'Invalid password. Please check your credentials.',
            variant: 'destructive',
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast({
            title: 'Email Not Confirmed',
            description: 'Please check your email and confirm your account.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Login Error',
            description: error.message || 'An error occurred during login.',
            variant: 'destructive',
          });
        }
        return;
      }

      if (data.user) {
        toast({
          title: 'Login Successful',
          description: 'Welcome back! Redirecting to your dashboard...',
        });
        // Auth state change will handle the redirect
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      toast({
        title: 'Login Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Hero Section */}
        <div className="text-center mb-macro-md animate-fade-in-up">
          <h1 className="text-hero text-foreground mb-4">
            {collegeData ? collegeData.name : 'ColCord'}
          </h1>
          <p className="text-body-large text-muted-foreground">
            Built for India. Global Standards.
          </p>
          {step > 1 && (
            <div className="mt-6 flex items-center justify-center space-x-2">
              <div className="h-0.5 w-8 bg-primary"></div>
              <span className="text-xs text-muted-foreground font-medium">STEP {step} OF 3</span>
              <div className="h-0.5 w-8 bg-white-10"></div>
            </div>
          )}
        </div>

        <Card className="border-border bg-card backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-section-header text-center text-card-foreground">
              {step === 1 && 'College Access'}
              {step === 2 && 'User Verification'}
              {step === 3 && 'Secure Login'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="collegeCode" className="text-sm font-medium text-foreground">
                    College Code
                  </Label>
                  <Input
                    id="collegeCode"
                    placeholder="Enter your college code"
                    type="text"
                    value={collegeCode}
                    onChange={(e) => setCollegeCode(e.target.value)}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground focus-ring"
                  />
                </div>
                <Button 
                  onClick={handleCollegeCodeSubmit} 
                  disabled={isLoading}
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-all duration-300 hover-scale focus-ring"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                      <span>Validating...</span>
                    </div>
                  ) : 'Continue'}
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="userCode" className="text-sm font-medium text-foreground">
                    User Code
                  </Label>
                  <Input
                    id="userCode"
                    placeholder="Enter your user code"
                    type="text"
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground focus-ring"
                  />
                </div>
                <Button 
                  onClick={handleUserCodeSubmit} 
                  disabled={isLoading}
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-all duration-300 hover-scale focus-ring"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                      <span>Validating...</span>
                    </div>
                  ) : 'Continue'}
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <Input
                    id="password"
                    placeholder="Enter your password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground focus-ring"
                  />
                </div>
                <Button 
                  onClick={handleLogin} 
                  disabled={isLoading}
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-all duration-300 hover-scale focus-ring"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                      <span>Logging in...</span>
                    </div>
                  ) : 'Access Portal'}
                </Button>
              </div>
            )}
          </CardContent>
          <div className="px-6 pb-6 text-center">
            <Link 
              to="#" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 underline-offset-4 hover:underline focus-ring rounded-sm"
            >
              Need assistance? Contact support
            </Link>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-macro-sm">
          <p className="text-xs text-white-40">
            Powered by ColCord • Secure • Reliable • Indian
          </p>
        </div>
      </div>
    </div>
  );
};

export default MultiStepLogin;
