
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { Calendar as CalendarIcon, Users, Clock, MapPin, Video } from 'lucide-react';

interface EventsMeetingsProps {
  user: any;
}

const EventsMeetings = ({ user }: EventsMeetingsProps) => {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [meetingRequest, setMeetingRequest] = useState({
    teacher_id: '',
    meeting_type: 'in_person',
    agenda: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
    fetchEvents();
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      fetchMeetings(selectedChild);
      fetchTeachers(selectedChild);
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

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          user_profiles!organizer_id (first_name, last_name),
          event_registrations!inner (status)
        `)
        .eq('college_id', user.college_id)
        .eq('is_active', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchMeetings = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('parent_meetings')
        .select(`
          *,
          user_profiles!teacher_id (first_name, last_name, user_code),
          student:user_profiles!student_id (first_name, last_name)
        `)
        .eq('student_id', studentId)
        .eq('parent_id', user.user_id)
        .order('meeting_date', { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const fetchTeachers = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          courses (
            instructor_id,
            course_name,
            user_profiles!instructor_id (
              id,
              first_name,
              last_name,
              user_code
            )
          )
        `)
        .eq('student_id', studentId)
        .eq('status', 'enrolled');

      if (error) throw error;

      const teacherList = (data || [])
        .filter(enrollment => enrollment.courses?.user_profiles)
        .map(enrollment => ({
          ...enrollment.courses.user_profiles,
          course_name: enrollment.courses.course_name
        }));

      setTeachers(teacherList);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const registerForEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.user_id,
          status: 'registered'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Successfully registered for the event',
      });

      fetchEvents();
    } catch (error) {
      console.error('Error registering for event:', error);
      toast({
        title: 'Error',
        description: 'Failed to register for event',
        variant: 'destructive',
      });
    }
  };

  const requestMeeting = async () => {
    if (!selectedChild || !selectedDate || !meetingRequest.teacher_id || !meetingRequest.agenda) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('parent_meetings')
        .insert({
          teacher_id: meetingRequest.teacher_id,
          student_id: selectedChild,
          parent_id: user.user_id,
          meeting_date: selectedDate.toISOString(),
          meeting_type: meetingRequest.meeting_type,
          agenda: meetingRequest.agenda,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Meeting request submitted successfully',
      });

      setMeetingRequest({
        teacher_id: '',
        meeting_type: 'in_person',
        agenda: ''
      });
      setSelectedDate(new Date());

      fetchMeetings(selectedChild);
    } catch (error) {
      console.error('Error requesting meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit meeting request',
        variant: 'destructive',
      });
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return 'bg-green-100 text-green-800';
      case 'attended': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMeetingStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video_call': return <Video className="h-4 w-4" />;
      case 'phone_call': return <Clock className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Upcoming Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{event.event_name}</h4>
                      <p className="text-sm text-gray-600">{event.description}</p>
                    </div>
                    <Badge variant="outline">{event.event_type}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.max_participants && (
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>Max Participants: {event.max_participants}</span>
                      </div>
                    )}
                  </div>
                  {event.registration_required && (
                    <Button
                      onClick={() => registerForEvent(event.id)}
                      size="sm"
                      className="w-full"
                    >
                      RSVP for Event
                    </Button>
                  )}
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-center text-gray-500 py-8">No upcoming events</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Request Meeting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Request Parent-Teacher Meeting</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Teacher</Label>
              <Select
                value={meetingRequest.teacher_id}
                onValueChange={(value) => setMeetingRequest({ ...meetingRequest, teacher_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name} - {teacher.course_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Meeting Type</Label>
              <Select
                value={meetingRequest.meeting_type}
                onValueChange={(value) => setMeetingRequest({ ...meetingRequest, meeting_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In Person</SelectItem>
                  <SelectItem value="video_call">Video Call</SelectItem>
                  <SelectItem value="phone_call">Phone Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preferred Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </div>
            <div>
              <Label>Meeting Agenda</Label>
              <Textarea
                placeholder="What would you like to discuss?"
                value={meetingRequest.agenda}
                onChange={(e) => setMeetingRequest({ ...meetingRequest, agenda: e.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={requestMeeting} className="w-full">
              Request Meeting
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Meeting History */}
      {selectedChild && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Meeting History - {selectedChildName}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium flex items-center space-x-2">
                        {getMeetingTypeIcon(meeting.meeting_type)}
                        <span>Meeting with {meeting.user_profiles.first_name} {meeting.user_profiles.last_name}</span>
                      </h4>
                      <p className="text-sm text-gray-600">
                        Student: {meeting.student.first_name} {meeting.student.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(meeting.meeting_date).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={getMeetingStatusColor(meeting.status)}>
                      {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                    </Badge>
                  </div>
                  {meeting.agenda && (
                    <div className="mb-2">
                      <strong>Agenda:</strong>
                      <p className="text-sm text-gray-700">{meeting.agenda}</p>
                    </div>
                  )}
                  {meeting.notes && (
                    <div>
                      <strong>Notes:</strong>
                      <p className="text-sm text-gray-700">{meeting.notes}</p>
                    </div>
                  )}
                </div>
              ))}
              {meetings.length === 0 && (
                <p className="text-center text-gray-500 py-8">No meeting history</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventsMeetings;
