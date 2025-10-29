
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface AttendanceTrackingProps {
  user: any;
}

const AttendanceTracking = ({ user }: AttendanceTrackingProps) => {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [absenceReason, setAbsenceReason] = useState('');
  const [absenceRequests, setAbsenceRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      fetchAttendanceData(selectedChild);
      fetchAbsenceRequests(selectedChild);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase.rpc('get_parent_children', {
        parent_uuid: user.user_id
      });

      if (error) throw error;
      setChildren(data || []);
      if (data && data.length > 0) {
        setSelectedChild(data[0].student_id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        title: 'Error',
        description: 'Failed to load children data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async (studentId: string) => {
    try {
      setLoading(true);

      // Fetch attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          courses (
            id,
            course_name,
            course_code
          )
        `)
        .eq('student_id', studentId)
        .order('class_date', { ascending: false });

      if (attendanceError) throw attendanceError;
      setAttendance(attendanceData || []);

      // Get unique courses
      const uniqueCourses = [...new Map(
        (attendanceData || []).map(record => [
          record.courses.id,
          record.courses
        ])
      ).values()];
      setCourses(uniqueCourses);

    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAbsenceRequests = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('absence_requests')
        .select(`
          *,
          courses (course_name),
          user_profiles!reviewed_by (first_name, last_name)
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setAbsenceRequests(data || []);
    } catch (error) {
      console.error('Error fetching absence requests:', error);
    }
  };

  const submitAbsenceRequest = async () => {
    if (!selectedChild || !selectedDate || !absenceReason.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select a date and provide a reason for absence',
        variant: 'destructive',
      });
      return;
    }

    try {
      // For now, we'll submit without a specific course
      // In a real implementation, you might want to let parents select a course
      const { error } = await supabase
        .from('absence_requests')
        .insert({
          student_id: selectedChild,
          course_id: courses[0]?.id, // Default to first course
          absence_date: selectedDate.toISOString().split('T')[0],
          reason: absenceReason
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Absence request submitted successfully',
      });

      setAbsenceReason('');
      setSelectedDate(new Date());
      fetchAbsenceRequests(selectedChild);
    } catch (error) {
      console.error('Error submitting absence request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit absence request',
        variant: 'destructive',
      });
    }
  };

  const getAttendanceStats = () => {
    let filteredAttendance = attendance;
    if (selectedCourse !== 'all') {
      filteredAttendance = attendance.filter(record => record.course_id === selectedCourse);
    }

    const totalClasses = filteredAttendance.length;
    const presentClasses = filteredAttendance.filter(record => record.status === 'present').length;
    const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    return { totalClasses, presentClasses, attendancePercentage };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedChildName = children.find(child => child.student_id === selectedChild)?.student_name || '';
  const stats = getAttendanceStats();

  return (
    <div className="space-y-6 animate-fade-in-up px-3 sm:px-4 md:px-6 overflow-x-hidden w-full">
      {/* Child Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Child</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.student_id} value={child.student_id}>
                  {child.student_name} ({child.user_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedChild && (
        <>
          {/* Attendance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Attendance Summary - {selectedChildName}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="text-center p-3 sm:p-4 bg-gray-900/50 border border-blue-500/20 rounded-lg">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-400">{stats.attendancePercentage}%</div>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Overall Attendance</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-gray-900/50 border border-green-500/20 rounded-lg">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-400">{stats.presentClasses}</div>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Classes Attended</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-gray-900/50 border border-red-500/20 rounded-lg">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-red-400">{stats.totalClasses - stats.presentClasses}</div>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Classes Missed</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-gray-900/50 border border-purple-500/20 rounded-lg">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-400">{stats.totalClasses}</div>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Total Classes</p>
                </div>
              </div>

              {/* Course Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <Label className="text-sm">Filter by Course:</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.course_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Attendance Records</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendance
                  .filter(record => selectedCourse === 'all' || record.course_id === selectedCourse)
                  .slice(0, 20)
                  .map((record) => (
                    <div key={record.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 sm:p-4 bg-black-900/30 border border-gray-600/40 rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm sm:text-base">{record.courses.course_name}</h4>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">
                          {new Date(record.class_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(record.status)} w-fit`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit Absence Request */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Submit Absence Request</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Select Date</Label>
                <div className="mt-1">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border border-gray-600/40 bg-black-900/30 w-full"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="reason" className="text-sm">Reason for Absence</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for the absence..."
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  className="mt-1 text-sm"
                  rows={4}
                />
              </div>
              <Button onClick={submitAbsenceRequest} className="w-full">
                Submit Absence Request
              </Button>
            </CardContent>
          </Card>

          {/* Absence Requests History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Absence Requests History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {absenceRequests.map((request) => (
                  <div key={request.id} className="bg-black-900/30 border border-gray-600/40 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm sm:text-base">{request.courses.course_name}</h4>
                        <p className="text-xs sm:text-sm text-black-400 mt-1">
                          Date: {new Date(request.absence_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={`${getRequestStatusColor(request.status)} w-fit`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="p-2 sm:p-3 bg-black-800/50 border border-gray-600/30 rounded">
                        <strong className="text-xs sm:text-sm">Reason:</strong>
                        <p className="text-xs sm:text-sm text-black-300 mt-1">{request.reason}</p>
                      </div>
                      {request.review_comments && (
                        <div className="p-2 sm:p-3 bg-black-800/50 border border-gray-600/30 rounded">
                          <strong className="text-xs sm:text-sm">Review Comments:</strong>
                          <p className="text-xs sm:text-sm text-black-300 mt-1">{request.review_comments}</p>
                        </div>
                      )}
                      {request.user_profiles && (
                        <p className="text-xs text-black-500 pt-2 border-t border-gray-600/40">
                          Reviewed by: {request.user_profiles.first_name} {request.user_profiles.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AttendanceTracking;
