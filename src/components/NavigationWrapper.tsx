import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface NavigationWrapperProps {
  children: React.ReactNode;
}

// Define user type to route mapping
const USER_ROUTE_MAP = {
  'student': '/student',
  'faculty': '/teacher',
  'teacher': '/teacher',
  'admin': '/admin',
  'super_admin': '/admin',
  'parent': '/parent',
  'alumni': '/alumni'
} as const;

const NavigationWrapper = ({ children }: NavigationWrapperProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        handleAuthStateChange(session);
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      handleAuthStateChange(session);
    });

    return () => subscription.unsubscribe();
  }, []); // Empty dependency array - only run once on mount

  const handleAuthStateChange = async (session: Session | null) => {
    // Prevent concurrent navigation attempts
    if (isNavigatingRef.current) {
      return;
    }

    try {
      isNavigatingRef.current = true;
      setIsChecking(true);

      const currentPath = location.pathname;

      // FIXED: Clear any stale localStorage data if no valid session
      if (!session) {
        // Remove any mock/demo user data
        localStorage.removeItem('colcord_user');
        
        // Redirect to login if not already there
        if (currentPath !== '/') {
          console.log('No valid session, redirecting to login');
          navigate('/');
        }
        setIsChecking(false);
        return;
      }

      // Handle authenticated users - verify session is still valid
      if (session) {
        try {
          // Get user profile to determine their type and route
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('user_type, id, first_name, last_name, email, college_id, user_code')
            .eq('id', session.user.id)
            .single();

          if (profileError || !profile) {
            console.error('Error fetching user profile:', profileError);
            // Clear invalid session data
            localStorage.removeItem('colcord_user');
            await supabase.auth.signOut();
            if (currentPath !== '/') {
              navigate('/');
            }
            setIsChecking(false);
            return;
          }

          // FIXED: Store valid user data in localStorage (sync with session)
          const validUserData = {
            user_id: profile.id,
            user_type: profile.user_type,
            first_name: profile.first_name,
            last_name: profile.last_name,
            college_id: profile.college_id,
            user_code: profile.user_code,
            email: profile.email
          };
          localStorage.setItem('colcord_user', JSON.stringify(validUserData));

          // Check onboarding status for first login
          const { data: onboarding, error: onboardingError } = await supabase
            .from('user_onboarding')
            .select('password_reset_required, first_login_completed, onboarding_completed')
            .eq('user_id', session.user.id)
            .maybeSingle();

          // If user needs to reset password, redirect to first-login
          if (onboarding && onboarding.password_reset_required) {
            // Allow access to first-login page
            if (currentPath === '/first-login') {
              setIsChecking(false);
              return;
            }
            
            // Redirect from any other page to first-login
            console.log('Password reset required, redirecting to /first-login');
            navigate('/first-login');
            setIsChecking(false);
            return;
          }

          // If on first-login but password already changed, redirect to dashboard
          if (currentPath === '/first-login' && onboarding && !onboarding.password_reset_required) {
            const correctRoute = USER_ROUTE_MAP[profile.user_type as keyof typeof USER_ROUTE_MAP];
            console.log('Password already changed, redirecting to dashboard');
            if (correctRoute && currentPath !== correctRoute) {
              navigate(correctRoute);
            }
            setIsChecking(false);
            return;
          }

          // If on first-login but no onboarding record (legacy user), redirect to dashboard
          if (currentPath === '/first-login' && !onboarding) {
            const correctRoute = USER_ROUTE_MAP[profile.user_type as keyof typeof USER_ROUTE_MAP];
            console.log('No onboarding record, redirecting to dashboard');
            if (correctRoute && currentPath !== correctRoute) {
              navigate(correctRoute);
            }
            setIsChecking(false);
            return;
          }

          const correctRoute = USER_ROUTE_MAP[profile.user_type as keyof typeof USER_ROUTE_MAP];
          
          if (!correctRoute) {
            console.error('Invalid user type:', profile.user_type);
            localStorage.removeItem('colcord_user');
            await supabase.auth.signOut();
            if (currentPath !== '/') {
              navigate('/');
            }
            setIsChecking(false);
            return;
          }

          // Redirect from login page to user's dashboard (only if password is changed)
          if (currentPath === '/') {
            navigate(correctRoute);
            setIsChecking(false);
            return;
          }
          
          // Redirect if user is on wrong route (but allow first-login)
          if (currentPath !== correctRoute && currentPath !== '/first-login') {
            navigate(correctRoute);
          }
        } catch (error) {
          console.error('Error validating session:', error);
          localStorage.removeItem('colcord_user');
          await supabase.auth.signOut();
          if (currentPath !== '/') {
            navigate('/');
          }
        }
      }
    } catch (error) {
      console.error('Error handling auth state change:', error);
      // Clear any stale data
      localStorage.removeItem('colcord_user');
      if (session) {
        await supabase.auth.signOut();
      }
      if (location.pathname !== '/') {
        navigate('/');
      }
    } finally {
      setIsChecking(false);
      // Reset navigation lock after a short delay
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 100);
    }
  };

  // Show loading state while checking auth (except on login page)
  if (isChecking && location.pathname !== '/') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default NavigationWrapper;