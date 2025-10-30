import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, DollarSign, Award, Home, Users, Loader2 } from 'lucide-react';
import PermissionWrapper from '@/components/PermissionWrapper';
import { supabase } from '@/integrations/supabase/client';

interface StudentDashboardProps {
  studentData: any;
  onNavigate?: (tab: string) => void;
}

const StudentDashboard = ({ studentData, onNavigate }: StudentDashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    upcomingAssignments: 0,
    cgpa: 0,
    pendingFees: 0
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);


  useEffect(() => {
    if (studentData?.id) {
      fetchDashboardData();
    }
  }, [studentData?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch enrolled courses
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(
            id,
            course_code,
            course_name,
            instructor:user_profiles!courses_instructor_id_fkey(
              first_name,
              last_name
            )
          )
        `)
        .eq('student_id', studentData.id)
        .eq('status', 'enrolled');

      if (enrollmentsError) throw enrollmentsError;

      // Fetch upcoming assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*, course:courses(course_name)')
        .gt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(10);

      if (assignmentsError) throw assignmentsError;

      // Filter assignments for enrolled courses
      const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
      const upcomingAssignments = assignments?.filter(a => 
        enrolledCourseIds.includes(a.course_id)
      ) || [];

      // Fetch CGPA from student academic records
      const { data: academicRecords, error: academicError } = await supabase
        .from('student_academic_records')
        .select('cgpa')
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (academicError && academicError.code !== 'PGRST116') {
        console.error('Academic records error:', academicError);
      }

      // Fetch pending fees
      const { data: feeTransactions, error: feesError } = await supabase
        .from('fee_transactions')
        .select('amount')
        .eq('student_id', studentData.id)
        .eq('transaction_status', 'pending');

      if (feesError) throw feesError;

      const totalPendingFees = feeTransactions?.reduce((sum, fee) => sum + Number(fee.amount), 0) || 0;

      // Fetch course progress for enrolled courses
      const coursesWithProgress = await Promise.all(
        (enrollments || []).slice(0, 3).map(async (enrollment: any) => {
          const { data: modules } = await supabase
            .from('learning_modules')
            .select('id')
            .eq('course_id', enrollment.course_id);

          const { data: progress } = await supabase
            .from('student_progress')
            .select('completion_percentage')
            .eq('student_id', studentData.id)
            .in('module_id', modules?.map(m => m.id) || []);

          const avgProgress = progress && progress.length > 0
            ? progress.reduce((sum, p) => sum + Number(p.completion_percentage), 0) / progress.length
            : 0;

          return {
            name: enrollment.course?.course_name || 'Unknown Course',
            code: enrollment.course?.course_code || 'N/A',
            instructor: enrollment.course?.instructor 
              ? `${enrollment.course.instructor.first_name} ${enrollment.course.instructor.last_name}`
              : 'TBA',
            progress: Math.round(avgProgress)
          };
        })
      );

      // Build recent activities
      const activities = [];

      // Recent assignment submissions
      const { data: recentSubmissions } = await supabase
        .from('assignment_submissions')
        .select(`
          submitted_at,
          assignment:assignments(
            title,
            course:courses(course_name)
          )
        `)
        .eq('student_id', studentData.id)
        .order('submitted_at', { ascending: false })
        .limit(2);

      recentSubmissions?.forEach((sub: any) => {
        activities.push({
          title: 'Assignment Submitted',
          description: `${sub.assignment?.course?.course_name} - ${sub.assignment?.title}`,
          time: formatTimeAgo(sub.submitted_at),
          type: 'assignment',
          permission: 'view_submit_assignments' as const
        });
      });

      // Recent grades
      const { data: recentGrades } = await supabase
        .from('grades')
        .select(`
          recorded_at,
          grade_letter,
          course:courses(course_name)
        `)
        .eq('student_id', studentData.id)
        .not('grade_letter', 'is', null)
        .order('recorded_at', { ascending: false })
        .limit(2);

      recentGrades?.forEach((grade: any) => {
        activities.push({
          title: 'Grade Updated',
          description: `${grade.course?.course_name} - ${grade.grade_letter} Grade`,
          time: formatTimeAgo(grade.recorded_at),
          type: 'grade',
          permission: 'view_grades' as const
        });
      });

      // Recent attendance
      const { data: recentAttendance } = await supabase
        .from('attendance')
        .select(`
          marked_at,
          status,
          course:courses(course_name)
        `)
        .eq('student_id', studentData.id)
        .order('marked_at', { ascending: false })
        .limit(2);

      recentAttendance?.forEach((att: any) => {
        activities.push({
          title: 'Attendance Marked',
          description: `${att.course?.course_name} - ${att.status}`,
          time: formatTimeAgo(att.marked_at),
          type: 'attendance',
          permission: 'view_attendance' as const
        });
      });

      // Sort activities by time
      activities.sort((a, b) => {
        const timeA = parseTimeAgo(a.time);
        const timeB = parseTimeAgo(b.time);
        return timeA - timeB;
      });

      setStats({
        enrolledCourses: enrollments?.length || 0,
        upcomingAssignments: upcomingAssignments.length,
        cgpa: academicRecords?.cgpa || 0,
        pendingFees: totalPendingFees
      });

      setCourses(coursesWithProgress);
      setRecentActivities(activities.slice(0, 4));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const parseTimeAgo = (timeStr: string): number => {
    const match = timeStr.match(/(\d+)\s+(minute|hour|day)s?\s+ago/);
    if (!match) return 0;
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit === 'minute') return value;
    if (unit === 'hour') return value * 60;
    return value * 1440; // days
  };

  const quickStats = [
    {
      title: 'Enrolled Courses',
      value: loading ? '-' : stats.enrolledCourses.toString(),
      icon: BookOpen,
      color: 'text-blue-600',
      permission: 'view_submit_assignments' as const
    },
    {
      title: 'Upcoming Assignments',
      value: loading ? '-' : stats.upcomingAssignments.toString(),
      icon: Calendar,
      color: 'text-orange-600',
      permission: 'view_submit_assignments' as const
    },
    {
      title: 'Current CGPA',
      value: loading ? '-' : stats.cgpa.toFixed(2),
      icon: Award,
      color: 'text-purple-600',
      permission: 'view_grades' as const
    },
    {
      title: 'Pending Fees',
      value: loading ? '-' : `₹${stats.pendingFees.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-red-600',
      permission: 'view_fees' as const
    }
  ];

  const recentActivitiesDisplay = loading 
    ? Array(4).fill(null).map((_, i) => ({
        title: 'Loading...',
        description: 'Fetching data...',
        time: '-',
        type: 'loading',
        permission: 'view_submit_assignments' as const
      }))
    : recentActivities.length > 0 
      ? recentActivities 
      : [{
          title: 'No Recent Activity',
          description: 'Your recent activities will appear here',
          time: '-',
          type: 'empty',
          permission: 'view_submit_assignments' as const
        }];

  const quickActions = [
    {
      title: 'View Assignments',
      description: 'Check and submit pending assignments',
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      permission: 'view_submit_assignments' as const,
      navigateTo: 'courses'
    },
    {
      title: 'Apply for Hostel',
      description: 'Submit hostel accommodation request',
      icon: Home,
      color: 'bg-green-50 text-green-600 hover:bg-green-100',
      permission: 'apply_hostel' as const,
      navigateTo: 'hostel'
    },
    {
      title: 'Join Discussion',
      description: 'Participate in course forums',
      icon: Users,
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
      permission: 'join_forums' as const,
      navigateTo: 'communication'
    },
    {
      title: 'Request Certificate',
      description: 'Apply for academic certificates',
      icon: Award,
      color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
      permission: 'request_certificates' as const,
      navigateTo: 'support'
    }
  ];

  const handleQuickActionClick = (navigateTo: string, actionTitle: string) => {
    if (onNavigate) {
      onNavigate(navigateTo);
    } else {
      console.warn(`Navigation not available for ${actionTitle}`);
    }
  };

  const handleStatCardClick = (statTitle: string) => {
    if (onNavigate) {
      switch (statTitle) {
        case 'Enrolled Courses':
          onNavigate('courses');
          break;
        case 'Upcoming Assignments':
          onNavigate('courses');
          break;
        case 'Current CGPA':
          onNavigate('gradebook');
          break;
        case 'Pending Fees':
          onNavigate('payments');
          break;
        default:
          break;
      }
    }
  };

  const handleCourseClick = () => {
    if (onNavigate) {
      onNavigate('courses');
    }
  };

  return (
    <div className="space-y-6 py-8 animate-fade-in-up px-3 sm:px-4 md:px-6 overflow-x-hidden w-full">
      {/* Welcome Section */}
      <div className="bg-card border border-white/10 rounded-lg p-4 sm:p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2 inline-block">
              Welcome back, {studentData.first_name}
            </h1>
            <p>Student ID: {studentData.user_code}</p>
            <Badge className="bg-green-600/30 text-green-100 border border-green-300/40 font-bold px-4 py-1.5 self-start md:self-auto hover:bg-green-600/40 hover:border-green-300/60 hover:cursor-pointer hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all duration-300 mt-4">
              STUDENT
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-md">Current CGPA</p>
            <p className="text-2xl font-bold text-role-student">
              {loading ? <Loader2 className="h-6 w-6 animate-spin inline" /> : stats.cgpa.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 w-full">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <PermissionWrapper key={index} permission={stat.permission}>
              <Card
                className="hover:shadow-md transition-all duration-300 hover:border-role-student/20 cursor-pointer hover:scale-[1.01] sm:hover:scale-[1.03] md:hover:scale-105"
                onClick={() => handleStatCardClick(stat.title)}
              >
                <CardContent className="p-3 sm:p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate mb-1">{stat.title}</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">{stat.value}</p>
                    </div>
                    <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ml-3`}>
                      <Icon className={`h-5 w-5 sm:h-6 ${stat.color} sm:w-6`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </PermissionWrapper>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activities */}
        <Card className="h-[450px] sm:h-[510px] border-white/20 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-md shadow-2xl overflow-hidden group">
          <CardHeader className="sticky top-0 z-10 bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-sm border-b border-white/10 pb-4">
            <CardTitle className="text-card-foreground text-lg sm:text-xl">Recent Activities</CardTitle>
            <CardDescription className="text-sm">Your latest academic activities</CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-100px)] overflow-y-auto overflow-x-hidden scrollbar-thin space-y-3 sm:space-y-4 p-4 sm:p-6">
            {recentActivitiesDisplay.map((activity, index) => (
              <PermissionWrapper key={index} permission={activity.permission}>
                <div className="flex flex-row items-start justify-start space-x-2 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 hover:shadow-md hover:shadow-green-500/5 will-change-transform">
                  <div className="flex-shrink-0 mt-2 sm:mt-2.5">
                    {loading ? (
                      <Loader2 className="w-2 h-2 animate-spin text-green-400" />
                    ) : (
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <p className="font-medium text-card-foreground text-sm sm:text-base truncate">{activity.title}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-snug line-clamp-2">{activity.description}</p>
                    <p className="text-[10px] sm:text-xs text-white/40 font-mono mt-1">{activity.time}</p>
                  </div>
                </div>
              </PermissionWrapper>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="h-[450px] sm:h-[510px] border-white/20 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-md shadow-2xl overflow-hidden group">
          <CardHeader className="sticky top-0 z-10 bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-sm border-b border-white/10 pb-4">
            <CardTitle className="text-card-foreground text-lg sm:text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-sm">Frequently used features - click to navigate</CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-100px)] overflow-y-auto overflow-x-hidden scroll-smooth space-y-3 sm:space-y-4 p-4 sm:p-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <PermissionWrapper key={index} permission={action.permission}>
                  <div 
                    className="flex flex-row items-start justify-start space-x-4 p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 hover:shadow-md hover:shadow-green-500/5 will-change-transform cursor-pointer"
                    onClick={() => handleQuickActionClick(action.navigateTo, action.title)}
                  >
                    <div className={`flex-shrink-0 p-2 ${action.color} transition-colors flex items-start self-start mt-1 mr-2 rounded-lg`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex flex-col justify-center flex-1 min-w-0">
                      <p className="font-medium text-card-foreground text-sm sm:text-base truncate">{action.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-snug line-clamp-2">{action.description}</p>
                    </div>
                  </div>
                </PermissionWrapper>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Current Courses Preview */}
      <PermissionWrapper permission="view_submit_assignments">
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-card-foreground">Current Courses</CardTitle>
            <CardDescription>Your enrolled courses this semester - click to view details</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-role-student" />
                <span className="ml-3 text-muted-foreground">Loading courses...</span>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No enrolled courses found</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {courses.map((course, index) => (
                    <div
                      key={index}
                      className="p-6 border border-white/10 rounded-lg bg-white/5 hover:border-role-student/20 transition-all duration-300 hover-translate-up cursor-pointer hover:scale-[1.02] sm:hover:scale-105"
                      onClick={handleCourseClick}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-card-foreground">{course.name}</h4>
                        <Badge variant="secondary">{course.code}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{course.instructor}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-card-foreground font-medium">{course.progress}%</span>
                        </div>
                        <div className="w-full rounded-full h-2 bg-white/10">
                          <div
                            className="bg-role-student h-2 rounded-full transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <Button
                    variant="outline"
                    onClick={handleCourseClick}
                    className="hover:bg-role-student/10 hover:text-role-student hover:border-role-student/20"
                  >
                    View All Courses
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </PermissionWrapper>
    </div>
  );
};

export default StudentDashboard;