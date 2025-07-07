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
  const [userData, setUserData] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);

  // Check if user is already logged in (using state instead of localStorage)
  useEffect(() => {
  // Check for existing session on component mount
  const checkExistingSession = () => {
    try {
      // First check if we have session data in state
      if (sessionData && sessionData.login_time) {
        navigate('/admin');
        return;
      }

      // If no session data in state, try to restore from localStorage
      if (typeof Storage !== 'undefined') {
        const storedSession = localStorage.getItem('colcord_session');
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          
          // Validate session (you might want to add expiration check here)
          if (parsedSession.login_time && parsedSession.user_id) {
            setSessionData(parsedSession);
            navigate('/admin');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
      // Clear invalid session data
      try {
        localStorage.removeItem('colcord_session');
      } catch (e) {
        console.log('localStorage not available');
      }
    }
  };

  checkExistingSession();
}, []); // Empty dependency array - only run on mount

// Separate useEffect for session changes
useEffect(() => {
  if (sessionData && sessionData.login_time) {
    navigate('/admin');
  }
}, [sessionData, navigate]);

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
          setUserData(result);
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
      // Debug: Log the search parameters
      console.log('Searching for user with:', {
        user_code: userCode.toUpperCase(),
        college_id: collegeData.id,
        college_code: collegeData.code
      });

      // First, let's try to find the user by user_code only
      const { data: userProfileData, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_code', userCode.toUpperCase());

      console.log('User profile query result:', { userProfileData, userProfileError });

      if (userProfileError) {
        console.error('User profile query error:', userProfileError);
        toast({
          title: "Error",
          description: "Database query failed. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (userProfileData && userProfileData.length > 0) {
        // Check if any of the returned users belong to the correct college
        const userFromCollege = userProfileData.find(user => {
          // Check if college_id matches or if college_code matches
          return user.college_id === collegeData.id || 
                 user.college_code === collegeData.code;
        });

        if (!userFromCollege) {
          console.log('User found but not in the specified college');
          toast({
            title: "Access Denied",
            description: "User not found in this college's database.",
            variant: "destructive",
          });
          return;
        }

        console.log('User found in college:', userFromCollege);
        console.log('Available columns in user_profiles:', Object.keys(userFromCollege));

        // Enhanced password validation
        const storedPassword = userFromCollege.password;
        
        console.log('Password validation:', {
          enteredPassword: password,
          storedPassword: storedPassword,
          passwordExists: !!storedPassword
        });

        // Check if password column exists and validate
        if (!storedPassword) {
          console.log('No password found in database - skipping password validation');
          
          toast({
            title: "Development Mode",
            description: "Password validation skipped - no password in database",
            variant: "default",
          });
        } else {
          // Perform password validation
          if (storedPassword !== password) {
            console.log('Password validation failed:', {
              entered: password,
              stored: storedPassword,
              match: storedPassword === password
            });
            
            toast({
              title: "Login Failed",
              description: "Invalid password. Please try again.",
              variant: "destructive",
            });
            return; // Exit early on password mismatch
          }
          
          console.log('Password validation successful');
        }

        // Create session data
        const newSessionData = {
          college_id: collegeData.id,
          college_code: collegeData.code,
          college_name: collegeData.name,
          user_id: userFromCollege.id,
          user_code: userCode,
          user_type: userFromCollege.user_type,
          first_name: userFromCollege.first_name,
          last_name: userFromCollege.last_name,
          login_time: new Date().toISOString(),
          session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        // Store session data in state instead of localStorage
        setSessionData(newSessionData);

        // Also try to store in localStorage if available (for persistence)
        try {
          if (typeof Storage !== 'undefined') {
            localStorage.setItem('colcord_session', JSON.stringify(newSessionData));
          }
        } catch (storageError) {
          console.log('localStorage not available, using session state only');
        }

        toast({
          title: "Login Successful!",
          description: `Welcome back, ${userFromCollege.first_name || 'User'}!`,
        });

        // Navigate to dashboard
        console.log('Navigating to admin dashboard...');
        setTimeout(() => {
          navigate('/admin');
        }, 1500);
        
      } else {
        console.log('No user found with user_code:', userCode.toUpperCase());
        toast({
          title: "Login Failed",
          description: "User not found. Please check your user code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: `Login failed: ${error.message || 'Unknown error'}`,
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
        setUserData(null);
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
                      ? "bg-blue-600 border-blue-600 text-white"
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && password && handleLogin()}
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

        {/* Debug Information */}
        {sessionData && (
          <div className="text-center text-sm text-green-600 bg-green-50 p-4 rounded-lg">
            <p className="font-semibold">Login Successful!</p>
            <p>Session ID: {sessionData.session_id}</p>
            <p>User: {sessionData.first_name} ({sessionData.user_type})</p>
          </div>
        )}

        {/* Testing Instructions */}
        <div className="text-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          <p className="font-semibold mb-2">Testing Instructions:</p>
          <p>1. College Code: <strong>TAPMI</strong>, <strong>BITS</strong>, or <strong>IIMB</strong></p>
          <p>2. User Code: <strong>STU0001</strong>, <strong>FAC0001</strong>, or <strong>ADM0001</strong></p>
          <p>3. Password: Enter the exact password from your database</p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Need help? Contact your institution's IT support</p>
          <p className="mt-1">© 2025 ColCord - Secure Education Platform</p>
        </div>
      </div>
    </div>
  );
};

export default MultiStepLogin;