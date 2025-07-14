
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MultiStepLogin from '@/components/MultiStepLogin';
import CollegeBranding from '@/components/CollegeBranding';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('colcord_user');
    if (userData) {
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
        if (correctRoute) {
          navigate(correctRoute);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('colcord_user');
      }
    }
  }, [navigate]);

  // Sample college data - this should ideally come from your backend/config
  const collegeData = {
    code: "COLCORD",
    name: "College Coordination System",
    logo: "🎓",
    primary_color: "#2563eb",
    secondary_color: "#1d4ed8"
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Industrial Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side - College Branding */}
            <CollegeBranding college={collegeData} />
            
            {/* Right side - Login */}
            <div className="flex justify-center lg:justify-end">
              <MultiStepLogin />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
