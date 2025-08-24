import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Bell,
  AlertTriangle,
  BookOpen,
  Plus,
  Edit,
  ChevronLeft,
  ChevronRight,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import PermissionWrapper from '@/components/PermissionWrapper';

interface TeacherScheduleProps {
  teacherData: any;
}

const TeacherSchedule = ({ teacherData }: TeacherScheduleProps) => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  const [newReminder, setNewReminder] = useState({
    class_id: '',
    reminder_text: '',
    reminder_time: '',
    reminder_type: 'preparation'
  });

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
    fetchScheduleData();
    fetchTeacherCourses();
  }, [teacherData, currentWeek]);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchWeeklySchedule(),
        fetchTodayClasses(),
        fetchReminders(),
        fetchAlerts()
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
      // Get regular schedule
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

      if (regularError) {
        console.error('Regular schedule fetch error:', regularError);
        throw regularError;
      }

      let allScheduleData = [];

      // Process regular classes
      if (regularSchedule) {
        const regularScheduleData = regularSchedule.map(schedule => ({
          ...schedule,
          is_extra_class: false,
          class_type: 'regular'
        }));
        allScheduleData = [...regularScheduleData];
      }

      // Calculate week start and end dates
      const weekStart = new Date(currentWeek);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Get extra classes for the current week taught by this teacher
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

      if (extraError) {
        console.warn('Extra class fetch error:', extraError);
      } else if (extraClasses && extraClasses.length > 0) {
        // Process extra classes
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
              enrollments: [] // Extra classes don't have regular enrollments
            }
          };
        });
        
        allScheduleData = [...allScheduleData, ...extraScheduleData];
      }

      setSchedule(allScheduleData);

    } catch (error) {
      console.error('Error fetching weekly schedule:', error);
    }
  };

  const fetchTodayClasses = async () => {
    const today = new Date();
    const todayDay = today.getDay();
    
    try {
      // Get regular classes for today
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

      // Get extra classes for today
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

      // Sort by start time
      allTodayClasses.sort((a, b) => a.start_time.localeCompare(b.start_time));
      setTodayClasses(allTodayClasses);

    } catch (error) {
      console.error('Error fetching today classes:', error);
    }
  };

  const fetchReminders = async () => {
    // Simulate teacher reminders data
    setReminders([
      {
        id: '1',
        class_name: 'Data Structures & Algorithms',
        reminder_text: 'Prepare slides for Binary Trees topic',
        reminder_time: '08:30',
        type: 'preparation'
      },
      {
        id: '2',
        class_name: 'Database Management',
        reminder_text: 'Review assignment submissions',
        reminder_time: '10:45',
        type: 'grading'
      }
    ]);
  };

  const fetchAlerts = async () => {
    // Simulate class change alerts
    setAlerts([
      {
        id: '1',
        type: 'room_change',
        message: 'Computer Networks class moved to Lab 102',
        class_time: '14:00',
        severity: 'warning'
      },
      {
        id: '2',
        type: 'cancelled',
        message: 'Database Systems class cancelled due to maintenance',
        class_time: '16:00',
        severity: 'error'
      }
    ]);
  };

  // Helper functions for timeline view
  const getWeekDays = (startDate: Date) => {
    const week = [];
    const start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay()); // Start from Sunday

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

  const createSchedule = async () => {
    try {
      // Validate form data
      if (!newSchedule.course_id || !newSchedule.start_time || !newSchedule.end_time) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      // Validate time logic
      if (newSchedule.start_time >= newSchedule.end_time) {
        toast({
          title: 'Error',
          description: 'End time must be after start time',
          variant: 'destructive'
        });
        return;
      }

      // Insert into database
      const { data, error } = await supabase
        .from('class_schedule')
        .insert([{
          course_id: newSchedule.course_id,
          day_of_week: parseInt(newSchedule.day_of_week.toString()),
          start_time: newSchedule.start_time,
          end_time: newSchedule.end_time,
          room_location: newSchedule.room_location || null
        }])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Class scheduled successfully'
      });

      // Reset form
      setNewSchedule({
        course_id: '',
        day_of_week: 0,
        start_time: '',
        end_time: '',
        room_location: ''
      });

      // Close dialog
      setIsScheduleDialogOpen(false);

      // Refresh schedule data
      await fetchScheduleData();

    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule class. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const createReminder = async () => {
    try {
      // In a real implementation, you would save to a reminders table
      const newReminderObj = {
        ...newReminder,
        id: Date.now().toString(),
        teacher_id: teacherData.user_id
      };

      setReminders(prev => [...prev, newReminderObj]);

      toast({
        title: 'Success',
        description: 'Reminder created successfully'
      });

      setNewReminder({
        class_id: '',
        reminder_text: '',
        reminder_time: '',
        reminder_type: 'preparation'
      });
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create reminder',
        variant: 'destructive'
      });
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
    <PermissionWrapper permission="mark_attendance">
      <div className="space-y-6">
        {/* Header with Schedule Class Button */}
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
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-black"
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
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-black"
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
                      className="focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Time *</label>
                    <Input
                      type="time"
                      value={newSchedule.end_time}
                      onChange={(e) => setNewSchedule({...newSchedule, end_time: e.target.value})}
                      className="focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Room Location</label>
                  <Input
                    placeholder="e.g., Room 101, Lab A, Online"
                    value={newSchedule.room_location}
                    onChange={(e) => setNewSchedule({...newSchedule, room_location: e.target.value})}
                    className="focus:ring-2 focus:ring-primary"
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

        {/* Weekly Timeline View */}
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
              {/* Time column */}
              <div className="space-y-2">
                <div className="h-12"></div>
                {timeSlots.map(time => (
                  <div key={time} className="h-16 text-xs text-muted-foreground flex items-center justify-end pr-2">
                    {time}
                  </div>
                ))}
              </div>

              {/* Day columns */}
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
                          <div className={`p-1 rounded text-xs h-full border transition-colors cursor-pointer ${getClassTypeStyle(classAtTime)}`}>
                            <div className="font-medium truncate flex items-center">
                              {classAtTime.is_extra_class && (
                                <Star className="h-2 w-2 mr-1 flex-shrink-0" />
                              )}
                              <span className="truncate">{classAtTime.courses?.course_code}</span>
                            </div>
                            <div className="text-xs opacity-80 truncate">
                              {classAtTime.room_location}
                            </div>
                            {classAtTime.is_extra_class ? (
                              <div className="text-xs opacity-70 truncate capitalize">
                                {classAtTime.class_type}
                              </div>
                            ) : (
                              <div className="text-xs opacity-70 truncate flex items-center">
                                <Users className="h-2 w-2 mr-1" />
                                {classAtTime.courses?.enrollments?.[0]?.count || 0}
                              </div>
                            )}
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

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Classes ({new Date().toLocaleDateString()})
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Bell className="h-4 w-4 mr-2" />
                    Set Reminder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Class Reminder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <select
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newReminder.class_id}
                      onChange={(e) => setNewReminder({...newReminder, class_id: e.target.value})}
                    >
                      <option value="">Select Class</option>
                      {todayClasses.map((class_item) => (
                        <option key={class_item.id} value={class_item.id}>
                          {class_item.courses?.course_name} - {class_item.start_time}
                        </option>
                      ))}
                    </select>
                    
                    <Textarea
                      placeholder="Reminder text"
                      value={newReminder.reminder_text}
                      onChange={(e) => setNewReminder({...newReminder, reminder_text: e.target.value})}
                    />
                    
                    <Input
                      type="time"
                      value={newReminder.reminder_time}
                      onChange={(e) => setNewReminder({...newReminder, reminder_time: e.target.value})}
                    />
                    
                    <select
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newReminder.reminder_type}
                      onChange={(e) => setNewReminder({...newReminder, reminder_type: e.target.value})}
                    >
                      <option value="preparation">Preparation</option>
                      <option value="grading">Grading</option>
                      <option value="meeting">Meeting</option>
                      <option value="general">General</option>
                    </select>
                    
                    <Button onClick={createReminder} className="w-full">
                      Create Reminder
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayClasses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No classes scheduled for today</p>
            ) : (
              <div className="space-y-4">
                {todayClasses.map((class_item) => (
                  <Card key={class_item.id} className={`p-4 ${
                    class_item.is_extra_class ? 'border-l-4 border-l-blue-500' : ''
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-primary">
                            {formatTime(class_item.start_time)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatTime(class_item.end_time)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{class_item.courses?.course_name}</h3>
                            {class_item.is_extra_class && (
                              <Badge variant="secondary" className="text-xs capitalize flex items-center">
                                <Star className="h-3 w-3 mr-1" />
                                {class_item.class_type}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {class_item.courses?.course_code}
                            {class_item.is_extra_class && class_item.title && ` • ${class_item.title}`}
                          </p>
                          {class_item.description && (
                            <p className="text-xs text-muted-foreground mt-1">{class_item.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {class_item.room_location || 'Room TBD'}
                            </div>
                            {!class_item.is_extra_class && (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {class_item.courses?.enrollments?.[0]?.count || 0} students
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Course Page
                        </Button>
                        <Button size="sm">
                          <Users className="h-4 w-4 mr-2" />
                          Mark Attendance
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              My Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reminders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No reminders set</p>
            ) : (
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-sm font-bold">{reminder.reminder_time}</div>
                        <Badge variant="outline" className="text-xs">
                          {reminder.type}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium">{reminder.class_name}</p>
                        <p className="text-sm text-muted-foreground">{reminder.reminder_text}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionWrapper>
  );
};

export default TeacherSchedule;