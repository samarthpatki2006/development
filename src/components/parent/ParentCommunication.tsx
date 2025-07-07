
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { MessageSquare, Send, Inbox, Bell, Users } from 'lucide-react';

interface ParentCommunicationProps {
  user: any;
}

const ParentCommunication = ({ user }: ParentCommunicationProps) => {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    content: '',
    message_type: 'direct'
  });
  const [feedback, setFeedback] = useState({
    course_id: '',
    feedback_type: 'general',
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
    fetchAnnouncements();
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      fetchMessages();
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

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_messages')
        .select(`
          *,
          sender:user_profiles!sender_id (first_name, last_name, user_type),
          recipient:user_profiles!recipient_id (first_name, last_name, user_type),
          courses (course_name)
        `)
        .or(`sender_id.eq.${user.user_id},recipient_id.eq.${user.user_id}`)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    }
  };

  const fetchTeachers = async (studentId: string) => {
    try {
      // Get teachers for courses the student is enrolled in
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

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          user_profiles!created_by (first_name, last_name)
        `)
        .eq('college_id', user.college_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.recipient_id || !newMessage.subject || !newMessage.content) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('teacher_messages')
        .insert({
          sender_id: user.user_id,
          recipient_id: newMessage.recipient_id,
          subject: newMessage.subject,
          content: newMessage.content,
          message_type: newMessage.message_type
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Message sent successfully',
      });

      setNewMessage({
        recipient_id: '',
        subject: '',
        content: '',
        message_type: 'direct'
      });

      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const submitFeedback = async () => {
    if (!selectedChild || !feedback.title || !feedback.content) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('parent_feedback')
        .insert({
          parent_id: user.user_id,
          student_id: selectedChild,
          course_id: feedback.course_id || null,
          feedback_type: feedback.feedback_type,
          title: feedback.title,
          content: feedback.content
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Feedback submitted successfully',
      });

      setFeedback({
        course_id: '',
        feedback_type: 'general',
        title: '',
        content: ''
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        variant: 'destructive',
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('teacher_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
      fetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'parent_inquiry': return 'bg-blue-100 text-blue-800';
      case 'announcement': return 'bg-green-100 text-green-800';
      case 'direct': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
        {/* Send New Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Send Message to Teacher</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Teacher</Label>
              <Select
                value={newMessage.recipient_id}
                onValueChange={(value) => setNewMessage({ ...newMessage, recipient_id: value })}
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
              <Label>Subject</Label>
              <Input
                placeholder="Enter subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message here..."
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                rows={4}
              />
            </div>
            <Button onClick={sendMessage} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </CardContent>
        </Card>

        {/* Submit Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Submit Feedback</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Feedback Type</Label>
              <Select
                value={feedback.feedback_type}
                onValueChange={(value) => setFeedback({ ...feedback, feedback_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="concern">Concern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                placeholder="Enter feedback title"
                value={feedback.title}
                onChange={(e) => setFeedback({ ...feedback, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Feedback</Label>
              <Textarea
                placeholder="Share your feedback or concerns..."
                value={feedback.content}
                onChange={(e) => setFeedback({ ...feedback, content: e.target.value })}
                rows={4}
              />
            </div>
            <Button onClick={submitFeedback} className="w-full">
              <MessageSquare className="h-4 w-4 mr-2" />
              Submit Feedback
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Inbox className="h-5 w-5" />
            <span>Messages</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${
                  !message.is_read && message.recipient_id === user.user_id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => {
                  if (!message.is_read && message.recipient_id === user.user_id) {
                    markAsRead(message.id);
                  }
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{message.subject}</h4>
                    <p className="text-sm text-gray-600">
                      {message.sender_id === user.user_id ? 'To:' : 'From:'}{' '}
                      {message.sender_id === user.user_id
                        ? `${message.recipient.first_name} ${message.recipient.last_name}`
                        : `${message.sender.first_name} ${message.sender.last_name}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getMessageTypeColor(message.message_type)}>
                      {message.message_type}
                    </Badge>
                    {!message.is_read && message.recipient_id === user.user_id && (
                      <Badge variant="destructive">Unread</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{message.content}</p>
                <div className="text-xs text-gray-500">
                  {new Date(message.sent_at).toLocaleString()}
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-center text-gray-500 py-8">No messages found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Recent Announcements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="border-l-4 border-blue-500 pl-4 py-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{announcement.title}</h4>
                  <Badge variant="outline">{announcement.announcement_type}</Badge>
                </div>
                <p className="text-sm text-gray-700 mb-2">{announcement.content}</p>
                <div className="text-xs text-gray-500">
                  By {announcement.user_profiles.first_name} {announcement.user_profiles.last_name} • {' '}
                  {new Date(announcement.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <p className="text-center text-gray-500 py-8">No announcements available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentCommunication;
