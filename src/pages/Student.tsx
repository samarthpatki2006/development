
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  User
} from 'lucide-react';
import StudentDashboard from '@/components/student/StudentDashboard';
import ScheduleTimetable from '@/components/student/ScheduleTimetable';
import AttendanceOverview from '@/components/student/AttendanceOverview';
import CoursesLearningSnapshot from '@/components/student/CoursesLearningSnapshot';
import MyCourses from '@/components/student/MyCourses';
import CalendarAttendance from '@/components/student/CalendarAttendance';
import CommunicationCenter from '@/components/student/CommunicationCenter';
import PaymentsFees from '@/components/student/PaymentsFees';
import HostelFacility from '@/components/student/HostelFacility';
import SupportHelp from '@/components/student/SupportHelp';

const Student = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [studentData, setStudentData] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Get student data from localStorage (set during login)
    const userData = localStorage.getItem('colcord_user');
    if (userData) {
      setStudentData(JSON.parse(userData));
    }
  }, []);

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to access the student portal.</p>
        </div>
      </div>
    );
  }

  const tabItems = [
    { value: 'dashboard', label: 'Dashboard', icon: GraduationCap },
    { value: 'schedule', label: 'Schedule', icon: Clock },
    { value: 'attendance', label: 'Attendance', icon: Calendar },
    { value: 'courses', label: 'Courses', icon: BookOpen },
    { value: 'assignments', label: 'Assignments', icon: FileText },
    { value: 'events', label: 'Events', icon: Bell },
    { value: 'communication', label: 'Communication', icon: MessageSquare },
    { value: 'payments', label: 'Payments', icon: CreditCard },
    { value: 'hostel', label: 'Hostel', icon: Building },
    { value: 'support', label: 'Support', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Industrial Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative z-10 bg-background/95 backdrop-blur-sm border-b border-white/10">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-bold text-foreground">ColCord</h1>
              <div className="h-6 w-px bg-white/20"></div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-role-student rounded-full animate-pulse-indicator"></div>
                <span className="text-lg font-medium text-foreground">Student Portal</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Notification Icon */}
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Bell className="h-5 w-5 text-foreground" />
              </Button>
              
              {/* Dark Mode Toggle */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors"
              >
                {isDarkMode ? <Sun className="h-5 w-5 text-foreground" /> : <Moon className="h-5 w-5 text-foreground" />}
              </Button>
              
              {/* Settings Icon */}
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Settings className="h-5 w-5 text-foreground" />
              </Button>
              
              {/* Profile Icon */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
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

      {/* Main Content */}
      <div className="relative z-10 container px-4 mx-auto py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-card border border-white/10 rounded-lg p-1 backdrop-blur-sm">
            <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 gap-1 h-auto p-0 bg-transparent">
              {tabItems.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex flex-col items-center justify-center p-3 text-xs font-medium border border-transparent rounded-lg data-[state=active]:bg-role-student/10 data-[state=active]:border-role-student/20 data-[state=active]:text-foreground transition-all duration-300 hover:bg-white/5 hover:border-white/10 text-muted-foreground"
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="hidden sm:block text-xs font-medium">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Tab Content */}
          <TabsContent value="dashboard" className="space-y-6">
            <StudentDashboard studentData={studentData} />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <ScheduleTimetable studentData={studentData} />
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <AttendanceOverview studentData={studentData} />
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <CoursesLearningSnapshot studentData={studentData} />
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <MyCourses studentData={studentData} />
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <CalendarAttendance studentData={studentData} />
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <CommunicationCenter studentData={studentData} />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <PaymentsFees studentData={studentData} />
          </TabsContent>

          <TabsContent value="hostel" className="space-y-6">
            <HostelFacility studentData={studentData} />
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <SupportHelp studentData={studentData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Student;
