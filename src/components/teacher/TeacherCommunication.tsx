import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  Send,
  Search,
  Users,
  Megaphone,
  Plus,
  Eye,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  CheckCheck,
  UserPlus,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TeacherCommunication = ({ teacherData }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Communication Hub states
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [lastReadTimestamps, setLastReadTimestamps] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    announcement_type: 'academic',
    priority: 'normal',
    course_id: '',
    target_type: 'course' // 'course' or 'general'
  });

  useEffect(() => {
    fetchCourses();
    if (teacherData?.user_id) {
      fetchChannels();
      fetchContacts();
      loadLastReadTimestamps();
      setupRealtimeSubscriptions();
    }
  }, [teacherData]);

  useEffect(() => {
    if (selectedCourse) {
      fetchAnnouncements();
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
      markChannelAsRead(selectedChannel.id);
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const setupRealtimeSubscriptions = () => {
    const messageSubscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          handleNewMessage(payload.new);
        }
      )
      .subscribe();

    const typingChannel = supabase.channel('typing-indicators');
    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        handleTypingIndicator(payload);
      })
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      typingChannel.unsubscribe();
    };
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('courses')
        .select('id, course_name, course_code')
        .eq('instructor_id', teacherData.user_id)
        .eq('is_active', true);

      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    if (!selectedCourse) return;

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          courses!announcements_course_id_fkey (
            course_name,
            course_code
          )
        `)
        .eq('course_id', selectedCourse)
        .eq('created_by', teacherData.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const createAnnouncement = async () => {
    if (newAnnouncement.target_type === 'course' && !newAnnouncement.course_id) {
      toast({
        title: 'Error',
        description: 'Please select a course for course-specific announcement',
        variant: 'destructive'
      });
      return;
    }

    try {
      const announcementData = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        announcement_type: newAnnouncement.announcement_type,
        priority: newAnnouncement.priority,
        college_id: teacherData.college_id,
        created_by: teacherData.user_id,
        is_active: true
      };

      // Add course_id and target_audience based on type
      if (newAnnouncement.target_type === 'course') {
        announcementData.course_id = newAnnouncement.course_id;
        announcementData.target_audience = { 
          type: 'course', 
          course_id: newAnnouncement.course_id 
        };
      } else {
        announcementData.course_id = null;
        announcementData.target_audience = { type: 'all_students' };
      }

      const { error } = await supabase
        .from('announcements')
        .insert(announcementData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${newAnnouncement.target_type === 'course' ? 'Course' : 'General'} announcement created successfully`
      });

      setNewAnnouncement({
        title: '',
        content: '',
        announcement_type: 'academic',
        priority: 'normal',
        course_id: '',
        target_type: 'course'
      });

      if (selectedCourse && newAnnouncement.target_type === 'course') {
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to create announcement',
        variant: 'destructive'
      });
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId)
        .eq('created_by', teacherData.user_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Announcement deleted successfully'
      });

      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive'
      });
    }
  };

  const handleNewMessage = async (newMessageData) => {
    await fetchChannels();
    
    if (selectedChannel && newMessageData.channel_id === selectedChannel.id) {
      await fetchMessages(selectedChannel.id);
      
      if (document.hasFocus()) {
        markChannelAsRead(selectedChannel.id);
      }
    } else {
      const channel = channels.find(c => c.id === newMessageData.channel_id);
      if (channel && newMessageData.sender_id !== teacherData.user_id) {
        toast({
          title: channel.channel_name,
          description: newMessageData.message_text.substring(0, 50) + '...',
          duration: 3000,
        });
      }
    }
  };

  const handleTypingIndicator = (payload) => {
    const { channel_id, user_id, user_name, is_typing } = payload.payload;
    
    if (user_id === teacherData.user_id) return;
    
    setTypingUsers(prev => {
      const newState = { ...prev };
      if (!newState[channel_id]) {
        newState[channel_id] = {};
      }
      
      if (is_typing) {
        newState[channel_id][user_id] = user_name;
      } else {
        delete newState[channel_id][user_id];
      }
      
      return newState;
    });
  };

  const sendTypingIndicator = (isTyping) => {
    if (!selectedChannel) return;
    
    supabase.channel('typing-indicators').send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        channel_id: selectedChannel.id,
        user_id: teacherData.user_id,
        user_name: `${teacherData.first_name} ${teacherData.last_name}`,
        is_typing: isTyping
      }
    });
  };

  const handleTyping = () => {
    sendTypingIndicator(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 3000);
  };

  const loadLastReadTimestamps = () => {
    const stored = localStorage.getItem(`lastRead_${teacherData.user_id}`);
    if (stored) {
      setLastReadTimestamps(JSON.parse(stored));
    }
  };

  const markChannelAsRead = (channelId) => {
    const now = new Date().toISOString();
    const updated = { ...lastReadTimestamps, [channelId]: now };
    setLastReadTimestamps(updated);
    localStorage.setItem(`lastRead_${teacherData.user_id}`, JSON.stringify(updated));
  };

  const fetchChannels = async () => {
    try {
      const { data: memberChannels, error: memberError } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', teacherData.user_id);

      if (memberError) throw memberError;

      const channelIds = memberChannels?.map(m => m.channel_id) || [];

      if (channelIds.length === 0) {
        setChannels([]);
        return;
      }

      const { data: channelData, error: channelError } = await supabase
        .from('communication_channels')
        .select(`
          *,
          created_by_user:user_profiles!communication_channels_created_by_fkey(
            first_name,
            last_name,
            user_type
          )
        `)
        .in('id', channelIds);

      if (channelError) throw channelError;

      const channelsWithMessages = await Promise.all(
        (channelData || []).map(async (channel) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:user_profiles!messages_sender_id_fkey(first_name, last_name)
            `)
            .eq('channel_id', channel.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count } = await supabase
            .from('channel_members')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.id);

          return {
            ...channel,
            lastMessage: lastMessage?.message_text || 'No messages yet',
            lastMessageTime: lastMessage?.created_at || channel.created_at,
            lastMessageSender: lastMessage?.sender,
            memberCount: count || 0
          };
        })
      );

      channelsWithMessages.sort((a, b) => 
        new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );

      setChannels(channelsWithMessages);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const fetchMessages = async (channelId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles!messages_sender_id_fkey(
            first_name,
            last_name,
            user_type
          )
        `)
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      // Teachers can contact other teachers, students, and alumni
      const allowedUserTypes = ['teacher', 'student', 'alumni'];
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('college_id', teacherData.college_id)
        .neq('id', teacherData.user_id)
        .in('user_type', allowedUserTypes)
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleChannelSelect = async (channel) => {
    setSelectedChannel(channel);
    setMessages([]);
    await fetchMessages(channel.id);
    markChannelAsRead(channel.id);
    setShowMobileSidebar(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    sendTypingIndicator(false);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          channel_id: selectedChannel.id,
          sender_id: teacherData.user_id,
          message_text: messageText,
          message_type: 'text'
        });

      if (error) throw error;

      await fetchMessages(selectedChannel.id);
      await fetchChannels();
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const createDirectChannel = async (contactId) => {
    try {
      const { data: existingChannels } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', teacherData.user_id);

      const myChannelIds = existingChannels?.map(c => c.channel_id) || [];

      if (myChannelIds.length > 0) {
        const { data: theirChannels } = await supabase
          .from('channel_members')
          .select('channel_id, communication_channels!inner(channel_type)')
          .eq('user_id', contactId)
          .in('channel_id', myChannelIds);

        const existingDirect = theirChannels?.find(
          c => c.communication_channels.channel_type === 'direct_message'
        );

        if (existingDirect) {
          const channel = channels.find(c => c.id === existingDirect.channel_id);
          if (channel) {
            setSelectedChannel(channel);
            await fetchMessages(channel.id);
            setShowNewChatDialog(false);
            setContactSearchQuery('');
            setShowMobileSidebar(false);
            return;
          }
        }
      }

      const contact = contacts.find(c => c.id === contactId);
      const { data: newChannel, error: channelError } = await supabase
        .from('communication_channels')
        .insert({
          college_id: teacherData.college_id,
          channel_name: `${contact.first_name} ${contact.last_name}`,
          channel_type: 'direct_message',
          is_public: false,
          created_by: teacherData.user_id
        })
        .select()
        .single();

      if (channelError) throw channelError;

      const { error: memberError } = await supabase
        .from('channel_members')
        .insert([
          { channel_id: newChannel.id, user_id: teacherData.user_id, role: 'member' },
          { channel_id: newChannel.id, user_id: contactId, role: 'member' }
        ]);

      if (memberError) throw memberError;

      await fetchChannels();
      setShowNewChatDialog(false);
      setContactSearchQuery('');
      
      toast({
        title: 'Success',
        description: 'Conversation started'
      });
    } catch (error) {
      console.error('Error creating channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive'
      });
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredChannels = channels.filter(channel =>
    channel.channel_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter(contact =>
    `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(contactSearchQuery.toLowerCase())
  );

  const getTypingText = () => {
    if (!selectedChannel || !typingUsers[selectedChannel.id]) return null;
    
    const typing = Object.values(typingUsers[selectedChannel.id]);
    if (typing.length === 0) return null;
    
    if (typing.length === 1) return `${typing[0]} is typing...`;
    if (typing.length === 2) return `${typing[0]} and ${typing[1]} are typing...`;
    return `${typing.length} people are typing...`;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="bg-sidebar-background border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Communication Hub</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Messages and Announcements</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="messages" className="h-full flex flex-col">
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
            <TabsTrigger value="messages" className="text-xs sm:text-sm">Messages</TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs sm:text-sm">Announcements</TabsTrigger>
          </TabsList>

          {/* Messages Tab */}
          <TabsContent value="messages" className="flex-1 m-0 overflow-hidden">
            <div className="h-full flex overflow-hidden">
              {/* Sidebar */}
              <div className={`w-full lg:w-80 bg-sidebar-background border-r border-sidebar-border flex flex-col ${
                selectedChannel ? 'hidden lg:flex' : 'flex'
              }`}>
                <div className="p-3 sm:p-4 border-b border-sidebar-border">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-input border-border text-foreground text-sm"
                    />
                  </div>
                  <Button 
                    onClick={() => setShowNewChatDialog(true)} 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm"
                    size="sm"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 p-2">
                  {filteredChannels.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No conversations yet</p>
                    </div>
                  ) : (
                    filteredChannels.map(channel => {
                      const isGroup = channel.channel_type === 'group' || channel.channel_type === 'course';
                      
                      return (
                        <div
                          key={channel.id}
                          onClick={() => handleChannelSelect(channel)}
                          className={`p-3 rounded-sm cursor-pointer transition-all ${
                            selectedChannel?.id === channel.id
                              ? 'bg-accent border-l-2 border-primary'
                              : 'hover:bg-accent/50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative flex-shrink-0">
                              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-sm flex items-center justify-center text-foreground font-semibold border border-border ${
                                isGroup ? 'bg-primary/10' : 'bg-primary/5'
                              }`}>
                                {channel.channel_name.substring(0, 2).toUpperCase()}
                              </div>
                              {isGroup && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-sidebar-background border-2 border-sidebar-border rounded-sm flex items-center justify-center">
                                  <Users className="h-2 w-2 sm:h-3 sm:w-3 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-sm sm:text-base text-foreground truncate">{channel.channel_name}</p>
                                {channel.lastMessageTime && (
                                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                    {formatTimestamp(channel.lastMessageTime)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {channel.lastMessageSender && isGroup
                                  ? `${channel.lastMessageSender.first_name}: ${channel.lastMessage}`
                                  : channel.lastMessage
                                }
                              </p>
                              {isGroup && (
                                <p className="text-xs text-muted-foreground mt-1">{channel.memberCount} members</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat Area */}
              {selectedChannel ? (
                <div className="w-full lg:flex-1 flex flex-col bg-background">
                  <div className="bg-sidebar-background border-b border-border px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedChannel(null);
                            setShowMobileSidebar(true);
                          }}
                          className="lg:hidden flex-shrink-0 p-2"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </Button>
                        
                        <div className="relative flex-shrink-0">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-sm flex items-center justify-center text-foreground font-semibold border border-border ${
                            selectedChannel.channel_type === 'group' || selectedChannel.channel_type === 'course'
                              ? 'bg-primary/10' 
                              : 'bg-primary/5'
                          }`}>
                            {selectedChannel.channel_name.substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="font-semibold text-sm sm:text-base text-foreground truncate">{selectedChannel.channel_name}</h2>
                          <p className="text-xs sm:text-sm text-muted-foreground capitalize truncate">
                            {selectedChannel.channel_type === 'group' || selectedChannel.channel_type === 'course'
                              ? `${selectedChannel.memberCount} members`
                              : selectedChannel.channel_type.replace('_', ' ')
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 min-h-0">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageSquare className="h-12 md:h-16 w-12 md:w-16 text-muted-foreground mx-auto mb-4" />
                          <p className="text-foreground/70 text-sm md:text-base">No messages yet</p>
                          <p className="text-xs md:text-sm text-muted-foreground">Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {messages.map((message, index) => {
                          const isMe = message.sender_id === teacherData.user_id;
                          const isGroup = selectedChannel.channel_type === 'group' || selectedChannel.channel_type === 'course';
                          const showAvatar = !isMe && (index === 0 || messages[index - 1].sender_id !== message.sender_id);
                          
                          return (
                            <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`flex items-end space-x-2 max-w-[85%] md:max-w-md ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                {!isMe && showAvatar && (
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 border border-border rounded-sm flex items-center justify-center text-foreground text-[10px] sm:text-xs font-semibold flex-shrink-0 mb-1">
                                    {getInitials(message.sender.first_name, message.sender.last_name)}
                                  </div>
                                )}
                                {!isMe && !showAvatar && (
                                  <div className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0"></div>
                                )}
                                <div className="max-w-full">
                                  {isGroup && !isMe && showAvatar && (
                                    <p className="text-xs text-muted-foreground mb-1 ml-2">
                                      {message.sender.first_name} {message.sender.last_name}
                                    </p>
                                  )}
                                  <div
                                    className={`px-3 md:px-4 py-2 ${
                                      isMe
                                        ? 'bg-primary text-primary-foreground rounded-sm rounded-br-none'
                                        : 'bg-card border border-border text-foreground rounded-sm rounded-bl-none'
                                    }`}
                                  >
                                    <p className="text-xs md:text-sm break-words">{message.message_text}</p>
                                  </div>
                                  <div className={`flex items-center space-x-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <span className="text-xs text-muted-foreground">
                                      {formatMessageTime(message.created_at)}
                                    </span>
                                    {isMe && (
                                      <CheckCheck className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {getTypingText() && (
                    <div className="px-4 md:px-6 py-2 bg-sidebar-background/50 flex-shrink-0">
                      <p className="text-xs md:text-sm text-muted-foreground italic">{getTypingText()}</p>
                    </div>
                  )}

                  <div className="bg-sidebar-background border-t border-border px-3 md:px-6 py-3 md:py-4 flex-shrink-0">
                    <div className="flex items-end space-x-2">
                      <div className="flex-1 relative">
                        <Textarea
                          ref={textareaRef}
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="resize-none pr-10 bg-input border-border text-foreground min-h-[40px] max-h-[120px] text-sm"
                          rows={1}
                        />
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 h-9 w-9 sm:h-10 sm:w-10 p-0"
                        size="sm"
                      >
                        <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden lg:flex flex-1 items-center justify-center bg-background">
                  <div className="text-center px-4">
                    <div className="w-20 sm:w-24 h-20 sm:h-24 bg-primary/10 border border-border rounded-sm flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-10 sm:h-12 w-10 sm:w-12 text-foreground" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Select a conversation</h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-6">Choose from your existing chats or start a new one</p>
                    <Button onClick={() => setShowNewChatDialog(true)} className="bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start New Chat
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="flex-1 m-0 overflow-hidden p-4 sm:p-6">
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  <h2 className="text-lg sm:text-xl font-semibold">Announcements</h2>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 w-full sm:w-auto text-xs sm:text-sm">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      New Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg">Create Announcement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Announcement Target *</Label>
                        <Select
                          value={newAnnouncement.target_type}
                          onValueChange={(value) => setNewAnnouncement({...newAnnouncement, target_type: value, course_id: ''})}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select target" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="course">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Course Specific
                              </div>
                            </SelectItem>
                            <SelectItem value="general">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                General (All Students)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {newAnnouncement.target_type === 'course' && (
                        <div className="space-y-2">
                          <Label>Select Course *</Label>
                          <Select
                            value={newAnnouncement.course_id}
                            onValueChange={(value) => setNewAnnouncement({...newAnnouncement, course_id: value})}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                            <SelectContent>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.course_name} ({course.course_code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Input
                        placeholder="Announcement title *"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                        className="text-sm"
                      />
                      <Textarea
                        placeholder="Announcement content *"
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                        className="text-sm"
                        rows={6}
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
              </div>

              <div className="mb-4 flex-shrink-0">
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Filter by course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.course_name} ({course.course_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 overflow-y-auto">
                {!selectedCourse ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center py-12">
                      <Megaphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Select a Course</h3>
                      <p className="text-muted-foreground">
                        Choose a course to view and manage its announcements
                      </p>
                    </div>
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center py-12">
                      <Megaphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-foreground/70 text-lg mb-2">No announcements yet</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create your first announcement for this course
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((announcement) => (
                      <Card key={announcement.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge 
                                  variant={
                                    announcement.priority === 'urgent' ? 'destructive' : 
                                    announcement.priority === 'high' ? 'default' : 
                                    'outline'
                                  }
                                  className="text-xs"
                                >
                                  {announcement.priority}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {announcement.announcement_type}
                                </Badge>
                                {announcement.is_active ? (
                                  <Badge variant="default" className="text-xs bg-green-500">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              
                              <h3 className="font-semibold text-lg mb-2">{announcement.title}</h3>
                              <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                                {announcement.content}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  Created: {new Date(announcement.created_at).toLocaleDateString()} at{' '}
                                  {new Date(announcement.created_at).toLocaleTimeString()}
                                </span>
                                {announcement.courses && (
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {announcement.courses.course_code}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete Announcement</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                                      <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                                        <div>
                                          <p className="font-medium text-sm mb-1">Are you sure?</p>
                                          <p className="text-sm text-muted-foreground">
                                            This will permanently delete the announcement "{announcement.title}". 
                                            Students will no longer be able to see it.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-3 justify-end">
                                      <DialogTrigger asChild>
                                        <Button variant="outline">Cancel</Button>
                                      </DialogTrigger>
                                      <Button 
                                        variant="destructive" 
                                        onClick={() => deleteAnnouncement(announcement.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Announcement
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Start New Conversation</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col flex-1 overflow-hidden space-y-4">
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={contactSearchQuery}
                onChange={(e) => setContactSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {filteredContacts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No contacts found</p>
              ) : (
                filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    className="p-3 hover:bg-accent rounded-sm cursor-pointer transition-all"
                    onClick={() => createDirectChannel(contact.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 border border-border rounded-sm flex items-center justify-center text-foreground font-semibold flex-shrink-0">
                        {getInitials(contact.first_name, contact.last_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {contact.user_type === 'alumni' ? 'Alumni' : contact.user_type}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherCommunication;