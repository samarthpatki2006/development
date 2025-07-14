
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationWrapperProps {
  children: React.ReactNode;
}

const NavigationWrapper = ({ children }: NavigationWrapperProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('colcord_user');
    if (!userData) {
      // If no user data, redirect to login
      if (location.pathname !== '/') {
        navigate('/');
      }
      return;
    }

    try {
      const user = JSON.parse(userData);
      const currentPath = location.pathname;
      
      // Define the correct route for each user type
      const userRoutes = {
        'student': '/student',
        'faculty': '/teacher',
        'teacher': '/teacher',
        'admin': '/admin',
        'super_admin': '/admin',
        'parent': '/parent',
        'alumni': '/alumni'
      };

      const correctRoute = userRoutes[user.user_type as keyof typeof userRoutes];
      
      // If user is on the wrong route, redirect them
      if (correctRoute && currentPath !== correctRoute) {
        // Allow access to the home page for navigation
        if (currentPath !== '/') {
          navigate(correctRoute);
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/');
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
};

export default NavigationWrapper;
