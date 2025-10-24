import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus,
  BookOpen,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import PermissionWrapper from '@/components/PermissionWrapper';

interface TeacherEventsProps {
  teacherData: any;
}

const TeacherExtra = ({ teacherData }: TeacherEventsProps) => {
  const [loading, setLoading] = useState(true);
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newClassDialogOpen, setNewClassDialogOpen] = useState(false);

  const [newClass, setNewClass] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    start_time: '',
    end_time: '',
    room_location: '',
    class_type: 'extra',
    course_id: ''
  });

  useEffect(() => {
    if (teacherData?.user_id) {
      fetchScheduledClasses();
      fetchTeacherCourses();
    }
  }, [teacherData]);

  const fetchTeacherCourses = async () => {
    try {
      console.log('Fetching courses for instructor:', teacherData.user_id);
      
      const { data, error } = await supabase
        .from('courses')
        .select('id, course_name, course_code')
        .eq('instructor_id', teacherData.user_id);

      if (error) {
        console.error('Error fetching courses:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch courses',
          variant: 'destructive'
        });
        return;
      }

      console.log('Fetched courses:', data);
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch courses',
        variant: 'destructive'
      });
    }
  };

  const fetchScheduledClasses = async () => {
    try {
      setLoading(true);
      console.log('Fetching scheduled classes for teacher:', teacherData.user_id);
      
      const { data, error } = await supabase
        .from('extra_class_schedule')
        .select(`
          *,
          courses!inner (
            id,
            course_name,
            course_code
          )
        `)
        .eq('teacher_id', teacherData.user_id)
        .not('course_id', 'is', null)
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error fetching scheduled classes:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch scheduled classes',
          variant: 'destructive'
        });
        return;
      }

      console.log('Fetched scheduled classes:', data);
      setScheduledClasses(data || []);
    } catch (error) {
      console.error('Error fetching scheduled classes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch scheduled classes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const scheduleExtraClass = async () => {
    try {
      // Validate required fields
      if (!newClass.title || !newClass.scheduled_date || !newClass.start_time || !newClass.end_time || !newClass.course_id) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields including course selection',
          variant: 'destructive'
        });
        return;
      }

      // Validate time order
      if (newClass.start_time >= newClass.end_time) {
        toast({
          title: 'Error',
          description: 'Start time must be before end time',
          variant: 'destructive'
        });
        return;
      }

      console.log('Scheduling class with data:', {
        teacher_id: teacherData.user_id,
        course_id: newClass.course_id,
        title: newClass.title,
        description: newClass.description,
        scheduled_date: newClass.scheduled_date,
        start_time: newClass.start_time,
        end_time: newClass.end_time,
        room_location: newClass.room_location,
        class_type: newClass.class_type,
        status: 'scheduled'
      });

      // Create the class schedule entry in the database
      const { data, error } = await supabase
        .from('extra_class_schedule')
        .insert({
          teacher_id: teacherData.user_id,
          course_id: newClass.course_id,
          title: newClass.title,
          description: newClass.description || null,
          scheduled_date: newClass.scheduled_date,
          start_time: newClass.start_time,
          end_time: newClass.end_time,
          room_location: newClass.room_location || null,
          class_type: newClass.class_type,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        toast({
          title: 'Error',
          description: `Failed to schedule class: ${error.message}`,
          variant: 'destructive'
        });
        return;
      }

      console.log('Class scheduled successfully:', data);

      toast({
        title: 'Success',
        description: `${newClass.class_type.charAt(0).toUpperCase() + newClass.class_type.slice(1)} class scheduled successfully`
      });

      setNewClassDialogOpen(false);

      // Clear the form
      setNewClass({
        title: '',
        description: '',
        scheduled_date: '',
        start_time: '',
        end_time: '',
        room_location: '',
        class_type: 'extra',
        course_id: ''
      });

      // Refresh the scheduled classes list
      await fetchScheduledClasses();
    } catch (error) {
      console.error('Error scheduling class:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule class',
        variant: 'destructive'
      });
    }
  };

  const cancelScheduledClass = async (classId: string) => {
    try {
      const { error } = await supabase
        .from('extra_class_schedule')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', classId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Class cancelled successfully'
      });

      // Refresh the scheduled classes list
      await fetchScheduledClasses();
    } catch (error) {
      console.error('Error cancelling class:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel class',
        variant: 'destructive'
      });
    }
  };

  // Edit scheduled class function
  const startEditClass = (scheduledClass: any) => {
    setEditingClass({
      id: scheduledClass.id,
      title: scheduledClass.title,
      description: scheduledClass.description || '',
      scheduled_date: scheduledClass.scheduled_date,
      start_time: scheduledClass.start_time,
      end_time: scheduledClass.end_time,
      room_location: scheduledClass.room_location || '',
      class_type: scheduledClass.class_type,
      course_id: scheduledClass.course_id || ''
    });
    setEditDialogOpen(true);
  };

  // Update scheduled class function
  const updateScheduledClass = async () => {
    try {
      if (!editingClass.title || !editingClass.scheduled_date || !editingClass.start_time || !editingClass.end_time || !editingClass.course_id) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields including course selection',
          variant: 'destructive'
        });
        return;
      }

      // Validate time order
      if (editingClass.start_time >= editingClass.end_time) {
        toast({
          title: 'Error',
          description: 'Start time must be before end time',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('extra_class_schedule')
        .update({
          title: editingClass.title,
          description: editingClass.description || null,
          scheduled_date: editingClass.scheduled_date,
          start_time: editingClass.start_time,
          end_time: editingClass.end_time,
          room_location: editingClass.room_location || null,
          class_type: editingClass.class_type,
          course_id: editingClass.course_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingClass.id);

      if (error) {
        console.error('Error updating class:', error);
        toast({
          title: 'Error',
          description: `Failed to update class: ${error.message}`,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Class updated successfully'
      });

      setEditDialogOpen(false);
      setEditingClass(null);
      await fetchScheduledClasses();
    } catch (error) {
      console.error('Error updating class:', error);
      toast({
        title: 'Error',
        description: 'Failed to update class',
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
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="schedule">Schedule Classes</TabsTrigger>
          </TabsList>

          {/* Schedule Classes */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-base sm:text-lg">Schedule Extra/Remedial Classes</span>
                  </div>
                  <Dialog open={newClassDialogOpen} onOpenChange={setNewClassDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule Class
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Schedule New Class</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Class Title *</label>
                          <Input
                            placeholder="Enter class title"
                            value={newClass.title}
                            onChange={(e) => setNewClass({...newClass, title: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <Textarea
                            placeholder="Enter class description (optional)"
                            value={newClass.description}
                            onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Course *</label>
                          <Select
                            value={newClass.course_id}
                            onValueChange={(value) => setNewClass({...newClass, course_id: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                            <SelectContent>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.course_code} - {course.course_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {courses.length === 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              No courses found. Make sure you have courses assigned.
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Date *</label>
                          <Input
                            type="date"
                            value={newClass.scheduled_date}
                            onChange={(e) => setNewClass({...newClass, scheduled_date: e.target.value})}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Start Time *</label>
                            <Input
                              type="time"
                              value={newClass.start_time}
                              onChange={(e) => setNewClass({...newClass, start_time: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">End Time *</label>
                            <Input
                              type="time"
                              value={newClass.end_time}
                              onChange={(e) => setNewClass({...newClass, end_time: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Room Location</label>
                          <Input
                            placeholder="Enter room location (optional)"
                            value={newClass.room_location}
                            onChange={(e) => setNewClass({...newClass, room_location: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Class Type</label>
                          <Select
                            value={newClass.class_type}
                            onValueChange={(value) => setNewClass({...newClass, class_type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="extra">Extra Class</SelectItem>
                              <SelectItem value="remedial">Remedial Class</SelectItem>
                              <SelectItem value="makeup">Makeup Class</SelectItem>
                              <SelectItem value="special">Special Session</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button 
                          onClick={scheduleExtraClass} 
                          className="w-full"
                          disabled={!newClass.title || !newClass.course_id || !newClass.scheduled_date || !newClass.start_time || !newClass.end_time}
                        >
                          Schedule Class
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scheduledClasses.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm sm:text-base px-4">
                      No scheduled classes yet. Schedule your first extra or remedial class!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledClasses.map((scheduledClass) => (
                      <Card key={scheduledClass.id} className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex-1 w-full min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-semibold text-sm sm:text-base truncate">{scheduledClass.title}</h3>
                              <Badge variant={
                                scheduledClass.class_type === 'extra' ? 'default' :
                                scheduledClass.class_type === 'remedial' ? 'secondary' :
                                scheduledClass.class_type === 'makeup' ? 'outline' :
                                'destructive'
                              } className="text-xs flex-shrink-0">
                                {scheduledClass.class_type.charAt(0).toUpperCase() + scheduledClass.class_type.slice(1)}
                              </Badge>
                            </div>
                            
                            {scheduledClass.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                                {scheduledClass.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                {new Date(scheduledClass.scheduled_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                {scheduledClass.start_time} - {scheduledClass.end_time}
                              </div>
                              {scheduledClass.room_location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="truncate">{scheduledClass.room_location}</span>
                                </div>
                              )}
                            </div>
                            
                            {scheduledClass.courses && (
                              <div className="flex items-center gap-2 text-xs sm:text-sm">
                                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                <span className="font-medium text-primary truncate">
                                  {scheduledClass.courses.course_code} - {scheduledClass.courses.course_name}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                            {scheduledClass.status === 'scheduled' && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => startEditClass(scheduledClass)} className="flex-1 sm:flex-initial text-xs sm:text-sm">
                                  Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => cancelScheduledClass(scheduledClass.id)} className="flex-1 sm:flex-initial text-xs sm:text-sm">
                                  Cancel
                                </Button>
                              </>
                            )}
                            {scheduledClass.status === 'completed' && (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
            </DialogHeader>
            {editingClass && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Class Title *</label>
                  <Input
                    placeholder="Enter class title"
                    value={editingClass.title}
                    onChange={(e) => setEditingClass({...editingClass, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Enter class description (optional)"
                    value={editingClass.description}
                    onChange={(e) => setEditingClass({...editingClass, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Course *</label>
                  <Select
                    value={editingClass.course_id}
                    onValueChange={(value) => setEditingClass({...editingClass, course_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.course_code} - {course.course_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Date *</label>
                  <Input
                    type="date"
                    value={editingClass.scheduled_date}
                    onChange={(e) => setEditingClass({...editingClass, scheduled_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Start Time *</label>
                    <Input
                      type="time"
                      value={editingClass.start_time}
                      onChange={(e) => setEditingClass({...editingClass, start_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Time *</label>
                    <Input
                      type="time"
                      value={editingClass.end_time}
                      onChange={(e) => setEditingClass({...editingClass, end_time: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Room Location</label>
                  <Input
                    placeholder="Enter room location (optional)"
                    value={editingClass.room_location}
                    onChange={(e) => setEditingClass({...editingClass, room_location: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Class Type</label>
                  <Select
                    value={editingClass.class_type}
                    onValueChange={(value) => setEditingClass({...editingClass, class_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="extra">Extra Class</SelectItem>
                      <SelectItem value="remedial">Remedial Class</SelectItem>
                      <SelectItem value="makeup">Makeup Class</SelectItem>
                      <SelectItem value="special">Special Session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={updateScheduledClass} 
                  className="w-full"
                  disabled={!editingClass.title || !editingClass.course_id || !editingClass.scheduled_date || !editingClass.start_time || !editingClass.end_time}
                >
                  Update Class
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PermissionWrapper>
  );
};

export default TeacherExtra;