import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Send,
  Search,
  Users,
  UserPlus,
  Paperclip,
  Image,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Check,
  GraduationCap,
  BookOpen,
  UserCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ParentCommunicationHub = ({ parentData, initialChannelId }) => {
  const [activeTab, setActiveTab] = useState('chats');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    if (parentData?.user_id) {
      fetchLinkedStudents();
      fetchChannels();
      fetchContacts();
      
      const messageSubscription = supabase
        .channel('messages')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'messages' },
          (payload) => {
            if (selectedChannel && payload.new?.channel_id === selectedChannel.id) {
              fetchMessages(selectedChannel.id);
            }
            fetchChannels();
          }
        )
        .subscribe();

      return () => {
        messageSubscription.unsubscribe();
      };
    }
  }, [parentData?.user_id]);

  useEffect(() => {
    if (initialChannelId && channels.length > 0) {
      const channel = channels.find(c => c.id === initialChannelId);
      if (channel) {
        handleChannelSelect(channel);
      }
    }
  }, [initialChannelId, channels]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [newMessage]);

  const fetchLinkedStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('parent_student_links')
        .select(`
          *,
          student:user_profiles!parent_student_links_student_id_fkey(
            id,
            first_name,
            last_name,
            user_code,
            profile_picture_url
          )
        `)
        .eq('parent_id', parentData.user_id);

      if (error) throw error;
      setLinkedStudents(data || []);
    } catch (error) {
      console.error('Error fetching linked students:', error);
    }
  };

  const fetchChannels = async () => {
    try {
      const { data: memberChannels, error: memberError } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', parentData.user_id);

      if (memberError) throw memberError;

      const channelIds = memberChannels?.map(m => m.channel_id) || [];

      if (channelIds.length === 0) {
        setChannels([]);
        setLoading(false);
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
        .in('id', channelIds)
        .order('created_at', { ascending: false });

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

          const { data: unreadMessages } = await supabase
            .from('messages')
            .select('id')
            .eq('channel_id', channel.id)
            .neq('sender_id', parentData.user_id)
            .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

          return {
            ...channel,
            lastMessage: lastMessage?.message_text || 'No messages yet',
            lastMessageTime: lastMessage?.created_at,
            lastMessageSender: lastMessage?.sender,
            memberCount: count || 0,
            unreadCount: unreadMessages?.length || 0
          };
        })
      );

      setChannels(channelsWithMessages);
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
            user_type,
            profile_picture_url
          ),
          reactions:message_reactions(*)
        `)
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    }
  };

  const fetchContacts = async () => {
    try {
      // Get teachers of linked students
      const studentIds = linkedStudents.map(link => link.student.id);
      
      if (studentIds.length === 0) {
        setContacts([]);
        return;
      }

      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          courses!inner(
            instructor_id,
            course_name,
            instructor:user_profiles!courses_instructor_id_fkey(
              id,
              first_name,
              last_name,
              user_type,
              profile_picture_url
            )
          )
        `)
        .in('student_id', studentIds);

      if (enrollError) throw enrollError;

      // Get unique teachers
      const teachersMap = new Map();
      enrollments?.forEach(enrollment => {
        const teacher = enrollment.courses.instructor;
        if (teacher && !teachersMap.has(teacher.id)) {
          teachersMap.set(teacher.id, {
            ...teacher,
            courses: [enrollment.courses.course_name]
          });
        } else if (teacher) {
          const existing = teachersMap.get(teacher.id);
          existing.courses.push(enrollment.courses.course_name);
        }
      });

      setContacts(Array.from(teachersMap.values()));
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleChannelSelect = async (channel) => {
    setSelectedChannel(channel);
    setMessages([]);
    await fetchMessages(channel.id);
    setActiveTab('chats');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          channel_id: selectedChannel.id,
          sender_id: parentData.user_id,
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
        variant: 'destructive',
      });
    }
  };

  const createDirectChannel = async (contactId) => {
    try {
      const { data: existingChannels } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', parentData.user_id);

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
            setActiveTab('chats');
            return;
          }
        }
      }

      const contact = contacts.find(c => c.id === contactId);
      const { data: newChannel, error: channelError } = await supabase
        .from('communication_channels')
        .insert({
          college_id: parentData.college_id,
          channel_name: `${contact.first_name} ${contact.last_name}`,
          channel_type: 'direct_message',
          is_public: false,
          created_by: parentData.user_id
        })
        .select()
        .single();

      if (channelError) throw channelError;

      const { error: memberError } = await supabase
        .from('channel_members')
        .insert([
          { channel_id: newChannel.id, user_id: parentData.user_id, role: 'member' },
          { channel_id: newChannel.id, user_id: contactId, role: 'member' }
        ]);

      if (memberError) throw memberError;

      await fetchChannels();
      setShowNewChatDialog(false);
      setContactSearchQuery('');
      
      toast({
        title: 'Success',
        description: 'Conversation started',
      });
    } catch (error) {
      console.error('Error creating channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/70">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="bg-sidebar-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Parent Portal - Messages</h1>
            <p className="text-sm text-muted-foreground">Connect with teachers and stay informed</p>
          </div>
          <div className="flex items-center space-x-4">
            {linkedStudents.length > 0 && (
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {linkedStudents.length} {linkedStudents.length === 1 ? 'Child' : 'Children'}
                </span>
              </div>
            )}
            <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-popover border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Contact a Teacher</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Search teachers..."
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                    className="w-full bg-input border-border text-foreground"
                  />
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {filteredContacts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No teachers found</p>
                    ) : (
                      filteredContacts.map(contact => (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between p-3 hover:bg-accent rounded-sm cursor-pointer transition-colors"
                          onClick={() => createDirectChannel(contact.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 border border-border rounded-sm flex items-center justify-center text-foreground font-semibold">
                              {getInitials(contact.first_name, contact.last_name)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {contact.first_name} {contact.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {contact.courses?.slice(0, 2).join(', ')}
                                {contact.courses?.length > 2 ? '...' : ''}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-sidebar-background border-r border-sidebar-border flex flex-col">
          <div className="p-4 border-b border-sidebar-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input border-border text-foreground"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 mx-3 mt-2 bg-muted">
              <TabsTrigger value="chats" className="data-[state=active]:bg-accent">Chats</TabsTrigger>
              <TabsTrigger value="teachers" className="data-[state=active]:bg-accent">Teachers</TabsTrigger>
            </TabsList>

            <TabsContent value="chats" className="flex-1 overflow-y-auto mt-2 m-0">
              <div className="space-y-1 p-2">
                {filteredChannels.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No conversations yet</p>
                    <Button
                      size="sm"
                      variant="link"
                      onClick={() => setShowNewChatDialog(true)}
                      className="mt-2 text-foreground/70"
                    >
                      Contact a teacher
                    </Button>
                  </div>
                ) : (
                  filteredChannels.map(channel => (
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
                          <div className="w-12 h-12 rounded-sm flex items-center justify-center text-foreground font-semibold border border-border bg-primary/10">
                            {channel.channel_name.substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-foreground truncate">{channel.channel_name}</p>
                            {channel.lastMessageTime && (
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(channel.lastMessageTime)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">
                              {channel.lastMessage}
                            </p>
                            {channel.unreadCount > 0 && (
                              <Badge className="ml-2 bg-primary text-primary-foreground">{channel.unreadCount}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="teachers" className="flex-1 overflow-y-auto mt-2 m-0">
              <div className="space-y-1 p-2">
                {filteredContacts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No teachers found</p>
                ) : (
                  filteredContacts.map(contact => (
                    <div
                      key={contact.id}
                      className="p-3 hover:bg-accent/50 rounded-sm cursor-pointer transition-all"
                      onClick={() => createDirectChannel(contact.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 border border-border rounded-sm flex items-center justify-center text-foreground font-semibold">
                          {getInitials(contact.first_name, contact.last_name)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contact.courses?.slice(0, 2).join(', ')}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {selectedChannel ? (
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            <div className="bg-sidebar-background border-b border-border px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-sm flex items-center justify-center text-foreground font-semibold border border-border bg-primary/10">
                      {selectedChannel.channel_name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{selectedChannel.channel_name}</h2>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedChannel.channel_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-foreground/70">No messages yet</p>
                    <p className="text-sm text-muted-foreground">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isMe = message.sender_id === parentData.user_id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-end space-x-2 max-w-md ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {!isMe && (
                            <div className="w-8 h-8 bg-primary/10 border border-border rounded-sm flex items-center justify-center text-foreground text-xs font-semibold flex-shrink-0">
                              {getInitials(message.sender.first_name, message.sender.last_name)}
                            </div>
                          )}
                          <div>
                            {!isMe && (
                              <p className="text-xs text-muted-foreground mb-1 ml-2">
                                {message.sender.first_name} {message.sender.last_name}
                              </p>
                            )}
                            <div
                              className={`px-4 py-2 ${
                                isMe
                                  ? 'bg-primary text-primary-foreground rounded-sm rounded-br-none'
                                  : 'bg-card border border-border text-foreground rounded-sm rounded-bl-none'
                              }`}
                            >
                              <p className="text-sm break-words">{message.message_text}</p>
                            </div>
                            <div className={`flex items-center space-x-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(message.created_at)}
                              </span>
                              {isMe && !message.is_edited && (
                                <Check className="h-3 w-3 text-muted-foreground" />
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

            <div className="bg-sidebar-background border-t border-border px-6 py-4 flex-shrink-0">
              <div className="flex items-end space-x-2">
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <Image className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="resize-none pr-10 bg-input border-border text-foreground min-h-[40px] max-h-[120px]"
                    rows={1}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="w-24 h-24 bg-primary/10 border border-border rounded-sm flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-12 w-12 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Select a conversation</h3>
              <p className="text-muted-foreground mb-6">Choose from your existing chats or contact a teacher</p>
              <Button onClick={() => setShowNewChatDialog(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Teacher
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentCommunicationHub;