
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, Settings, Activity, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import AuditLogs from './AuditLogs';
import SecuritySettings from './SecuritySettings';
import SystemSettings from './SystemSettings';

interface AdminRole {
  role_type: string;
  permissions: any;
  assigned_at: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  hierarchy_level: string;
  college_id: string;
}

const AdminDashboard = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access the admin dashboard.",
          variant: "destructive",
        });
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      setUserProfile(profile);

      // Get admin roles
      const { data: roles, error: rolesError } = await supabase
        .rpc('get_user_admin_roles', {
          user_uuid: user.id,
          college_uuid: profile.college_id
        });

      if (rolesError) {
        console.error('Error fetching admin roles:', rolesError);
      } else {
        setAdminRoles(roles || []);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdmin = () => {
    return adminRoles.some(role => role.role_type === 'super_admin');
  };

  const hasRole = (roleType: string) => {
    return adminRoles.some(role => role.role_type === roleType);
  };

  const getRoleDisplayName = (roleType: string) => {
    const roleNames = {
      'super_admin': 'Super Admin',
      'course_management_admin': 'Course Management Admin',
      'estate_logistics_admin': 'Estate & Logistics Admin',
      'event_admin': 'Event Admin',
      'finance_admin': 'Finance Admin',
      'it_admin': 'IT Admin'
    };
    return roleNames[roleType as keyof typeof roleNames] || roleType;
  };

  const getHierarchyLevel = (level: string) => {
    const levels = {
      'super_admin': 'Level 1 - Super Admin',
      'admin': 'Level 2 - Admin',
      'faculty': 'Level 3 - Faculty',
      'student': 'Level 4 - Student',
      'parent': 'Level 5 - Parent',
      'alumni': 'Level 6 - Alumni'
    };
    return levels[level as keyof typeof levels] || level;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || adminRoles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have admin privileges to access this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ColCord Admin</h1>
                <p className="text-sm text-gray-600">
                  Welcome, {userProfile.first_name} {userProfile.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {getHierarchyLevel(userProfile.hierarchy_level)}
              </Badge>
              {adminRoles.map((role, index) => (
                <Badge key={index} variant="default" className="text-xs">
                  {getRoleDisplayName(role.role_type)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            {isSuperAdmin() && (
              <TabsTrigger value="roles" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Roles</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="audit" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Audit</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            {isSuperAdmin() && (
              <TabsTrigger value="system" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">System</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminOverview userProfile={userProfile} adminRoles={adminRoles} />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement userProfile={userProfile} adminRoles={adminRoles} />
          </TabsContent>

          {isSuperAdmin() && (
            <TabsContent value="roles" className="space-y-6">
              <RoleManagement userProfile={userProfile} />
            </TabsContent>
          )}

          <TabsContent value="audit" className="space-y-6">
            <AuditLogs userProfile={userProfile} adminRoles={adminRoles} />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecuritySettings userProfile={userProfile} />
          </TabsContent>

          {isSuperAdmin() && (
            <TabsContent value="system" className="space-y-6">
              <SystemSettings userProfile={userProfile} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

// Overview Component
const AdminOverview = ({ userProfile, adminRoles }: { userProfile: UserProfile; adminRoles: AdminRole[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Admin Roles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {adminRoles.map((role, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm">{role.role_type.replace('_', ' ')}</span>
                <Badge variant="outline" className="text-xs">Active</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button size="sm" className="w-full justify-start">
            Manage Users
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-start">
            View Reports
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-start">
            System Health
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>System status: All services operational</p>
            <p>Last login: Just now</p>
            <p>Active sessions: 1</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
