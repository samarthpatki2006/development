import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, Building2, User, KeyRound, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import CollegeBranding from './CollegeBranding';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

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
  const [currentStep, setCurrentStep] = useState(1);
  const [collegeCode, setCollegeCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [collegeData, setCollegeData] = useState<CollegeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/admin');
      }
    };
    checkAuth();
  }, [navigate]);

  const validateCollegeCode = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('get_college_by_code', {
        college_code: collegeCode.toUpperCase()
      });

      if (error) {
        console.error('Error validating college code:', error);
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        const college = data[0];
        setCollegeData({
          id: college.id,
          code: college.code,
          name: college.name,
          logo: college.logo || '🎓',
          primary_color: college.primary_color || '#1e40af',
          secondary_color: college.secondary_color || '#3b82f6'
        });
        setCurrentStep(2);
        toast({
          title: "College Found!",
          description: `Welcome to ${college.name}`,
        });
      } else {
        toast({
          title: "Invalid College Code",
          description: "Please check your college code and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateUserCode = async () => {
    if (!collegeData) return;

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('validate_college_user', {
        college_code: collegeData.code,
        user_code: userCode.toUpperCase()
      });

      if (error) {
        console.error('Error validating user code:', error);
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        if (result.user_exists) {
          setUserExists(true);
          setCurrentStep(3);
          toast({
            title: "User Code Verified",
            description: "Please enter your password to continue.",
          });
        } else {
          toast({
            title: "Invalid User Code",
            description: "User code not found in this college's database.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Invalid User Code",
          description: "Please enter a valid user code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!collegeData || !userExists) return;

    setIsLoading(true);
    
    try {
      // For demo purposes, create a temporary user email for authentication
      const tempEmail = `${userCode.toLowerCase()}@${collegeData.code.toLowerCase()}.edu`;
      
      // Try to sign in with demo credentials
      if (password === 'test123' || password === 'password') {
        // Create a demo user session using Supabase auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: tempEmail,
          password: password,
        });

        if (error) {
          // If user doesn't exist, create them for demo purposes
          if (error.message.includes('Invalid login credentials')) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: tempEmail,
              password: password,
              options: {
                data: {
                  college_id: collegeData.id,
                  user_code: userCode,
                  user_type: userCode.startsWith('ADM') ? 'admin' : 
                           userCode.startsWith('FAC') ? 'faculty' : 'student',
                  first_name: 'Demo',
                  last_name: 'User'
                }
              }
            });

            if (signUpError) {
              console.error('Sign up error:', signUpError);
              toast({
                title: "Authentication Error",
                description: "Unable to create demo user session.",
                variant: "destructive",
              });
              return;
            }

            // Sign in the newly created user
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email: tempEmail,
              password: password,
            });

            if (loginError) {
              console.error('Login error:', loginError);
              toast({
                title: "Login Failed",
                description: "Unable to authenticate user.",
                variant: "destructive",
              });
              return;
            }
          } else {
            console.error('Authentication error:', error);
            toast({
              title: "Login Failed",
              description: "Authentication failed. Please try again.",
              variant: "destructive",
            });
            return;
          }
        }

        toast({
          title: "Login Successful!",
          description: `Welcome to ColCord - ${collegeData.name}`,
        });

        // Redirect to admin dashboard
        setTimeout(() => {
          navigate('/admin');
        }, 1000);
        
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid password. For testing, use 'test123' or 'password'.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "Something went wrong during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 2) {
        setCollegeData(null);
      }
      if (currentStep === 3) {
        setUserExists(false);
      }
    }
  };

  const steps = [
    { number: 1, title: 'College Code', icon: Building2, completed: currentStep > 1 },
    { number: 2, title: 'User Code', icon: User, completed: currentStep > 2 },
    { number: 3, title: 'Password', icon: KeyRound, completed: false }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            CC
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ColCord</h1>
          <p className="text-gray-600">Connecting Education Communities</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                currentStep >= step.number
                  ? step.completed
                    ? "bg-green-500 border-green-500 text-white"
                    : collegeData
                      ? `border-[${collegeData.primary_color}] text-[${collegeData.primary_color}]`
                      : "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-300 text-gray-400"
              )}>
                {step.completed ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-16 h-0.5 mx-3 transition-all duration-300",
                  currentStep > step.number ? "bg-green-500" : "bg-gray-300"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* College Branding */}
        {collegeData && <CollegeBranding college={collegeData} />}

        {/* Main Card */}
        <Card className="p-6 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <div className="space-y-6">
            {/* Step 1: College Code */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <Building2 className="w-12 h-12 mx-auto text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Enter College Code</h2>
                  <p className="text-sm text-gray-600">Start by entering your institution's unique code</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="collegeCode">College Code</Label>
                  <Input
                    id="collegeCode"
                    type="text"
                    placeholder="e.g., TAPMI, BITS, IIMB"
                    value={collegeCode}
                    onChange={(e) => setCollegeCode(e.target.value.toUpperCase())}
                    className="text-center text-lg font-mono tracking-wider"
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={validateCollegeCode} 
                  disabled={!collegeCode || isLoading}
                >
                  {isLoading ? "Validating..." : "Continue"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: User Code */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <User className="w-12 h-12 mx-auto text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Enter User Code</h2>
                  <p className="text-sm text-gray-600">Your unique identifier at {collegeData?.name}</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="userCode">User Code</Label>
                  <Input
                    id="userCode"
                    type="text"
                    placeholder="e.g., STU0001, FAC0001, ADM0001"
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                    className="text-center text-lg font-mono tracking-wider"
                  />
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" onClick={goBack} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={validateUserCode} 
                    disabled={!userCode || isLoading}
                  >
                    {isLoading ? "Validating..." : "Continue"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Password */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <KeyRound className="w-12 h-12 mx-auto text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Enter Password</h2>
                  <p className="text-sm text-gray-600">Complete your secure login</p>
                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    For testing, use password: <strong>test123</strong> or <strong>password</strong>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" onClick={goBack} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleLogin} 
                    disabled={!password || isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Testing Instructions */}
        <div className="text-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          <p className="font-semibold mb-2">Testing Instructions:</p>
          <p>1. College Code: <strong>TAPMI</strong>, <strong>BITS</strong>, or <strong>IIMB</strong></p>
          <p>2. User Code: <strong>STU0001</strong>, <strong>FAC0001</strong>, or <strong>ADM0001</strong></p>
          <p>3. Password: <strong>test123</strong> or <strong>password</strong></p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Need help? Contact your institution's IT support</p>
          <p className="mt-1">© 2024 ColCord - Secure Education Platform</p>
        </div>
      </div>
    </div>
  );
};

export default MultiStepLogin;
