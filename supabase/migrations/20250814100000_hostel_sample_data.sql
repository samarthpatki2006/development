-- Sample data for hostel management system

-- Insert sample hostels
INSERT INTO public.hostels (college_id, hostel_name, hostel_type, location, total_floors, total_rooms, amenities, description, rules_regulations) 
SELECT 
    c.id as college_id,
    hostel_name,
    hostel_type,
    location,
    total_floors,
    total_rooms,
    amenities,
    description,
    rules_regulations
FROM public.colleges c
CROSS JOIN (
    VALUES 
    ('Sunrise Boys Hostel', 'boys', 'North Campus Block A', 4, 120, '["wifi", "mess", "laundry", "gym", "study_hall", "common_room"]'::jsonb, 'Modern 4-story boys hostel with all amenities. Each floor has common areas and study spaces.', 'No smoking, No alcohol, Visitors allowed till 8 PM, Curfew at 11 PM on weekdays and 12 AM on weekends.'),
    ('Sunset Girls Hostel', 'girls', 'South Campus Block B', 3, 90, '["wifi", "mess", "laundry", "gym", "library", "common_room", "security_cameras"]'::jsonb, 'Secure 3-story girls hostel with 24/7 security. Features include recreation room and mini library.', 'No male visitors in rooms, Visitors allowed till 7 PM, Curfew at 10:30 PM on weekdays and 11:30 PM on weekends.'),
    ('Unity Coed Hostel', 'coed', 'Central Campus Block C', 5, 150, '["wifi", "mess", "laundry", "gym", "cafeteria", "study_hall", "recreational_facilities"]'::jsonb, 'Modern coed hostel with separate floors for boys and girls. Features cafeteria and recreational facilities.', 'Separate floors for boys and girls, Inter-floor visits with permission only, Curfew at 11 PM on weekdays.')
) as hostels(hostel_name, hostel_type, location, total_floors, total_rooms, amenities, description, rules_regulations)
ON CONFLICT DO NOTHING;

-- Insert room types
INSERT INTO public.room_types (college_id, type_name, occupancy, has_ac, has_attached_bathroom, has_balcony, furniture_included, monthly_fee, security_deposit, description) 
SELECT 
    c.id as college_id,
    type_name,
    occupancy,
    has_ac,
    has_attached_bathroom,
    has_balcony,
    furniture_included,
    monthly_fee,
    security_deposit,
    description
FROM public.colleges c
CROSS JOIN (
    VALUES 
    ('Single AC', 1, true, true, true, '["bed", "study_table", "chair", "cupboard", "AC", "fan", "mattress"]'::jsonb, 8000.00, 5000.00, 'Premium single occupancy room with AC, attached bathroom, and balcony. Perfect for focused study environment.'),
    ('Single Non-AC', 1, false, true, false, '["bed", "study_table", "chair", "cupboard", "fan", "mattress"]'::jsonb, 5000.00, 3000.00, 'Comfortable single occupancy room with fan, attached bathroom. Good ventilation and natural lighting.'),
    ('Double Sharing AC', 2, true, true, true, '["bed", "study_table", "chair", "cupboard", "AC", "fan", "mattress"]'::jsonb, 6000.00, 4000.00, 'Shared AC room for two students with attached bathroom and balcony. Each student gets individual study space.'),
    ('Double Sharing Non-AC', 2, false, true, false, '["bed", "study_table", "chair", "cupboard", "fan", "mattress"]'::jsonb, 4000.00, 2500.00, 'Economical double sharing room with fan and attached bathroom. Great for making friendships.'),
    ('Triple Sharing AC', 3, true, true, false, '["bed", "study_table", "chair", "cupboard", "AC", "fan", "mattress"]'::jsonb, 5000.00, 3000.00, 'AC room for three students with attached bathroom. Affordable option with modern amenities.'),
    ('Triple Sharing Non-AC', 3, false, true, false, '["bed", "study_table", "chair", "cupboard", "fan", "mattress"]'::jsonb, 3000.00, 2000.00, 'Budget-friendly triple sharing room with basic amenities. Perfect for cost-conscious students.')
) as room_types(type_name, occupancy, has_ac, has_attached_bathroom, has_balcony, furniture_included, monthly_fee, security_deposit, description)
ON CONFLICT DO NOTHING;

