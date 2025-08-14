-- Insert sample hostel facilities
INSERT INTO facilities (facility_name, facility_type, location, capacity, is_available, college_id) VALUES 
('Sunrise Hostel', 'hostel', 'North Campus', 120, true, (SELECT id FROM colleges LIMIT 1)),
('Moonlight Hostel', 'hostel', 'South Campus', 80, true, (SELECT id FROM colleges LIMIT 1)),
('Valley View Hostel', 'hostel', 'East Campus', 100, true, (SELECT id FROM colleges LIMIT 1)),
('Riverside Hostel', 'hostel', 'West Campus', 150, true, (SELECT id FROM colleges LIMIT 1)),
('Central Library', 'library', 'Central Campus', 500, true, (SELECT id FROM colleges LIMIT 1)),
('Sports Complex', 'sports', 'Main Campus', 200, true, (SELECT id FROM colleges LIMIT 1)),
('Cafeteria Block A', 'dining', 'North Campus', 300, true, (SELECT id FROM colleges LIMIT 1)),
('Medical Center', 'medical', 'Central Campus', 50, true, (SELECT id FROM colleges LIMIT 1));
