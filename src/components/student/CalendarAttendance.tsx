import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  MapPin,
  Users,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendarAttendanceProps {
  studentData: any;
}

interface Event {
  id: string;
  event_name: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location: string;
  max_participants: number;
  organizer_id: string;
  registration_required: boolean;
  is_active: boolean;
  created_at: string;
  organizer?: {
    first_name: string;
    last_name: string;
  };
  participant_count?: number;
  is_registered?: boolean;
}

const CalendarAttendance: React.FC<CalendarAttendanceProps> = ({ studentData }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [todayClasses, setTodayClasses] = useState([]);
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({ present: 0, absent: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayClasses();
    fetchTodayEvents();
    fetchAttendanceHistory();
  }, [selectedDate, studentData]);

  const fetchTodayClasses = async () => {
    try {
      const dayOfWeek = selectedDate.getDay();
      const dateString = selectedDate.toISOString().split('T')[0];

      // Get enrolled courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', studentData.user_id);

      const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];

      // Get class schedule for selected day
      const { data: scheduleData } = await supabase
        .from('class_schedule')
        .select(`
          *,
          courses(course_name, course_code, instructor_id)
        `)
        .eq('day_of_week', dayOfWeek)
        .in('course_id', enrolledCourseIds)
        .order('start_time');

      // Get attendance records for the selected date
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentData.user_id)
        .eq('class_date', dateString);

      // Combine schedule with attendance data
      const classesWithAttendance = scheduleData?.map(schedule => {
        const attendance = attendanceData?.find(a => a.course_id === schedule.course_id);
        return {
          ...schedule,
          attendance: attendance || null
        };
      }) || [];

      setTodayClasses(classesWithAttendance);

    } catch (error) {
      console.error('Error fetching today\'s classes:', error);
    }
  };

  const fetchTodayEvents = async () => {
    try {
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      
      // First, let's fetch ALL active events for the college (to debug)
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          organizer:user_profiles!events_organizer_id_fkey(
            first_name,
            last_name
          )
        `)
        .eq('college_id', studentData.college_id)
        .eq('is_active', true)
        .order('start_date');

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return;
      }

      console.log('All events from database:', eventsData);
      console.log('Selected date:', selectedDateStr);

      // Filter events that occur on the selected date (client-side filtering for now)
      const eventsForSelectedDate = eventsData?.filter(event => {
        const eventStartDate = new Date(event.start_date).toISOString().split('T')[0];
        const eventEndDate = new Date(event.end_date).toISOString().split('T')[0];
        
        // Check if selected date is between start and end date (inclusive)
        return selectedDateStr >= eventStartDate && selectedDateStr <= eventEndDate;
      }) || [];

      console.log('Filtered events for selected date:', eventsForSelectedDate);

      // Get registration status and participant count for each event
      const eventsWithDetails = await Promise.all(
        eventsForSelectedDate.map(async (event) => {
          try {
            // Check if student is registered for this event
            const { data: registrationData, error: regError } = await supabase
              .from('event_registrations')
              .select('*')
              .eq('event_id', event.id)
              .eq('user_id', studentData.user_id)
              .maybeSingle();

            if (regError && regError.code !== 'PGRST116') { // Ignore "no rows returned" error
              console.error('Error checking registration for event', event.id, regError);
            }

            // Get participant count
            const { count, error: countError } = await supabase
              .from('event_registrations')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id);

            if (countError) {
              console.error('Error counting participants for event', event.id, countError);
            }

            console.log(`Event ${event.event_name}: registered=${!!registrationData}, count=${count}`);

            return {
              ...event,
              is_registered: !!registrationData,
              participant_count: count || 0
            };
          } catch (error) {
            console.error('Error processing event', event.id, error);
            return {
              ...event,
              is_registered: false,
              participant_count: 0
            };
          }
        })
      );

      console.log('Final events with details:', eventsWithDetails);
      setTodayEvents(eventsWithDetails);

    } catch (error) {
      console.error('Error fetching today\'s events:', error);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          *,
          courses(course_name, course_code)
        `)
        .eq('student_id', studentData.user_id)
        .order('class_date', { ascending: false })
        .limit(50);

      setAttendanceHistory(attendanceData || []);

      // Calculate monthly stats
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyData = attendanceData?.filter(record => {
        const recordDate = new Date(record.class_date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
      }) || [];

      const presentCount = monthlyData.filter(r => r.status === 'present').length;
      const absentCount = monthlyData.filter(r => r.status === 'absent').length;
      
      setMonthlyStats({
        present: presentCount,
        absent: absentCount,
        total: monthlyData.length
      });

    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (scheduleId: string, courseId: string, status: 'present' | 'absent' | 'late') => {
    try {
      const dateString = selectedDate.toISOString().split('T')[0];

      const { error } = await supabase
        .from('attendance')
        .upsert({
          course_id: courseId,
          student_id: studentData.user_id,
          class_date: dateString,
          status: status,
          marked_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Attendance marked as ${status}`,
      });

      // Refresh data
      fetchTodayClasses();
      fetchAttendanceHistory();

    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive',
      });
    }
  };

  const registerForEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: studentData.user_id,
          registration_date: new Date().toISOString(),
          status: 'registered'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Successfully registered for the event!',
      });

      // Refresh events data
      fetchTodayEvents();

    } catch (error) {
      console.error('Error registering for event:', error);
      toast({
        title: 'Error',
        description: 'Failed to register for event',
        variant: 'destructive',
      });
    }
  };

  const unregisterFromEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', studentData.user_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Successfully unregistered from the event',
      });

      // Refresh events data
      fetchTodayEvents();

    } catch (error) {
      console.error('Error unregistering from event:', error);
      toast({
        title: 'Error',
        description: 'Failed to unregister from event',
        variant: 'destructive',
      });
    }
  };

  const submitAbsenceRequest = async (courseId: string, reason: string, requestType: string) => {
    try {
      // In a real implementation, this would create an absence request
      // For now, we'll create a facility request as a workaround
      const { error } = await supabase
        .from('facility_requests')
        .insert({
          student_id: studentData.user_id,
          request_type: 'complaint', // Using this as absence request
          title: 'Absence Request',
          description: `Course: ${courseId}\nReason: ${reason}\nType: ${requestType}`,
          status: 'submitted'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Absence request submitted successfully',
      });

    } catch (error) {
      console.error('Error submitting absence request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit absence request',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatEventDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'late':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getEventTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'academic': 'bg-blue-100 text-blue-800',
      'cultural': 'bg-purple-100 text-purple-800',
      'sports': 'bg-green-100 text-green-800',
      'orientation': 'bg-orange-100 text-orange-800',
      'workshop': 'bg-indigo-100 text-indigo-800',
      'seminar': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getAttendancePercentage = () => {
    if (monthlyStats.total === 0) return 0;
    return Math.round((monthlyStats.present / monthlyStats.total) * 100);
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading calendar data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Calendar & Attendance</h2>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {getAttendancePercentage()}% This Month
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Academic Calendar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
            
            {/* Monthly Stats */}
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold">This Month</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-green-600 font-bold">{monthlyStats.present}</p>
                  <p className="text-xs text-green-600">Present</p>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <p className="text-red-600 font-bold">{monthlyStats.absent}</p>
                  <p className="text-xs text-red-600">Absent</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-600 font-bold">{monthlyStats.total}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Classes and Events */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Schedule for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="classes" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="classes">Classes ({todayClasses.length})</TabsTrigger>
                <TabsTrigger value="events">Events ({todayEvents.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="classes" className="space-y-4">
                {todayClasses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No classes scheduled for this day</p>
                ) : (
                  <div className="space-y-4">
                    {todayClasses.map((classItem: any) => (
                      <div key={classItem.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{classItem.courses.course_name}</h4>
                            <p className="text-sm text-gray-600">{classItem.courses.course_code}</p>
                            <p className="text-sm text-gray-500">{classItem.room_location}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
                            </p>
                            <div className="flex items-center justify-end mt-1">
                              {getAttendanceIcon(classItem.attendance?.status)}
                              <span className="ml-1 text-sm capitalize">
                                {classItem.attendance?.status || 'Not marked'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Attendance Actions */}
                        {selectedDate.toDateString() === new Date().toDateString() && !classItem.attendance && (
                          <div className="flex space-x-2 mt-3">
                            <Button
                              size="sm"
                              onClick={() => markAttendance(classItem.id, classItem.course_id, 'present')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Mark Present
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAttendance(classItem.id, classItem.course_id, 'late')}
                            >
                              Mark Late
                            </Button>
                            <AbsenceRequestDialog 
                              courseId={classItem.course_id}
                              courseName={classItem.courses.course_name}
                              onSubmit={submitAbsenceRequest}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="events" className="space-y-4">
                {todayEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No events scheduled for this day</p>
                ) : (
                  <div className="space-y-4">
                    {todayEvents.map((event) => (
                      <div key={event.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold">{event.event_name}</h4>
                              <Badge className={getEventTypeColor(event.event_type)}>
                                {event.event_type}
                              </Badge>
                              {event.is_registered && (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  <Star className="w-3 h-3 mr-1" />
                                  Registered
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {formatEventDateTime(event.start_date)} - {formatEventDateTime(event.end_date)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>{event.participant_count}/{event.max_participants}</span>
                              </div>
                            </div>
                            {event.organizer && (
                              <p className="text-xs text-gray-400 mt-1">
                                Organized by {event.organizer.first_name} {event.organizer.last_name}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Event Registration Actions */}
                        <div className="flex space-x-2 mt-3">
                          {event.registration_required ? (
                            event.is_registered ? (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => unregisterFromEvent(event.id)}
                                >
                                  Unregister
                                </Button>
                                <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  You're registered
                                </Badge>
                              </div>
                            ) : (
                              <div className="flex space-x-2 items-center">
                                <Button
                                  size="sm"
                                  onClick={() => registerForEvent(event.id)}
                                  disabled={event.participant_count >= event.max_participants}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {event.participant_count >= event.max_participants ? 'Event Full' : 'Register Now'}
                                </Button>
                                {event.participant_count >= event.max_participants && (
                                  <Badge variant="destructive">Full</Badge>
                                )}
                              </div>
                            )
                          ) : (
                            <div className="flex space-x-2 items-center">
                              <Badge variant="secondary">No Registration Required</Badge>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                Open to All
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No attendance records found</p>
          ) : (
            <div className="space-y-3">
              {attendanceHistory.map((record: any) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getAttendanceIcon(record.status)}
                    <div>
                      <h4 className="font-medium">{record.courses.course_name}</h4>
                      <p className="text-sm text-gray-600">{record.courses.course_code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{new Date(record.class_date).toLocaleDateString()}</p>
                    <Badge variant={
                      record.status === 'present' ? 'default' :
                      record.status === 'late' ? 'secondary' : 'destructive'
                    }>
                      {record.status}
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

// Absence Request Dialog Component
const AbsenceRequestDialog: React.FC<{
  courseId: string;
  courseName: string;
  onSubmit: (courseId: string, reason: string, type: string) => void;
}> = ({ courseId, courseName, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [requestType, setRequestType] = useState('medical');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (!reason.trim()) return;
    
    onSubmit(courseId, reason, requestType);
    setReason('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileText className="h-4 w-4 mr-1" />
          Request Absence
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Absence - {courseName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Reason Type</label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="family">Family Emergency</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Reason</label>
            <Textarea
              placeholder="Please provide details for your absence request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={handleSubmit} disabled={!reason.trim()}>
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarAttendance;