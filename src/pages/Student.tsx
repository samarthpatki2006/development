
import React, { useState, useEffect } from 'react';
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
  Sparkle
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
  const [studentData, setStudentData] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('colcord_user');
    if (userData) {
      setStudentData(JSON.parse(userData));
    } else {
      // Set default student data for development/testing
      const defaultStudent = {
        id: 'student_123',
        name: 'John Doe',
        student_id: 'STU2024001',
        class: '12th Grade',
        section: 'A',
        email: 'john.doe@college.edu',
        phone: '+91 9876543210'
      };
      setStudentData(defaultStudent);
      console.log('No user data in localStorage, using default student data:', defaultStudent);
    }
  }, []);

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
                <div className="h-2 w-2 bg-role-student rounded-full animate-pulse-indicator"></div>
                <span className="text-lg font-medium text-foreground">Student Portal</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
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
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors"
              >
                {isDarkMode ? <Sun className="h-5 w-5 text-foreground" /> : <Moon className="h-5 w-5 text-foreground" />}
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
                onClick={async() => {
                  await supabase.auth.signOut();
                  localStorage.removeItem('colcord_user');
                  window.location.href = '/';
                }}
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
          userType="student"
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

export default Student;
