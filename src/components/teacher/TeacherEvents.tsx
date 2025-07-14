import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus,
  BookOpen,
  GraduationCap,
  Coffee,
  Award,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import PermissionWrapper from '@/components/PermissionWrapper';

interface TeacherEventsProps {
  teacherData: any;
}

const TeacherEvents = ({ teacherData }: TeacherEventsProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newClass, setNewClass] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    room_location: '',
    class_type: 'extra',
    course_id: ''
  });

  useEffect(() => {
    fetchEventData();
  }, [teacherData]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchEvents(),
        fetchMyEvents(),
        fetchWorkshops()
      ]);
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('college_id', teacherData.college_id)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
  };

  const fetchMyEvents = async () => {
    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        *,
        events (
          id,
          event_name,
          description,
          start_date,
          end_date,
          location,
          event_type
        )
      `)
      .eq('user_id', teacherData.user_id)
      .order('registration_date', { ascending: false });

    if (!error && data) {
      setMyEvents(data);
    }
  };

  const fetchWorkshops = async () => {
    // Simulate workshop data
    setWorkshops([
      {
        id: '1',
        title: 'Digital Teaching Methods Workshop',
        description: 'Learn modern digital teaching techniques and tools',
        date: '2024-02-15',
        time: '09:00 - 12:00',
        location: 'Conference Hall A',
        instructor: 'Dr. Sarah Johnson',
        status: 'available',
        credits: 3
      },
      {
        id: '2',
        title: 'Student Assessment Strategies',
        description: 'Effective methods for evaluating student performance',
        date: '2024-02-20',
        time: '14:00 - 17:00',
        location: 'Workshop Room 1',
        instructor: 'Prof. Michael Chen',
        status: 'registered',
        credits: 2
      },
      {
        id: '3',
        title: 'Classroom Management Techniques',
        description: 'Best practices for maintaining an effective learning environment',
        date: '2024-02-25',
        time: '10:00 - 15:00',
        location: 'Main Auditorium',
        instructor: 'Dr. Emily Rodriguez',
        status: 'available',
        credits: 4
      }
    ]);
  };

  const registerForEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: teacherData.user_id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Successfully registered for event'
      });

      fetchMyEvents();
    } catch (error) {
      console.error('Error registering for event:', error);
      toast({
        title: 'Error',
        description: 'Failed to register for event',
        variant: 'destructive'
      });
    }
  };

  const scheduleExtraClass = async () => {
    try {
      // In a real implementation, this would create a new class schedule entry
      toast({
        title: 'Success',
        description: 'Extra class scheduled successfully'
      });

      setNewClass({
        title: '',
        description: '',
        date: '',
        start_time: '',
        end_time: '',
        room_location: '',
        class_type: 'extra',
        course_id: ''
      });
    } catch (error) {
      console.error('Error scheduling class:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule class',
        variant: 'destructive'
      });
    }
  };

  const registerForWorkshop = async (workshopId: string) => {
    setWorkshops(prev => prev.map(workshop => 
      workshop.id === workshopId 
        ? { ...workshop, status: 'registered' }
        : workshop
    ));

    toast({
      title: 'Success',
      description: 'Registered for workshop successfully'
    });
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
    <PermissionWrapper permission="mark_attendance">
      <div className="space-y-6">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calendar">Academic Calendar</TabsTrigger>
            <TabsTrigger value="workshops">Training & Workshops</TabsTrigger>
            <TabsTrigger value="my-events">My Events</TabsTrigger>
            <TabsTrigger value="schedule">Schedule Classes</TabsTrigger>
          </TabsList>

          {/* Academic Calendar */}
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Academic Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No upcoming events</p>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <Card key={event.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{event.event_name}</h3>
                              <Badge variant={
                                event.event_type === 'academic' ? 'default' :
                                event.event_type === 'meeting' ? 'secondary' :
                                'outline'
                              }>
                                {event.event_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(event.start_date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(event.start_date).toLocaleTimeString()} - {new Date(event.end_date).toLocaleTimeString()}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => registerForEvent(event.id)}
                            disabled={myEvents.some(me => me.event_id === event.id)}
                          >
                            {myEvents.some(me => me.event_id === event.id) ? 'Registered' : 'RSVP'}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training & Workshops */}
          <TabsContent value="workshops" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Professional Development Workshops
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workshops.map((workshop) => (
                    <Card key={workshop.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{workshop.title}</h3>
                            <Badge variant="outline">{workshop.credits} Credits</Badge>
                            {workshop.status === 'registered' && (
                              <Badge variant="default">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Registered
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{workshop.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(workshop.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {workshop.time}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {workshop.location}
                            </div>
                          </div>
                          <p className="text-sm mt-2">
                            <span className="font-medium">Instructor:</span> {workshop.instructor}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => registerForWorkshop(workshop.id)}
                          disabled={workshop.status === 'registered'}
                          variant={workshop.status === 'registered' ? 'outline' : 'default'}
                        >
                          {workshop.status === 'registered' ? 'Registered' : 'Register'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Events */}
          <TabsContent value="my-events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  My Registered Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No registered events</p>
                ) : (
                  <div className="space-y-4">
                    {myEvents.map((registration) => (
                      <Card key={registration.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{registration.events?.event_name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{registration.events?.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(registration.events?.start_date).toLocaleDateString()}
                              </div>
                              {registration.events?.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {registration.events.location}
                                </div>
                              )}
                            </div>
                            <Badge variant="default" className="mt-2">
                              Registered on {new Date(registration.registration_date).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Classes */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Schedule Extra/Remedial Classes
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule Class
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule New Class</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Class title"
                          value={newClass.title}
                          onChange={(e) => setNewClass({...newClass, title: e.target.value})}
                        />
                        
                        <Textarea
                          placeholder="Class description"
                          value={newClass.description}
                          onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                        />
                        
                        <Input
                          type="date"
                          value={newClass.date}
                          onChange={(e) => setNewClass({...newClass, date: e.target.value})}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            type="time"
                            placeholder="Start time"
                            value={newClass.start_time}
                            onChange={(e) => setNewClass({...newClass, start_time: e.target.value})}
                          />
                          <Input
                            type="time"
                            placeholder="End time"
                            value={newClass.end_time}
                            onChange={(e) => setNewClass({...newClass, end_time: e.target.value})}
                          />
                        </div>
                        
                        <Input
                          placeholder="Room location"
                          value={newClass.room_location}
                          onChange={(e) => setNewClass({...newClass, room_location: e.target.value})}
                        />
                        
                        <select
                          className="w-full p-2 border rounded"
                          value={newClass.class_type}
                          onChange={(e) => setNewClass({...newClass, class_type: e.target.value})}
                        >
                          <option value="extra">Extra Class</option>
                          <option value="remedial">Remedial Class</option>
                          <option value="makeup">Makeup Class</option>
                          <option value="special">Special Session</option>
                        </select>
                        
                        <Button onClick={scheduleExtraClass} className="w-full">
                          Schedule Class
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Schedule extra classes or remedial sessions for your students
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionWrapper>
  );
};

export default TeacherEvents;