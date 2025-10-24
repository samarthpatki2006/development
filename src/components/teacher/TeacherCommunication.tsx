
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Megaphone,
  Reply,
  Eye,
  Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface TeacherCommunicationProps {
  teacherData: any;
}

const TeacherCommunication = ({ teacherData }: TeacherCommunicationProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    content: '',
    message_type: 'direct',
    course_id: ''
  });

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    announcement_type: 'academic',
    priority: 'normal',
    target_audience: 'all'
  });

  useEffect(() => {
    fetchData();
  }, [teacherData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMessages(),
        fetchAnnouncements(),
        fetchStudentsAndCourses()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('teacher_messages')
      .select(`
        *,
        user_profiles!teacher_messages_sender_id_fkey (
          first_name,
          last_name,
          user_type
        ),
        courses (
          course_name
        )
      `)
      .or(`sender_id.eq.${teacherData.user_id},recipient_id.eq.${teacherData.user_id}`)
      .order('sent_at', { ascending: false });

    if (!error && data) {
      setMessages(data);
    }
  };

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('created_by', teacherData.user_id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    }
  };

  const fetchStudentsAndCourses = async () => {
    // Fetch teacher's courses
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', teacherData.user_id);

    if (coursesData) {
      setCourses(coursesData);

      // Fetch students from all courses
      const courseIds = coursesData.map(course => course.id);
      const { data: studentsData } = await supabase
        .from('enrollments')
        .select(`
          *,
          user_profiles!enrollments_student_id_fkey (
            id,
            first_name,
            last_name,
            email
          ),
          courses (
            course_name
          )
        `)
        .in('course_id', courseIds)
        .eq('status', 'enrolled');

      if (studentsData) {
        setStudents(studentsData);
      }
    }
  };

  const sendMessage = async () => {
    try {
      const { error } = await supabase
        .from('teacher_messages')
        .insert({
          ...newMessage,
          sender_id: teacherData.user_id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Message sent successfully'
      });

      setNewMessage({
        recipient_id: '',
        subject: '',
        content: '',
        message_type: 'direct',
        course_id: ''
      });

      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const createAnnouncement = async () => {
    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          ...newAnnouncement,
          college_id: teacherData.college_id,
          created_by: teacherData.user_id,
          target_audience: { type: newAnnouncement.target_audience }
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Announcement created successfully'
      });

      setNewAnnouncement({
        title: '',
        content: '',
        announcement_type: 'academic',
        priority: 'normal',
        target_audience: 'all'
      });

      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to create announcement',
        variant: 'destructive'
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('teacher_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('recipient_id', teacherData.user_id);

      if (error) throw error;
      fetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages" className="text-xs sm:text-sm">Messages</TabsTrigger>
          <TabsTrigger value="announcements" className="text-xs sm:text-sm">Announcements</TabsTrigger>
          <TabsTrigger value="compose" className="text-xs sm:text-sm">Compose</TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">No messages</p>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <Card key={message.id} className={`cursor-pointer transition-colors ${!message.is_read && message.recipient_id === teacherData.user_id ? 'bg-blue-50' : ''}`}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="space-y-3">
                          <div className="flex-1" onClick={() => markAsRead(message.id)}>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <p className="font-medium text-xs sm:text-sm">
                                {message.sender_id === teacherData.user_id ? 'To: ' : 'From: '}
                                {message.user_profiles?.first_name} {message.user_profiles?.last_name}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {message.user_profiles?.user_type}
                              </Badge>
                              {message.courses && (
                                <Badge variant="secondary" className="text-xs">
                                  {message.courses.course_name}
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-sm sm:text-base">{message.subject}</p>
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{message.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(message.sent_at).toLocaleDateString()} at {new Date(message.sent_at).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t justify-end">
                            {!message.is_read && message.recipient_id === teacherData.user_id && (
                              <Badge variant="destructive" className="text-xs">New</Badge>
                            )}
                            <Button size="sm" variant="outline">
                              <Reply className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-base sm:text-lg">My Announcements</span>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 w-full sm:w-auto text-xs sm:text-sm">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      New Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg">Create Announcement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Announcement title"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                        className="text-sm"
                      />
                      <Textarea
                        placeholder="Announcement content"
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                        className="text-sm"
                      />
                      <Select
                        value={newAnnouncement.announcement_type}
                        onValueChange={(value) => setNewAnnouncement({...newAnnouncement, announcement_type: value})}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Announcement type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={newAnnouncement.priority}
                        onValueChange={(value) => setNewAnnouncement({...newAnnouncement, priority: value})}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={createAnnouncement} className="w-full text-sm">
                        Create Announcement
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">No announcements</p>
              ) : (
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <Card key={announcement.id}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="space-y-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant={announcement.priority === 'urgent' ? 'destructive' : 'outline'} className="text-xs">
                                {announcement.priority}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {announcement.announcement_type}
                              </Badge>
                              {announcement.is_active ? (
                                <Badge variant="default" className="text-xs">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Inactive</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-sm sm:text-base">{announcement.title}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">{announcement.content}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Created: {new Date(announcement.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex justify-end pt-2 border-t">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                Compose Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={newMessage.recipient_id}
                onValueChange={(value) => setNewMessage({...newMessage, recipient_id: value})}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.student_id} value={student.student_id}>
                      {student.user_profiles?.first_name} {student.user_profiles?.last_name} - {student.courses?.course_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={newMessage.course_id}
                onValueChange={(value) => setNewMessage({...newMessage, course_id: value})}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select course (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.course_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                className="text-sm"
              />

              <Textarea
                placeholder="Message content"
                rows={6}
                value={newMessage.content}
                onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                className="text-sm"
              />

              <Button onClick={sendMessage} className="w-full text-sm">
                <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherCommunication;
