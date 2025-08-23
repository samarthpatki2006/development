import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Calendar, 
  Users, 
  Heart, 
  FileText, 
  HelpCircle, 
  Bell, 
  Settings, 
  User,
  LogOut,
  Mail,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Award,
  Briefcase
} from 'lucide-react';
import SidebarNavigation from '@/components/layout/SidebarNavigation';
import AlumniDashboard from '@/components/alumni/AlumniDashboard';
import AlumniEvents from '@/components/alumni/AlumniEvents';
import AlumniNetworking from '@/components/alumni/AlumniNetworking';
import AlumniContributions from '@/components/alumni/AlumniContributions';
import AlumniDocuments from '@/components/alumni/AlumniDocuments';
import AlumniSupport from '@/components/alumni/AlumniSupport';
import { supabase } from '@/integrations/supabase/client';

const Alumni = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Mock notifications for alumni
  const [notifications] = useState([
    {
      id: 1,
      type: 'info',
      title: 'Alumni Meetup',
      message: 'Annual alumni gathering scheduled for next month in Mumbai',
      time: '1 hour ago',
      read: false
    },
    {
      id: 2,
      type: 'success',
      title: 'Contribution Received',
      message: 'Thank you for your generous donation to the scholarship fund',
      time: '2 days ago',
      read: false
    },
    {
      id: 3,
      type: 'warning',
      title: 'Profile Update',
      message: 'Please update your current employment details',
      time: '3 days ago',
      read: true
    },
    {
      id: 4,
      type: 'info',
      title: 'New Job Opening',
      message: 'Tech startup is looking for experienced professionals',
      time: '1 week ago',
      read: true
    },
    {
      id: 5,
      type: 'success',
      title: 'Network Connection',
      message: 'John Smith accepted your connection request',
      time: '1 week ago',
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
    const initializeUser = async () => {
      try {
        const userData = localStorage.getItem('colcord_user');
        if (!userData) {
          navigate('/');
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.user_type !== 'alumni') {
          toast({
            title: 'Access Denied',
            description: 'This area is for alumni only.',
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

    initializeUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('colcord_user');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    navigate('/');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-role-alumni" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'networking', label: 'Networking', icon: Users },
    { id: 'contributions', label: 'Contributions', icon: Heart },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <AlumniDashboard user={user} onNavigate={setActiveView}/>;
      case 'events':
        return <AlumniEvents user={user} />;
      case 'networking':
        return <AlumniNetworking user={user} />;
      case 'contributions':
        return <AlumniContributions user={user} />;
      case 'documents':
        return <AlumniDocuments user={user} />;
      case 'support':
        return <AlumniSupport user={user} />;
      default:
        return <AlumniDashboard user={user} />;
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
                    <div className="h-2 w-2 bg-role-alumni rounded-full animate-pulse-indicator"></div>
                    <span className="text-lg font-medium text-foreground">Alumni Portal</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {!isMobile && (
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.first_name} {user.last_name}
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
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-foreground truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="px-2 py-1 bg-role-alumni/20 text-role-alumni text-xs rounded-md font-medium">
                              Alumni
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {user.user_code || 'ALM001'}
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
                          setActiveView('networking');
                          setShowUserMenu(false);
                        }}
                      >
                        <Users className="h-4 w-4 mr-3" />
                        My Network
                      </Button>
                      
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left hover:bg-white/10"
                        onClick={() => {
                          setActiveView('contributions');
                          setShowUserMenu(false);
                        }}
                      >
                        <Heart className="h-4 w-4 mr-3" />
                        My Contributions
                      </Button>
                      
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left hover:bg-white/10"
                        onClick={() => {
                          setActiveView('support');
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
          userType="alumni"
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

export default Alumni;