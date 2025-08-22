-- Comprehensive Fee Management System with Student Integration
-- This migration creates a complete fee management system with proper student mapping

-- First ensure we have all necessary tables
CREATE TABLE IF NOT EXISTS public.fee_structures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL, -- 'tuition', 'hostel', 'library', 'lab', 'sports', 'examination', 'misc'
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  academic_year TEXT NOT NULL, -- '2024-25', '2025-26'
  semester TEXT, -- 'semester_1', 'semester_2', 'annual'
  user_type TEXT, -- 'student', 'alumni', null for all
  is_active BOOLEAN DEFAULT true,
  due_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fee_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  amount_paid DECIMAL(10,2) NOT NULL CHECK (amount_paid >= 0),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method TEXT DEFAULT 'online', -- 'online', 'cash', 'cheque', 'bank_transfer'
  transaction_id TEXT UNIQUE,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'refunded'
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fee_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  due_amount DECIMAL(10,2) NOT NULL CHECK (due_amount >= 0),
  due_date DATE NOT NULL,
  reminder_sent BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
  last_reminder_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student fee assignments table for specific fee mappings
CREATE TABLE IF NOT EXISTS public.student_fee_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  is_applicable BOOLEAN DEFAULT true,
  custom_amount DECIMAL(10,2), -- Override amount if different from fee_structure
  due_date DATE,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES public.user_profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, fee_structure_id)
);

-- Create payment statistics view
CREATE OR REPLACE VIEW public.payment_statistics AS
SELECT 
  fs.college_id,
  fs.fee_type,
  fs.academic_year,
  fs.semester,
  COUNT(DISTINCT sfa.student_id) as total_students,
  COUNT(DISTINCT fp.user_id) as students_paid,
  SUM(fs.amount) as total_expected,
  COALESCE(SUM(fp.amount_paid), 0) as total_collected,
  (COUNT(DISTINCT sfa.student_id) - COUNT(DISTINCT fp.user_id)) as pending_payments
FROM fee_structures fs
LEFT JOIN student_fee_assignments sfa ON fs.id = sfa.fee_structure_id AND sfa.is_applicable = true
LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.status = 'completed'
WHERE fs.is_active = true
GROUP BY fs.college_id, fs.fee_type, fs.academic_year, fs.semester, fs.id;

-- Create student payment summary view
CREATE OR REPLACE VIEW public.student_payment_summary AS
SELECT 
  up.id as student_id,
  up.first_name,
  up.last_name,
  up.user_code,
  up.college_id,
  fs.id as fee_structure_id,
  fs.fee_type,
  fs.amount as fee_amount,
  COALESCE(sfa.custom_amount, fs.amount) as applicable_amount,
  COALESCE(SUM(fp.amount_paid), 0) as total_paid,
  (COALESCE(sfa.custom_amount, fs.amount) - COALESCE(SUM(fp.amount_paid), 0)) as balance_due,
  fs.due_date,
  CASE 
    WHEN COALESCE(SUM(fp.amount_paid), 0) >= COALESCE(sfa.custom_amount, fs.amount) THEN 'paid'
    WHEN fs.due_date < CURRENT_DATE THEN 'overdue'
    ELSE 'pending'
  END as payment_status,
  fs.academic_year,
  fs.semester
FROM user_profiles up
CROSS JOIN fee_structures fs
LEFT JOIN student_fee_assignments sfa ON up.id = sfa.student_id AND fs.id = sfa.fee_structure_id
LEFT JOIN fee_payments fp ON up.id = fp.user_id AND fs.id = fp.fee_structure_id AND fp.status = 'completed'
WHERE up.user_type = 'student' 
  AND fs.is_active = true
  AND (fs.user_type IS NULL OR fs.user_type = 'student')
  AND (sfa.is_applicable IS NULL OR sfa.is_applicable = true)
GROUP BY up.id, up.first_name, up.last_name, up.user_code, up.college_id, 
         fs.id, fs.fee_type, fs.amount, sfa.custom_amount, fs.due_date, fs.academic_year, fs.semester;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fee_structures_college_active ON fee_structures(college_id, is_active);
