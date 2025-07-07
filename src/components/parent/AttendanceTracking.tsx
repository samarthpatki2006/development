
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
    <div className="space-y-6">
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
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Attendance Summary - {selectedChildName}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.attendancePercentage}%</div>
                  <p className="text-sm text-gray-600">Overall Attendance</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.presentClasses}</div>
                  <p className="text-sm text-gray-600">Classes Attended</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{stats.totalClasses - stats.presentClasses}</div>
                  <p className="text-sm text-gray-600">Classes Missed</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.totalClasses}</div>
                  <p className="text-sm text-gray-600">Total Classes</p>
                </div>
              </div>

              {/* Course Filter */}
              <div className="flex items-center space-x-4">
                <Label>Filter by Course:</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-48">
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
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Attendance Records</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendance
                  .filter(record => selectedCourse === 'all' || record.course_id === selectedCourse)
                  .slice(0, 20)
                  .map((record) => (
                    <div key={record.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{record.courses.course_name}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(record.class_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(record.status)}>
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
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>Submit Absence Request</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason for Absence</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for the absence..."
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  className="mt-1"
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
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Absence Requests History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {absenceRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{request.courses.course_name}</h4>
                        <p className="text-sm text-gray-600">
                          Date: {new Date(request.absence_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getRequestStatusColor(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <strong>Reason:</strong>
                        <p className="text-sm text-gray-700">{request.reason}</p>
                      </div>
                      {request.review_comments && (
                        <div>
                          <strong>Review Comments:</strong>
                          <p className="text-sm text-gray-700">{request.review_comments}</p>
                        </div>
                      )}
                      {request.user_profiles && (
                        <p className="text-xs text-gray-500">
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
