-- Table 1: Departments
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL,
  department_code text NOT NULL,
  department_name text NOT NULL,
  description text,
  hod_id uuid, -- Head of Department
  department_color text DEFAULT '#3b82f6',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT departments_pkey PRIMARY KEY (id),
  CONSTRAINT departments_college_id_fkey FOREIGN KEY (college_id) 
    REFERENCES public.colleges(id) ON DELETE CASCADE,
  CONSTRAINT departments_hod_id_fkey FOREIGN KEY (hod_id) 
    REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  CONSTRAINT departments_unique_code UNIQUE (college_id, department_code)
);

-- Table 2: Department Members (Faculty assignments)
CREATE TABLE public.department_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL,
  faculty_id uuid NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('hod', 'member', 'admin')),
  joined_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  assigned_by uuid,
  
  CONSTRAINT department_members_pkey PRIMARY KEY (id),
  CONSTRAINT department_members_department_id_fkey FOREIGN KEY (department_id) 
    REFERENCES public.departments(id) ON DELETE CASCADE,
  CONSTRAINT department_members_faculty_id_fkey FOREIGN KEY (faculty_id) 
    REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT department_members_assigned_by_fkey FOREIGN KEY (assigned_by) 
    REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  CONSTRAINT department_members_unique UNIQUE (department_id, faculty_id)
);

-- Table 3: Department Communication Channels
CREATE TABLE public.department_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL,
  channel_name text NOT NULL,
  channel_type text DEFAULT 'general' CHECK (channel_type IN ('general', 'announcements', 'academic', 'admin')),
  description text,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT department_channels_pkey PRIMARY KEY (id),
  CONSTRAINT department_channels_department_id_fkey FOREIGN KEY (department_id) 
    REFERENCES public.departments(id) ON DELETE CASCADE,
  CONSTRAINT department_channels_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

-- Table 4: Department Messages
CREATE TABLE public.department_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message_text text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'link', 'video', 'document', 'announcement')),
  file_url text,
  file_name text,
  file_size bigint,
  reply_to_id uuid, -- For threaded conversations
  is_pinned boolean DEFAULT false,
  pinned_by uuid,
  pinned_at timestamp with time zone,
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  mentions jsonb DEFAULT '[]'::jsonb, -- Array of mentioned user IDs
  hashtags text[], -- Array of hashtags
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT department_messages_pkey PRIMARY KEY (id),
  CONSTRAINT department_messages_channel_id_fkey FOREIGN KEY (channel_id) 
    REFERENCES public.department_channels(id) ON DELETE CASCADE,
  CONSTRAINT department_messages_sender_id_fkey FOREIGN KEY (sender_id) 
    REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT department_messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) 
    REFERENCES public.department_messages(id) ON DELETE SET NULL,
  CONSTRAINT department_messages_pinned_by_fkey FOREIGN KEY (pinned_by) 
    REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

-- Table 5: Department Events (Calendar)
CREATE TABLE public.department_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL,
  event_title text NOT NULL,
  event_description text,
  event_type text NOT NULL CHECK (event_type IN ('meeting', 'deadline', 'holiday', 'workshop', 'seminar', 'exam', 'conference', 'other')),
  start_datetime timestamp with time zone NOT NULL,
  end_datetime timestamp with time zone NOT NULL,
  location text,
  is_all_day boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb, -- Array of file URLs
  created_by uuid NOT NULL,
  is_active boolean DEFAULT true,
  notify_members boolean DEFAULT true,
  reminder_sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT department_events_pkey PRIMARY KEY (id),
  CONSTRAINT department_events_department_id_fkey FOREIGN KEY (department_id) 
    REFERENCES public.departments(id) ON DELETE CASCADE,
  CONSTRAINT department_events_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  CONSTRAINT department_events_valid_datetime CHECK (end_datetime >= start_datetime)
);


-- Table 6: Department Analytics (Optional - for tracking)
CREATE TABLE public.department_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL,
  metric_type text NOT NULL CHECK (metric_type IN ('message_count', 'active_users', 'event_count', 'engagement_rate')),
  metric_value numeric NOT NULL,
  metric_date date NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT department_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT department_analytics_department_id_fkey FOREIGN KEY (department_id) 
    REFERENCES public.departments(id) ON DELETE CASCADE
);


-- Index for faster queries 
CREATE INDEX IF NOT EXISTS idx_departments_college_id ON public.departments(college_id); CREATE INDEX IF NOT EXISTS idx_departments_hod_id ON public.departments(hod_id); CREATE INDEX IF NOT EXISTS idx_departments_is_active ON public.departments(is_active);

CREATE INDEX IF NOT EXISTS idx_department_members_department_id ON public.department_members(department_id); CREATE INDEX IF NOT EXISTS idx_department_members_faculty_id ON public.department_members(faculty_id); CREATE INDEX IF NOT EXISTS idx_department_members_is_active ON public.department_members(is_active);

CREATE INDEX IF NOT EXISTS idx_department_channels_department_id ON public.department_channels(department_id); CREATE INDEX IF NOT EXISTS idx_department_channels_created_by ON public.department_channels(created_by);

CREATE INDEX IF NOT EXISTS idx_department_messages_channel_id ON public.department_messages(channel_id); CREATE INDEX IF NOT EXISTS idx_department_messages_sender_id ON public.department_messages(sender_id); CREATE INDEX IF NOT EXISTS idx_department_messages_created_at ON public.department_messages(created_at DESC); CREATE INDEX IF NOT EXISTS idx_department_messages_is_pinned ON public.department_messages(is_pinned) WHERE is_pinned = true; CREATE INDEX IF NOT EXISTS idx_department_messages_is_deleted ON public.department_messages(is_deleted) WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_department_events_department_id ON public.department_events(department_id); CREATE INDEX IF NOT EXISTS idx_department_events_start_datetime ON public.department_events(start_datetime); CREATE INDEX IF NOT EXISTS idx_department_events_created_by ON public.department_events(created_by); CREATE INDEX IF NOT EXISTS idx_department_events_is_active ON public.department_events(is_active);

CREATE INDEX IF NOT EXISTS idx_department_analytics_department_id ON public.department_analytics(department_id); CREATE INDEX IF NOT EXISTS idx_department_analytics_metric_date ON public.department_analytics(metric_date DESC);


