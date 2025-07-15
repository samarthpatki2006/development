
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
    const currentPath = location.pathname;

    if (!userData) {
      // If no user data and not on login page, redirect to login
      if (currentPath !== '/') {
        navigate('/');
      }
      return;
    }

    try {
      const user = JSON.parse(userData);
      
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
      
      // If user is logged in and on the login page, redirect to their correct route
      if (currentPath === '/' && correctRoute) {
        navigate(correctRoute);
        return;
      }
      
      // If user is on the wrong route, redirect them to their correct route
      if (correctRoute && currentPath !== correctRoute) {
        navigate(correctRoute);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('colcord_user');
      navigate('/');
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
};

export default NavigationWrapper;
