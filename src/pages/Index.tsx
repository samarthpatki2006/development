
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import MultiStepLogin from '@/components/MultiStepLogin';
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
            <div className="flex justify-center">
              <MultiStepLogin />
            </div>
          </div>
          
          
        </div>
      </div>
  );
};

export default Index;
