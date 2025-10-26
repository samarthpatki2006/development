import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, User, BookOpen, ChevronLeft, ChevronRight, Star } from 'lucide-react';
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

  useEffect(() => {
    fetchScheduleData();
  }, [studentData, currentWeek]);

  const fetchScheduleData = async () => {
    if (!studentData?.user_id) return;

    setLoading(true);
    try {
      const { data: enrollments, error: enrollmentError } = await supabase
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

      if (enrollmentError) {
        console.error('Enrollment fetch error:', enrollmentError);
        throw enrollmentError;
      }

      let allScheduleData = [];

      if (enrollments) {
        const regularSchedule = enrollments.flatMap(enrollment => 
          enrollment.courses.class_schedule.map(schedule => ({
            ...schedule,
            course_name: enrollment.courses.course_name,
            course_code: enrollment.courses.course_code,
            instructor_name: `${enrollment.courses.user_profiles?.first_name || ''} ${enrollment.courses.user_profiles?.last_name || ''}`.trim(),
            course_id: enrollment.courses.id,
            is_extra_class: false,
            class_type: 'regular'
          }))
        );
        allScheduleData = [...regularSchedule];
      }

      const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];

      if (enrolledCourseIds.length > 0) {
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
          .in('course_id', enrolledCourseIds)
          .eq('status', 'scheduled')
          .gte('scheduled_date', weekStart.toISOString().split('T')[0])
          .lte('scheduled_date', weekEnd.toISOString().split('T')[0]);

        let teacherProfiles = {};
        if (extraClasses && extraClasses.length > 0) {
          const teacherIds = [...new Set(extraClasses.map(ec => ec.teacher_id))];
          const { data: teachers } = await supabase
            .from('user_profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', teacherIds);
          
          if (teachers) {
            teacherProfiles = teachers.reduce((acc, teacher) => {
              acc[teacher.user_id] = teacher;
              return acc;
            }, {});
          }
        }

        if (extraError) {
          console.warn('Extra class fetch error:', extraError);
        } else if (extraClasses && extraClasses.length > 0) {
          const extraScheduleData = extraClasses.map(extraClass => {
            const scheduledDate = new Date(extraClass.scheduled_date);
            const teacher = teacherProfiles[extraClass.teacher_id];
            return {
              id: extraClass.id,
              day_of_week: scheduledDate.getDay(),
              scheduled_date: extraClass.scheduled_date,
              start_time: extraClass.start_time,
              end_time: extraClass.end_time,
              room_location: extraClass.room_location || '',
              course_name: extraClass.courses?.course_name || extraClass.title,
              course_code: extraClass.courses?.course_code || 'EXTRA',
              instructor_name: teacher ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() : '',
              course_id: extraClass.course_id,
              class_type: extraClass.class_type,
              title: extraClass.title,
              description: extraClass.description,
              status: extraClass.status,
              is_extra_class: true
            };
          });
          
          allScheduleData = [...allScheduleData, ...extraScheduleData];
        }
      }

      setWeeklySchedule(allScheduleData);

      const today = new Date();
      const todaySchedule = allScheduleData.filter(cls => {
        if (cls.is_extra_class && cls.scheduled_date) {
          const classDate = new Date(cls.scheduled_date);
          return classDate.toDateString() === today.toDateString();
        }
        return cls.day_of_week === today.getDay();
      });
      setTodayClasses(todaySchedule.sort((a, b) => a.start_time.localeCompare(b.start_time)));

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

  const timeToMinutes = (timeString: string) => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getClassesForDay = (dayOfWeek: number, specificDate?: Date) => {
    return weeklySchedule.filter(cls => {
      if (cls.is_extra_class && cls.scheduled_date && specificDate) {
        const classDate = new Date(cls.scheduled_date);
        return classDate.toDateString() === specificDate.toDateString();
      }
      return cls.day_of_week === dayOfWeek;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getClassTypeStyle = (cls: any) => {
    if (!cls.is_extra_class) {
      return 'bg-primary/10 text-primary border-primary/20';
    }
    
    switch (cls.class_type) {
      case 'extra':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'remedial':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'makeup':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'special':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getClassPosition = (startTime: string, endTime: string) => {
    const dayStartMinutes = 8 * 60;
    const dayEndMinutes = 18 * 60;
    const totalMinutes = dayEndMinutes - dayStartMinutes;
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const duration = endMinutes - startMinutes;
    
    const topPercent = ((startMinutes - dayStartMinutes) / totalMinutes) * 100;
    const heightPercent = (duration / totalMinutes) * 100;
    
    return {
      top: `${Math.max(0, topPercent)}%`,
      height: `${Math.max(5, heightPercent)}%`
    };
  };

  const generateTimeLabels = () => {
    const labels = [];
    for (let hour = 8; hour <= 18; hour++) {
      labels.push({
        time: `${hour}:00`,
        display: formatTime(`${hour.toString().padStart(2, '0')}:00`)
      });
    }
    return labels;
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Class Schedule</h2>
            <p className="text-muted-foreground">View your class schedule</p>
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
                <div className="grid grid-cols-8 gap-2 min-h-[600px]">
                  <div className="space-y-0 relative">
                    <div className="h-12"></div>
                    <div className="relative" style={{ height: 'calc(100% - 48px)' }}>
                      {generateTimeLabels().map((label, index) => (
                        <div 
                          key={label.time}
                          className="absolute text-xs text-muted-foreground w-full"
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
                      
                      <div className="relative border rounded-lg" style={{ height: 'calc(100% - 56px)', minHeight: '500px' }}>
                        {generateTimeLabels().map((_, index) => (
                          <div 
                            key={index}
                            className="absolute w-full border-t border-muted"
                            style={{ top: `${(index / (generateTimeLabels().length - 1)) * 100}%` }}
                          />
                        ))}
                        
                        {getClassesForDay(dayIndex, date).map((cls, clsIndex) => {
                          const position = getClassPosition(cls.start_time, cls.end_time);
                          return (
                            <div 
                              key={clsIndex}
                              className={`absolute left-1 right-1 p-2 rounded text-xs border overflow-hidden ${getClassTypeStyle(cls)}`}
                              style={position}
                            >
                              <div className="font-medium truncate flex items-center">
                                {cls.is_extra_class && (
                                  <Star className="h-2 w-2 mr-1 flex-shrink-0" />
                                )}
                                <span className="truncate">{cls.course_code}</span>
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
                            </div>
                          );
                        })}
                      </div>
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
                    <div key={index} className={`flex items-center space-x-4 p-4 border rounded-lg ${
                      cls.is_extra_class ? 'border-l-4 border-l-blue-500' : ''
                    }`}>
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          cls.is_extra_class 
                            ? 'text-blue-600'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {cls.is_extra_class ? (
                            <Star className="h-6 w-6" />
                          ) : (
                            <BookOpen className="h-6 w-6" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h3 className="font-medium">{cls.course_name}</h3>
                          {cls.is_extra_class && (
                            <Badge variant="secondary" className="text-xs capitalize">
                              {cls.class_type}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {cls.course_code}
                          {cls.is_extra_class && cls.title && ` • ${cls.title}`}
                        </p>
                        {cls.description && (
                          <p className="text-xs text-muted-foreground mt-1">{cls.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground flex-wrap">
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
                          {cls.instructor_name && (
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {cls.instructor_name}
                            </span>
                          )}
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
                  {getClassesForDay(selectedDate.getDay(), selectedDate).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No classes scheduled for this day
                    </div>
                  ) : (
                    getClassesForDay(selectedDate.getDay(), selectedDate)
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((cls, index) => (
                      <div key={index} className={`flex items-center space-x-4 p-4 border rounded-lg ${
                        cls.is_extra_class ? 'border-l-4 border-l-blue-500' : ''
                      }`}>
                        <div className="flex-shrink-0 space-y-2">
                          <Badge variant={cls.is_extra_class ? "secondary" : "outline"}>
                            {cls.course_code}
                          </Badge>
                          {cls.is_extra_class && (
                            <Badge variant="outline" className="text-xs capitalize block">
                              {cls.class_type}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{cls.course_name}</h4>
                            {cls.is_extra_class && (
                              <Star className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          {cls.is_extra_class && cls.title && (
                            <p className="text-sm text-blue-600 font-medium">{cls.title}</p>
                          )}
                          {cls.description && (
                            <p className="text-sm text-muted-foreground mt-1">{cls.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground flex-wrap">
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
                            {cls.instructor_name && (
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {cls.instructor_name}
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