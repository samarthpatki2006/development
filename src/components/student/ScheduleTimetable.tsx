import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, User, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PermissionWrapper from '@/components/PermissionWrapper';

interface ScheduleTimetableProps {
  studentData: any;
}

const ScheduleTimetable: React.FC<ScheduleTimetableProps> = ({ studentData }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  useEffect(() => {
    fetchScheduleData();
  }, [studentData, currentWeek]);

  const fetchScheduleData = async () => {
    if (!studentData?.user_id) return;

    setLoading(true);
    try {
      // Get enrolled courses with schedule
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          courses!inner (
            id,
            course_name,
            course_code,
            instructor_id,
            user_profiles!courses_instructor_id_fkey (
              first_name,
              last_name
            ),
            class_schedule (
              day_of_week,
              start_time,
              end_time,
              room_location
            )
          )
        `)
        .eq('student_id', studentData.user_id)
        .eq('status', 'enrolled');

      if (enrollments) {
        const scheduleData = enrollments.flatMap(enrollment => 
          enrollment.courses.class_schedule.map(schedule => ({
            ...schedule,
            course_name: enrollment.courses.course_name,
            course_code: enrollment.courses.course_code,
            instructor_name: `${enrollment.courses.user_profiles?.first_name || ''} ${enrollment.courses.user_profiles?.last_name || ''}`.trim(),
            course_id: enrollment.courses.id
          }))
        );

        setWeeklySchedule(scheduleData);

        // Filter today's classes
        const today = new Date();
        const todaySchedule = scheduleData.filter(cls => cls.day_of_week === today.getDay());
        setTodayClasses(todaySchedule);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schedule data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

  const getClassesForDay = (dayOfWeek: number) => {
    return weeklySchedule.filter(cls => cls.day_of_week === dayOfWeek);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PermissionWrapper permission="view_attendance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Schedule & Timetable</h2>
            <p className="text-muted-foreground">View your class schedule and timetable</p>
          </div>
        </div>

        <Tabs defaultValue="weekly" className="space-y-4">
          <TabsList>
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="daily">Daily View</TabsTrigger>
          </TabsList>

          {/* Weekly View */}
          <TabsContent value="weekly" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Weekly Schedule</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
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
                      <div key={time} className="h-16 text-xs text-muted-foreground flex items-center">
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
                        const dayClasses = getClassesForDay(dayIndex);
                        const classAtTime = dayClasses.find(cls => {
                          const startTime = formatTime(cls.start_time);
                          return startTime === timeSlot;
                        });

                        return (
                          <div key={timeIndex} className="h-16 border rounded">
                            {classAtTime && (
                              <div className="p-1 bg-primary/10 rounded text-xs h-full">
                                <div className="font-medium text-primary truncate">
                                  {classAtTime.course_code}
                                </div>
                                <div className="text-muted-foreground truncate">
                                  {classAtTime.room_location}
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
          </TabsContent>

          {/* Daily View */}
          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Classes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {todayClasses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No classes scheduled for today
                  </div>
                ) : (
                  todayClasses.map((cls, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{cls.course_name}</h3>
                        <p className="text-sm text-muted-foreground">{cls.course_code}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                          </span>
                          {cls.room_location && (
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {cls.room_location}
                            </span>
                          )}
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {cls.instructor_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    Classes on {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getClassesForDay(selectedDate.getDay()).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No classes scheduled for this day
                    </div>
                  ) : (
                    getClassesForDay(selectedDate.getDay()).map((cls, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          <Badge variant="outline">{cls.course_code}</Badge>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{cls.course_name}</h4>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                            </span>
                            {cls.room_location && (
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {cls.room_location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionWrapper>
  );
};

export default ScheduleTimetable;