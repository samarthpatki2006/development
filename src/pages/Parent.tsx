import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { 
  User, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  Users, 
  Bell, 
  Settings, 
  TrendingUp,
  LogOut,
  Mail,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  GraduationCap,
  DollarSign,
  Clock
} from 'lucide-react';
import SidebarNavigation from '@/components/layout/SidebarNavigation';
import ParentDashboard from '@/components/parent/ParentDashboard';
import AcademicProgress from '@/components/parent/AcademicProgress';
import AttendanceTracking from '@/components/parent/AttendanceTracking';
import PaymentsFees from '@/components/parent/PaymentsFees';
import ParentCommunication from '@/components/parent/ParentCommunication';
import EventsMeetings from '@/components/parent/EventsMeetings';
import { supabase } from '@/integrations/supabase/client';
import ParentCommunicationHub from '@/components/parent/ParentCommunicationHub';

const Parent = () => {
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

  // Mock notifications for parents
  const [notifications] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Fee Payment Due',
      message: 'Semester fee payment is due by next Friday',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: 'Parent-Teacher Meeting',
      message: 'Scheduled for next Monday at 10:00 AM',
      time: '1 day ago',
      read: false
    },
    {
      id: 3,
      type: 'success',
      title: 'Exam Results Published',
      message: 'Mid-semester exam results are now available',
      time: '2 days ago',
      read: false
    },
    {
      id: 4,
      type: 'warning',
      title: 'Low Attendance Alert',
      message: 'Your child\'s attendance has dropped below 75%',
      time: '3 days ago',
      read: true
    },
    {
      id: 5,
      type: 'info',
      title: 'School Event',
      message: 'Annual sports day event scheduled for next month',
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
        return <ParentCommunicationHub parentData={user} />;
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
                    <div className="h-2 w-2 bg-role-parent rounded-full animate-pulse-indicator"></div>
                    <span className="text-lg font-medium text-foreground">Parent Portal</span>
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
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
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
                            <div className="px-2 py-1 bg-role-parent/20 text-role-parent text-xs rounded-md font-medium">
                              Parent
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {user.user_code || 'PAR001'}
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
                          setActiveView('academic');
                          setShowUserMenu(false);
                        }}
                      >
                        <TrendingUp className="h-4 w-4 mr-3" />
                        Academic Progress
                      </Button>
                      
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left hover:bg-white/10"
                        onClick={() => {
                          setActiveView('attendance');
                          setShowUserMenu(false);
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-3" />
                        Attendance Tracking
                      </Button>
                      
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left hover:bg-white/10"
                        onClick={() => {
                          setActiveView('payments');
                          setShowUserMenu(false);
                        }}
                      >
                        <CreditCard className="h-4 w-4 mr-3" />
                        Payments & Fees
                      </Button>
                      
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left hover:bg-white/10"
                        onClick={() => {
                          setActiveView('communication');
                          setShowUserMenu(false);
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-3" />
                        Communication
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
          userType="parent"
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

export default Parent;