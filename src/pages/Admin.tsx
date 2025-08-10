import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Users, 
  BookOpen, 
  Calendar, 
  DollarSign, 
  FileText, 
  Shield, 
  Activity, 
  Building, 
  Bell, 
  User 
} from 'lucide-react';
import SidebarNavigation from '@/components/layout/SidebarNavigation';
import AdminDashboard from '../components/admin/AdminDashboard';

// Import all the admin management components
import EnhancedUserManagement from '../components/admin/EnhancedUserManagement';
import CourseManagement from '../components/admin/CourseManagement';
import EventManagement from '../components/admin/EventManagement';
import FinanceManagement from '../components/admin/FinanceManagement';
import FacilityManagement from '../components/admin/FacilityManagement';
import RoleManagement from '../components/admin/RoleManagement';
import AuditLogs from '../components/admin/AuditLogs';
import SystemSettings from '../components/admin/SystemSettings';

const Admin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [adminRoles, setAdminRoles] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedSession = localStorage.getItem('colcord_user');
        console.log('Checking stored session:', storedSession);
        
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          console.log('Parsed session:', parsedSession);
          
          // Check for admin user type (could be 'admin' or other admin variants)
          const adminUserTypes = ['admin', 'super_admin', 'administrator'];
          if (parsedSession.user_type && parsedSession.user_id) {
            console.log('Valid session found, setting authenticated state');
            setSessionData(parsedSession);
            setIsAuthenticated(true);
            
            // Create user profile from session data
            const profile = {
              id: parsedSession.user_id,
              first_name: parsedSession.first_name || 'Admin',
              last_name: parsedSession.last_name || 'User',
              email: parsedSession.email || '',
              user_code: parsedSession.user_code || 'ADM001',
              user_type: parsedSession.user_type || 'admin',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              college_id: parsedSession.college_id || '',
              hierarchy_level: parsedSession.user_type || 'admin'
            };
            setUserProfile(profile);
            
            // Set default admin roles
            setAdminRoles([{
              role_type: 'super_admin',
              permissions: { all: true },
              assigned_at: new Date().toISOString()
            }]);
            
            setIsLoading(false);
            return;
          }
        }

        console.log('No valid session found, redirecting to login');
        toast({
          title: 'Access Denied',
          description: 'Please log in to access the admin portal.',
          variant: 'destructive',
        });
        navigate('/');
      } catch (error) {
        console.error('Auth check error:', error);
        toast({
          title: 'Authentication Error',
          description: 'There was an error verifying your credentials.',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('colcord_user');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    navigate('/');
  };

  const handleNavigationChange = (view: string) => {
    setActiveView(view);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-role-admin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !sessionData) {
    return null;
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'courses', label: 'Course Management', icon: BookOpen },
    { id: 'events', label: 'Event Management', icon: Calendar },
    { id: 'finance', label: 'Finance Management', icon: DollarSign },
    { id: 'facilities', label: 'Facility Management', icon: Building },
    { id: 'roles', label: 'Role Management', icon: Shield },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'system', label: 'System Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <AdminDashboard sessionData={sessionData} onNavigate={handleNavigationChange} />;
      case 'users':
        return <EnhancedUserManagement userProfile={userProfile} adminRoles={adminRoles} />;
      case 'courses':
        return <CourseManagement userProfile={userProfile} />;
      case 'events':
        return <EventManagement userProfile={userProfile} />;
      case 'finance':
        return <FinanceManagement userProfile={userProfile} />;
      case 'facilities':
        return <FacilityManagement userProfile={userProfile} />;
      case 'roles':
        return <RoleManagement userProfile={userProfile} adminRoles={adminRoles} />;
      case 'audit':
        return <AuditLogs userProfile={userProfile} adminRoles={adminRoles} />;
      case 'system':
        return <SystemSettings userProfile={userProfile} />;
      default:
        return <AdminDashboard sessionData={sessionData} onNavigate={handleNavigationChange} />;
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
                <div className="h-2 w-2 bg-role-admin rounded-full animate-pulse-indicator"></div>
                <span className="text-lg font-medium text-foreground">Admin Portal</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">
                Welcome, {sessionData.first_name} {sessionData.last_name}
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
          userType="admin"
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

export default Admin;