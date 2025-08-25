import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  User,
  LogOut,
  Mail,
  AlertCircle,
  CheckCircle,
  Info,
  X
} from 'lucide-react';
import SidebarNavigation from '@/components/layout/SidebarNavigation';
import AdminDashboard from '../components/admin/AdminDashboard';
import { supabase } from '@/integrations/supabase/client';

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
  const [sessionData, setSessionData] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [adminRoles, setAdminRoles] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Mock notifications data
  const [notifications] = useState([
    {
      id: 1,
      type: 'info',
      title: 'System Update',
      message: 'New features have been added to the user management system',
      time: '2 minutes ago',
      read: false
    },
    {
      id: 2,
      type: 'warning',
      title: 'Pending Approvals',
      message: '5 new student registrations awaiting approval',
      time: '1 hour ago',
      read: false
    },
    {
      id: 3,
      type: 'success',
      title: 'Backup Complete',
      message: 'Daily system backup completed successfully',
      time: '3 hours ago',
      read: true
    },
    {
      id: 4,
      type: 'error',
      title: 'Payment Failed',
      message: 'Payment gateway connection issue detected',
      time: '5 hours ago',
      read: true
    },
    {
      id: 5,
      type: 'info',
      title: 'New Course Added',
      message: 'Computer Science course has been added to the system',
      time: '1 day ago',
      read: true
    }
  ]);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
  try {
    // First check Supabase session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      navigate('/');
      return;
    }

    if (session?.user) {
      // Get user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile error:', profileError);
        navigate('/');
        return;
      }

      // Set session data
      const userData = {
        user_id: profile.id,
        user_type: profile.user_type,
        first_name: profile.first_name,
        last_name: profile.last_name,
        college_id: profile.college_id,
        user_code: profile.user_code,
        email: profile.email
      };

      setSessionData(userData);
      setIsAuthenticated(true);
      setUserProfile(profile);
      setAdminRoles([{
        role_type: 'super_admin',
        permissions: { all: true },
        assigned_at: new Date().toISOString()
      }]);
    } else {
      // Fallback to localStorage for development
      const storedSession = localStorage.getItem('colcord_user');
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession.user_type && parsedSession.user_id) {
          setSessionData(parsedSession);
          setIsAuthenticated(true);
          
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
          setAdminRoles([{
            role_type: 'super_admin',
            permissions: { all: true },
            assigned_at: new Date().toISOString()
          }]);
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    }
  } catch (error) {
    console.error('Auth check error:', error);
    navigate('/');
  } finally {
    setIsLoading(false);
  }
};

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('colcord_user');
    navigate('/');
  };

  const handleNavigationChange = (view) => {
    setActiveView(view);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
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
      <div className="relative z-[100] bg-background/95 backdrop-blur-sm border-b border-white/10">
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
              {!isMobile && (
                <>
                  <div className="h-6 w-px bg-white/20"></div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-role-admin rounded-full animate-pulse-indicator"></div>
                    <span className="text-lg font-medium text-foreground">Admin Portal</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {!isMobile && (
                <span className="text-sm text-muted-foreground">
                  Welcome, {sessionData.first_name} {sessionData.last_name}
                </span>
              )}
              
              {/* Notifications Dropdown */}
              <div className="relative" ref={notificationRef}>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={toggleNotifications}
                  className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors relative"
                >
                  <Bell className="h-5 w-5 text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notifications Panel */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-background/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-[9999]">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowNotifications(false)}
                          className="h-6 w-6 rounded-lg hover:bg-white/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {unreadCount > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                            !notification.read ? 'bg-white/5' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="h-2 w-2 bg-blue-500 rounded-full ml-2 flex-shrink-0"></div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-white/10">
                      <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground">
                        View All Notifications
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* User Menu Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={toggleUserMenu}
                  className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <User className="h-5 w-5 text-foreground" />
                </Button>

                {/* User Menu Panel */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 max-w-[90vw] bg-background/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-[9999]">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {sessionData.first_name?.[0]}{sessionData.last_name?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-foreground truncate">
                            {sessionData.first_name} {sessionData.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {sessionData.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="px-2 py-1 bg-role-admin/20 text-role-admin text-xs rounded-md font-medium">
                              {sessionData.user_type}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {sessionData.user_code}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left hover:bg-white/10"
                        onClick={() => {
                          setActiveView('system');
                          setShowUserMenu(false);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Account Settings
                      </Button>
                      
                      <div className="my-2 h-px bg-white/10"></div>
                      
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left hover:bg-red-500/10 text-red-400 hover:text-red-300"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                )}
              </div>
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
          collapsed={isMobile || sidebarCollapsed}
        />

        {/* Main Content */}
        <div className={`flex-1 p-4 md:p-6 ${isMobile ? 'ml-0' : ''}`}>
          {renderContent()}
        </div>
      </div>
      
      {/* Mobile overlay when sidebar is open */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-[50] md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
};

export default Admin;