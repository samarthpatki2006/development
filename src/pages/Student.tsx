import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  CreditCard, 
  Building, 
  HelpCircle,
  GraduationCap,
  Clock,
  FileText,
  Bell,
  Moon,
  Sun,
  Settings,
  User,
  Sparkle,
  LogOut,
  Mail,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Award,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SidebarNavigation from '@/components/layout/SidebarNavigation';
import StudentDashboard from '@/components/student/StudentDashboard';
import ScheduleTimetable from '@/components/student/ScheduleTimetable';
import AttendanceOverview from '@/components/student/AttendanceOverview';
import CoursesLearningSnapshot from '@/components/student/CoursesLearningSnapshot';
// import MyCourses from '@/components/student/MyCourses'; // Temporarily commented out
import CalendarAttendance from '@/components/student/CalendarAttendance';
import CommunicationCenter from '@/components/student/CommunicationCenter';
import PaymentsFees from '@/components/student/PaymentsFeesIntegrated';
import HostelFacility from '@/components/student/HostelFacility';
import SupportHelp from '@/components/student/SupportHelp';
import { supabase } from '@/integrations/supabase/client';
import QuizTaker from '@/components/student/QuizTaker';
import StudentGrades from '@/components/student/StudentGrades';

const Student = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [studentData, setStudentData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Mock notifications for students
  const [notifications] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Assignment Due',
      message: 'Math assignment due tomorrow at 11:59 PM',
      time: '1 hour ago',
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: 'New Quiz Available',
      message: 'Physics quiz is now available in your courses',
      time: '3 hours ago',
      read: false
    },
    {
      id: 3,
      type: 'success',
      title: 'Grade Updated',
      message: 'Your Chemistry exam grade has been posted',
      time: '1 day ago',
      read: false
    },
    {
      id: 4,
      type: 'warning',
      title: 'Low Attendance',
      message: 'Your attendance in History is below 75%',
      time: '2 days ago',
      read: true
    },
    {
      id: 5,
      type: 'info',
      title: 'Library Book Due',
      message: 'Return "Advanced Mathematics" by Friday',
      time: '3 days ago',
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
    const userData = localStorage.getItem('colcord_user');
    if (userData) {
      setStudentData(JSON.parse(userData));
    } else {
      // Set default student data for development/testing
      const defaultStudent = {
        id: 'student_123',
        name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        student_id: 'STU2024001',
        user_code: 'STU2024001',
        class: '12th Grade',
        section: 'A',
        email: 'john.doe@college.edu',
        phone: '+91 9876543210',
        user_type: 'student'
      };
      setStudentData(defaultStudent);
      console.log('No user data in localStorage, using default student data:', defaultStudent);
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('colcord_user');
    window.location.href = '/';
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

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Student Portal...</h2>
          <p className="text-gray-600">Setting up your dashboard...</p>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: GraduationCap },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'quizzes', label: 'Quizzes', icon: Sparkle },
    { id: 'gradebook', label: 'Gradebook', icon: FileText },
    { id: 'events', label: 'Events', icon: Bell },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'hostel', label: 'Hostel', icon: Building },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <StudentDashboard studentData={studentData} />;
      case 'schedule':
        return <ScheduleTimetable studentData={studentData} />;
      case 'attendance':
        return <AttendanceOverview studentData={studentData} />;
      case 'courses':
        return <CoursesLearningSnapshot studentData={studentData} />;
      case 'quizzes':
        return <QuizTaker />;
      case 'gradebook':
        return <StudentGrades />;
      case 'events':
        return <CalendarAttendance studentData={studentData} />;
      case 'communication':
        return <CommunicationCenter studentData={studentData} />;
      case 'payments':
        return <PaymentsFees studentData={studentData} />;
      case 'hostel':
        return <HostelFacility studentData={studentData} />;
      case 'support':
        return <SupportHelp studentData={studentData} />;
      default:
        return <StudentDashboard studentData={studentData} />;
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
                    <div className="h-2 w-2 bg-role-student rounded-full animate-pulse-indicator"></div>
                    <span className="text-lg font-medium text-foreground">Student Portal</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {!isMobile && studentData.name && (
                <span className="text-sm text-muted-foreground">
                  Welcome, {studentData.first_name || studentData.name}
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
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {(studentData.first_name || studentData.name)?.[0]}{studentData.last_name?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-foreground truncate">
                            {studentData.first_name ? `${studentData.first_name} ${studentData.last_name}` : studentData.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {studentData.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="px-2 py-1 bg-role-student/20 text-role-student text-xs rounded-md font-medium">
                              Student
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {studentData.user_code || studentData.student_id}
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
                          setActiveView('courses');
                          setShowUserMenu(false);
                        }}
                      >
                        <BookOpen className="h-4 w-4 mr-3" />
                        My Courses
                      </Button>
                      
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left hover:bg-white/10"
                        onClick={() => {
                          setActiveView('gradebook');
                          setShowUserMenu(false);
                        }}
                      >
                        <TrendingUp className="h-4 w-4 mr-3" />
                        My Grades
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
                        My Attendance
                      </Button>
                      
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left hover:bg-white/10"
                        onClick={() => {
                          setActiveView('schedule');
                          setShowUserMenu(false);
                        }}
                      >
                        <Clock className="h-4 w-4 mr-3" />
                        My Schedule
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
          userType="student"
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

export default Student;