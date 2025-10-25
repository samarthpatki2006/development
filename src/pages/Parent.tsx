import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Clock,
  Menu
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
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Mock notifications for parents
  const [notifications, setNotifications] = useState([
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
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        // Close mobile menu when switching to desktop
        if (!mobile) {
          setMobileMenuOpen(false);
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





  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
    toast({
      title: 'Notifications Cleared',
      description: 'All notifications have been cleared.',
    });
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* Header */}
      <div className="fixed w-full z-[100] bg-background/95 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex justify-between items-center h-16">
            {/* Left Section */}
            <div className="flex items-center space-x-3 sm:space-x-6">
              {/* UPDATED: Sidebar Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSidebarToggle}
                className="h-9 w-9 rounded-lg hover:bg-white/10 transition-all duration-200 ease-in-out"
              >
                <span className="sr-only">Toggle sidebar</span>
                <Menu className="h-7 w-7" />
              </Button>


              {/* Logo + Portal Name */}
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">ColCord</h1>
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="h-6 w-px bg-white/20"></div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-role-parent rounded-full animate-pulse-indicator"></div>
                    <span className="text-sm sm:text-lg font-medium text-foreground">Parent Portal</span>
                  </div>
                </div>
              </div>
            </div>


            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Notifications Dropdown */}
              <div className="relative" ref={notificationRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNotificationClick}
                  className="h-9 w-9 rounded-lg hover:bg-white/10 transition-all relative will-change-transform"
                >
                  <Bell className="h-9 w-9 text-foreground" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">{unreadCount}</span>
                    </div>
                  )}
                </Button>

                {/* Notifications Panel */}
                {showNotifications && (
                  <div className="fixed right-3 sm:right-4 top-20 w-72 sm:w-96 bg-background/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-[9999]">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">Notifications</h3>
                      <div className="flex items-center space-x-2">
                        {notifications.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllNotifications}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Clear All
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowNotifications(false)}
                          className="h-6 w-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <Bell className="h-10 sm:h-12 w-10 sm:w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                          <p className="text-sm text-muted-foreground">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors ${!notification.read ? 'bg-white/5' : ''
                              }`}
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {notification.title}
                                  </p>
                                  {!notification.read && (
                                    <div className="h-2 w-2 bg-blue-500 rounded-full ml-2"></div>
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
                        ))
                      )}
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
                  className="h-9 w-9 rounded-lg hover:bg-white/10 transition-all will-change-transform"
                >
                  <User className="h-9 w-9 text-foreground" />
                </Button>

                {/* User Menu Panel */}
                {showUserMenu && (
                  <div className="fixed right-3 sm:right-4 top-20 w-60 sm:w-64 bg-background/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-[9999]">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 sm:h-12 w-10 sm:w-12 bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>

                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className="bg-gray-500/20 text-gray-300 border-gray-400/30 font-medium text-xs pointer-events-none">
                              Parent
                            </Badge>
                            <span className=" text-gray-300 border-gray-400/30 text-xs font-medium">
                              {user.user_code || 'PAR001'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>



                    <div className="p-2 space-y-2 sm:space-y-0 ">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveView('academic');
                        }}
                        className="w-full justify-start text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg will-change-transform"
                      >
                        <TrendingUp className="h-4 w-4 mr-3" />
                        Academic Progress
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveView('attendance');
                        }}
                        className="w-full justify-start text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg will-change-transform"
                      >
                        <Calendar className="h-4 w-4 mr-3" />
                        Attendance Tracking
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveView('payments');
                        }}
                        className="w-full justify-start text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg will-change-transform"
                      >
                        <CreditCard className="h-4 w-4 mr-3" />
                        Payments & Fees
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveView('communication');
                        }}
                        className="w-full justify-start text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg will-change-transform"
                      >
                        <MessageSquare className="h-4 w-4 mr-3" />
                        Communication
                      </Button>



                      <div className="h-px bg-white/10 my-2"></div>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full justify-start text-sm text-red-400 hover:text-red-300 hover:bg-ref-500/10 rounded-lg will-change-transform"
                      >
                        <LogOut className="text-red-300 h-4 w-4 mr-3" />
                        Logout
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
      <div className="relative z-10 flex mt-[64px] min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <SidebarNavigation
          items={sidebarItems}
          activeItem={activeView}
          onItemClick={setActiveView}
          userType="parent"
          collapsed={sidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 w-full min-w-0 transition-all duration-300 ease-in-out p-3 sm:p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Parent;