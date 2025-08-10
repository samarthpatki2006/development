
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { User, BookOpen, Calendar, CreditCard, MessageSquare, Users, Bell, Settings, TrendingUp } from 'lucide-react';
import SidebarNavigation from '@/components/layout/SidebarNavigation';
import ParentDashboard from '@/components/parent/ParentDashboard';
import AcademicProgress from '@/components/parent/AcademicProgress';
import AttendanceTracking from '@/components/parent/AttendanceTracking';
import PaymentsFees from '@/components/parent/PaymentsFees';
import ParentCommunication from '@/components/parent/ParentCommunication';
import EventsMeetings from '@/components/parent/EventsMeetings';
import { supabase } from '@/integrations/supabase/client';

const Parent = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = localStorage.getItem('colcord_user');
        if (!userData) {
          navigate('/');
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.user_type !== 'parent') {
          toast({
            title: 'Access Denied',
            description: 'This area is for parents only.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setUser(parsedUser);
      } catch (error) {
        console.error('Error checking user:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const handleLogout = async() => {
    await supabase.auth.signOut();
    localStorage.removeItem('colcord_user');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-role-parent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: User },
    { id: 'academic', label: 'Academic Progress', icon: TrendingUp },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'payments', label: 'Payments & Fees', icon: CreditCard },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'events', label: 'Events & Meetings', icon: Users },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <ParentDashboard user={user} />;
      case 'academic':
        return <AcademicProgress user={user} />;
      case 'attendance':
        return <AttendanceTracking user={user} />;
      case 'payments':
        return <PaymentsFees user={user} />;
      case 'communication':
        return <ParentCommunication user={user} />;
      case 'events':
        return <EventsMeetings user={user} />;
      default:
        return <ParentDashboard user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative z-10 bg-background/95 backdrop-blur-sm border-b border-white/10">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors"
              >
                <span className="sr-only">Toggle sidebar</span>
                <div className="w-4 h-4 flex flex-col space-y-1">
                  <div className="w-full h-0.5 bg-foreground"></div>
                  <div className="w-full h-0.5 bg-foreground"></div>
                  <div className="w-full h-0.5 bg-foreground"></div>
                </div>
              </Button>
              <h1 className="text-2xl font-bold text-foreground">ColCord</h1>
              <div className="h-6 w-px bg-white/20"></div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-role-parent rounded-full animate-pulse-indicator"></div>
                <span className="text-lg font-medium text-foreground">Parent Portal</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.first_name} {user.last_name}
              </span>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Bell className="h-5 w-5 text-foreground" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Settings className="h-5 w-5 text-foreground" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors"
              >
                <User className="h-5 w-5 text-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex">
        {/* Sidebar */}
        <SidebarNavigation
          items={sidebarItems}
          activeItem={activeView}
          onItemClick={setActiveView}
          userType="parent"
          collapsed={sidebarCollapsed}
        />

        {/* Main Content */}
        <div className="flex-1 p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Parent;
