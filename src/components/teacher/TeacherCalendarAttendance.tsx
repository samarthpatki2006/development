
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface TeacherCalendarAttendanceProps {
  teacherData: any;
}

const TeacherCalendarAttendance = ({ teacherData }: TeacherCalendarAttendanceProps) => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [absenceRequests, setAbsenceRequests] = useState<any[]>([]);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchScheduleAndRequests();
  }, [teacherData]);

  const fetchScheduleAndRequests = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchWeeklySchedule(),
        fetchAbsenceRequests()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklySchedule = async () => {
    const { data, error } = await supabase
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

    if (!error && data) {
      setSchedule(data);
    }
  };

  const fetchAbsenceRequests = async () => {
    const { data, error } = await supabase
      .from('absence_requests')
      .select(`
        *,
        user_profiles!absence_requests_student_id_fkey (
          first_name,
          last_name
        ),
        courses (
          course_name
        )
      `)
      .eq('courses.instructor_id', teacherData.user_id)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    if (!error && data) {
      setAbsenceRequests(data);
    }
  };

  const fetchAttendanceForClass = async (classItem: any, date: string) => {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        user_profiles!attendance_student_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('course_id', classItem.course_id)
      .eq('class_date', date);

    if (!error && data) {
      setAttendanceData(data);
    } else {
      // If no attendance data exists, create from enrollments
      await createAttendanceFromEnrollments(classItem.course_id, date);
    }
  };

  const createAttendanceFromEnrollments = async (courseId: string, date: string) => {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        student_id,
        user_profiles!enrollments_student_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('course_id', courseId)
      .eq('status', 'enrolled');

    if (enrollments) {
      const attendanceRecords = enrollments.map(enrollment => ({
        course_id: courseId,
        student_id: enrollment.student_id,
        class_date: date,
        status: 'present',
        marked_by: teacherData.user_id,
        user_profiles: enrollment.user_profiles
      }));

      setAttendanceData(attendanceRecords);
    }
  };

  const handleMarkAttendance = async (classItem: any) => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedClass(classItem);
    await fetchAttendanceForClass(classItem, today);
    setShowAttendanceModal(true);
  };

  const updateAttendanceStatus = (studentId: string, status: string) => {
    setAttendanceData(prev => 
      prev.map(record => 
        record.student_id === studentId 
          ? { ...record, status }
          : record
      )
    );
  };

  const saveAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      for (const record of attendanceData) {
        const { error } = await supabase
          .from('attendance')
          .upsert({
            course_id: selectedClass.course_id,
            student_id: record.student_id,
            class_date: today,
            status: record.status,
            marked_by: teacherData.user_id,
            marked_at: new Date().toISOString()
          }, {
            onConflict: 'course_id,student_id,class_date'
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Attendance marked successfully'
      });

      setShowAttendanceModal(false);
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to save attendance',
        variant: 'destructive'
      });
    }
  };

  const handleAbsenceRequest = async (requestId: string, action: 'approved' | 'rejected', comments?: string) => {
    try {
      const { error } = await supabase
        .from('absence_requests')
        .update({
          status: action,
          reviewed_by: teacherData.user_id,
          reviewed_at: new Date().toISOString(),
          review_comments: comments
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Absence request ${action}`
      });

      fetchAbsenceRequests();
    } catch (error) {
      console.error('Error updating absence request:', error);
      toast({
        title: 'Error',
        description: 'Failed to update absence request',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Teaching Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {daysOfWeek.map((day, index) => {
              const daySchedule = schedule.filter(item => item.day_of_week === index);
              return (
                <div key={day} className="space-y-2">
                  <h3 className="font-semibold text-center">{day}</h3>
                  <div className="space-y-2">
                    {daySchedule.map((classItem) => (
                      <Card key={classItem.id} className="p-3">
                        <div className="space-y-2">
                          <p className="font-medium text-sm">{classItem.courses?.course_name}</p>
                          <p className="text-xs text-gray-600">
                            {classItem.start_time} - {classItem.end_time}
                          </p>
                          <p className="text-xs text-gray-500">{classItem.room_location}</p>
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleMarkAttendance(classItem)}
                          >
                            <Users className="h-3 w-3 mr-1" />
                            Mark Attendance
                          </Button>
                        </div>
                      </Card>
                    ))}
                    {daySchedule.length === 0 && (
                      <div className="text-center text-gray-400 text-sm py-4">
                        No classes
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Absence Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Pending Absence Requests ({absenceRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {absenceRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending absence requests</p>
          ) : (
            <div className="space-y-4">
              {absenceRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {request.user_profiles?.first_name} {request.user_profiles?.last_name}
                          </p>
                          <Badge variant="outline">{request.courses?.course_name}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Date: {new Date(request.absence_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm">{request.reason}</p>
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(request.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600"
                          onClick={() => handleAbsenceRequest(request.id, 'approved')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleAbsenceRequest(request.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Marking Modal */}
      <Dialog open={showAttendanceModal} onOpenChange={setShowAttendanceModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Mark Attendance - {selectedClass?.courses?.course_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Date: {new Date().toLocaleDateString()} | 
              Time: {selectedClass?.start_time} - {selectedClass?.end_time}
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {attendanceData.map((record) => (
                <div key={record.student_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {record.user_profiles?.first_name} {record.user_profiles?.last_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={record.status === 'present' ? "default" : "outline"}
                      onClick={() => updateAttendanceStatus(record.student_id, 'present')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant={record.status === 'absent' ? "destructive" : "outline"}
                      onClick={() => updateAttendanceStatus(record.student_id, 'absent')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Absent
                    </Button>
                    <Button
                      size="sm"
                      variant={record.status === 'late' ? "secondary" : "outline"}
                      onClick={() => updateAttendanceStatus(record.student_id, 'late')}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Late
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAttendanceModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveAttendance}>
                Save Attendance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherCalendarAttendance;
