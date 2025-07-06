
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Shield, Plus, Trash2, Users, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AdminRoleAssignment {
  id: string;
  user_id: string;
  admin_role_type: string;
  assigned_at: string;
  is_active: boolean;
  user_profiles: {
    first_name: string;
    last_name: string;
    email: string;
    user_code: string;
  };
}

interface RoleManagementProps {
  userProfile: any;
}

const RoleManagement = ({ userProfile }: RoleManagementProps) => {
  const [roleAssignments, setRoleAssignments] = useState<AdminRoleAssignment[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const adminRoleTypes = [
    { value: 'course_management_admin', label: 'Course Management Admin', description: 'Manages courses, enrollments, and academic schedules' },
    { value: 'estate_logistics_admin', label: 'Estate & Logistics Admin', description: 'Handles campus infrastructure and logistics' },
    { value: 'event_admin', label: 'Event Admin', description: 'Organizes and manages college events' },
    { value: 'finance_admin', label: 'Finance Admin', description: 'Manages financial operations and transactions' },
    { value: 'it_admin', label: 'IT Admin', description: 'Handles IT infrastructure and technical support' }
  ];

  useEffect(() => {
    loadRoleAssignments();
    loadAvailableUsers();
  }, []);

  const loadRoleAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select(`
          *,
          user_profiles (
            first_name,
            last_name,
            email,
            user_code
          )
        `)
        .eq('college_id', userProfile.college_id)
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('Error loading role assignments:', error);
        toast({
          title: "Error",
          description: "Failed to load role assignments.",
          variant: "destructive",
        });
      } else {
        setRoleAssignments(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('college_id', userProfile.college_id)
        .in('user_type', ['admin', 'faculty'])
        .eq('is_active', true);

      if (error) {
        console.error('Error loading users:', error);
      } else {
        setAvailableUsers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Missing Information",
        description: "Please select both a user and a role.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_roles')
        .insert({
          user_id: selectedUser,
          college_id: userProfile.college_id,
          admin_role_type: selectedRole,
          assigned_by: userProfile.id,
          is_active: true
        });

      if (error) {
        console.error('Error assigning role:', error);
        toast({
          title: "Error",
          description: "Failed to assign role.",
          variant: "destructive",
        });
      } else {
        // Log the admin action
        await supabase.rpc('log_admin_action', {
          college_uuid: userProfile.college_id,
          admin_uuid: userProfile.id,
          target_uuid: selectedUser,
          action_type_param: 'role_assigned',
          action_desc: `Assigned ${selectedRole} role`,
          module_param: 'roles'
        });

        toast({
          title: "Success",
          description: "Role assigned successfully.",
        });

        setIsAssignDialogOpen(false);
        setSelectedUser('');
        setSelectedRole('');
        loadRoleAssignments();
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to assign role.",
        variant: "destructive",
      });
    }
  };

  const revokeRole = async (roleId: string, targetUserId: string, roleType: string) => {
    try {
      const { error } = await supabase
        .from('admin_roles')
        .update({ is_active: false })
        .eq('id', roleId);

      if (error) {
        console.error('Error revoking role:', error);
        toast({
          title: "Error",
          description: "Failed to revoke role.",
          variant: "destructive",
        });
      } else {
        // Log the admin action
        await supabase.rpc('log_admin_action', {
          college_uuid: userProfile.college_id,
          admin_uuid: userProfile.id,
          target_uuid: targetUserId,
          action_type_param: 'role_revoked',
          action_desc: `Revoked ${roleType} role`,
          module_param: 'roles'
        });

        toast({
          title: "Success",
          description: "Role revoked successfully.",
        });

        loadRoleAssignments();
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to revoke role.",
        variant: "destructive",
      });
    }
  };

  const getRoleDisplayName = (roleType: string) => {
    const role = adminRoleTypes.find(r => r.value === roleType);
    return role ? role.label : roleType.replace('_', ' ');
  };

  const getRoleBadgeColor = (roleType: string) => {
    const colors = {
      'course_management_admin': 'bg-blue-100 text-blue-800',
      'estate_logistics_admin': 'bg-green-100 text-green-800',
      'event_admin': 'bg-purple-100 text-purple-800',
      'finance_admin': 'bg-yellow-100 text-yellow-800',
      'it_admin': 'bg-gray-100 text-gray-800'
    };
    return colors[roleType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading role assignments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Role Management</span>
              </CardTitle>
              <CardDescription>
                Assign and manage admin roles for your college. Only Super Admins can manage roles.
              </CardDescription>
            </div>
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Admin Role</DialogTitle>
                  <DialogDescription>
                    Select a user and role to assign admin privileges.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select User</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.user_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {adminRoleTypes.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-sm text-gray-500">{role.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={assignRole} className="w-full">
                    Assign Role
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {assignment.user_profiles.first_name} {assignment.user_profiles.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.user_profiles.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(assignment.admin_role_type)}>
                        {getRoleDisplayName(assignment.admin_role_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={assignment.is_active ? "default" : "secondary"}>
                        {assignment.is_active ? "Active" : "Revoked"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignment.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => revokeRole(assignment.id, assignment.user_id, assignment.admin_role_type)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {roleAssignments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No role assignments found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Hierarchy Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Admin Role Hierarchy</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminRoleTypes.map((role, index) => (
              <div key={role.value} className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-4 h-4" />
                  <h4 className="font-medium">{role.label}</h4>
                </div>
                <p className="text-sm text-gray-600">{role.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagement;
