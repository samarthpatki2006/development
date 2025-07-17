
import React, { useEffect, useState } from 'react';
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
  const currentPath = location.pathname;
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        handleAuthStateChange(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      handleAuthStateChange(session);
    });

    return () => subscription.unsubscribe();
  }, [currentPath, navigate]);

  const handleAuthStateChange = async (session: Session | null) => {
    // Handle unauthenticated users
    if (!session) {
      // Clear any legacy localStorage data
      localStorage.removeItem('colcord_user');
      
      if (currentPath !== '/') {
        navigate('/');
      }
      return;
    }

    // Handle authenticated users
    try {
      // Get user profile to determine their type and route
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        console.error('Error fetching user profile:', error);
        // If we can't get the user profile, sign them out
        await supabase.auth.signOut();
        navigate('/');
        return;
      }

      const correctRoute = USER_ROUTE_MAP[profile.user_type as keyof typeof USER_ROUTE_MAP];
      
      if (!correctRoute) {
        console.error('Invalid user type:', profile.user_type);
        await supabase.auth.signOut();
        navigate('/');
        return;
      }

      // Redirect from login page to user's dashboard
      if (currentPath === '/') {
        navigate(correctRoute);
        return;
      }
      
      // Redirect if user is on wrong route
      if (currentPath !== correctRoute) {
        navigate(correctRoute);
      }
    } catch (error) {
      console.error('Error handling auth state change:', error);
      await supabase.auth.signOut();
      navigate('/');
    }
  };

  return <>{children}</>;
};

export default NavigationWrapper;
