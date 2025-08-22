-- Enhanced Fee Management System Migration

-- Add missing columns to fee_structures table
ALTER TABLE public.fee_structures 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS late_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS installments_allowed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_installments INTEGER DEFAULT 1;

-- Create fee categories table for better organization
CREATE TABLE IF NOT EXISTS public.fee_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(college_id, category_name)
);

-- Add category reference to fee_structures
ALTER TABLE public.fee_structures 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.fee_categories(id);

-- Create fee installments table
CREATE TABLE IF NOT EXISTS public.fee_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(fee_structure_id, installment_number)
);

-- Create fee exemptions table
CREATE TABLE IF NOT EXISTS public.fee_exemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    exemption_type TEXT NOT NULL, -- 'full', 'partial', 'scholarship'
    exemption_amount DECIMAL(10,2),
    exemption_percentage DECIMAL(5,2),
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES public.user_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced fee_payments table with better tracking
ALTER TABLE public.fee_payments 
ADD COLUMN IF NOT EXISTS installment_id UUID REFERENCES public.fee_installments(id),
ADD COLUMN IF NOT EXISTS due_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS late_fee_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_gateway TEXT,
ADD COLUMN IF NOT EXISTS receipt_number TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create fee notifications table
CREATE TABLE IF NOT EXISTS public.fee_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 'due_reminder', 'overdue', 'payment_confirmation'
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default fee categories
INSERT INTO public.fee_categories (college_id, category_name, description, display_order)
SELECT 
    c.id,
    category_name,
    description,
    display_order
FROM public.colleges c
CROSS JOIN (
    VALUES 
        ('Academic', 'Tuition and academic-related fees', 1),
        ('Accommodation', 'Hostel and accommodation fees', 2),
        ('Transport', 'Bus and transportation fees', 3),
        ('Examination', 'Exam and assessment fees', 4),
        ('Library', 'Library and resource fees', 5),
        ('Laboratory', 'Lab and equipment fees', 6),
        ('Sports', 'Sports and recreation fees', 7),
        ('Miscellaneous', 'Other fees and charges', 8)
) as categories(category_name, description, display_order)
ON CONFLICT (college_id, category_name) DO NOTHING;

-- Enable RLS on all new tables
ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_exemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fee_categories
CREATE POLICY "Users can view categories from their college" ON public.fee_categories
    FOR SELECT USING (
        college_id IN (
            SELECT college_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage categories" ON public.fee_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND college_id = fee_categories.college_id 
            AND user_type = 'admin'
        )
    );

-- RLS Policies for fee_installments
CREATE POLICY "Users can view installments from their college" ON public.fee_installments
    FOR SELECT USING (
        fee_structure_id IN (
            SELECT fs.id FROM public.fee_structures fs
            JOIN public.user_profiles up ON fs.college_id = up.college_id
            WHERE up.id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage installments" ON public.fee_installments
    FOR ALL USING (
        fee_structure_id IN (
            SELECT fs.id FROM public.fee_structures fs
            JOIN public.user_profiles up ON fs.college_id = up.college_id
            WHERE up.id = auth.uid() AND up.user_type = 'admin'
        )
    );

-- RLS Policies for fee_exemptions
CREATE POLICY "Users can view own exemptions" ON public.fee_exemptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage exemptions" ON public.fee_exemptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND college_id = fee_exemptions.college_id 
            AND user_type = 'admin'
        )
    );

-- RLS Policies for fee_notifications
CREATE POLICY "Users can view own notifications" ON public.fee_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage notifications" ON public.fee_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND college_id = fee_notifications.college_id 
            AND user_type = 'admin'
        )
    );

-- Enhanced RLS Policies for existing tables
DROP POLICY IF EXISTS "Users can view fee structures from their college" ON public.fee_structures;
CREATE POLICY "Users can view fee structures from their college" ON public.fee_structures
    FOR SELECT USING (
        college_id IN (
            SELECT college_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage fee structures" ON public.fee_structures;
CREATE POLICY "Admins can manage fee structures" ON public.fee_structures
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND college_id = fee_structures.college_id 
            AND user_type = 'admin'
        )
    );

-- Enhanced fee payments policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.fee_payments;
CREATE POLICY "Users can view own payments" ON public.fee_payments
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view payments from their college" ON public.fee_payments;
CREATE POLICY "Admins can view payments from their college" ON public.fee_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND college_id = fee_payments.college_id 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Users can create own payments" ON public.fee_payments
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Functions for fee management
CREATE OR REPLACE FUNCTION public.calculate_outstanding_fees(
    student_id UUID,
    college_id UUID
) RETURNS TABLE (
    fee_structure_id UUID,
    fee_type TEXT,
    total_amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2),
    outstanding_amount DECIMAL(10,2),
    due_date TIMESTAMP WITH TIME ZONE,
    is_overdue BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fs.id,
        fs.fee_type,
        fs.amount,
        COALESCE(SUM(fp.amount_paid), 0) as paid_amount,
        fs.amount - COALESCE(SUM(fp.amount_paid), 0) as outstanding_amount,
        fs.due_date,
        (fs.due_date < NOW() AND fs.amount > COALESCE(SUM(fp.amount_paid), 0)) as is_overdue
    FROM public.fee_structures fs
    LEFT JOIN public.fee_payments fp ON fs.id = fp.fee_structure_id AND fp.user_id = student_id
    WHERE fs.college_id = calculate_outstanding_fees.college_id
    AND fs.is_active = true
    AND (fs.user_type = 'student' OR fs.user_type IS NULL)
    GROUP BY fs.id, fs.fee_type, fs.amount, fs.due_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number(
    college_id UUID
) RETURNS TEXT AS $$
DECLARE
    college_code TEXT;
    current_year TEXT;
    sequence_number TEXT;
BEGIN
    -- Get college code
    SELECT code INTO college_code FROM public.colleges WHERE id = college_id;
    
    -- Get current year
    current_year := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Generate sequence number (6 digits)
    sequence_number := LPAD(
        (
            SELECT COUNT(*) + 1 
            FROM public.fee_payments 
            WHERE college_id = generate_receipt_number.college_id 
            AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
        )::TEXT, 
        6, 
        '0'
    );
    
    RETURN college_code || '/' || current_year || '/' || sequence_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate receipt numbers
CREATE OR REPLACE FUNCTION public.set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL THEN
        NEW.receipt_number := public.generate_receipt_number(NEW.college_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_receipt_number ON public.fee_payments;
CREATE TRIGGER trigger_set_receipt_number
    BEFORE INSERT ON public.fee_payments
    FOR EACH ROW EXECUTE FUNCTION public.set_receipt_number();
