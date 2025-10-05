import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, AlertTriangle, Camera, X, ScanLine } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';

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
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // QR Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [isMarked, setIsMarked] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-reader-student';

  useEffect(() => {
    if (studentData?.user_id) {
      fetchAttendanceData();
      fetchCourses();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [studentData, selectedCourse]);

  const fetchCourses = async () => {
    if (!studentData?.user_id) return;

    try {
      const { data: enrollments, error } = await supabase
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

      if (error) throw error;

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

      const { data: attendance, error } = await query;

      if (error) throw error;

      if (attendance) {
        setAttendanceData(attendance);
        calculateStats(attendance);
        calculateCourseStats(attendance);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance data');
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

  const startScanner = async () => {
    try {
      setIsScanning(true);
      
      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const html5QrCode = new Html5Qrcode(scannerDivId);
      scannerRef.current = html5QrCode;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        throw new Error('No cameras found on this device');
      }

      const cameraId = cameras.length > 1 ? cameras[cameras.length - 1].id : cameras[0].id;

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          setQrCodeInput(decodedText);
          stopScanner();
          toast.success('QR Code scanned successfully!');
        },
        () => {}
      );
    } catch (error: any) {
      console.error('Scanner error:', error);
      let errorMessage = 'Failed to start camera. Please check permissions.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setIsScanning(false);
      scannerRef.current = null;
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  };

  const handleMarkAttendance = async () => {
    if (!qrCodeInput.trim()) {
      toast.error('Please scan or enter session ID');
      return;
    }

    if (!studentData?.user_id) {
      toast.error('Student data not found');
      return;
    }

    try {
      // Verify session exists
      const { data: session, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('qr_code', qrCodeInput)
        .single();

      if (sessionError || !session) {
        toast.error('Invalid session ID');
        return;
      }

      // Check if student is enrolled in the course
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', studentData.user_id)
        .eq('course_id', session.course_id)
        .eq('status', 'enrolled')
        .single();

      if (enrollmentError || !enrollment) {
        toast.error('You are not enrolled in this course');
        return;
      }

      // Check if already marked
      const { data: existing } = await supabase
        .from('attendance')
        .select('id, status')
        .eq('session_id', session.id)
        .eq('student_id', studentData.user_id)
        .single();

      if (existing) {
        toast.error(`Attendance already marked as ${existing.status} for this session`);
        return;
      }

      // Determine if attendance is late
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const isLate = currentTime > session.end_time;
      const attendanceStatus = isLate ? 'late' : 'present';

      // Mark attendance
      const { error: insertError } = await supabase
        .from('attendance')
        .insert({
          course_id: session.course_id,
          student_id: studentData.user_id,
          class_date: session.session_date,
          status: attendanceStatus,
          session_id: session.id,
          marked_by: studentData.user_id,
          location_verified: false,
          device_info: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        });

      if (insertError) throw insertError;

      if (isLate) {
        toast.warning('Attendance marked as LATE - You scanned after class time');
      } else {
        toast.success('Attendance marked successfully!');
      }
      
      setIsMarked(true);
      
      // Refresh attendance data
      await fetchAttendanceData();

      // Reset after 3 seconds
      setTimeout(() => {
        setQrCodeInput('');
        setIsMarked(false);
      }, 3000);

    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance. Please try again.');
    }
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Attendance Overview</h2>
          <p className="text-muted-foreground">Track your class attendance and statistics</p>
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map(course => (
              <SelectItem key={course.id} value={course.id}>
                {course.course_code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <Tabs defaultValue="mark" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="summary">Course Summary</TabsTrigger>
          <TabsTrigger value="history">Attendance History</TabsTrigger>
        </TabsList>

        {/* Mark Attendance Tab */}
        <TabsContent value="mark">
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ScanLine className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Mark Attendance</h2>
                <p className="text-muted-foreground">Scan or enter the QR code session ID</p>
              </div>
            </div>

            {isMarked ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center mb-4 animate-in zoom-in">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">Attendance Marked!</h3>
                <p className="text-muted-foreground">You're all set for today</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="qrCode" className="flex items-center gap-2">
                    <ScanLine className="h-4 w-4" />
                    QR Code Session ID
                  </Label>
                  
                  {isScanning ? (
                    <div className="space-y-4">
                      <div 
                        id={scannerDivId}
                        className="rounded-lg overflow-hidden border-2 border-primary"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={stopScanner}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Scanning
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <Input
                          id="qrCode"
                          placeholder="Scan or paste session ID here"
                          value={qrCodeInput}
                          onChange={(e) => setQrCodeInput(e.target.value)}
                          className="h-12 font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={startScanner}
                          className="h-12 px-6"
                        >
                          <Camera className="h-5 w-5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click the camera icon to scan QR code or enter session ID manually
                      </p>
                    </>
                  )}
                </div>

                <Button 
                  onClick={handleMarkAttendance}
                  size="lg" 
                  className="w-full h-12"
                  disabled={!qrCodeInput.trim()}
                >
                  Submit Attendance
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Course Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course-wise Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {courseStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No attendance data available</p>
              ) : (
                courseStats.map((course, index) => (
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
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No attendance records found</p>
                ) : (
                  attendanceData.slice(0, 20).map((record, index) => (
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
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default AttendanceOverview;