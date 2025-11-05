import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Edit,
  AlertCircle
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
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [selectedCourseAnalytics, setSelectedCourseAnalytics] = useState<string>('');
  const [courseAnalytics, setCourseAnalytics] = useState<any[]>([]);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [minutesSinceStart, setMinutesSinceStart] = useState<number>(0);
  const [teacherCourseIds, setTeacherCourseIds] = useState<string[]>([]);

  const [newSchedule, setNewSchedule] = useState({
    course_id: '',
    day_of_week: 0,
    start_time: '',
    end_time: '',
    room_location: ''
  });

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

  useEffect(() => {
    if (teacherData?.user_id) {
      fetchTeacherCourses();
    }
  }, [teacherData]);

  useEffect(() => {
    if (teacherData?.user_id) {
      fetchScheduleData();
    }
  }, [teacherData, currentWeek, teacherCourseIds]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isQRDialogOpen && currentSessionId) {
      fetchAttendanceForSession();
      interval = setInterval(fetchAttendanceForSession, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isQRDialogOpen, currentSessionId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isQRDialogOpen && selectedClass) {
        checkTimeValidity(selectedClass);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isQRDialogOpen, selectedClass]);

  useEffect(() => {
    if (selectedCourseAnalytics) {
      fetchCourseAnalytics(selectedCourseAnalytics);
    }
  }, [selectedCourseAnalytics]);

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const generateSessionCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const checkTimeValidity = (classData: any) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    if (currentTime >= classData.start_time && currentTime <= classData.end_time) {
      const startTimeParts = classData.start_time.split(':');
      const startDate = new Date();
      startDate.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]), 0, 0);
      
      const elapsedMs = now.getTime() - startDate.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      setMinutesSinceStart(elapsedMinutes);

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
      setMinutesSinceStart(0);
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
        .eq('instructor_id', teacherData.user_id)
        .eq('is_active', true);

      if (error) throw error;

      if (data) {
        setCourses(data);
        setTeacherCourseIds(data.map(c => c.id));
      }
    } catch (error) {
      console.error('Error fetching teacher courses:', error);
      toast.error('Failed to fetch your courses');
    }
  };

  const fetchWeeklySchedule = async () => {
    try {
      if (teacherCourseIds.length === 0) {
        setSchedule([]);
        return;
      }

      const { data: regularSchedule, error: regularError } = await supabase
        .from('class_schedule')
        .select(`
          *,
          courses (
            id,
            course_name,
            course_code,
            instructor_id,
            enrollments (count)
          )
        `)
        .in('course_id', teacherCourseIds);

      if (regularError) throw regularError;

      let allScheduleData = [];

      if (regularSchedule) {
        const regularScheduleData = regularSchedule
          .filter(schedule => schedule.courses?.instructor_id === teacherData.user_id)
          .map(schedule => ({
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
            course_code,
            instructor_id
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
              instructor_id: extraClass.teacher_id,
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
      if (teacherCourseIds.length === 0) {
        setTodayClasses([]);
        return;
      }

      const { data: regularClasses, error: regularError } = await supabase
        .from('class_schedule')
        .select(`
          *,
          courses (
            id,
            course_name,
            course_code,
            instructor_id,
            enrollments (count)
          )
        `)
        .in('course_id', teacherCourseIds)
        .eq('day_of_week', todayDay);

      let allTodayClasses = [];

      if (!regularError && regularClasses) {
        const regularClassesData = regularClasses
          .filter(cls => cls.courses?.instructor_id === teacherData.user_id)
          .map(cls => ({
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
            course_code,
            instructor_id
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
            instructor_id: extraClass.teacher_id,
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
    try {
      // Verify teacher owns this course
      if (!teacherCourseIds.includes(classData.course_id)) {
        toast.error('You are not authorized to generate QR code for this course');
        return;
      }

      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      
      if (currentTime < classData.start_time) {
        toast.error('Cannot generate QR code before class starts');
        return;
      }

      if (currentTime > classData.end_time) {
        toast.error('Class has already ended. Cannot generate QR code');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const sessionDate = classData.scheduled_date || today;

      const { data: existingSession } = await supabase
        .from('attendance_sessions')
        .select('id, qr_code, is_active')
        .eq('course_id', classData.course_id)
        .eq('session_date', sessionDate)
        .eq('start_time', classData.start_time)
        .eq('instructor_id', teacherData.user_id)
        .single();

      let session;
      let qrCodeData;

      if (existingSession) {
        session = existingSession;
        qrCodeData = existingSession.qr_code;
        
        await supabase
          .from('attendance_sessions')
          .update({ is_active: true })
          .eq('id', existingSession.id);
        
        toast.info('Reopening existing session');
      } else {
        let sessionCode;
        let isUnique = false;
        
        while (!isUnique) {
          sessionCode = generateSessionCode();
          
          const { data: existingCode } = await supabase
            .from('attendance_sessions')
            .select('id')
            .eq('qr_code', sessionCode)
            .eq('session_date', sessionDate)
            .single();
          
          if (!existingCode) {
            isUnique = true;
          }
        }

        const sessionData = {
          course_id: classData.course_id,
          instructor_id: teacherData.user_id,
          session_date: sessionDate,
          start_time: classData.start_time,
          end_time: classData.end_time,
          session_type: classData.is_extra_class ? classData.class_type : 'lecture',
          topic: classData.title || classData.courses?.course_name,
          qr_code: sessionCode,
          is_active: true,
          room_location: classData.room_location
        };

        const { data: newSession, error: sessionError } = await supabase
          .from('attendance_sessions')
          .insert(sessionData)
          .select()
          .single();

        if (sessionError) throw sessionError;

        qrCodeData = sessionCode;
        session = newSession;
        toast.success('QR Code generated! Session is now active.');
      }

      setSelectedClass(classData);
      setCurrentSessionId(session.id);

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
      
      setTimeout(() => fetchAttendanceForSession(), 500);

      const endTimeParts = classData.end_time.split(':');
      const endDate = new Date();
      endDate.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0, 0);
      const remainingMs = endDate.getTime() - now.getTime();

      if (remainingMs > 0) {
        setTimeout(async () => {
          await closeSession(session.id, classData.course_id, sessionDate);
        }, remainingMs);
      }

    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast.error(error.message || 'Failed to generate QR code');
    }
  };

  const closeSession = async (sessionId: string, courseId: string, sessionDate: string) => {
    try {
      await supabase
        .from('attendance_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      const { data: attendedStudents } = await supabase
        .from('attendance')
        .select('student_id')
        .eq('session_id', sessionId);

      const attendedIds = new Set((attendedStudents || []).map(a => a.student_id));

      const { data: enrolledStudents } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('course_id', courseId)
        .eq('status', 'enrolled');

      const absentStudents = (enrolledStudents || [])
        .filter(e => !attendedIds.has(e.student_id))
        .map(e => ({
          course_id: courseId,
          student_id: e.student_id,
          class_date: sessionDate,
          status: 'absent',
          session_id: sessionId,
          marked_by: teacherData.user_id,
          marked_at: new Date().toISOString()
        }));

      if (absentStudents.length > 0) {
        await supabase
          .from('attendance')
          .insert(absentStudents);
      }

      if (isQRDialogOpen) {
        toast.info(`Session closed. ${absentStudents.length} students marked absent.`);
        await fetchAttendanceForSession();
      }
    } catch (error) {
      console.error('Error closing session:', error);
    }
  };

  const fetchAttendanceForSession = async () => {
    if (!currentSessionId || !selectedClass?.course_id) return;

    try {
      const { data: attendance, error: attError } = await supabase
        .from('attendance')
        .select(`
          student_id,
          status,
          marked_at,
          session_id,
          device_info,
          user_profiles!attendance_student_id_fkey (
            id,
            first_name,
            last_name,
            user_code
          )
        `)
        .eq('session_id', currentSessionId)
        .order('marked_at', { ascending: false });

      if (attError) throw attError;

      const { data: allEnrolled, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          user_profiles!enrollments_student_id_fkey (
            id,
            first_name,
            last_name,
            user_code
          )
        `)
        .eq('course_id', selectedClass.course_id)
        .eq('status', 'enrolled');

      if (enrollError) throw enrollError;

      const allStudentsWithStatus = (allEnrolled || []).map(enrollment => {
        const attendanceRecord = (attendance || []).find(a => a.student_id === enrollment.student_id);

        return {
          student_id: enrollment.student_id,
          user_profiles: enrollment.user_profiles,
          status: attendanceRecord?.status || 'waiting',
          marked_at: attendanceRecord?.marked_at || null,
          session_id: currentSessionId,
          device_info: attendanceRecord?.device_info
        };
      });

      setAttendanceRecords(allStudentsWithStatus);
      
      if (attendance && attendance.length > 0) {
        await fetchCourseAttendanceStats(selectedClass.course_id, attendance);
      }
    } catch (error) {
      console.error('Error in fetchAttendanceForSession:', error);
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
            statsMap.set(record.student_id, { present: 0, late: 0, total: 0 });
          }
          const stats = statsMap.get(record.student_id);
          stats.total += 1;
          if (record.status === 'present') {
            stats.present += 1;
          } else if (record.status === 'late') {
            stats.late += 1;
          }
        });

        const stats = Array.from(statsMap.entries()).map(([studentId, data]: [string, any]) => {
          const effectivePresent = data.present + (data.late * 0.5);
          return {
            student_id: studentId,
            present_count: data.present,
            late_count: data.late,
            total_count: data.total,
            percentage: data.total > 0 ? ((effectivePresent / data.total) * 100).toFixed(1) : '0.0'
          };
        });

        setCourseAttendanceStats(stats);
      }
    } catch (error) {
      console.error('Error fetching course attendance stats:', error);
    }
  };

  const fetchCourseAnalytics = async (courseId: string) => {
    try {
      // Verify teacher owns this course
      if (!teacherCourseIds.includes(courseId)) {
        toast.error('You are not authorized to view analytics for this course');
        return;
      }

      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          user_profiles (
            id,
            first_name,
            last_name,
            user_code
          )
        `)
        .eq('course_id', courseId)
        .eq('status', 'enrolled');

      if (enrollError) throw enrollError;

      const { data: attendanceData, error: attError } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('course_id', courseId);

      if (attError) throw attError;

      const statsMap = new Map();

      (enrollments || []).forEach(enrollment => {
        statsMap.set(enrollment.student_id, {
          student_id: enrollment.student_id,
          user_profiles: enrollment.user_profiles,
          present: 0,
          late: 0,
          absent: 0,
          total: 0
        });
      });

      (attendanceData || []).forEach(record => {
        if (statsMap.has(record.student_id)) {
          const stats = statsMap.get(record.student_id);
          stats.total += 1;
          if (record.status === 'present') stats.present += 1;
          else if (record.status === 'late') stats.late += 1;
          else if (record.status === 'absent') stats.absent += 1;
        }
      });

      const analytics = Array.from(statsMap.values()).map(stats => {
        const effectivePresent = stats.present + (stats.late * 0.5);
        return {
          ...stats,
          percentage: stats.total > 0 ? ((effectivePresent / stats.total) * 100).toFixed(1) : '0.0'
        };
      }).sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));

      setCourseAnalytics(analytics);
    } catch (error) {
      console.error('Error fetching course analytics:', error);
      toast.error('Failed to load analytics');
    }
  };

  const updateStudentAttendance = async (studentId: string, newStatus: 'late') => {
    if (!currentSessionId) return;

    try {
      const { data: existing } = await supabase
        .from('attendance')
        .select('id, status')
        .eq('session_id', currentSessionId)
        .eq('student_id', studentId)
        .single();

      if (existing && existing.status === 'absent') {
        const { error } = await supabase
          .from('attendance')
          .update({ 
            status: newStatus,
            marked_by: teacherData.user_id,
            marked_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;

        toast.success('Attendance updated to late');
        await fetchAttendanceForSession();
        setEditingStudent(null);
      } else {
        toast.error('Can only change absent to late');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'border-green-300 text-green-700';
      case 'late':
        return 'border-yellow-300 text-yellow-700';
      case 'absent':
        return 'border-red-300 text-red-700';
      default:
        return 'border-gray-300 text-gray-700';
    }
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

      // Verify teacher owns this course
      if (!teacherCourseIds.includes(newSchedule.course_id)) {
        toast.error('You can only schedule classes for your assigned courses');
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

  const canGenerateQRForClass = (classItem: any) => {
    // Verify teacher owns this course
    if (!teacherCourseIds.includes(classItem.course_id)) {
      return false;
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    return currentTime >= classItem.start_time && currentTime <= classItem.end_time;
  };

  const getClassPosition = (startTime: string, endTime: string) => {
    const dayStartMinutes = 0 * 60;
    const dayEndMinutes = 24 * 60;
    const totalMinutes = dayEndMinutes - dayStartMinutes;
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const duration = endMinutes - startMinutes;
    
    const topPercent = ((startMinutes - dayStartMinutes) / totalMinutes) * 100;
    const heightPercent = (duration / totalMinutes) * 100;
    
    return {
      top: `${Math.max(0, topPercent)}%`,
      height: `${Math.max(3, heightPercent)}%`
    };
  };

  const generateTimeLabels = () => {
    const labels = [];
    for (let hour = 0; hour < 25; hour++) {
      labels.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        display: formatTime(`${hour.toString().padStart(2, '0')}:00`)
      });
    }
    return labels;
  };

  const hasNoCourses = courses.length === 0 && !loading;

  if (loading && courses.length === 0) {
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
      {hasNoCourses && (
        <Alert>
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            You don't have any courses assigned yet. Once courses are assigned to you, they will appear here.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="schedule" className="space-y-4">

        <TabsContent value="schedule" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-bold">My Schedule</h2>
          </div>

          <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] mt-2 overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">Attendance Session - {selectedClass?.courses?.course_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {!canGenerateQR ? (
                  <Alert className="border-red-200">
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Class has ended. Session is now closed.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className={minutesSinceStart <= 10 ? '' : ''}>
                    <CheckCircle className={`h-4 w-4 ${minutesSinceStart <= 10 ? '' : ''}`} />
                    <AlertDescription className={minutesSinceStart <= 10 ? '' : ''}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span>
                          Session active • {timeRemaining} min remaining
                          {minutesSinceStart <= 10 ? (
                            <> • {10 - minutesSinceStart} min left for full credit</>
                          ) : (
                            <> • Late period (0.5x credit)</>
                          )}
                        </span>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col items-center gap-4 p-4 sm:p-6 bg-muted/50 rounded-lg">
                  <div className="p-4 rounded-lg shadow-md">
                    {qrCode && <img src={qrCode} alt="Attendance QR Code" className="w-[200px] h-[200px] sm:w-[300px] sm:h-[300px]" />}
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xs sm:text-sm font-medium">
                      Session Code: <span className="font-mono text-primary text-2xl font-bold tracking-wider">{sessionId}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Students can scan QR or enter this 6-character code
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      <span className="font-medium">
                        First 10 min = Present | After 10 min = Late (0.5x)
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={copySessionId}>
                      {copiedSessionId ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copiedSessionId ? 'Copied!' : 'Copy Code'}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    Live Attendance ({attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length} / {attendanceRecords.length})
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {attendanceRecords.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        Loading student list...
                      </p>
                    ) : (
                      attendanceRecords.map((record, index) => {
                        const attendancePercentage = getAttendancePercentage(record.student_id);
                        const isMarked = record.status !== 'waiting';
                        return (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isMarked ? getStatusColor(record.status) : 'border-muted bg-background'
                            }`}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm sm:text-base">
                                {record.user_profiles?.first_name} {record.user_profiles?.last_name}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                ID: {record.user_profiles?.user_code}
                              </p>
                            </div>
                            <div className="text-right space-y-1 flex items-center gap-2 sm:gap-3">
                              {isMarked ? (
                                <>
                                  <div>
                                    <p className="text-xs sm:text-sm font-medium">
                                      {new Date(record.marked_at).toLocaleTimeString()}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {record.status}
                                        {record.status === 'late' && ' (0.5x)'}
                                      </Badge>
                                      <span className={`text-xs font-semibold ${getAttendanceColor(attendancePercentage)}`}>
                                        {attendancePercentage}%
                                      </span>
                                    </div>
                                  </div>
                                  {record.status === 'absent' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        if (editingStudent === record.student_id) {
                                          updateStudentAttendance(record.student_id, 'late');
                                        } else {
                                          setEditingStudent(record.student_id);
                                        }
                                      }}
                                      className="h-8"
                                    >
                                      {editingStudent === record.student_id ? (
                                        <>
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Confirm
                                        </>
                                      ) : (
                                        <>
                                          <Edit className="h-3 w-3 mr-1" />
                                          Late
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">
                                  Waiting...
                                </Badge>
                              )}
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

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Weekly Schedule Timeline
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs sm:text-sm font-medium min-w-[100px] sm:min-w-[140px] text-center">
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
              {hasNoCourses ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Schedule Available</p>
                  <p className="text-sm">Your schedule will appear here once courses are assigned to you.</p>
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-2 min-h-[800px]">
                  <div className="space-y-0 relative">
                    <div className="h-12"></div>
                    <div className="relative" style={{ height: 'calc(100% - 48px)' }}>
                      {generateTimeLabels().map((label, index) => (
                        <div 
                          key={label.time}
                          className="absolute text-xs text-muted-foreground w-full pr-2 text-right"
                          style={{ 
                            top: `${(index / (generateTimeLabels().length - 1)) * 100}%`,
                            transform: 'translateY(-50%)'
                          }}
                        >
                          {label.display}
                        </div>
                      ))}
                    </div>
                  </div>

                  {getWeekDays(currentWeek).map((date, dayIndex) => (
                    <div key={dayIndex} className="space-y-2">
                      <div className={`h-12 text-center p-2 rounded-lg ${
                        isToday(date) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <div className="text-sm font-medium">{daysOfWeek[dayIndex]}</div>
                        <div className="text-xs">{date.getDate()}</div>
                      </div>
                      
                      <div className="relative border rounded-lg" style={{ height: 'calc(100% - 56px)', minHeight: '700px' }}>
                        {generateTimeLabels().map((_, index) => (
                          <div 
                            key={index}
                            className="absolute w-full border-t border-muted"
                            style={{ top: `${(index / (generateTimeLabels().length - 1)) * 100}%` }}
                          />
                        ))}
                        
                        {getClassesForDay(dayIndex, date).map((cls, clsIndex) => {
                          const position = getClassPosition(cls.start_time, cls.end_time);
                          const active = isClassActive(cls);
                          return (
                            <div 
                              key={clsIndex}
                              className={`absolute left-1 right-1 p-2 rounded text-xs border overflow-hidden cursor-pointer transition-all ${getClassTypeStyle(cls)} ${
                                active ? 'ring-2 ring-offset-1' : ''
                              }`}
                              style={position}
                              onClick={() => generateQRCode(cls)}
                            >
                              <div className="font-medium truncate flex items-center">
                                {cls.is_extra_class && (
                                  <Star className="h-2 w-2 mr-1 flex-shrink-0" />
                                )}
                                <span className="truncate">{cls.courses?.course_code}</span>
                              </div>
                              <div className="text-xs opacity-80 truncate">
                                {formatTime(cls.start_time)}
                              </div>
                              <div className="text-xs opacity-80 truncate">
                                {cls.room_location}
                              </div>
                              {cls.is_extra_class && (
                                <div className="text-xs opacity-70 truncate capitalize">
                                  {cls.class_type}
                                </div>
                              )}
                              {active && (
                                <div className="text-xs font-semibold text-green-600 mt-1">
                                  ACTIVE
                                </div>
                              )}
                              <div className="text-xs opacity-70 truncate flex items-center mt-1">
                                <QrCodeIcon className="h-2 w-2 mr-1" />
                                Click for QR
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Today's Classes ({new Date().toLocaleDateString()})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayClasses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {hasNoCourses ? 'No courses assigned yet' : 'No classes scheduled for today'}
                </p>
              ) : (
                <div className="space-y-4">
                  {todayClasses.map((classItem) => {
                    const isActive = isClassActive(classItem);
                    return (
                      <Card key={classItem.id} className={`p-3 sm:p-4 ${
                        classItem.is_extra_class ? 'border-l-4' : ''
                      } ${isActive ? 'ring-2 ring-primary' : ''}`}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full">
                            <div className="text-center">
                              <div className="text-base sm:text-lg font-bold text-primary">
                                {formatTime(classItem.start_time)}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                {formatTime(classItem.end_time)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 flex-wrap">
                                <h3 className="font-semibold text-base sm:text-lg">{classItem.courses?.course_name}</h3>
                                {classItem.is_extra_class && (
                                  <Badge variant="secondary" className="text-xs capitalize flex items-center">
                                    <Star className="h-3 w-3 mr-1" />
                                    {classItem.class_type}
                                  </Badge>
                                )}
                                {isActive && (
                                  <Badge className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Active Now
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {classItem.courses?.course_code}
                              </p>
                              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {classItem.room_location || 'Room TBD'}
                                </div>
                                {!classItem.is_extra_class && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                                    {classItem.courses?.enrollments?.[0]?.count || 0} students
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button 
                            onClick={() => generateQRCode(classItem)}
                            variant="default"
                            disabled={!canGenerateQRForClass(classItem)}
                          >
                            <QrCodeIcon className="h-4 w-4 mr-2" />
                            {canGenerateQRForClass(classItem) ? 'Generate QR' : 'Not Started'}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherSchedule;