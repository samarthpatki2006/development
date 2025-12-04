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
  'admin': '/admin',
  'super_admin': '/admin',
  'parent': '/parent',
  'alumni': '/alumni'
} as const;

const NavigationWrapper = ({ children }: NavigationWrapperProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const processingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const currentSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only run once on mount
    if (hasInitializedRef.current) {
      return;
    }
    
    hasInitializedRef.current = true;
    let mounted = true;

    // Check initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          currentSessionIdRef.current = session.user.id;
          await handleAuthentication(session, true);
        } else {
          // No session, clear storage
          sessionStorage.removeItem('colcord_user');
          localStorage.removeItem('colcord_user');
          if (location.pathname !== '/') {
            navigate('/', { replace: true });
          }
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsChecking(false);
      }
    };

    initAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth event:', event);
        
        if (event === 'SIGNED_OUT') {
          sessionStorage.removeItem('colcord_user');
          localStorage.removeItem('colcord_user');
          processingRef.current = false;
          currentSessionIdRef.current = null;
          if (location.pathname !== '/') {
            navigate('/', { replace: true });
          }
          return;
        }
        
        // Only handle SIGNED_IN event for new sessions
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if this is a new session
          if (currentSessionIdRef.current !== session.user.id) {
            currentSessionIdRef.current = session.user.id;
            await handleAuthentication(session, false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once

  const handleAuthentication = async (session: Session, isInitialCheck: boolean) => {
    // Prevent concurrent processing
    if (processingRef.current) {
      console.log('Already processing authentication, skipping...');
      return;
    }

    processingRef.current = true;

    try {
      setIsChecking(true);
      
      const currentPath = location.pathname;
      console.log('Processing authentication. Current path:', currentPath);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_type, id, first_name, last_name, email, college_id, user_code')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching user profile:', profileError);
        sessionStorage.removeItem('colcord_user');
        localStorage.removeItem('colcord_user');
        await supabase.auth.signOut();
        navigate('/', { replace: true });
        return;
      }

      // Store user data consistently in sessionStorage only
      const validUserData = {
        user_id: profile.id,
        user_type: profile.user_type,
        first_name: profile.first_name,
        last_name: profile.last_name,
        college_id: profile.college_id,
        user_code: profile.user_code,
        email: profile.email
      };
      sessionStorage.setItem('colcord_user', JSON.stringify(validUserData));

      // Check onboarding status
      const { data: onboarding } = await supabase
        .from('user_onboarding')
        .select('password_reset_required, first_login_completed, onboarding_completed')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const correctRoute = USER_ROUTE_MAP[profile.user_type as keyof typeof USER_ROUTE_MAP];
      
      if (!correctRoute) {
        console.error('Invalid user type:', profile.user_type);
        sessionStorage.removeItem('colcord_user');
        await supabase.auth.signOut();
        navigate('/', { replace: true });
        return;
      }

      console.log('User type:', profile.user_type, 'Correct route:', correctRoute);

      // Only redirect on initial check or from login page
      if (isInitialCheck || currentPath === '/') {
        let targetRoute: string | null = null;

        // Priority 1: Password reset required
        if (onboarding?.password_reset_required) {
          targetRoute = '/first-login';
          console.log('Redirecting to first-login (password reset required)');
        } 
        // Priority 2: Go to correct dashboard
        else {
          targetRoute = correctRoute;
          console.log('Redirecting to dashboard:', correctRoute);
        }

        if (targetRoute) {
          console.log('Navigating to:', targetRoute);
          navigate(targetRoute, { replace: true });
        }
      }

    } catch (error) {
      console.error('Error handling authentication:', error);
      sessionStorage.removeItem('colcord_user');
      localStorage.removeItem('colcord_user');
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } finally {
      setIsChecking(false);
      processingRef.current = false;
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