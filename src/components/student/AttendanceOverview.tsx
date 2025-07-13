import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, AlertTriangle, Calendar as CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PermissionWrapper from '@/components/PermissionWrapper';

interface AttendanceOverviewProps {
  studentData: any;
}

const AttendanceOverview: React.FC<AttendanceOverviewProps> = ({ studentData }) => {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalClasses: 0,
    attendedClasses: 0,
    percentage: 0,
    status: 'good'
  });
  const [courseStats, setCourseStats] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendanceData();
    fetchCourses();
  }, [studentData, selectedMonth, selectedCourse]);

  const fetchCourses = async () => {
    if (!studentData?.user_id) return;

    try {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          courses (
            id,
            course_name,
            course_code
          )
        `)
        .eq('student_id', studentData.user_id)
        .eq('status', 'enrolled');

      if (enrollments) {
        setCourses(enrollments.map(e => e.courses).filter(Boolean));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchAttendanceData = async () => {
    if (!studentData?.user_id) return;

    setLoading(true);
    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          courses (
            course_name,
            course_code
          )
        `)
        .eq('student_id', studentData.user_id)
        .order('class_date', { ascending: false });

      if (selectedCourse !== 'all') {
        query = query.eq('course_id', selectedCourse);
      }

      const { data: attendance } = await query;

      if (attendance) {
        setAttendanceData(attendance);
        calculateStats(attendance);
        calculateCourseStats(attendance);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (attendance: any[]) => {
    const totalClasses = attendance.length;
    const attendedClasses = attendance.filter(a => a.status === 'present').length;
    const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
    
    let status = 'good';
    if (percentage < 65) status = 'critical';
    else if (percentage < 75) status = 'warning';

    setOverallStats({
      totalClasses,
      attendedClasses,
      percentage,
      status
    });
  };

  const calculateCourseStats = (attendance: any[]) => {
    const courseMap = new Map();

    attendance.forEach(record => {
      const courseId = record.course_id;
      const courseName = record.courses?.course_name || 'Unknown Course';
      const courseCode = record.courses?.course_code || 'N/A';

      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          course_id: courseId,
          course_name: courseName,
          course_code: courseCode,
          total: 0,
          present: 0,
          absent: 0,
          late: 0
        });
      }

      const courseData = courseMap.get(courseId);
      courseData.total++;
      
      switch (record.status) {
        case 'present':
          courseData.present++;
          break;
        case 'absent':
          courseData.absent++;
          break;
        case 'late':
          courseData.late++;
          break;
      }
    });

    const stats = Array.from(courseMap.values()).map(course => ({
      ...course,
      percentage: course.total > 0 ? Math.round((course.present / course.total) * 100) : 0
    }));

    setCourseStats(stats);
  };

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-green-600 bg-green-50';
      case 'absent':
        return 'text-red-600 bg-red-50';
      case 'late':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (percentage: number) => {
    if (percentage >= 75) return 'default';
    if (percentage >= 65) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PermissionWrapper permission="view_attendance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Attendance Overview</h2>
            <p className="text-muted-foreground">Track your class attendance and statistics</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.course_code} - {course.course_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Attendance</p>
                  <p className="text-2xl font-bold">{overallStats.percentage}%</p>
                </div>
                <div className={`p-2 rounded-full ${
                  overallStats.status === 'critical' ? 'bg-red-100' :
                  overallStats.status === 'warning' ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  {overallStats.status === 'critical' ? (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  ) : (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  )}
                </div>
              </div>
              <Progress value={overallStats.percentage} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                <p className="text-2xl font-bold">{overallStats.totalClasses}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Classes Attended</p>
                <p className="text-2xl font-bold text-green-600">{overallStats.attendedClasses}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Classes Missed</p>
                <p className="text-2xl font-bold text-red-600">
                  {overallStats.totalClasses - overallStats.attendedClasses}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Course Summary</TabsTrigger>
            <TabsTrigger value="history">Attendance History</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          {/* Course Summary */}
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course-wise Attendance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {courseStats.map((course, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{course.course_name}</h4>
                      <p className="text-sm text-muted-foreground">{course.course_code}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs">
                        <span className="text-green-600">Present: {course.present}</span>
                        <span className="text-red-600">Absent: {course.absent}</span>
                        <span className="text-yellow-600">Late: {course.late}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusBadgeVariant(course.percentage)}>
                        {course.percentage}%
                      </Badge>
                      <div className="w-24 mt-2">
                        <Progress value={course.percentage} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance History */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceData.slice(0, 20).map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getAttendanceIcon(record.status)}
                        <div>
                          <p className="font-medium">{record.courses?.course_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.class_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge className={getAttendanceStatusColor(record.status)}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Select Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedMonth}
                    onSelect={(date) => date && setSelectedMonth(date)}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Monthly Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Present Days</p>
                      <p className="text-2xl font-bold text-green-600">
                        {attendanceData.filter(a => 
                          a.status === 'present' && 
                          new Date(a.class_date).getMonth() === selectedMonth.getMonth()
                        ).length}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Absent Days</p>
                      <p className="text-2xl font-bold text-red-600">
                        {attendanceData.filter(a => 
                          a.status === 'absent' && 
                          new Date(a.class_date).getMonth() === selectedMonth.getMonth()
                        ).length}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {attendanceData
                      .filter(a => new Date(a.class_date).getMonth() === selectedMonth.getMonth())
                      .slice(0, 10)
                      .map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">
                            {new Date(record.class_date).toLocaleDateString()} - {record.courses?.course_code}
                          </span>
                          {getAttendanceIcon(record.status)}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionWrapper>
  );
};

export default AttendanceOverview;