
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { BookOpen, Calendar, CreditCard, Bell, TrendingUp, Users } from 'lucide-react';

interface ParentDashboardProps {
  user: any;
}

const ParentDashboard = ({ user }: ParentDashboardProps) => {
  const [children, setChildren] = useState<any[]>([]);
  const [academicSummary, setAcademicSummary] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [feeStatus, setFeeStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch children
      const { data: childrenData, error: childrenError } = await supabase.rpc('get_parent_children', {
        parent_uuid: user.user_id
      });

      if (childrenError) throw childrenError;
      setChildren(childrenData || []);

      // Fetch academic summary for each child
      if (childrenData && childrenData.length > 0) {
        const summaryPromises = childrenData.map(async (child: any) => {
          const { data, error } = await supabase.rpc('get_student_academic_summary', {
            student_uuid: child.student_id,
            parent_uuid: user.user_id
          });
          if (error) throw error;
          return { child: child.student_name, data: data || [] };
        });

        const summaryResults = await Promise.all(summaryPromises);
        setAcademicSummary(summaryResults);
      }

      // Fetch notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('parent_notifications')
        .select('*')
        .eq('parent_id', user.user_id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (notificationsError) throw notificationsError;
      setNotifications(notificationsData || []);

      // Fetch fee status
      const { data: feeData, error: feeError } = await supabase
        .from('fee_reminders')
        .select('*, fee_structures(*)')
        .eq('user_id', user.user_id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true });

      if (feeError) throw feeError;
      setFeeStatus(feeData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Children Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{children.length}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>

        {/* Overall Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Good</div>
            <p className="text-xs text-muted-foreground">
              Average across all subjects
            </p>
          </CardContent>
        </Card>

        {/* Pending Fees */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{feeStatus.reduce((total, fee) => total + Number(fee.due_amount), 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {feeStatus.length} pending payments
            </p>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">
              New messages and alerts
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Children Academic Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Academic Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {academicSummary.map((summary, index) => (
              <div key={index} className="space-y-2">
                <h4 className="font-medium text-lg">{summary.child}</h4>
                {summary.data.map((course: any, courseIndex: number) => (
                  <div key={courseIndex} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{course.course_name}</span>
                      <Badge variant={course.current_grade ? "default" : "secondary"}>
                        {course.current_grade || 'In Progress'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Attendance</span>
                        <span>{course.attendance_percentage}%</span>
                      </div>
                      <Progress value={Number(course.attendance_percentage)} className="h-2" />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Assignments: {course.submitted_assignments}/{course.total_assignments}</span>
                        <span>Instructor: {course.instructor_name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Recent Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                    </div>
                    <Badge variant="outline">{notification.notification_type}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No new notifications</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fee Status Overview */}
      {feeStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Pending Fee Payments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feeStatus.map((fee) => (
                <div key={fee.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{fee.fee_structures?.fee_type}</h4>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(fee.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">₹{Number(fee.due_amount).toLocaleString()}</p>
                    <Badge variant="destructive">Due</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ParentDashboard;
