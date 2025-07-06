import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Shield, 
  Settings, 
  FileText, 
  Activity,
  BookOpen,
  Building,
  Calendar,
  DollarSign,
  MessageSquare,
  Archive,
  BarChart3,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Import all admin components
import EnhancedUserManagement from './EnhancedUserManagement';
import RoleManagement from './RoleManagement';
import AuditLogs from './AuditLogs';
import SecuritySettings from './SecuritySettings';
import SystemSettings from './SystemSettings';
import CourseManagement from './CourseManagement';
import FacilityManagement from './FacilityManagement';
import EventManagement from './EventManagement';
import FinanceManagement from './FinanceManagement';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_code: string;
  user_type: 'student' | 'faculty' | 'admin' | 'staff';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  college_id: string;
  hierarchy_level: string;
}

interface AdminRole {
  role_type: string;
  permissions: any;
  assigned_at: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalEvents: number;
  monthlyRevenue: number;
  pendingApprovals: number;
}

const AdminDashboard = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    totalEvents: 0,
    monthlyRevenue: 0,
    pendingApprovals: 0
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "No authenticated user found.",
          variant: "destructive",
        });
        return;
      }

      // Mock user profile data with hierarchy_level
      const mockUserProfile: UserProfile = {
        id: user.id,
        first_name: 'Admin',
        last_name: 'User',
        email: user.email || '',
        user_code: 'ADM001',
        user_type: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        college_id: 'college-1',
        hierarchy_level: 'super_admin'
      };

      const mockAdminRoles: AdminRole[] = [
        {
          role_type: 'super_admin',
          permissions: { all: true },
          assigned_at: new Date().toISOString()
        }
      ];

      const mockStats: DashboardStats = {
        totalUsers: 1250,
        activeUsers: 1180,
        totalCourses: 85,
        totalEvents: 12,
        monthlyRevenue: 2850000,
        pendingApprovals: 8
      };

      setUserProfile(mockUserProfile);
      setAdminRoles(mockAdminRoles);
      setDashboardStats(mockStats);
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const isSuperAdmin = (): boolean => {
    return adminRoles.some(role => role.role_type === 'super_admin') || 
           userProfile?.user_type === 'admin';
  };

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

  if (!userProfile) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {userProfile.first_name}!
          </h1>
          <p className="text-gray-600">
            Welcome to ColCord Admin Dashboard
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {userProfile.hierarchy_level.replace('_', ' ').toUpperCase()}
          </Badge>
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Notifications ({dashboardStats.pendingApprovals})
          </Button>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 gap-2">
          <TabsTrigger value="overview" className="flex items-center space-x-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center space-x-1">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center space-x-1">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Courses</span>
          </TabsTrigger>
          <TabsTrigger value="facilities" className="flex items-center space-x-1">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">Facilities</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center space-x-1">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Finance</span>
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center space-x-1">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Comms</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center space-x-1">
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-1">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-1">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center space-x-1">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{dashboardStats.activeUsers} active users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">
                  Across all departments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.totalEvents}</div>
                <p className="text-xs text-muted-foreground">
                  This semester
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{(dashboardStats.monthlyRevenue / 100000).toFixed(1)}L</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => setActiveTab('users')}>
                  <Users className="w-6 h-6" />
                  <span>Add User</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => setActiveTab('courses')}>
                  <BookOpen className="w-6 h-6" />
                  <span>Create Course</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => setActiveTab('events')}>
                  <Calendar className="w-6 h-6" />
                  <span>Schedule Event</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => setActiveTab('communication')}>
                  <MessageSquare className="w-6 h-6" />
                  <span>Send Announcement</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activities and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">New student enrollment: John Doe (STU001)</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Course "Advanced Mathematics" created</p>
                    <p className="text-xs text-gray-500">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Payment received: ₹50,000 - Tuition Fee</p>
                    <p className="text-xs text-gray-500">6 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced User Management Tab */}
        <TabsContent value="users">
          <EnhancedUserManagement userProfile={userProfile} adminRoles={adminRoles} />
        </TabsContent>

        {/* Role Management Tab */}
        <TabsContent value="roles">
          <RoleManagement userProfile={userProfile} adminRoles={adminRoles} />
        </TabsContent>

        {/* Course Management Tab */}
        <TabsContent value="courses">
          <CourseManagement userProfile={userProfile} />
        </TabsContent>

        {/* Facility Management Tab */}
        <TabsContent value="facilities">
          <FacilityManagement userProfile={userProfile} />
        </TabsContent>

        {/* Event Management Tab */}
        <TabsContent value="events">
          <EventManagement userProfile={userProfile} />
        </TabsContent>

        {/* Finance Management Tab */}
        <TabsContent value="finance">
          <FinanceManagement userProfile={userProfile} />
        </TabsContent>

        {/* Communication Center Tab */}
        <TabsContent value="communication">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Communication Center</span>
              </CardTitle>
              <CardDescription>
                Send emails, SMS, push notifications, and announcements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Communication Center</h3>
                <p>Multi-channel communication tools will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Management Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Archive className="w-5 h-5" />
                <span>Content & Resource Management</span>
              </CardTitle>
              <CardDescription>
                Manage documents, announcements, and learning resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Archive className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Content Management</h3>
                <p>Resource management and content publishing tools will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security">
          <SecuritySettings userProfile={userProfile} adminRoles={adminRoles} />
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="settings">
          <SystemSettings userProfile={userProfile} adminRoles={adminRoles} />
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="logs">
          <AuditLogs userProfile={userProfile} adminRoles={adminRoles} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
