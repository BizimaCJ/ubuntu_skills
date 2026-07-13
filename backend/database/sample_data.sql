-- This file adds fake data into the tables, just for testing
-- None of this is real user data

-- Add some fake users
INSERT INTO Users (name, email, password, bio) VALUES
('Aline Uwase', 'aline.uwase@example.com', 'hashed_password_1', 'Second year student, loves graphic design.'),
('Jean Baptiste', 'jean.baptiste@example.com', 'hashed_password_2', 'Coding enthusiast, wants to learn French.'),
('Grace Mukamana', 'grace.mukamana@example.com', 'hashed_password_3', 'Small business owner, needs help with logos.'),
('Eric Niyonzima', 'eric.niyonzima@example.com', 'hashed_password_4', 'Math tutor, wants to learn graphic design.'),
('Sarah Umutoni', 'sarah.umutoni@example.com', 'hashed_password_5', 'French teacher, curious about coding.');

-- Add some fake skills
INSERT INTO Skills (skill_name, category) VALUES
('Graphic Design', 'Design'),
('Python Programming', 'Coding'),
('French Language', 'Language'),
('Mathematics Tutoring', 'Education'),
('Logo Design', 'Design');

-- Connect users to skills
-- This says who teaches what and who wants to learn what
INSERT INTO UserSkills (user_id, skill_id, type) VALUES
(1, 1, 'teach'),
(1, 4, 'learn'),
(2, 2, 'teach'),
(2, 3, 'learn'),
(3, 5, 'learn'),
(4, 4, 'teach'),
(4, 1, 'learn'),
(5, 3, 'teach'),
(5, 2, 'learn');

-- Add some fake verification records
INSERT INTO Verifications (user_id, skill_id, status, verified_by) VALUES
(1, 1, 'approved', 'admin_one'),
(2, 2, 'approved', 'admin_one'),
(4, 4, 'pending', NULL),
(5, 3, 'approved', 'admin_two');

-- Add some fake completed skill exchanges
INSERT INTO Projects (user_id, skill_id, description, date) VALUES
(1, 4, 'Aline received a math tutoring session from Eric.', '2026-06-10'),
(2, 3, 'Jean had a French practice session with Sarah.', '2026-06-12'),
(4, 1, 'Eric learned basic logo design from Aline.', '2026-06-15');