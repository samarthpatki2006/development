
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface CollegeData {
  id: string;
  code: string;
  name: string;
  logo: string;
  primary_color: string;
  secondary_color: string;
}

const MultiStepLogin = () => {
  const [step, setStep] = useState(1);
  const [collegeCode, setCollegeCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [collegeData, setCollegeData] = useState<CollegeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      const { data, error } = await supabase.rpc('validate_college_user', {
        college_code: collegeData?.code || '',
        user_code: userCode
      });

      if (error) throw error;

      const validationResult = data?.[0];

      if (!validationResult?.user_exists) {
        toast({
          title: 'Invalid User Code',
          description: 'This user code does not exist in this college',
          variant: 'destructive',
        });
        return;
      }

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

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('validate_user_login', {
        college_code: collegeData?.code || '',
        user_code: userCode,
        user_password: password
      });

      if (error) throw error;

      const loginResult = data?.[0];
      
      if (!loginResult?.login_success) {
        toast({
          title: 'Login Failed',
          description: loginResult?.error_message || 'Invalid credentials',
          variant: 'destructive',
        });
        return;
      }

      // Store user data in localStorage for session management
      const userData = {
        user_id: loginResult.user_id,
        user_type: loginResult.user_type,
        first_name: loginResult.first_name,
        last_name: loginResult.last_name,
        college_id: collegeData?.id,
        college_name: collegeData?.name,
        user_code: userCode
      };

      localStorage.setItem('colcord_user', JSON.stringify(userData));

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${loginResult.first_name}!`,
      });

      // Redirect based on user type
      if (loginResult.user_type === 'admin' || loginResult.user_type === 'staff') {
        window.location.href = '/admin';
      } else if (loginResult.user_type === 'student') {
        window.location.href = '/student';
      } else if (loginResult.user_type === 'faculty') {
        window.location.href = '/teacher';
      } else {
        // For other user types, redirect to appropriate portal
        window.location.href = '/student';
      }

    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Error',
        description: 'An error occurred during login. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md space-y-4 p-4">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {collegeData ? collegeData.name : 'ColCord'}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {step === 1 && (
            <div className="grid gap-2">
              <Label htmlFor="collegeCode">College Code</Label>
              <Input
                id="collegeCode"
                placeholder="Enter your college code"
                type="text"
                value={collegeCode}
                onChange={(e) => setCollegeCode(e.target.value)}
              />
              <Button onClick={handleCollegeCodeSubmit} disabled={isLoading}>
                {isLoading ? 'Validating...' : 'Next'}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-2">
              <Label htmlFor="userCode">User Code</Label>
              <Input
                id="userCode"
                placeholder="Enter your user code"
                type="text"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
              />
              <Button onClick={handleUserCodeSubmit} disabled={isLoading}>
                {isLoading ? 'Validating...' : 'Next'}
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={handleLogin} disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          )}
        </CardContent>
        <div className="px-4 text-center text-sm text-muted-foreground">
          <Link to="#" className="hover:text-primary underline-offset-4 hover:underline">
            Forgot Password?
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default MultiStepLogin;
