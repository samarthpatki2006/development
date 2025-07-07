
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminDashboard from '../components/admin/AdminDashboard';

const Admin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check localStorage for session data
        const storedSession = localStorage.getItem('colcord_session');
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          console.log('Found stored session:', parsedSession);
          
          if (parsedSession.login_time && parsedSession.user_id) {
            setSessionData(parsedSession);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }

        // If no valid session in localStorage, check Supabase auth
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Supabase session:', session);
        
        if (session) {
          setIsAuthenticated(true);
        } else {
          console.log('No session found, redirecting to login');
          navigate('/');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (event === 'SIGNED_OUT' || !session) {
        localStorage.removeItem('colcord_session');
        navigate('/');
      } else if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard sessionData={sessionData} />;
};

export default Admin;
