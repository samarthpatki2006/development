
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/admin/AdminDashboard';

const Admin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check localStorage for custom session data
        const storedSession = localStorage.getItem('colcord_session');
        console.log('Checking stored session:', storedSession);
        
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          console.log('Parsed session:', parsedSession);
          
          if (parsedSession.login_time && parsedSession.user_id) {
            console.log('Valid session found, setting authenticated state');
            setSessionData(parsedSession);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }

        console.log('No valid session found, redirecting to login');
        navigate('/');
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
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

  if (!isAuthenticated || !sessionData) {
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
