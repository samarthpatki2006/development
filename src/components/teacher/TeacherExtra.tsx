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
    if (teacherData) {
      fetchScheduledClasses();
    }
  }, [teacherData]);

  const fetchScheduledClasses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('extra_class_schedule')
        .select(`
          *,
          courses (
            course_name,
            course_code
          )
        `)
        .eq('teacher_id', teacherData.user_id)
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error fetching scheduled classes:', error);
        return;
      }

      if (data) {
        setScheduledClasses(data);
      }
    } catch (error) {
      console.error('Error fetching scheduled classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleExtraClass = async () => {
    try {
      // Validate required fields
      if (!newClass.title || !newClass.scheduled_date || !newClass.start_time || !newClass.end_time) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      // Create the class schedule entry in the database
      const { data, error } = await supabase
        .from('extra_class_schedule')
        .insert({
          teacher_id: teacherData.user_id,
          course_id: newClass.course_id || null,
          title: newClass.title,
          description: newClass.description,
          scheduled_date: newClass.scheduled_date,
          start_time: newClass.start_time,
          end_time: newClass.end_time,
          room_location: newClass.room_location,
          class_type: newClass.class_type,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

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
        .update({ status: 'cancelled' })
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
      if (!editingClass.title || !editingClass.scheduled_date || !editingClass.start_time || !editingClass.end_time) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('extra_class_schedule')
        .update({
          title: editingClass.title,
          description: editingClass.description,
          scheduled_date: editingClass.scheduled_date,
          start_time: editingClass.start_time,
          end_time: editingClass.end_time,
          room_location: editingClass.room_location,
          class_type: editingClass.class_type,
          course_id: editingClass.course_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingClass.id);

      if (error) throw error;

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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Schedule Extra/Remedial Classes
                  </div>
                  <Dialog open={newClassDialogOpen} onOpenChange={setNewClassDialogOpen}>
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
                          value={newClass.scheduled_date}
                          onChange={(e) => setNewClass({...newClass, scheduled_date: e.target.value})}
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
                          className="w-full p-2 border rounded bg-background"
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
                {scheduledClasses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No scheduled classes yet. Schedule your first extra or remedial class!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {scheduledClasses.map((scheduledClass) => (
                      <Card key={scheduledClass.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{scheduledClass.title}</h3>
                              <Badge variant={
                                scheduledClass.class_type === 'extra' ? 'default' :
                                scheduledClass.class_type === 'remedial' ? 'secondary' :
                                scheduledClass.class_type === 'makeup' ? 'outline' :
                                'destructive'
                              }>
                                {scheduledClass.class_type.charAt(0).toUpperCase() + scheduledClass.class_type.slice(1)}
                              </Badge>
                              <Badge variant={
                                scheduledClass.status === 'scheduled' ? 'default' :
                                scheduledClass.status === 'completed' ? 'outline' :
                                'destructive'
                              }>
                                {scheduledClass.status?.charAt(0).toUpperCase() + scheduledClass.status?.slice(1)}
                              </Badge>
                            </div>
                            
                            {scheduledClass.description && (
                              <p className="text-sm text-muted-foreground mb-2">{scheduledClass.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(scheduledClass.scheduled_date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {scheduledClass.start_time} - {scheduledClass.end_time}
                              </div>
                              {scheduledClass.room_location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {scheduledClass.room_location}
                                </div>
                              )}
                            </div>
                            
                            {scheduledClass.courses && (
                              <div className="flex items-center gap-2 text-sm">
                                <BookOpen className="h-4 w-4" />
                                <span className="font-medium">
                                  {scheduledClass.courses.course_code} - {scheduledClass.courses.course_name}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {scheduledClass.status === 'scheduled' && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => startEditClass(scheduledClass)}>
                                  Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => cancelScheduledClass(scheduledClass.id)}>
                                  Cancel
                                </Button>
                              </>
                            )}
                            {scheduledClass.status === 'completed' && (
                              <Badge variant="outline">
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
            </DialogHeader>
            {editingClass && (
              <div className="space-y-4">
                <Input
                  placeholder="Class title"
                  value={editingClass.title}
                  onChange={(e) => setEditingClass({...editingClass, title: e.target.value})}
                />
                
                <Textarea
                  placeholder="Class description"
                  value={editingClass.description}
                  onChange={(e) => setEditingClass({...editingClass, description: e.target.value})}
                />
                
                <Input
                  type="date"
                  value={editingClass.scheduled_date}
                  onChange={(e) => setEditingClass({...editingClass, scheduled_date: e.target.value})}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="time"
                    placeholder="Start time"
                    value={editingClass.start_time}
                    onChange={(e) => setEditingClass({...editingClass, start_time: e.target.value})}
                  />
                  <Input
                    type="time"
                    placeholder="End time"
                    value={editingClass.end_time}
                    onChange={(e) => setEditingClass({...editingClass, end_time: e.target.value})}
                  />
                </div>
                
                <Input
                  placeholder="Room location"
                  value={editingClass.room_location}
                  onChange={(e) => setEditingClass({...editingClass, room_location: e.target.value})}
                />
                
                <select
                  className="w-full p-2 border rounded bg-background"
                  value={editingClass.class_type}
                  onChange={(e) => setEditingClass({...editingClass, class_type: e.target.value})}
                >
                  <option value="extra">Extra Class</option>
                  <option value="remedial">Remedial Class</option>
                  <option value="makeup">Makeup Class</option>
                  <option value="special">Special Session</option>
                </select>
                
                <Button onClick={updateScheduledClass} className="w-full">
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