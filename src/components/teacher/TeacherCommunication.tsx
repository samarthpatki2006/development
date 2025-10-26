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
  Menu,
  CheckCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface TeacherCommunicationProps {
  teacherData: any;
}

const TeacherCommunication = ({ teacherData }: TeacherCommunicationProps) => {
  const [activeTab, setActiveTab] = useState('messages');
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Communication Hub states
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
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
    course_id: ''
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
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data } = await supabase
        .from('courses')
        .select('id, course_name, course_code')
        .eq('instructor_id', user.user.id)
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
    if (!selectedCourse) {
      toast({
        title: 'Error',
        description: 'Please select a course first',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          ...newAnnouncement,
          course_id: selectedCourse,
          college_id: teacherData.college_id,
          created_by: teacherData.user_id,
          target_audience: { type: 'course', course_id: selectedCourse }
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
        course_id: ''
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

  const deleteAnnouncement = async (announcementId: string) => {
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
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('college_id', teacherData.college_id)
        .neq('id', teacherData.user_id)
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
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="announcements">Course Announcements</TabsTrigger>
        </TabsList>

        {/* Messages Tab - Communication Hub */}
        <TabsContent value="messages" className="mt-6">
          <div className="h-[calc(100vh-200px)] flex flex-col bg-background border rounded-lg overflow-hidden">
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Sidebar */}
              <div className={`${
                showMobileSidebar ? 'flex' : 'hidden'
              } md:flex w-full md:w-80 bg-sidebar-background border-r border-sidebar-border flex-col absolute md:relative z-10 h-full overflow-hidden`}>
                <div className="p-4 border-b border-sidebar-border flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Tabs defaultValue="chats" className="flex-1 flex flex-col overflow-hidden min-h-0">
                  <TabsList className="grid w-full grid-cols-2 mx-3 mt-2 flex-shrink-0">
                    <TabsTrigger value="chats">Chats</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                  </TabsList>

                  <TabsContent value="chats" className="flex-1 overflow-y-auto mt-2 m-0 min-h-0">
                    <div className="space-y-1 p-2">
                      {filteredChannels.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground text-sm">No conversations yet</p>
                        </div>
                      ) : (
                        filteredChannels.map(channel => {
                          const isGroup = channel.channel_type === 'group' || channel.channel_type === 'course';
                          const lastRead = lastReadTimestamps[channel.id];
                          const hasUnread = lastRead ? new Date(channel.lastMessageTime) > new Date(lastRead) : false;
                          
                          return (
                            <div
                              key={channel.id}
                              onClick={() => handleChannelSelect(channel)}
                              className={`p-3 rounded-lg cursor-pointer transition-all ${
                                selectedChannel?.id === channel.id
                                  ? 'bg-accent'
                                  : 'hover:bg-accent/50'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-foreground font-semibold bg-primary/10">
                                  {channel.channel_name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className={`text-sm truncate ${hasUnread ? 'font-bold' : 'font-semibold'}`}>
                                      {channel.channel_name}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {formatTimestamp(channel.lastMessageTime)}
                                    </span>
                                  </div>
                                  <p className={`text-sm truncate ${hasUnread ? 'font-medium' : 'text-muted-foreground'}`}>
                                    {channel.lastMessage}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="contacts" className="flex-1 overflow-y-auto mt-2 m-0 min-h-0">
                    <div className="p-3 border-b border-sidebar-border">
                      <Input
                        placeholder="Search contacts..."
                        value={contactSearchQuery}
                        onChange={(e) => setContactSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1 p-2">
                      {filteredContacts.map(contact => (
                        <div
                          key={contact.id}
                          className="p-3 hover:bg-accent/50 rounded-lg cursor-pointer"
                          onClick={() => createDirectChannel(contact.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center font-semibold">
                              {getInitials(contact.first_name, contact.last_name)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {contact.first_name} {contact.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">{contact.user_type}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Chat Area */}
              {selectedChannel ? (
                <div className={`${showMobileSidebar ? 'hidden' : 'flex'} md:flex flex-1 flex-col overflow-hidden min-h-0`}>
                  <div className="bg-sidebar-background border-b p-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="md:hidden"
                          onClick={() => {
                            setShowMobileSidebar(true);
                            setSelectedChannel(null);
                          }}
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-semibold bg-primary/10">
                          {selectedChannel.channel_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="font-semibold">{selectedChannel.channel_name}</h2>
                          <p className="text-sm text-muted-foreground">{selectedChannel.memberCount} members</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                          <p className="text-foreground/70">No messages yet</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => {
                          const isMe = message.sender_id === teacherData.user_id;
                          
                          return (
                            <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`flex items-end space-x-2 max-w-md ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                {!isMe && (
                                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-xs font-semibold">
                                    {getInitials(message.sender.first_name, message.sender.last_name)}
                                  </div>
                                )}
                                <div>
                                  <div className={`px-4 py-2 ${
                                    isMe ? 'bg-primary text-primary-foreground rounded-lg rounded-br-none' : 'bg-card border rounded-lg rounded-bl-none'
                                  }`}>
                                    <p className="text-sm">{message.message_text}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatMessageTime(message.created_at)}
                                  </p>
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
                    <div className="px-6 py-2 bg-sidebar-background/50">
                      <p className="text-sm text-muted-foreground italic">{getTypingText()}</p>
                    </div>
                  )}

                  <div className="bg-sidebar-background border-t p-4">
                    <div className="flex items-end space-x-2">
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
                        className="resize-none"
                        rows={1}
                      />
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`${showMobileSidebar ? 'hidden' : 'flex'} md:flex flex-1 items-center justify-center`}>
                  <div className="text-center">
                    <MessageSquare className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                    <p className="text-muted-foreground">Choose from your existing chats or start a new one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4">
          {/* Course Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Course Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[250px]">
                  <Label htmlFor="announcement-course">Select Course</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger id="announcement-course">
                      <SelectValue placeholder="Choose a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.course_code} - {course.course_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCourse && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2 mt-6">
                        <Plus className="h-4 w-4" />
                        New Announcement
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Course Announcement</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            This announcement will be visible to all students enrolled in:{' '}
                            <span className="font-semibold text-foreground">
                              {courses.find(c => c.id === selectedCourse)?.course_name}
                            </span>
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="announcement-title">Title</Label>
                          <Input
                            id="announcement-title"
                            placeholder="Announcement title"
                            value={newAnnouncement.title}
                            onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="announcement-content">Content</Label>
                          <Textarea
                            id="announcement-content"
                            placeholder="Announcement content"
                            rows={6}
                            value={newAnnouncement.content}
                            onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="announcement-type">Type</Label>
                            <Select
                              value={newAnnouncement.announcement_type}
                              onValueChange={(value) => setNewAnnouncement({...newAnnouncement, announcement_type: value})}
                            >
                              <SelectTrigger id="announcement-type">
                                <SelectValue placeholder="Announcement type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="academic">Academic</SelectItem>
                                <SelectItem value="assignment">Assignment</SelectItem>
                                <SelectItem value="exam">Exam</SelectItem>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="event">Event</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="announcement-priority">Priority</Label>
                            <Select
                              value={newAnnouncement.priority}
                              onValueChange={(value) => setNewAnnouncement({...newAnnouncement, priority: value})}
                            >
                              <SelectTrigger id="announcement-priority">
                                <SelectValue placeholder="Priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Button 
                          onClick={createAnnouncement} 
                          className="w-full"
                          disabled={!newAnnouncement.title || !newAnnouncement.content}
                        >
                          <Megaphone className="h-4 w-4 mr-2" />
                          Create Announcement
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Announcements List */}
          {selectedCourse && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Course Announcements</span>
                  <Badge variant="secondary">{announcements.length} total</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <div className="text-center py-12">
                    <Megaphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg mb-2">No announcements yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first announcement for this course
                    </p>
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
              </CardContent>
            </Card>
          )}

          {!selectedCourse && (
            <Card>
              <CardContent className="p-12 text-center">
                <Megaphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Course</h3>
                <p className="text-muted-foreground">
                  Choose a course from the dropdown above to view and manage announcements
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherCommunication;