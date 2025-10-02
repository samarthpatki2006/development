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
  Archive,
  Star,
  Check,
  CheckCheck,
  Clock,
  X,
  Settings,
  Bell,
  BellOff,
  Download,
  Edit2,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CommunicationHub = ({ studentData }) => {
  const [activeTab, setActiveTab] = useState('chats');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    if (studentData?.user_id) {
      fetchChannels();
      fetchContacts();
      
      // Subscribe to real-time message updates
      const messageSubscription = supabase
        .channel('messages')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'messages' },
          (payload) => {
            if (selectedChannel && payload.new.channel_id === selectedChannel.id) {
              fetchMessages(selectedChannel.id);
            }
            fetchChannels(); // Update last message in channel list
          }
        )
        .subscribe();

      return () => {
        messageSubscription.unsubscribe();
      };
    }
  }, [studentData, selectedChannel]);

  const fetchChannels = async () => {
    try {
      // Get channels where user is a member
      const { data: memberChannels, error: memberError } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', studentData.user_id);

      if (memberError) throw memberError;

      const channelIds = memberChannels?.map(m => m.channel_id) || [];

      if (channelIds.length === 0) {
        setChannels([]);
        setLoading(false);
        return;
      }

      // Get channel details
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

      // Get last message for each channel
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

          // Get member count
          const { count } = await supabase
            .from('channel_members')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.id);

          // Get unread count
          const { data: unreadMessages } = await supabase
            .from('messages')
            .select('id')
            .eq('channel_id', channel.id)
            .neq('sender_id', studentData.user_id)
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
      // Get all users from the same college
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('college_id', studentData.college_id)
        .neq('id', studentData.user_id)
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
    await fetchMessages(channel.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          channel_id: selectedChannel.id,
          sender_id: studentData.user_id,
          message_text: newMessage,
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      await fetchMessages(selectedChannel.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const createDirectChannel = async (contactId) => {
    try {
      // Check if direct channel already exists
      const { data: existingChannels } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', studentData.user_id);

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
            setActiveTab('chats');
            return;
          }
        }
      }

      // Create new direct channel
      const contact = contacts.find(c => c.id === contactId);
      const { data: newChannel, error: channelError } = await supabase
        .from('communication_channels')
        .insert({
          college_id: studentData.college_id,
          channel_name: `${contact.first_name} ${contact.last_name}`,
          channel_type: 'direct_message',
          is_public: false,
          created_by: studentData.user_id
        })
        .select()
        .single();

      if (channelError) throw channelError;

      // Add both users as members
      const { error: memberError } = await supabase
        .from('channel_members')
        .insert([
          { channel_id: newChannel.id, user_id: studentData.user_id, role: 'member' },
          { channel_id: newChannel.id, user_id: contactId, role: 'member' }
        ]);

      if (memberError) throw memberError;

      await fetchChannels();
      setShowNewChatDialog(false);
      
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredChannels = channels.filter(channel =>
    channel.channel_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter(contact =>
    `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className=" border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-sm">Stay connected with your campus community</p>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Start a New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {filteredContacts.length === 0 ? (
                      <p className="text-center py-8">No contacts found</p>
                    ) : (
                      filteredContacts.map(contact => (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between p-3 rounded-lg cursor-pointer"
                          onClick={() => createDirectChannel(contact.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold">
                              {getInitials(contact.first_name, contact.last_name)}
                            </div>
                            <div>
                              <p className="font-medium">
                                {contact.first_name} {contact.last_name}
                              </p>
                              <p className="text-xs capitalize">{contact.user_type}</p>
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
        {/* Sidebar */}
        <div className="w-80 border-r flex flex-col">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mx-3 mt-2">
              <TabsTrigger value="chats">Chats</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>

            <TabsContent value="chats" className="flex-1 overflow-y-auto mt-0">
              <div className="space-y-1 p-2">
                {filteredChannels.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2" />
                    <p className=" text-sm">No conversations yet</p>
                    <Button
                      size="sm"
                      variant="link"
                      onClick={() => setShowNewChatDialog(true)}
                      className="mt-2"
                    >
                      Start a new chat
                    </Button>
                  </div>
                ) : (
                  filteredChannels.map(channel => {
                    const isGroup = channel.channel_type === 'group' || channel.channel_type === 'course';
                    
                    return (
                      <div
                        key={channel.id}
                        onClick={() => handleChannelSelect(channel)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedChannel?.id === channel.id
                            ? ' border-l-4 border-blue-600'
                            : 'hover:bg-gray-500'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative flex-shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                              isGroup 
                                ? 'bg-gradient-to-br from-gray-500 to-gray-600' 
                                : 'bg-gradient-to-br from-gray-500 to-gray-600'
                            }`}>
                              {channel.channel_name.substring(0, 2).toUpperCase()}
                            </div>
                            {isGroup && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-2 border-white rounded-full flex items-center justify-center">
                                <Users className="h-3 w-3 " />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold truncate">{channel.channel_name}</p>
                              {channel.lastMessageTime && (
                                <span className="text-xs">
                                  {formatTimestamp(channel.lastMessageTime)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600 truncate">
                                {channel.lastMessageSender && isGroup
                                  ? `${channel.lastMessageSender.first_name}: ${channel.lastMessage}`
                                  : channel.lastMessage
                                }
                              </p>
                              {channel.unreadCount > 0 && (
                                <Badge className="ml-2">{channel.unreadCount}</Badge>
                              )}
                            </div>
                            {isGroup && (
                              <p className="text-xs mt-1">{channel.memberCount} members</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="flex-1 overflow-y-auto mt-0">
              <div className="space-y-1 p-2">
                {filteredContacts.length === 0 ? (
                  <p className="text-center py-8">No contacts found</p>
                ) : (
                  filteredContacts.map(contact => (
                    <div
                      key={contact.id}
                      className="p-3 rounded-lg cursor-pointer transition-all"
                      onClick={() => createDirectChannel(contact.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center font-semibold">
                          {getInitials(contact.first_name, contact.last_name)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-xs capitalize">{contact.user_type}</p>
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

        {/* Chat Area */}
        {selectedChannel ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className=" border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center  font-semibold ${
                      selectedChannel.channel_type === 'group' || selectedChannel.channel_type === 'course'
                        ? 'bg-gradient-to-br from-gray-500 to-gray-600' 
                        : 'bg-gradient-to-br from-gray-500 to-gray-600'
                    }`}>
                      {selectedChannel.channel_name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h2 className="font-semibold">{selectedChannel.channel_name}</h2>
                    <p className="text-sm capitalize">
                      {selectedChannel.channel_type === 'group' || selectedChannel.channel_type === 'course'
                        ? `${selectedChannel.memberCount} members`
                        : selectedChannel.channel_type.replace('_', ' ')
                      }
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isMe = message.sender_id === studentData.user_id;
                  const isGroup = selectedChannel.channel_type === 'group' || selectedChannel.channel_type === 'course';
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-md ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {!isMe && (
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {getInitials(message.sender.first_name, message.sender.last_name)}
                          </div>
                        )}
                        <div>
                          {isGroup && !isMe && (
                            <p className="text-xs text-gray-500 mb-1 ml-2">
                              {message.sender.first_name} {message.sender.last_name}
                            </p>
                          )}
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isMe
                                ? 'bg-gray-600 rounded-br-sm'
                                : 'border border-gray-200 rounded-bl-sm'
                            }`}
                          >
                            <p className="text-sm">{message.message_text}</p>
                          </div>
                          <div className={`flex items-center space-x-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs">
                              {formatMessageTime(message.created_at)}
                            </span>
                            {isMe && !message.is_edited && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t px-6 py-4">
              <div className="flex items-end space-x-2">
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <Image className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="resize-none pr-10"
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
                  className="flex-shrink-0"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
              <p className=" mb-6">Choose from your existing chats or start a new one</p>
              <Button onClick={() => setShowNewChatDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <MessageSquare className="h-4 w-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationHub;