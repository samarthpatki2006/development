import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import MultiStepLogin from '@/components/MultiStepLogin';

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Clear any session data when landing on login page
    const checkAndClearStaleData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // No valid session, clear session storage
        sessionStorage.removeItem('colcord_user');
      }
      
      setSession(session);
    };

    checkAndClearStaleData();

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        // Clear session storage on sign out
        if (event === 'SIGNED_OUT') {
          sessionStorage.removeItem('colcord_user');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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