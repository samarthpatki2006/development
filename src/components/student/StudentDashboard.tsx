
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  BookOpen, 
  TrendingUp, 
  FileText, 
  Bell, 
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudentDashboardProps {
  studentData: any;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ studentData }) => {
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, [studentData]);

  const fetchDashboardData = async () => {
    try {
      // Fetch today's schedule
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      const { data: scheduleData } = await supabase
        .from('class_schedule')
        .select(`
          *,
          courses(course_name, course_code, instructor_id)
        `)
        .eq('day_of_week', dayOfWeek)
        .order('start_time');

      // Filter for enrolled courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', studentData.user_id);

      const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
      const filteredSchedule = scheduleData?.filter(s => 
        enrolledCourseIds.includes(s.course_id)
      ) || [];

      setTodaySchedule(filteredSchedule);

      // Fetch upcoming assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select(`
          *,
          courses(course_name, course_code)
        `)
        .in('course_id', enrolledCourseIds)
        .gte('due_date', new Date().toISOString())
        .order('due_date')
        .limit(5);

      setUpcomingAssignments(assignmentsData || []);

      // Fetch recent grades
      const { data: gradesData } = await supabase
        .from('grades')
        .select(`
          *,
          courses(course_name, course_code)
        `)
        .eq('student_id', studentData.user_id)
        .order('recorded_at', { ascending: false })
        .limit(5);

      setRecentGrades(gradesData || []);

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .eq('college_id', studentData.college_id)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(3);

      setAnnouncements(announcementsData || []);

      // Fetch attendance stats
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', studentData.user_id);

      const totalClasses = attendanceData?.length || 0;
      const presentClasses = attendanceData?.filter(a => a.status === 'present').length || 0;
      
      setAttendanceStats({ present: presentClasses, total: totalClasses });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAttendancePercentage = () => {
    if (attendanceStats.total === 0) return 0;
    return Math.round((attendanceStats.present / attendanceStats.total) * 100);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-2">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {studentData.first_name}!
          </h2>
          <p className="text-blue-100">
            Welcome to your ColCord dashboard. Here's what's happening today.
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Today's Classes</p>
                <p className="text-2xl font-bold">{todaySchedule.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Pending Assignments</p>
                <p className="text-2xl font-bold">{upcomingAssignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Attendance</p>
                <p className="text-2xl font-bold">{getAttendancePercentage()}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Recent Grades</p>
                <p className="text-2xl font-bold">{recentGrades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Today's Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedule.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No classes scheduled for today</p>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((schedule: any) => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{schedule.courses.course_name}</h4>
                      <p className="text-sm text-gray-600">{schedule.courses.course_code}</p>
                      <p className="text-sm text-gray-500">{schedule.room_location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Upcoming Assignments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming assignments</p>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((assignment: any) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{assignment.title}</h4>
                      <p className="text-sm text-gray-600">{assignment.courses.course_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                      <Badge variant={
                        new Date(assignment.due_date).getTime() - new Date().getTime() < 86400000 
                          ? 'destructive' : 'secondary'
                      }>
                        {new Date(assignment.due_date).getTime() - new Date().getTime() < 86400000 
                          ? 'Due Soon' : 'Upcoming'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Attendance Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Attendance</span>
                  <span>{getAttendancePercentage()}%</span>
                </div>
                <Progress value={getAttendancePercentage()} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                  <p className="text-sm text-gray-600">Present</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{attendanceStats.total}</p>
                  <p className="text-sm text-gray-600">Total Classes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Recent Grades</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentGrades.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent grades</p>
            ) : (
              <div className="space-y-3">
                {recentGrades.map((grade: any) => (
                  <div key={grade.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{grade.courses.course_name}</h4>
                      <p className="text-sm text-gray-600">{grade.grade_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {grade.marks_obtained}/{grade.max_marks}
                      </p>
                      <p className="text-sm text-gray-600">
                        {Math.round((grade.marks_obtained / grade.max_marks) * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Important Announcements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent announcements</p>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement: any) => (
                <div key={announcement.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{announcement.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      announcement.priority === 'urgent' ? 'destructive' :
                      announcement.priority === 'high' ? 'default' : 'secondary'
                    }>
                      {announcement.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
