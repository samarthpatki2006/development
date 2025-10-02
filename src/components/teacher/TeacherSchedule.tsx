import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QRCode from 'qrcode';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Star,
  QrCode as QrCodeIcon,
  Copy,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TeacherScheduleProps {
  teacherData: any;
}

const TeacherSchedule = ({ teacherData }: TeacherScheduleProps) => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [copiedSessionId, setCopiedSessionId] = useState(false);
  const [courseAttendanceStats, setCourseAttendanceStats] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [canGenerateQR, setCanGenerateQR] = useState<boolean>(false);

  const [newSchedule, setNewSchedule] = useState({
    course_id: '',
    day_of_week: 0,
    start_time: '',
    end_time: '',
    room_location: ''
  });

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  useEffect(() => {
    if (teacherData?.user_id) {
      fetchScheduleData();
      fetchTeacherCourses();
    }
  }, [teacherData, currentWeek]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isQRDialogOpen && sessionId) {
      fetchAttendanceForSession();
      interval = setInterval(fetchAttendanceForSession, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isQRDialogOpen, sessionId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isQRDialogOpen && selectedClass) {
        checkTimeValidity(selectedClass);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isQRDialogOpen, selectedClass]);

  const checkTimeValidity = (classData: any) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    if (currentTime >= classData.start_time && currentTime <= classData.end_time) {
      const endTimeParts = classData.end_time.split(':');
      const endDate = new Date();
      endDate.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0, 0);
      
      const remainingMs = endDate.getTime() - now.getTime();
      const remainingMinutes = Math.floor(remainingMs / 60000);
      
      setTimeRemaining(remainingMinutes);
      setCanGenerateQR(true);
    } else {
      setCanGenerateQR(false);
      setTimeRemaining(0);
    }
  };

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchWeeklySchedule(),
        fetchTodayClasses()
      ]);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, course_name, course_code')
        .eq('instructor_id', teacherData.user_id);

      if (!error && data) {
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching teacher courses:', error);
    }
  };

  const fetchWeeklySchedule = async () => {
    try {
      const { data: regularSchedule, error: regularError } = await supabase
        .from('class_schedule')
        .select(`
          *,
          courses (
            id,
            course_name,
            course_code,
            enrollments (count)
          )
        `)
        .eq('courses.instructor_id', teacherData.user_id);

      if (regularError) throw regularError;

      let allScheduleData = [];

      if (regularSchedule) {
        const regularScheduleData = regularSchedule.map(schedule => ({
          ...schedule,
          is_extra_class: false,
          class_type: 'regular'
        }));
        allScheduleData = [...regularScheduleData];
      }

      const weekStart = new Date(currentWeek);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const { data: extraClasses, error: extraError } = await supabase
        .from('extra_class_schedule')
        .select(`
          id,
          course_id,
          teacher_id,
          title,
          description,
          scheduled_date,
          start_time,
          end_time,
          room_location,
          class_type,
          status,
          courses (
            course_name,
            course_code
          )
        `)
        .eq('teacher_id', teacherData.user_id)
        .eq('status', 'scheduled')
        .gte('scheduled_date', weekStart.toISOString().split('T')[0])
        .lte('scheduled_date', weekEnd.toISOString().split('T')[0]);

      if (!extraError && extraClasses && extraClasses.length > 0) {
        const extraScheduleData = extraClasses.map(extraClass => {
          const scheduledDate = new Date(extraClass.scheduled_date);
          return {
            id: extraClass.id,
            day_of_week: scheduledDate.getDay(),
            scheduled_date: extraClass.scheduled_date,
            start_time: extraClass.start_time,
            end_time: extraClass.end_time,
            room_location: extraClass.room_location || '',
            course_id: extraClass.course_id,
            class_type: extraClass.class_type,
            title: extraClass.title,
            description: extraClass.description,
            status: extraClass.status,
            is_extra_class: true,
            courses: {
              id: extraClass.course_id,
              course_name: extraClass.courses?.course_name || extraClass.title,
              course_code: extraClass.courses?.course_code || 'EXTRA',
              enrollments: []
            }
          };
        });
        
        allScheduleData = [...allScheduleData, ...extraScheduleData];
      }

      setSchedule(allScheduleData);

    } catch (error) {
      console.error('Error fetching weekly schedule:', error);
      toast.error('Failed to fetch schedule');
    }
  };

  const fetchTodayClasses = async () => {
    const today = new Date();
    const todayDay = today.getDay();
    
    try {
      const { data: regularClasses, error: regularError } = await supabase
        .from('class_schedule')
        .select(`
          *,
          courses (
            id,
            course_name,
            course_code,
            enrollments (count)
          )
        `)
        .eq('courses.instructor_id', teacherData.user_id)
        .eq('day_of_week', todayDay);

      let allTodayClasses = [];

      if (!regularError && regularClasses) {
        const regularClassesData = regularClasses.map(cls => ({
          ...cls,
          is_extra_class: false,
          class_type: 'regular'
        }));
        allTodayClasses = [...regularClassesData];
      }

      const todayString = today.toISOString().split('T')[0];
      const { data: extraClasses, error: extraError } = await supabase
        .from('extra_class_schedule')
        .select(`
          id,
          course_id,
          teacher_id,
          title,
          description,
          scheduled_date,
          start_time,
          end_time,
          room_location,
          class_type,
          status,
          courses (
            course_name,
            course_code
          )
        `)
        .eq('teacher_id', teacherData.user_id)
        .eq('status', 'scheduled')
        .eq('scheduled_date', todayString);

      if (!extraError && extraClasses && extraClasses.length > 0) {
        const extraClassesData = extraClasses.map(extraClass => ({
          id: extraClass.id,
          day_of_week: todayDay,
          scheduled_date: extraClass.scheduled_date,
          start_time: extraClass.start_time,
          end_time: extraClass.end_time,
          room_location: extraClass.room_location || '',
          course_id: extraClass.course_id,
          class_type: extraClass.class_type,
          title: extraClass.title,
          description: extraClass.description,
          status: extraClass.status,
          is_extra_class: true,
          courses: {
            id: extraClass.course_id,
            course_name: extraClass.courses?.course_name || extraClass.title,
            course_code: extraClass.courses?.course_code || 'EXTRA',
            enrollments: []
          }
        }));
        
        allTodayClasses = [...allTodayClasses, ...extraClassesData];
      }

      allTodayClasses.sort((a, b) => a.start_time.localeCompare(b.start_time));
      setTodayClasses(allTodayClasses);

    } catch (error) {
      console.error('Error fetching today classes:', error);
    }
  };

  const generateQRCode = async (classData: any) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    if (currentTime < classData.start_time || currentTime > classData.end_time) {
      toast.error(`QR code can only be generated between ${formatTime(classData.start_time)} and ${formatTime(classData.end_time)}`);
      return;
    }

    try {
      setSelectedClass(classData);
      
      const today = new Date().toISOString().split('T')[0];
      const sessionData = {
        course_id: classData.course_id,
        instructor_id: teacherData.user_id,
        session_date: classData.scheduled_date || today,
        start_time: classData.start_time,
        end_time: classData.end_time,
        room_location: classData.room_location,
        session_type: classData.is_extra_class ? classData.class_type : 'lecture',
        topic: classData.title || classData.courses?.course_name,
        is_active: true
      };

      const { data: session, error: sessionError } = await supabase
        .from('attendance_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (sessionError) throw sessionError;

      const qrCodeData = `session-${session.id}`;
      
      await supabase
        .from('attendance_sessions')
        .update({ qr_code: qrCodeData })
        .eq('id', session.id);

      const qrDataUrl = await QRCode.toDataURL(qrCodeData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#3b82f6',
          light: '#ffffff',
        },
      });

      setQrCode(qrDataUrl);
      setSessionId(qrCodeData);
      setIsQRDialogOpen(true);
      setAttendanceRecords([]);
      setCourseAttendanceStats([]);
      checkTimeValidity(classData);
      toast.success('QR Code generated successfully!');

      const endTimeParts = classData.end_time.split(':');
      const endDate = new Date();
      endDate.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0, 0);
      const remainingMs = endDate.getTime() - now.getTime();

      setTimeout(async () => {
        await supabase
          .from('attendance_sessions')
          .update({ is_active: false })
          .eq('id', session.id);
        
        if (isQRDialogOpen) {
          toast.info('Session expired. Class time has ended.');
          setIsQRDialogOpen(false);
        }
      }, remainingMs);

    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const fetchAttendanceForSession = async () => {
    if (!sessionId) return;

    try {
      const { data: session } = await supabase
        .from('attendance_sessions')
        .select('id, course_id')
        .eq('qr_code', sessionId)
        .single();

      if (!session) return;

      const { data: attendance, error } = await supabase
        .from('attendance')
        .select(`
          *,
          user_profiles (
            first_name,
            last_name,
            user_code
          )
        `)
        .eq('session_id', session.id)
        .order('marked_at', { ascending: false });

      if (!error && attendance) {
        setAttendanceRecords(attendance);
        
        if (session.course_id) {
          await fetchCourseAttendanceStats(session.course_id, attendance);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchCourseAttendanceStats = async (courseId: string, currentAttendance: any[]) => {
    try {
      const studentIds = currentAttendance.map(a => a.student_id);
      
      if (studentIds.length === 0) return;

      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('course_id', courseId)
        .in('student_id', studentIds);

      if (!attendanceError && attendanceData) {
        const statsMap = new Map();
        
        attendanceData.forEach(record => {
          if (!statsMap.has(record.student_id)) {
            statsMap.set(record.student_id, { present: 0, total: 0 });
          }
          const stats = statsMap.get(record.student_id);
          stats.total += 1;
          if (record.status === 'present') {
            stats.present += 1;
          }
        });

        const stats = Array.from(statsMap.entries()).map(([studentId, data]: [string, any]) => ({
          student_id: studentId,
          present_count: data.present,
          total_count: data.total,
          percentage: data.total > 0 ? ((data.present / data.total) * 100).toFixed(1) : '0.0'
        }));

        setCourseAttendanceStats(stats);
      }
    } catch (error) {
      console.error('Error fetching course attendance stats:', error);
    }
  };

  const getAttendancePercentage = (studentId: string) => {
    const stats = courseAttendanceStats.find(s => s.student_id === studentId);
    return stats ? stats.percentage : '0.0';
  };

  const getAttendanceColor = (percentage: string) => {
    const percent = parseFloat(percentage);
    if (percent >= 75) return 'text-green-600';
    if (percent >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopiedSessionId(true);
    toast.success('Session ID copied to clipboard');
    setTimeout(() => setCopiedSessionId(false), 2000);
  };

  const getWeekDays = (startDate: Date) => {
    const week = [];
    const start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getClassesForDay = (dayOfWeek: number, specificDate?: Date) => {
    return schedule.filter(cls => {
      if (cls.is_extra_class && cls.scheduled_date && specificDate) {
        const classDate = new Date(cls.scheduled_date);
        return classDate.toDateString() === specificDate.toDateString();
      }
      return cls.day_of_week === dayOfWeek;
    });
  };

  const getClassTypeStyle = (cls: any) => {
    if (!cls.is_extra_class) {
      return 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20';
    }
    
    switch (cls.class_type) {
      case 'extra':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'remedial':
        return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
      case 'makeup':
        return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
      case 'special':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isClassActive = (classItem: any) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    return currentTime >= classItem.start_time && currentTime <= classItem.end_time;
  };

  const createSchedule = async () => {
    try {
      if (!newSchedule.course_id || !newSchedule.start_time || !newSchedule.end_time) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (newSchedule.start_time >= newSchedule.end_time) {
        toast.error('End time must be after start time');
        return;
      }

      const { error } = await supabase
        .from('class_schedule')
        .insert([{
          course_id: newSchedule.course_id,
          day_of_week: parseInt(newSchedule.day_of_week.toString()),
          start_time: newSchedule.start_time,
          end_time: newSchedule.end_time,
          room_location: newSchedule.room_location || null
        }]);

      if (error) throw error;

      toast.success('Class scheduled successfully');

      setNewSchedule({
        course_id: '',
        day_of_week: 0,
        start_time: '',
        end_time: '',
        room_location: ''
      });

      setIsScheduleDialogOpen(false);
      await fetchScheduleData();

    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to schedule class. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Schedule</h2>
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Schedule Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule New Class</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Course *</label>
                <select
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  value={newSchedule.course_id}
                  onChange={(e) => setNewSchedule({...newSchedule, course_id: e.target.value})}
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_code} - {course.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Day of Week *</label>
                <select
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  value={newSchedule.day_of_week}
                  onChange={(e) => setNewSchedule({...newSchedule, day_of_week: parseInt(e.target.value)})}
                >
                  {daysOfWeek.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time *</label>
                  <Input
                    type="time"
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule({...newSchedule, start_time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time *</label>
                  <Input
                    type="time"
                    value={newSchedule.end_time}
                    onChange={(e) => setNewSchedule({...newSchedule, end_time: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Room Location</label>
                <Input
                  placeholder="e.g., Room 101, Lab A"
                  value={newSchedule.room_location}
                  onChange={(e) => setNewSchedule({...newSchedule, room_location: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={createSchedule} 
                  className="flex-1"
                  disabled={!newSchedule.course_id || !newSchedule.start_time || !newSchedule.end_time}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Class
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsScheduleDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attendance QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {!canGenerateQR ? (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Class time has ended. QR code is no longer active.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-blue-200 bg-blue-50">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Session will expire in {timeRemaining} minutes (at {formatTime(selectedClass?.end_time)})
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col items-center gap-4 p-6 bg-muted/50 rounded-lg">
              <div className="bg-white p-4 rounded-lg shadow-md">
                {qrCode && <img src={qrCode} alt="Attendance QR Code" className="w-[300px] h-[300px]" />}
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">
                  Session ID: <span className="font-mono text-primary">{sessionId}</span>
                </p>
                <Button variant="outline" size="sm" onClick={copySessionId}>
                  {copiedSessionId ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copiedSessionId ? 'Copied!' : 'Copy Session ID'}
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Live Attendance ({attendanceRecords.length})
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {attendanceRecords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Waiting for students to mark attendance...
                  </p>
                ) : (
                  attendanceRecords.map((record, index) => {
                    const attendancePercentage = getAttendancePercentage(record.student_id);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {record.user_profiles?.first_name} {record.user_profiles?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {record.user_profiles?.user_code}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-medium">
                            {new Date(record.marked_at).toLocaleTimeString()}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {record.status}
                            </Badge>
                            <span className={`text-xs font-semibold ${getAttendanceColor(attendancePercentage)}`}>
                              {attendancePercentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weekly Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Schedule Timeline
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {currentWeek.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-2">
            <div className="space-y-2">
              <div className="h-12"></div>
              {timeSlots.map(time => (
                <div key={time} className="h-16 text-xs text-muted-foreground flex items-center justify-end pr-2">
                  {time}
                </div>
              ))}
            </div>

            {getWeekDays(currentWeek).map((date, dayIndex) => (
              <div key={dayIndex} className="space-y-2">
                <div className={`h-12 text-center p-2 rounded-lg ${
                  isToday(date) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <div className="text-sm font-medium">{daysOfWeek[dayIndex]}</div>
                  <div className="text-xs">{date.getDate()}</div>
                </div>
                
                {timeSlots.map((timeSlot, timeIndex) => {
                  const dayClasses = getClassesForDay(dayIndex, date);
                  const classAtTime = dayClasses.find(cls => {
                    const startTime = formatTime(cls.start_time);
                    return startTime === timeSlot;
                  });

                  return (
                    <div key={timeIndex} className="h-16 border rounded">
                      {classAtTime && (
                        <div 
                          className={`p-1 rounded text-xs h-full border transition-colors cursor-pointer ${getClassTypeStyle(classAtTime)}`}
                          onClick={() => generateQRCode(classAtTime)}
                        >
                          <div className="font-medium truncate flex items-center">
                            {classAtTime.is_extra_class && (
                              <Star className="h-2 w-2 mr-1 flex-shrink-0" />
                            )}
                            <span className="truncate">{classAtTime.courses?.course_code}</span>
                          </div>
                          <div className="text-xs opacity-80 truncate">
                            {classAtTime.room_location}
                          </div>
                          <div className="text-xs opacity-70 truncate flex items-center">
                            <QrCodeIcon className="h-2 w-2 mr-1" />
                            Click for QR
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Classes ({new Date().toLocaleDateString()})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayClasses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No classes scheduled for today</p>
          ) : (
            <div className="space-y-4">
              {todayClasses.map((classItem) => {
                const isActive = isClassActive(classItem);
                return (
                  <Card key={classItem.id} className={`p-4 ${
                    classItem.is_extra_class ? 'border-l-4 border-l-blue-500' : ''
                  } ${isActive ? 'ring-2 ring-primary' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-center">
                          <div className="text-lg font-bold text-primary">
                            {formatTime(classItem.start_time)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatTime(classItem.end_time)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{classItem.courses?.course_name}</h3>
                            {classItem.is_extra_class && (
                              <Badge variant="secondary" className="text-xs capitalize flex items-center">
                                <Star className="h-3 w-3 mr-1" />
                                {classItem.class_type}
                              </Badge>
                            )}
                            {isActive && (
                              <Badge className="text-xs bg-green-600">
                                <Clock className="h-3 w-3 mr-1" />
                                Active Now
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {classItem.courses?.course_code}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {classItem.room_location || 'Room TBD'}
                            </div>
                            {!classItem.is_extra_class && (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {classItem.courses?.enrollments?.[0]?.count || 0} students
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => generateQRCode(classItem)}
                        disabled={!isActive}
                        variant={isActive ? 'default' : 'outline'}
                      >
                        <QrCodeIcon className="h-4 w-4 mr-2" />
                        {isActive ? 'Generate QR' : 'Not Active'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherSchedule;