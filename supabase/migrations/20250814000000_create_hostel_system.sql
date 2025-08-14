-- Hostel Management System Database Schema

-- Create hostels table
CREATE TABLE public.hostels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    hostel_name TEXT NOT NULL,
    hostel_type TEXT NOT NULL, -- 'boys', 'girls', 'coed'
    location TEXT,
    total_floors INTEGER DEFAULT 1,
    total_rooms INTEGER DEFAULT 0,
    warden_id UUID REFERENCES public.user_profiles(id),
    amenities JSONB DEFAULT '[]', -- ['wifi', 'ac', 'mess', 'laundry', 'gym', 'library']
    hostel_image TEXT, -- URL to hostel image
    description TEXT,
    rules_regulations TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create room types table
CREATE TABLE public.room_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    type_name TEXT NOT NULL, -- 'Single AC', 'Double Sharing AC', 'Triple Sharing Non-AC', etc.
    occupancy INTEGER NOT NULL, -- 1, 2, 3, etc.
    has_ac BOOLEAN DEFAULT false,
    has_attached_bathroom BOOLEAN DEFAULT true,
    has_balcony BOOLEAN DEFAULT false,
    furniture_included JSONB DEFAULT '[]', -- ['bed', 'study_table', 'chair', 'cupboard', 'fan']
    monthly_fee DECIMAL(10,2) NOT NULL, -- in INR
    security_deposit DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create hostel rooms table
CREATE TABLE public.hostel_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    floor_number INTEGER DEFAULT 1,
    block_name TEXT, -- 'A Block', 'B Block', etc.
    current_occupancy INTEGER DEFAULT 0,
    max_occupancy INTEGER NOT NULL,
    room_status TEXT DEFAULT 'available', -- 'available', 'occupied', 'maintenance', 'reserved'
    last_maintenance_date DATE,
    room_images JSONB DEFAULT '[]', -- Array of image URLs
    special_features JSONB DEFAULT '[]', -- ['corner_room', 'garden_view', 'main_road_view']
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(hostel_id, room_number)
);

-- Create hostel applications table
CREATE TABLE public.hostel_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    hostel_id UUID REFERENCES public.hostels(id),
    room_type_id UUID REFERENCES public.room_types(id),
    room_id UUID REFERENCES public.hostel_rooms(id),
    application_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    preferred_room_types JSONB DEFAULT '[]', -- Array of room type IDs in preference order
    preferred_floor INTEGER,
    preferred_block TEXT,
    special_requirements TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    application_status TEXT DEFAULT 'submitted', -- 'submitted', 'under_review', 'approved', 'rejected', 'waitlisted', 'allocated'
    allotment_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    waitlist_position INTEGER,
    admin_comments TEXT,
    academic_year TEXT DEFAULT '2024-25',
    semester TEXT DEFAULT 'Fall',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create hostel allotments table (for current allocations)
CREATE TABLE public.hostel_allotments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.hostel_rooms(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.hostel_applications(id) ON DELETE CASCADE,
    check_in_date DATE,
    check_out_date DATE,
    allotment_status TEXT DEFAULT 'active', -- 'active', 'checked_out', 'terminated'
    monthly_fee DECIMAL(10,2) NOT NULL,
    security_deposit_paid DECIMAL(10,2) DEFAULT 0,
    bed_number INTEGER,
    key_issued BOOLEAN DEFAULT false,
    academic_year TEXT DEFAULT '2024-25',
    semester TEXT DEFAULT 'Fall',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(student_id, academic_year, semester) -- One allotment per student per semester
);

-- Create facility requests table (enhanced for hostels)
CREATE TABLE public.facility_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    hostel_id UUID REFERENCES public.hostels(id),
    room_id UUID REFERENCES public.hostel_rooms(id),
    facility_id UUID REFERENCES public.facilities(id),
    request_type TEXT NOT NULL, -- 'maintenance', 'complaint', 'room_change', 'facility_request'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    category TEXT, -- 'electrical', 'plumbing', 'furniture', 'cleanliness', 'ac_heating', 'internet'
    images JSONB DEFAULT '[]', -- Array of image URLs for evidence
    status TEXT DEFAULT 'submitted', -- 'submitted', 'acknowledged', 'in_progress', 'resolved', 'closed'
    assigned_to UUID REFERENCES public.user_profiles(id), -- Staff member assigned
    resolution_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_hostels_college_id ON public.hostels(college_id);
CREATE INDEX idx_hostel_rooms_hostel_id ON public.hostel_rooms(hostel_id);
CREATE INDEX idx_hostel_rooms_room_status ON public.hostel_rooms(room_status);
CREATE INDEX idx_hostel_applications_student_id ON public.hostel_applications(student_id);
CREATE INDEX idx_hostel_applications_status ON public.hostel_applications(application_status);
CREATE INDEX idx_hostel_allotments_student_id ON public.hostel_allotments(student_id);
CREATE INDEX idx_facility_requests_student_id ON public.facility_requests(student_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_allotments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hostels
CREATE POLICY "Users can view hostels for their college" ON public.hostels
    FOR SELECT USING (
        college_id IN (
            SELECT college_id 
            FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

-- RLS Policies for room_types
CREATE POLICY "Users can view room types for their college" ON public.room_types
    FOR SELECT USING (
        college_id IN (
            SELECT college_id 
            FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

-- RLS Policies for hostel_rooms
CREATE POLICY "Users can view hostel rooms for their college" ON public.hostel_rooms
    FOR SELECT USING (
        college_id IN (
            SELECT college_id 
            FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

-- RLS Policies for hostel_applications
CREATE POLICY "Students can view their own applications" ON public.hostel_applications
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create their own applications" ON public.hostel_applications
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own pending applications" ON public.hostel_applications
    FOR UPDATE USING (student_id = auth.uid() AND application_status = 'submitted');

-- RLS Policies for hostel_allotments
CREATE POLICY "Students can view their own allotments" ON public.hostel_allotments
    FOR SELECT USING (student_id = auth.uid());

-- RLS Policies for facility_requests
CREATE POLICY "Students can view their own facility requests" ON public.facility_requests
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create their own facility requests" ON public.facility_requests
    FOR INSERT WITH CHECK (student_id = auth.uid());

-- Admin policies (for hostel management)
CREATE POLICY "Admins can manage hostels" ON public.hostels
    FOR ALL USING (
        college_id IN (
            SELECT college_id 
            FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can manage room types" ON public.room_types
    FOR ALL USING (
        college_id IN (
            SELECT college_id 
            FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can manage hostel rooms" ON public.hostel_rooms
    FOR ALL USING (
        college_id IN (
            SELECT college_id 
            FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can manage applications" ON public.hostel_applications
    FOR ALL USING (
        college_id IN (
            SELECT college_id 
            FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can manage allotments" ON public.hostel_allotments
    FOR ALL USING (
        college_id IN (
            SELECT college_id 
            FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can manage facility requests" ON public.facility_requests
    FOR ALL USING (
        college_id IN (
            SELECT college_id 
            FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Parent policies (for viewing their child's applications)
CREATE POLICY "Parents can view their child's hostel applications" ON public.hostel_applications
    FOR SELECT USING (
        student_id IN (
            SELECT sp.id 
            FROM public.user_profiles sp
            INNER JOIN public.user_profiles pp ON pp.id = auth.uid()
            WHERE pp.user_type = 'parent'
            AND sp.user_code = pp.linked_student_code -- Assuming this relationship exists
            AND sp.college_id = pp.college_id
        )
    );

CREATE POLICY "Parents can view their child's hostel allotments" ON public.hostel_allotments
    FOR SELECT USING (
        student_id IN (
            SELECT sp.id 
            FROM public.user_profiles sp
            INNER JOIN public.user_profiles pp ON pp.id = auth.uid()
            WHERE pp.user_type = 'parent'
            AND sp.user_code = pp.linked_student_code
            AND sp.college_id = pp.college_id
        )
    );
