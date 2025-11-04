import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Calendar,
  Plus, 
  Edit, 
  Trash2,
  Search, 
  AlertCircle,
  Clock,
  MapPin,
  BookOpen,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  college_id: string;
  user_type: string;
}

const TimetableManagement = ({ userProfile }: { userProfile: UserProfile }) => {
  const [activeDay, setActiveDay] = useState<number>(new Date().getDay());
  const [schedules, setSchedules] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysOfWeek = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' }
  ];

  const [scheduleForm, setScheduleForm] = useState({
    course_id: '',
    day_of_week: activeDay,
    start_time: '',
    end_time: '',
    room_location: ''
  });

  useEffect(() => {
    loadAllData();
  }, [userProfile]);

  useEffect(() => {
    setScheduleForm(prev => ({ ...prev, day_of_week: activeDay }));
  }, [activeDay]);

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadSchedules(),
      loadCourses(),
      loadInstructors()
    ]);
    setIsLoading(false);
  };

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('class_schedule')
        .select(`
          *,
          courses!inner (
            id,
            course_name,
            course_code,
            instructor_id,
            college_id,
            user_profiles!courses_instructor_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .eq('courses.college_id', userProfile.college_id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        title: "Error",
        description: "Failed to load class schedules.",
        variant: "destructive",
      });
    }
  };

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          course_name,
          course_code,
          instructor_id,
          user_profiles!courses_instructor_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('college_id', userProfile.college_id)
        .order('course_name', { ascending: true });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses.",
        variant: "destructive",
      });
    }
  };

  const loadInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .eq('college_id', userProfile.college_id)
        .eq('user_type', 'teacher')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  };

  const handleAddSchedule = async () => {
    if (!scheduleForm.course_id || !scheduleForm.start_time || !scheduleForm.end_time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate time
    if (scheduleForm.start_time >= scheduleForm.end_time) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('class_schedule')
        .insert([scheduleForm])
        .select(`
          *,
          courses!inner (
            id,
            course_name,
            course_code,
            instructor_id,
            user_profiles!courses_instructor_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .single();

      if (error) throw error;

      setSchedules([...schedules, data]);
      setIsAddScheduleOpen(false);
      resetScheduleForm();

      toast({
        title: "Success",
        description: "Class schedule added successfully.",
      });
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast({
        title: "Error",
        description: "Failed to add class schedule.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSchedule = async () => {
    if (!scheduleForm.course_id || !scheduleForm.start_time || !scheduleForm.end_time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (scheduleForm.start_time >= scheduleForm.end_time) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('class_schedule')
        .update({
          course_id: scheduleForm.course_id,
          day_of_week: scheduleForm.day_of_week,
          start_time: scheduleForm.start_time,
          end_time: scheduleForm.end_time,
          room_location: scheduleForm.room_location
        })
        .eq('id', selectedSchedule.id)
        .select(`
          *,
          courses!inner (
            id,
            course_name,
            course_code,
            instructor_id,
            user_profiles!courses_instructor_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .single();

      if (error) throw error;

      setSchedules(schedules.map(s => s.id === data.id ? data : s));
      setIsEditScheduleOpen(false);
      setSelectedSchedule(null);
      resetScheduleForm();

      toast({
        title: "Success",
        description: "Class schedule updated successfully.",
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update class schedule.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('class_schedule')
        .delete()
        .eq('id', selectedSchedule.id);

      if (error) throw error;

      setSchedules(schedules.filter(s => s.id !== selectedSchedule.id));
      setIsDeleteDialogOpen(false);
      setSelectedSchedule(null);

      toast({
        title: "Success",
        description: "Class schedule deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Error",
        description: "Failed to delete class schedule.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      course_id: '',
      day_of_week: activeDay,
      start_time: '',
      end_time: '',
      room_location: ''
    });
  };

  const openEditDialog = (schedule: any) => {
    setSelectedSchedule(schedule);
    setScheduleForm({
      course_id: schedule.course_id,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      room_location: schedule.room_location || ''
    });
    setIsEditScheduleOpen(true);
  };

  const openDeleteDialog = (schedule: any) => {
    setSelectedSchedule(schedule);
    setIsDeleteDialogOpen(true);
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getInstructorName = (course: any) => {
    if (!course?.user_profiles) return 'No instructor';
    return `${course.user_profiles.first_name || ''} ${course.user_profiles.last_name || ''}`.trim() || 'No instructor';
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesDay = schedule.day_of_week === activeDay;
    const matchesSearch = 
      schedule.courses?.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.courses?.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.room_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getInstructorName(schedule.courses).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDay && matchesSearch;
  }).sort((a, b) => a.start_time.localeCompare(b.start_time));

  const navigateDay = (direction: 'prev' | 'next') => {
    if (direction === 'next') {
      setActiveDay((activeDay + 1) % 7);
    } else {
      setActiveDay((activeDay - 1 + 7) % 7);
    }
  };

  const getScheduleCountForDay = (day: number) => {
    return schedules.filter(s => s.day_of_week === day).length;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading timetable data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Timetable Management</span>
              </CardTitle>
              <CardDescription>
                Manage class schedules and weekly timetable
              </CardDescription>
            </div>
            <Button onClick={() => {
              resetScheduleForm();
              setIsAddScheduleOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Class Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Navigation */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <Button variant="outline" size="sm" onClick={() => navigateDay('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {daysOfWeek[activeDay].label}
              </h3>
              <Button variant="outline" size="sm" onClick={() => navigateDay('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Day Tabs */}
            <div className="grid grid-cols-7 gap-1.5">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  onClick={() => setActiveDay(day.value)}
                  className={`p-2 rounded-md border transition-all ${
                    activeDay === day.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted hover:bg-muted/80 border-muted'
                  }`}
                >
                  <div className="text-xs font-medium">{day.short}</div>
                  <div className="text-[10px] mt-0.5">
                    {getScheduleCountForDay(day.value)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <Input
                placeholder="Search by course, instructor, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          {/* Schedule Cards */}
          {filteredSchedules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSchedules.map((schedule) => (
                <Card key={schedule.id} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <Badge className="mb-1.5 text-xs">{schedule.courses?.course_code}</Badge>
                        <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                          {schedule.courses?.course_name}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1.5 flex-shrink-0" />
                        <span>
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </span>
                      </div>
                      
                      {schedule.room_location && (
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1.5 flex-shrink-0" />
                          <span className="line-clamp-1">{schedule.room_location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1.5 flex-shrink-0" />
                        <span className="line-clamp-1">{getInstructorName(schedule.courses)}</span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => openEditDialog(schedule)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => openDeleteDialog(schedule)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm">
                {searchTerm 
                  ? 'No classes found matching your search'
                  : `No classes scheduled for ${daysOfWeek[activeDay].label}`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Schedule Dialog */}
      <Dialog open={isAddScheduleOpen} onOpenChange={setIsAddScheduleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Class Schedule</DialogTitle>
            <DialogDescription>
              Create a new class schedule for the timetable
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="course">Course *</Label>
              <Select 
                value={scheduleForm.course_id} 
                onValueChange={(value) => setScheduleForm({...scheduleForm, course_id: value})}
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

            <div className="col-span-2">
              <Label htmlFor="day_of_week">Day of Week *</Label>
              <Select 
                value={scheduleForm.day_of_week.toString()} 
                onValueChange={(value) => setScheduleForm({...scheduleForm, day_of_week: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={scheduleForm.start_time}
                onChange={(e) => setScheduleForm({...scheduleForm, start_time: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={scheduleForm.end_time}
                onChange={(e) => setScheduleForm({...scheduleForm, end_time: e.target.value})}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="room_location">Room Location</Label>
              <Input
                id="room_location"
                value={scheduleForm.room_location}
                onChange={(e) => setScheduleForm({...scheduleForm, room_location: e.target.value})}
                placeholder="e.g., Room 101, Building A"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddScheduleOpen(false);
                resetScheduleForm();
              }} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSchedule} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Schedule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditScheduleOpen} onOpenChange={setIsEditScheduleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Class Schedule</DialogTitle>
            <DialogDescription>
              Update the class schedule details
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="edit_course">Course *</Label>
              <Select 
                value={scheduleForm.course_id} 
                onValueChange={(value) => setScheduleForm({...scheduleForm, course_id: value})}
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

            <div className="col-span-2">
              <Label htmlFor="edit_day_of_week">Day of Week *</Label>
              <Select 
                value={scheduleForm.day_of_week.toString()} 
                onValueChange={(value) => setScheduleForm({...scheduleForm, day_of_week: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_start_time">Start Time *</Label>
              <Input
                id="edit_start_time"
                type="time"
                value={scheduleForm.start_time}
                onChange={(e) => setScheduleForm({...scheduleForm, start_time: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit_end_time">End Time *</Label>
              <Input
                id="edit_end_time"
                type="time"
                value={scheduleForm.end_time}
                onChange={(e) => setScheduleForm({...scheduleForm, end_time: e.target.value})}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="edit_room_location">Room Location</Label>
              <Input
                id="edit_room_location"
                value={scheduleForm.room_location}
                onChange={(e) => setScheduleForm({...scheduleForm, room_location: e.target.value})}
                placeholder="e.g., Room 101, Building A"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditScheduleOpen(false);
                setSelectedSchedule(null);
                resetScheduleForm();
              }} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSchedule} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Schedule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this class schedule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="p-4 rounded-lg">
              <p className="font-medium">{selectedSchedule.courses?.course_name}</p>
              <p className="text-sm">
                {daysOfWeek[selectedSchedule.day_of_week]?.label} • {formatTime(selectedSchedule.start_time)} - {formatTime(selectedSchedule.end_time)}
              </p>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedSchedule(null);
              }} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSchedule} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimetableManagement;