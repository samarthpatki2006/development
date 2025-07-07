
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Users, 
  MessageSquare,
  AlertCircle,
  CheckCircle,
  BookOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TeacherDashboardProps {
  teacherData: any;
}

const TeacherDashboard = ({ teacherData }: TeacherDashboardProps) => {
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [teacherData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTodayClasses(),
        fetchPendingAssignments(),
        fetchAttendanceSummary(),
        fetchRecentMessages()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayClasses = async () => {
    const today = new Date().getDay();
    const { data, error } = await supabase
      .from('class_schedule')
      .select(`
        *,
        courses (
          id,
          course_name,
          course_code
        )
      `)
      .eq('day_of_week', today)
      .eq('courses.instructor_id', teacherData.user_id);

    if (!error && data) {
      setTodayClasses(data);
    }
  };

  const fetchPendingAssignments = async () => {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignments (
          title,
          course_id,
          courses (
            course_name
          )
        ),
        user_profiles!assignment_submissions_student_id_fkey (
          first_name,
          last_name
        )
      `)
      .is('marks_obtained', null)
      .eq('assignments.courses.instructor_id', teacherData.user_id)
      .limit(5);

    if (!error && data) {
      setPendingAssignments(data);
    }
  };

  const fetchAttendanceSummary = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        course_name,
        course_code,
        enrollments (count),
        attendance (
          status,
          class_date
        )
      `)
      .eq('instructor_id', teacherData.user_id);

    if (!error && data) {
      const summary = data.map(course => {
        const totalClasses = course.attendance?.length || 0;
        const presentCount = course.attendance?.filter((a: any) => a.status === 'present').length || 0;
        const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
        
        return {
          ...course,
          attendanceRate,
          totalStudents: course.enrollments?.[0]?.count || 0
        };
      });
      setAttendanceSummary(summary);
    }
  };

  const fetchRecentMessages = async () => {
    const { data, error } = await supabase
      .from('teacher_messages')
      .select(`
        *,
        user_profiles!teacher_messages_sender_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('recipient_id', teacherData.user_id)
      .order('sent_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setRecentMessages(data);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {teacherData.first_name}!</h2>
        <p className="text-blue-100">Here's what's happening in your classes today.</p>
      </div>

      {/* Today's Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayClasses.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No classes scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {todayClasses.map((classItem) => (
                <div key={classItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{classItem.courses?.course_name}</p>
                      <p className="text-sm text-gray-600">
                        {classItem.start_time} - {classItem.end_time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{classItem.room_location}</p>
                    <Badge variant="outline">{classItem.courses?.course_code}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pending Reviews ({pendingAssignments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingAssignments.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAssignments.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{submission.assignments?.title}</p>
                      <p className="text-sm text-gray-600">
                        {submission.user_profiles?.first_name} {submission.user_profiles?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{submission.assignments?.courses?.course_name}</p>
                    </div>
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Review
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceSummary.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No courses assigned</p>
            ) : (
              <div className="space-y-3">
                {attendanceSummary.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{course.course_name}</p>
                      <p className="text-sm text-gray-600">{course.totalStudents} students</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{course.attendanceRate}%</p>
                      <p className="text-xs text-gray-500">Attendance Rate</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentMessages.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent messages</p>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((message) => (
                <div key={message.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">
                        {message.user_profiles?.first_name} {message.user_profiles?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(message.sent_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm font-medium">{message.subject}</p>
                    <p className="text-sm text-gray-600 truncate">{message.content}</p>
                  </div>
                  {!message.is_read && (
                    <Badge variant="destructive" className="text-xs">New</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
