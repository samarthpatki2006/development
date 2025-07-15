
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    const handleUserNavigation = () => {
      const userData = localStorage.getItem('colcord_user');
      
      // Handle unauthenticated users
      if (!userData) {
        if (currentPath !== '/') {
          navigate('/');
        }
        return;
      }

      // Handle authenticated users
      try {
        const user = JSON.parse(userData);
        const correctRoute = USER_ROUTE_MAP[user.user_type as keyof typeof USER_ROUTE_MAP];
        
        if (!correctRoute) {
          console.error('Invalid user type:', user.user_type);
          localStorage.removeItem('colcord_user');
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
        console.error('Error parsing user data:', error);
        localStorage.removeItem('colcord_user');
        navigate('/');
      }
    };

    handleUserNavigation();
  }, [currentPath, navigate]);

  return <>{children}</>;
};

export default NavigationWrapper;
