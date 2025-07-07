
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import ParentDashboard from '@/components/parent/ParentDashboard';
import AcademicProgress from '@/components/parent/AcademicProgress';
import AttendanceTracking from '@/components/parent/AttendanceTracking';
import PaymentsFees from '@/components/parent/PaymentsFees';
import ParentCommunication from '@/components/parent/ParentCommunication';
import EventsMeetings from '@/components/parent/EventsMeetings';
import { User, BookOpen, Calendar, CreditCard, MessageSquare, Users } from 'lucide-react';

const Parent = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">ColCord - Parent Portal</h1>
              <span className="text-sm text-gray-600">Welcome, {user.first_name} {user.last_name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="academic" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Academic</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Payments</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Events</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ParentDashboard user={user} />
          </TabsContent>

          <TabsContent value="academic">
            <AcademicProgress user={user} />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceTracking user={user} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsFees user={user} />
          </TabsContent>

          <TabsContent value="communication">
            <ParentCommunication user={user} />
          </TabsContent>

          <TabsContent value="events">
            <EventsMeetings user={user} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Parent;
