import { supabase } from '@/integrations/supabase/client';

export interface Department {
  id: string;
  college_id: string;
  department_code: string;
  department_name: string;
  description: string | null;
  hod_id: string | null;
  department_color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentMember {
  id: string;
  department_id: string;
  faculty_id: string;
  role: 'hod' | 'member' | 'admin';
  joined_at: string;
  is_active: boolean;
  assigned_by: string | null;
}

export interface DepartmentChannel {
  id: string;
  department_id: string;
  channel_name: string;
  channel_type: 'general' | 'announcements' | 'academic' | 'admin';
  description: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface DepartmentMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  message_text: string;
  message_type: 'text' | 'file' | 'image' | 'link' | 'video' | 'document' | 'announcement';
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  reply_to_id: string | null;
  is_pinned: boolean;
  pinned_by: string | null;
  pinned_at: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  mentions: any;
  hashtags: string[] | null;
  created_at: string;
  updated_at: string;
  sender?: {
    first_name: string;
    last_name: string;
  };
}

export interface DepartmentEvent {
  id: string;
  department_id: string;
  event_title: string;
  event_description: string | null;
  event_type: 'meeting' | 'deadline' | 'holiday' | 'workshop' | 'seminar' | 'exam' | 'conference' | 'other';
  start_datetime: string;
  end_datetime: string;
  location: string | null;
  is_all_day: boolean;
  attachments: any;
  created_by: string;
  is_active: boolean;
  notify_members: boolean;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  creator?: {
    first_name: string;
    last_name: string;
  };
}

// Get user's department
export async function getUserDepartment(userId: string): Promise<Department | null> {
  try {
    console.log('getUserDepartment called for userId:', userId);
    
    const { data: members, error: memberError } = await supabase
      .from('department_members')
      .select('department_id, role')
      .eq('faculty_id', userId)
      .eq('is_active', true);

    console.log('Department members query result:', { members, memberError });

    if (memberError) {
      console.error('Error fetching department members:', memberError);
      return null;
    }

    if (!members || members.length === 0) {
      console.log('No department membership found for user');
      return null;
    }

    // Get the first department (or prioritize HOD role)
    const member = members.find(m => m.role === 'hod') || members[0];
    console.log('Selected member:', member);

    const { data: department, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .eq('id', member.department_id)
      .eq('is_active', true)
      .single();

    console.log('Department query result:', { department, deptError });

    if (deptError) {
      console.error('Error fetching department:', deptError);
      return null;
    }

    return department;
  } catch (error) {
    console.error('Error in getUserDepartment:', error);
    return null;
  }
}

// Get all user's departments
export async function getUserDepartments(userId: string): Promise<Department[]> {
  try {
    const { data: members, error: memberError } = await supabase
      .from('department_members')
      .select('department_id, role')
      .eq('faculty_id', userId)
      .eq('is_active', true);

    if (memberError || !members || members.length === 0) {
      console.error('Error fetching department members:', memberError);
      return [];
    }

    const departmentIds = members.map(m => m.department_id);

    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .in('id', departmentIds)
      .eq('is_active', true)
      .order('department_name', { ascending: true });

    if (deptError) {
      console.error('Error fetching departments:', deptError);
      return [];
    }

    return departments || [];
  } catch (error) {
    console.error('Error in getUserDepartments:', error);
    return [];
  }
}

// Get department channels
export async function getDepartmentChannels(departmentId: string): Promise<DepartmentChannel[]> {
  const { data, error } = await supabase
    .from('department_channels')
    .select('*')
    .eq('department_id', departmentId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching channels:', error);
    return [];
  }

  return (data || []) as DepartmentChannel[];
}

// Get messages from a channel
export async function getChannelMessages(channelId: string): Promise<DepartmentMessage[]> {
  const { data, error } = await supabase
    .from('department_messages')
    .select(`
      *,
      sender:sender_id (
        first_name,
        last_name
      )
    `)
    .eq('channel_id', channelId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return (data || []) as unknown as DepartmentMessage[];
}

// Send a message
export async function sendMessage(
  channelId: string,
  senderId: string,
  messageText: string,
  messageType: string = 'text',
  fileUrl?: string,
  fileName?: string,
  fileSize?: number
): Promise<DepartmentMessage | null> {
  console.log('sendMessage called with:', {
    channelId,
    senderId,
    messageText,
    messageType,
    fileUrl,
    fileName,
    fileSize
  });

  const { data, error } = await supabase
    .from('department_messages')
    .insert({
      channel_id: channelId,
      sender_id: senderId,
      message_text: messageText,
      message_type: messageType,
      file_url: fileUrl || null,
      file_name: fileName || null,
      file_size: fileSize || null,
    })
    .select(`
      *,
      sender:sender_id (
        first_name,
        last_name
      )
    `)
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return null;
  }

  console.log('Message saved to database:', data);
  return data as unknown as DepartmentMessage;
}

// Toggle pin message
export async function togglePinMessage(messageId: string, userId: string, isPinned: boolean): Promise<boolean> {
  const updateData: any = {
    is_pinned: isPinned,
  };

  if (isPinned) {
    updateData.pinned_by = userId;
    updateData.pinned_at = new Date().toISOString();
  } else {
    updateData.pinned_by = null;
    updateData.pinned_at = null;
  }

  const { error } = await supabase
    .from('department_messages')
    .update(updateData)
    .eq('id', messageId);

  if (error) {
    console.error('Error toggling pin:', error);
    return false;
  }

  return true;
}

// Get department events
export async function getDepartmentEvents(departmentId: string): Promise<DepartmentEvent[]> {
  const { data, error } = await supabase
    .from('department_events')
    .select(`
      *,
      creator:created_by (
        first_name,
        last_name
      )
    `)
    .eq('department_id', departmentId)
    .eq('is_active', true)
    .order('start_datetime', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return (data || []) as DepartmentEvent[];
}

// Create department event
export async function createDepartmentEvent(
  departmentId: string,
  eventData: {
    event_title: string;
    event_description?: string;
    event_type: string;
    start_datetime: string;
    end_datetime: string;
    location?: string;
    is_all_day?: boolean;
    created_by: string;
  }
): Promise<DepartmentEvent | null> {
  const { data, error } = await supabase
    .from('department_events')
    .insert({
      department_id: departmentId,
      ...eventData,
    })
    .select(`
      *,
      creator:created_by (
        first_name,
        last_name
      )
    `)
    .single();

  if (error) {
    console.error('Error creating event:', error);
    return null;
  }

  return data as DepartmentEvent;
}

// Subscribe to new messages in a channel
export function subscribeToMessages(channelId: string, callback: (message: DepartmentMessage) => void) {
  const subscription = supabase
    .channel(`channel-${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'department_messages',
        filter: `channel_id=eq.${channelId}`,
      },
      async (payload) => {
        // Fetch sender details
        const { data: sender } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', payload.new.sender_id)
          .single();

        callback({
          ...payload.new as DepartmentMessage,
          sender: sender || undefined,
        });
      }
    )
    .subscribe();

  return subscription;
}
