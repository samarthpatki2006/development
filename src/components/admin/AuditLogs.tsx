
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Search, Filter, Download, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  action_type: string;
  action_description: string;
  module: string;
  created_at: string;
  admin_user_id: string;
  target_user_id: string;
  old_values: any;
  new_values: any;
  admin_user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  target_user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface AuditLogsProps {
  userProfile: any;
  adminRoles: any[];
}

const AuditLogs = ({ userProfile, adminRoles }: AuditLogsProps) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          admin_user:user_profiles!audit_logs_admin_user_id_fkey (
            first_name,
            last_name,
            email
          ),
          target_user:user_profiles!audit_logs_target_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('college_id', userProfile.college_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading audit logs:', error);
        toast({
          title: "Error",
          description: "Failed to load audit logs.",
          variant: "destructive",
        });
      } else {
        setAuditLogs(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdmin = () => {
    return adminRoles.some(role => role.role_type === 'super_admin');
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_user.last_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = filterModule === 'all' || log.module === filterModule;
    const matchesAction = filterAction === 'all' || log.action_type === filterAction;

    return matchesSearch && matchesModule && matchesAction;
  });

  const getActionBadgeColor = (actionType: string) => {
    const colors = {
      'create': 'bg-green-100 text-green-800',
      'update': 'bg-blue-100 text-blue-800',
      'delete': 'bg-red-100 text-red-800',
      'login': 'bg-gray-100 text-gray-800',
      'role_assigned': 'bg-purple-100 text-purple-800',
      'role_revoked': 'bg-orange-100 text-orange-800',
      'deactivate': 'bg-yellow-100 text-yellow-800'
    };
    return colors[actionType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getModuleBadgeColor = (module: string) => {
    const colors = {
      'users': 'bg-blue-100 text-blue-800',
      'roles': 'bg-purple-100 text-purple-800',
      'courses': 'bg-green-100 text-green-800',
      'events': 'bg-yellow-100 text-yellow-800',
      'finance': 'bg-red-100 text-red-800',
      'system': 'bg-gray-100 text-gray-800'
    };
    return colors[module as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const exportLogs = async () => {
    try {
      const csvContent = [
        'Date,Admin User,Action,Module,Description,Target User',
        ...filteredLogs.map(log => [
          new Date(log.created_at).toLocaleString(),
          `${log.admin_user.first_name} ${log.admin_user.last_name}`,
          log.action_type,
          log.module,
          log.action_description,
          log.target_user ? `${log.target_user.first_name} ${log.target_user.last_name}` : ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Audit logs exported successfully.",
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast({
        title: "Error",
        description: "Failed to export audit logs.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading audit logs...</p>
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
                <Activity className="w-5 h-5" />
                <span>Audit Logs</span>
              </CardTitle>
              <CardDescription>
                Track all administrative actions and system changes. 
                {isSuperAdmin() ? ' Full access to all logs.' : ' Access limited to your actions and relevant logs.'}
              </CardDescription>
            </div>
            <Button onClick={exportLogs} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="roles">Roles</SelectItem>
                <SelectItem value="courses">Courses</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="role_assigned">Role Assigned</SelectItem>
                <SelectItem value="role_revoked">Role Revoked</SelectItem>
                <SelectItem value="login">Login</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Admin User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">
                          {log.admin_user.first_name} {log.admin_user.last_name}
                        </div>
                        <div className="text-xs text-gray-500">{log.admin_user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionBadgeColor(log.action_type)}>
                        {log.action_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getModuleBadgeColor(log.module)}>
                        {log.module}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-md">
                      <div className="truncate">{log.action_description}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.target_user ? (
                        <div>
                          <div className="font-medium">
                            {log.target_user.first_name} {log.target_user.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{log.target_user.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No audit logs found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;
