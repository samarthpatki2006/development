
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import MultiStepLogin from '@/components/MultiStepLogin';
import CollegeBranding from '@/components/CollegeBranding';
import { Button } from '@/components/ui/button';
import { setupMockData, setupMockAdmin, setupMockParent, clearMockData } from '@/utils/mockData';

// Default college configuration
const DEFAULT_COLLEGE_CONFIG = {
  code: "COLCORD",
  name: "College Coordination System",
  logo: "🎓",
  primary_color: "#2563eb",
  secondary_color: "#1d4ed8"
};

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check if user is already authenticated with Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // User is authenticated, they'll be redirected by NavigationWrapper
          // based on their profile data
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Industrial Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side - College Branding */}
            <CollegeBranding college={DEFAULT_COLLEGE_CONFIG} />
            
            {/* Right side - Login */}
            <div className="flex justify-center lg:justify-end">
              <MultiStepLogin />
            </div>
          </div>
          
          {/* Development Tools */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Development Tools (Demo Mode)</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setupMockData();
                  navigate('/student');
                }}
              >
                Demo Student Login
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setupMockAdmin();
                  navigate('/admin');
                }}
              >
                Demo Admin Login
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setupMockParent();
                  navigate('/parent');
                }}
              >
                Demo Parent Login
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/test-fees')}
              >
                Test Fee System
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  clearMockData();
                  window.location.reload();
                }}
              >
                Clear Demo Data
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Click any demo button to bypass login and explore the application with sample data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
