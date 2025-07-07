
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
  Bell
} from 'lucide-react';
import StudentDashboard from '@/components/student/StudentDashboard';
import MyCourses from '@/components/student/MyCourses';
import CalendarAttendance from '@/components/student/CalendarAttendance';
import CommunicationCenter from '@/components/student/CommunicationCenter';
import PaymentsFees from '@/components/student/PaymentsFees';
import HostelFacility from '@/components/student/HostelFacility';
import SupportHelp from '@/components/student/SupportHelp';

const Student = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [studentData, setStudentData] = useState<any>(null);

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
    { value: 'courses', label: 'My Courses', icon: BookOpen },
    { value: 'calendar', label: 'Calendar & Attendance', icon: Calendar },
    { value: 'communication', label: 'Communication', icon: MessageSquare },
    { value: 'payments', label: 'Payments & Fees', icon: CreditCard },
    { value: 'hostel', label: 'Hostel & Facility', icon: Building },
    { value: 'support', label: 'Support & Help', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-blue-600">ColCord</h1>
              <span className="text-gray-400">|</span>
              <span className="text-lg font-medium text-gray-700">Student Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {studentData.first_name} {studentData.last_name}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem('colcord_user');
                  window.location.href = '/';
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7 gap-1 h-auto p-1">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex flex-col items-center justify-center p-3 text-xs font-medium data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="hidden sm:block">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="dashboard" className="space-y-6">
            <StudentDashboard studentData={studentData} />
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <MyCourses studentData={studentData} />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
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
