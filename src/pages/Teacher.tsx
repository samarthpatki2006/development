
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Calendar, 
  Users, 
  BookOpen, 
  ClipboardList, 
  MessageSquare, 
  FileText, 
  Settings, 
  Bell, 
  User,
  TrendingUp,
  Award,
  HelpCircle
} from 'lucide-react';
import SidebarNavigation from '@/components/layout/SidebarNavigation';
import TeacherDashboard from '@/components/teacher/TeacherDashboard';
import TeacherSchedule from '@/components/teacher/TeacherSchedule';
import TeacherCalendarAttendance from '@/components/teacher/TeacherCalendarAttendance';
import TeacherCourses from '@/components/teacher/TeacherCourses';
import TeacherGradebook from '@/components/teacher/TeacherGradebook';
import TeacherCommunication from '@/components/teacher/TeacherCommunication';
import TeacherDocuments from '@/components/teacher/TeacherDocuments';
import TeacherPerformance from '@/components/teacher/TeacherPerformance';
import TeacherRecognition from '@/components/teacher/TeacherRecognition';
import TeacherEvents from '@/components/teacher/TeacherEvents';
import TeacherParentInteraction from '@/components/teacher/TeacherParentInteraction';
import TeacherSupport from '@/components/teacher/TeacherSupport';

const Teacher = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [teacherData, setTeacherData] = useState<any>(null);
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
        if (parsedUser.user_type !== 'faculty') {
          toast({
            title: 'Access Denied',
            description: 'This area is for teachers only.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setTeacherData(parsedUser);
      } catch (error) {
        console.error('Error checking user:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('colcord_user');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-role-teacher" />
      </div>
    );
  }

  if (!teacherData) {
    return null;
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: GraduationCap },
    { id: 'schedule', label: 'Schedule & Timetable', icon: Calendar },
    { id: 'attendance', label: 'Attendance Management', icon: Users },
    { id: 'courses', label: 'Course & Content', icon: BookOpen },
    { id: 'gradebook', label: 'Assignments & Evaluation', icon: ClipboardList },
    { id: 'events', label: 'Events & Calendar', icon: Calendar },
    { id: 'performance', label: 'Student Performance', icon: TrendingUp },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'parent-interaction', label: 'Parent Interaction', icon: Users },
    { id: 'documents', label: 'Document Management', icon: FileText },
    { id: 'recognition', label: 'Recognition & Feedback', icon: Award },
    { id: 'support', label: 'Support & Helpdesk', icon: HelpCircle },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <TeacherDashboard teacherData={teacherData} />;
      case 'schedule':
        return <TeacherSchedule teacherData={teacherData} />;
      case 'attendance':
        return <TeacherCalendarAttendance teacherData={teacherData} />;
      case 'courses':
        return <TeacherCourses teacherData={teacherData} />;
      case 'gradebook':
        return <TeacherGradebook teacherData={teacherData} />;
      case 'events':
        return <TeacherEvents teacherData={teacherData} />;
      case 'performance':
        return <TeacherPerformance teacherData={teacherData} />;
      case 'communication':
        return <TeacherCommunication teacherData={teacherData} />;
      case 'parent-interaction':
        return <TeacherParentInteraction teacherData={teacherData} />;
      case 'documents':
        return <TeacherDocuments teacherData={teacherData} />;
      case 'recognition':
        return <TeacherRecognition teacherData={teacherData} />;
      case 'support':
        return <TeacherSupport teacherData={teacherData} />;
      default:
        return <TeacherDashboard teacherData={teacherData} />;
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
                <div className="h-2 w-2 bg-role-teacher rounded-full animate-pulse-indicator"></div>
                <span className="text-lg font-medium text-foreground">Teacher Portal</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">
                Welcome, Prof. {teacherData.first_name} {teacherData.last_name}
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
          userType="faculty"
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

export default Teacher;
