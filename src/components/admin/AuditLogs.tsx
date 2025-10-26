import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Search, Download, AlertCircle, Calendar, Filter, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuditLog {
  id: string;
  action_type: string;
  action_description: string;
  module: string;
  created_at: string;
  admin_user_id: string;
  target_user_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  admin_user: {
    first_name: string;
    last_name: string;
    email: string;
    user_type: string;
  } | null;
  target_user: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const itemsPerPage = 50;

  useEffect(() => {
    loadAuditLogs();
  }, [userProfile, currentPage, filterModule, filterAction, dateFrom, dateTo]);

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      
      if (!userProfile?.college_id) {
        return;
      }

      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          action_type,
          action_description,
          module,
          created_at,
          admin_user_id,
          target_user_id,
          old_values,
          new_values,
          ip_address,
          user_agent,
          admin_user:user_profiles!audit_logs_admin_user_id_fkey(
            first_name,
            last_name,
            email,
            user_type
          ),
          target_user:user_profiles!audit_logs_target_user_id_fkey(
            first_name,
            last_name,
            email
          )
        `, { count: 'exact' })
        .eq('college_id', userProfile.college_id)
        .order('created_at', { ascending: false });

      if (filterModule !== 'all') {
        query = query.eq('module', filterModule);
      }
      
      if (filterAction !== 'all') {
        query = query.eq('action_type', filterAction);
      }

      if (dateFrom) {
        query = query.gte('created_at', new Date(dateFrom).toISOString());
      }

      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error loading audit logs:', error);
        toast({
          title: "Error",
          description: "Failed to load audit logs. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setAuditLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdmin = () => {
    return adminRoles.some(role => role.admin_role_type === 'super_admin') || 
           userProfile?.is_super_admin === true;
  };

  const filteredLogs = auditLogs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action_description?.toLowerCase().includes(searchLower) ||
      log.admin_user?.first_name.toLowerCase().includes(searchLower) ||
      log.admin_user?.last_name.toLowerCase().includes(searchLower) ||
      log.admin_user?.email.toLowerCase().includes(searchLower) ||
      log.target_user?.first_name.toLowerCase().includes(searchLower) ||
      log.target_user?.last_name.toLowerCase().includes(searchLower) ||
      log.module?.toLowerCase().includes(searchLower)
    );
  });

  const getActionBadgeColor = (actionType: string) => {
    const colors = {
      'create': 'bg-green-100 text-green-800',
      'update': 'bg-blue-100 text-blue-800',
      'delete': 'bg-red-100 text-red-800',
      'login': 'bg-gray-100 text-gray-800',
      'logout': 'bg-gray-100 text-gray-800',
      'role_assigned': 'bg-purple-100 text-purple-800',
      'role_revoked': 'bg-orange-100 text-orange-800',
      'activate': 'bg-green-100 text-green-800',
      'deactivate': 'bg-yellow-100 text-yellow-800',
      'enrollment': 'bg-indigo-100 text-indigo-800',
      'grade_submission': 'bg-teal-100 text-teal-800',
      'payment': 'bg-emerald-100 text-emerald-800',
      'bulk_operation': 'bg-violet-100 text-violet-800'
    };
    return colors[actionType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getModuleBadgeColor = (module: string) => {
    const colors = {
      'users': 'bg-blue-100 text-blue-800',
      'roles': 'bg-purple-100 text-purple-800',
      'courses': 'bg-green-100 text-green-800',
      'enrollments': 'bg-indigo-100 text-indigo-800',
      'assignments': 'bg-yellow-100 text-yellow-800',
      'grades': 'bg-teal-100 text-teal-800',
      'attendance': 'bg-orange-100 text-orange-800',
      'events': 'bg-pink-100 text-pink-800',
      'clubs': 'bg-violet-100 text-violet-800',
      'fees': 'bg-red-100 text-red-800',
      'hostel': 'bg-cyan-100 text-cyan-800',
      'alumni': 'bg-lime-100 text-lime-800',
      'communications': 'bg-sky-100 text-sky-800',
      'facilities': 'bg-amber-100 text-amber-800',
      'system': 'bg-gray-100 text-gray-800'
    };
    return colors[module as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const exportLogs = async () => {
    try {
      if (filteredLogs.length === 0) {
        toast({
          title: "No Data",
          description: "No audit logs to export.",
          variant: "destructive",
        });
        return;
      }

      const csvContent = [
        'Date & Time,Admin User,Admin Email,Action Type,Module,Description,Target User,IP Address',
        ...filteredLogs.map(log => [
          new Date(log.created_at).toLocaleString(),
          log.admin_user ? `${log.admin_user.first_name} ${log.admin_user.last_name}` : 'System',
          log.admin_user?.email || 'system@automated',
          log.action_type,
          log.module || 'N/A',
          `"${log.action_description?.replace(/"/g, '""') || 'N/A'}"`,
          log.target_user ? `${log.target_user.first_name} ${log.target_user.last_name}` : 'N/A',
          log.ip_address || 'N/A'
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

  const resetFilters = () => {
    setSearchTerm('');
    setFilterModule('all');
    setFilterAction('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (isLoading && auditLogs.length === 0) {
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
                Comprehensive tracking of all administrative actions and system changes.
                {isSuperAdmin() ? ' Full access to all logs.' : ' Access limited to relevant logs.'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadAuditLogs} variant="outline" size="sm" disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={exportLogs} variant="outline" size="sm" disabled={filteredLogs.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by description, user, email, or module..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={resetFilters} variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="roles">Roles</SelectItem>
                  <SelectItem value="courses">Courses</SelectItem>
                  <SelectItem value="enrollments">Enrollments</SelectItem>
                  <SelectItem value="assignments">Assignments</SelectItem>
                  <SelectItem value="grades">Grades</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="clubs">Clubs</SelectItem>
                  <SelectItem value="fees">Fees</SelectItem>
                  <SelectItem value="hostel">Hostel</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                  <SelectItem value="communications">Communications</SelectItem>
                  <SelectItem value="facilities">Facilities</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="role_assigned">Role Assigned</SelectItem>
                  <SelectItem value="role_revoked">Role Revoked</SelectItem>
                  <SelectItem value="activate">Activate</SelectItem>
                  <SelectItem value="deactivate">Deactivate</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="enrollment">Enrollment</SelectItem>
                  <SelectItem value="grade_submission">Grade Submission</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="bulk_operation">Bulk Operation</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="date"
                  placeholder="From Date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="date"
                  placeholder="To Date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg">
            <div>
              <p className="text-sm">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
            <div>
              <p className="text-sm">Filtered Results</p>
              <p className="text-2xl font-bold">{filteredLogs.length}</p>
            </div>
            <div>
              <p className="text-sm ">Current Page</p>
              <p className="text-2xl font-bold ">{currentPage} / {totalPages || 1}</p>
            </div>
            <div>
              <p className="text-sm ">Date Range</p>
              <p className="text-sm font-medium">
                {dateFrom || dateTo ? `${dateFrom || 'Start'} to ${dateTo || 'End'}` : 'All Time'}
              </p>
            </div>
          </div>

          {/* Audit Logs Table */}
          {filteredLogs.length > 0 ? (
            <>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className=" border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-mediumw-40">Date & Time</th>
                      <th className="px-4 py-3 text-left font-mediumw-48">Admin User</th>
                      <th className="px-4 py-3 text-left font-mediumw-32">Action</th>
                      <th className="px-4 py-3 text-left font-mediumw-32">Module</th>
                      <th className="px-4 py-3 text-left font-medium">Description</th>
                      <th className="px-4 py-3 text-left font-mediumw-48">Target User</th>
                      <th className="px-4 py-3 text-left font-mediumw-32">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLogs.map((log) => (
                      <tr 
                        key={log.id}
                        className="cursor-pointer transition-colors"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="px-4 py-3 text-xs">
                          {new Date(log.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3">
                          {log.admin_user ? (
                            <div>
                              <div className="font-medium text-sm">
                                {log.admin_user.first_name} {log.admin_user.last_name}
                              </div>
                              <div className="text-xs text-gray-500">{log.admin_user.email}</div>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {log.admin_user.user_type}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">System</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getActionBadgeColor(log.action_type)}>
                            {log.action_type.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getModuleBadgeColor(log.module || 'system')}>
                            {log.module || 'system'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm max-w-md">
                          <div className="truncate">{log.action_description || 'No description'}</div>
                        </td>
                        <td className="px-4 py-3">
                          {log.target_user ? (
                            <div>
                              <div className="font-medium text-sm">
                                {log.target_user.first_name} {log.target_user.last_name}
                              </div>
                              <div className="text-xs text-gray-500">{log.target_user.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {log.ip_address || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} logs
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Audit Logs Found</h3>
              <p>No audit logs match your current filters or no logs have been recorded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black flex items-center justify-center p-4 z-50" onClick={() => setSelectedLog(null)}>
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Audit Log Details</CardTitle>
                  <CardDescription>Complete information about this audit entry</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Action Type</label>
                  <div className="mt-1">
                    <Badge className={getActionBadgeColor(selectedLog.action_type)}>
                      {selectedLog.action_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium ">Module</label>
                  <div className="mt-1">
                    <Badge className={getModuleBadgeColor(selectedLog.module || 'system')}>
                      {selectedLog.module || 'system'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium ">Date & Time</label>
                  <p className="mt-1 text-sm">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium ">IP Address</label>
                  <p className="mt-1 text-sm">{selectedLog.ip_address || 'Not recorded'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium ">Admin User</label>
                {selectedLog.admin_user ? (
                  <div className="mt-1 p-3 rounded">
                    <p className="font-medium">{selectedLog.admin_user.first_name} {selectedLog.admin_user.last_name}</p>
                    <p className="text-sm ">{selectedLog.admin_user.email}</p>
                    <Badge variant="outline" className="mt-1">{selectedLog.admin_user.user_type}</Badge>
                  </div>
                ) : (
                  <p className="mt-1 text-sm ">System</p>
                )}
              </div>

              {selectedLog.target_user && (
                <div>
                  <label className="text-sm font-medium ">Target User</label>
                  <div className="mt-1 p-3 rounded">
                    <p className="font-medium">{selectedLog.target_user.first_name} {selectedLog.target_user.last_name}</p>
                    <p className="text-sm ">{selectedLog.target_user.email}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium ">Description</label>
                <p className="mt-1 text-sm p-3 rounded">{selectedLog.action_description || 'No description'}</p>
              </div>

              {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                <div>
                  <label className="text-sm font-medium ">Old Values</label>
                  <pre className="mt-1 text-xs p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                <div>
                  <label className="text-sm font-medium ">New Values</label>
                  <pre className="mt-1 text-xs p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <label className="text-sm font-medium ">User Agent</label>
                  <p className="mt-1 text-xs rounded break-all">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}

              <Button onClick={() => setSelectedLog(null)} className="w-full">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;