-- Insert sample rooms for each hostel
INSERT INTO public.hostel_rooms (college_id, hostel_id, room_type_id, room_number, floor_number, block_name, max_occupancy, room_status, special_features)
SELECT 
    h.college_id,
    h.id as hostel_id,
    rt.id as room_type_id,
    room_data.room_number,
    room_data.floor_number,
    room_data.block_name,
    rt.occupancy as max_occupancy,
    'available' as room_status,
    room_data.special_features
FROM public.hostels h
CROSS JOIN public.room_types rt
CROSS JOIN (
    -- Generate room numbers and details
    SELECT 
        '101' as room_number, 1 as floor_number, 'A Block' as block_name, '["corner_room", "garden_view"]'::jsonb as special_features
    UNION ALL SELECT '102', 1, 'A Block', '["main_road_view"]'::jsonb
    UNION ALL SELECT '103', 1, 'A Block', '["corner_room"]'::jsonb
    UNION ALL SELECT '201', 2, 'A Block', '["garden_view"]'::jsonb
    UNION ALL SELECT '202', 2, 'A Block', '[]'::jsonb
    UNION ALL SELECT '203', 2, 'A Block', '["corner_room"]'::jsonb
    UNION ALL SELECT '301', 3, 'B Block', '["corner_room", "terrace_access"]'::jsonb
    UNION ALL SELECT '302', 3, 'B Block', '["main_road_view"]'::jsonb
    UNION ALL SELECT '303', 3, 'B Block', '[]'::jsonb
    UNION ALL SELECT '401', 4, 'B Block', '["corner_room", "city_view"]'::jsonb
    UNION ALL SELECT '402', 4, 'B Block', '["terrace_access"]'::jsonb
) as room_data
WHERE h.college_id = rt.college_id
AND random() > 0.7 -- Only create some rooms to avoid too much data
ON CONFLICT (hostel_id, room_number) DO NOTHING;

-- Insert hostel fee structures
INSERT INTO public.fee_structures (college_id, fee_type, amount, academic_year, semester, user_type, is_active)
SELECT 
    c.id as college_id,
    fee_type,
    amount,
    academic_year,
    semester,
    user_type,
    is_active
FROM public.colleges c
CROSS JOIN (
    VALUES 
    ('Hostel Fee - Single AC', 8000.00, '2024-25', 'Fall', 'student', true),
    ('Hostel Fee - Single AC', 8000.00, '2024-25', 'Spring', 'student', true),
    ('Hostel Fee - Single Non-AC', 5000.00, '2024-25', 'Fall', 'student', true),
    ('Hostel Fee - Single Non-AC', 5000.00, '2024-25', 'Spring', 'student', true),
    ('Hostel Fee - Double Sharing AC', 6000.00, '2024-25', 'Fall', 'student', true),
    ('Hostel Fee - Double Sharing AC', 6000.00, '2024-25', 'Spring', 'student', true),
    ('Hostel Fee - Double Sharing Non-AC', 4000.00, '2024-25', 'Fall', 'student', true),
    ('Hostel Fee - Double Sharing Non-AC', 4000.00, '2024-25', 'Spring', 'student', true),
    ('Hostel Fee - Triple Sharing AC', 5000.00, '2024-25', 'Fall', 'student', true),
    ('Hostel Fee - Triple Sharing AC', 5000.00, '2024-25', 'Spring', 'student', true),
    ('Hostel Fee - Triple Sharing Non-AC', 3000.00, '2024-25', 'Fall', 'student', true),
    ('Hostel Fee - Triple Sharing Non-AC', 3000.00, '2024-25', 'Spring', 'student', true),
    ('Hostel Security Deposit', 5000.00, '2024-25', null, 'student', true),
    ('Mess Fee', 2500.00, '2024-25', null, 'student', true)
) as fees(fee_type, amount, academic_year, semester, user_type, is_active)
ON CONFLICT DO NOTHING;