CREATE INDEX IF NOT EXISTS idx_fee_payments_user_status ON fee_payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_structure_status ON fee_payments(fee_structure_id, status);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_student ON student_fee_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_structure ON student_fee_assignments(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_fee_reminders_user_status ON fee_reminders(user_id, status);

-- Create RLS policies
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fee_assignments ENABLE ROW LEVEL SECURITY;

-- Fee structures policies
DROP POLICY IF EXISTS "Users can view fee structures for their college" ON fee_structures;
CREATE POLICY "Users can view fee structures for their college" ON fee_structures
  FOR SELECT TO authenticated
  USING (
    college_id IN (
      SELECT college_id FROM user_profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage fee structures" ON fee_structures;
CREATE POLICY "Admins can manage fee structures" ON fee_structures
  FOR ALL TO authenticated
  USING (
    college_id IN (
      SELECT college_id FROM user_profiles 
      WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

-- Fee payments policies
DROP POLICY IF EXISTS "Users can view their own payments" ON fee_payments;
CREATE POLICY "Users can view their own payments" ON fee_payments
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    college_id IN (
      SELECT college_id FROM user_profiles 
      WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Students can create their own payments" ON fee_payments;
CREATE POLICY "Students can create their own payments" ON fee_payments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all payments" ON fee_payments;
CREATE POLICY "Admins can manage all payments" ON fee_payments
  FOR ALL TO authenticated
  USING (
    college_id IN (
      SELECT college_id FROM user_profiles 
      WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

-- Fee reminders policies
DROP POLICY IF EXISTS "Users can view their own reminders" ON fee_reminders;
CREATE POLICY "Users can view their own reminders" ON fee_reminders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage reminders" ON fee_reminders;
CREATE POLICY "Admins can manage reminders" ON fee_reminders
  FOR ALL TO authenticated
  USING (
    fee_structure_id IN (
      SELECT fs.id FROM fee_structures fs
      JOIN user_profiles up ON fs.college_id = up.college_id
      WHERE up.id = auth.uid() AND up.user_type IN ('admin', 'super_admin')
    )
  );

-- Student fee assignments policies
DROP POLICY IF EXISTS "Students can view their assignments" ON student_fee_assignments;
CREATE POLICY "Students can view their assignments" ON student_fee_assignments
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage assignments" ON student_fee_assignments;
CREATE POLICY "Admins can manage assignments" ON student_fee_assignments
  FOR ALL TO authenticated
  USING (
    college_id IN (
      SELECT college_id FROM user_profiles 
      WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

-- Create function to automatically assign fees to new students
CREATE OR REPLACE FUNCTION assign_default_fees_to_student()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process for students
  IF NEW.user_type = 'student' THEN
    -- Assign all active fee structures for the college to the new student
    INSERT INTO student_fee_assignments (student_id, fee_structure_id, college_id, assigned_date)
    SELECT 
      NEW.id,
      fs.id,
      NEW.college_id,
      NOW()
    FROM fee_structures fs
    WHERE fs.college_id = NEW.college_id 
      AND fs.is_active = true
      AND (fs.user_type IS NULL OR fs.user_type = 'student')
    ON CONFLICT (student_id, fee_structure_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to assign fees to new students
DROP TRIGGER IF EXISTS assign_fees_to_new_student ON user_profiles;
CREATE TRIGGER assign_fees_to_new_student
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_fees_to_student();

-- Create function to calculate student balance
CREATE OR REPLACE FUNCTION calculate_student_balance(student_id_param UUID, fee_structure_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
  fee_amount DECIMAL;
  total_paid DECIMAL;
  custom_amount DECIMAL;
BEGIN
  -- Get fee amount and custom amount
  SELECT 
    fs.amount,
    sfa.custom_amount
  INTO fee_amount, custom_amount
  FROM fee_structures fs
  LEFT JOIN student_fee_assignments sfa ON fs.id = sfa.fee_structure_id AND sfa.student_id = student_id_param
  WHERE fs.id = fee_structure_id_param;
  
  -- Get total paid amount
  SELECT COALESCE(SUM(amount_paid), 0)
  INTO total_paid
  FROM fee_payments
  WHERE user_id = student_id_param 
    AND fee_structure_id = fee_structure_id_param 
    AND status = 'completed';
  
  -- Return balance
  RETURN COALESCE(custom_amount, fee_amount, 0) - total_paid;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate fee reminders
CREATE OR REPLACE FUNCTION generate_fee_reminders()
RETURNS INTEGER AS $$
DECLARE
  reminder_count INTEGER := 0;
  rec RECORD;
BEGIN
  -- Generate reminders for overdue fees
  FOR rec IN 
    SELECT DISTINCT
      sps.student_id,
      sps.fee_structure_id,
      sps.balance_due,
      sps.due_date
    FROM student_payment_summary sps
    WHERE sps.payment_status = 'overdue' 
      AND sps.balance_due > 0
      AND NOT EXISTS (
        SELECT 1 FROM fee_reminders fr 
        WHERE fr.user_id = sps.student_id 
          AND fr.fee_structure_id = sps.fee_structure_id
          AND fr.status = 'pending'
      )
  LOOP
    INSERT INTO fee_reminders (user_id, fee_structure_id, due_amount, due_date, status)
    VALUES (rec.student_id, rec.fee_structure_id, rec.balance_due, rec.due_date, 'pending');
    
    reminder_count := reminder_count + 1;
  END LOOP;
  
  RETURN reminder_count;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for development/testing
INSERT INTO fee_structures (college_id, fee_type, amount, academic_year, semester, user_type, due_date, description)
SELECT 
  c.id,
  'tuition',
  15000.00,
  '2024-25',
  'semester_1',
  'student',
  '2024-12-31',
  'Semester 1 Tuition Fee'
FROM colleges c
WHERE c.code = 'COLCORD'
ON CONFLICT DO NOTHING;

INSERT INTO fee_structures (college_id, fee_type, amount, academic_year, semester, user_type, due_date, description)
SELECT 
  c.id,
  'hostel',
  8000.00,
  '2024-25',
  'semester_1',
  'student',
  '2024-12-31',
  'Semester 1 Hostel Fee'
FROM colleges c
WHERE c.code = 'COLCORD'
ON CONFLICT DO NOTHING;

INSERT INTO fee_structures (college_id, fee_type, amount, academic_year, semester, user_type, due_date, description)
SELECT 
  c.id,
  'library',
  1500.00,
  '2024-25',
  'annual',
  'student',
  '2024-12-31',
  'Annual Library Fee'
FROM colleges c
WHERE c.code = 'COLCORD'
ON CONFLICT DO NOTHING;

INSERT INTO fee_structures (college_id, fee_type, amount, academic_year, semester, user_type, due_date, description)
SELECT 
  c.id,
  'examination',
  2000.00,
  '2024-25',
  'semester_1',
  'student',
  '2024-11-30',
  'Semester 1 Examination Fee'
FROM colleges c
WHERE c.code = 'COLCORD'
ON CONFLICT DO NOTHING;

-- Create a comprehensive function to get student fee details
CREATE OR REPLACE FUNCTION get_student_fee_details(student_id_param UUID)
RETURNS TABLE (
  fee_structure_id UUID,
  fee_type TEXT,
  fee_amount DECIMAL,
  total_paid DECIMAL,
  balance_due DECIMAL,
  due_date DATE,
  payment_status TEXT,
  academic_year TEXT,
  semester TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sps.fee_structure_id,
    sps.fee_type,
    sps.applicable_amount as fee_amount,
    sps.total_paid,
    sps.balance_due,
    sps.due_date,
    sps.payment_status,
    sps.academic_year,
    sps.semester,
    fs.description
  FROM student_payment_summary sps
  JOIN fee_structures fs ON sps.fee_structure_id = fs.id
  WHERE sps.student_id = student_id_param
  ORDER BY sps.due_date ASC, sps.fee_type ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE fee_structures IS 'Stores different types of fees for colleges';
COMMENT ON TABLE fee_payments IS 'Records of fee payments made by students';
COMMENT ON TABLE fee_reminders IS 'Fee payment reminders for students';
COMMENT ON TABLE student_fee_assignments IS 'Maps which fee structures apply to which students';
COMMENT ON VIEW payment_statistics IS 'Aggregated payment statistics for administrators';
COMMENT ON VIEW student_payment_summary IS 'Complete payment summary for each student';
