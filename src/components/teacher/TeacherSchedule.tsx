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
  Edit
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
  const [loading, setLoading] = useState(true);

  const [newReminder, setNewReminder] = useState({
    class_id: '',
    reminder_text: '',
    reminder_time: '',
    reminder_type: 'preparation'
  });

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchScheduleData();
  }, [teacherData]);

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

  const fetchTodayClasses = async () => {
    const today = new Date().getDay();
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
      .eq('courses.instructor_id', teacherData.user_id)
      .eq('day_of_week', today);

    if (!error && data) {
      setTodayClasses(data);
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
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <Alert key={alert.id} variant={alert.severity === 'error' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{alert.class_time}</strong> - {alert.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

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
                      className="w-full p-2 border rounded"
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
                      className="w-full p-2 border rounded"
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
                  <Card key={class_item.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-primary">
                            {class_item.start_time}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {class_item.end_time}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{class_item.courses?.course_name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {class_item.room_location || 'Room TBD'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {class_item.courses?.enrollments?.[0]?.count || 0} students
                            </div>
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

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Schedule Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {daysOfWeek.map((day, index) => {
                const daySchedule = schedule.filter(item => item.day_of_week === index);
                const isToday = index === new Date().getDay();
                
                return (
                  <div key={day} className="space-y-2">
                    <h3 className={`font-semibold text-center p-2 rounded ${
                      isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {day}
                    </h3>
                    <div className="space-y-2">
                      {daySchedule.map((classItem) => (
                        <Card key={classItem.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-medium">
                                {classItem.start_time} - {classItem.end_time}
                              </span>
                            </div>
                            <p className="font-medium text-sm">{classItem.courses?.course_name}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {classItem.room_location}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {classItem.courses?.enrollments?.[0]?.count || 0}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                      {daySchedule.length === 0 && (
                        <div className="text-center text-muted-foreground text-sm py-8">
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