-- This file creates all the tables for the UbuntuSkills database
-- Remove old tables first, in case we run this file again
DROP TABLE IF EXISTS Messages;
DROP TABLE IF EXISTS Bookings;
DROP TABLE IF EXISTS Availability;
DROP TABLE IF EXISTS Projects;
DROP TABLE IF EXISTS Verifications;
DROP TABLE IF EXISTS UserSkills;
DROP TABLE IF EXISTS Skills;
DROP TABLE IF EXISTS Users;

-- This table stores every person who signs up
CREATE TABLE Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    bio TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- This table stores the list of skills people can teach or learn
CREATE TABLE Skills (
    skill_id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_name TEXT NOT NULL UNIQUE,
    category TEXT
);

-- This table connects a user to a skill
-- It says if the user wants to teach that skill or learn it
CREATE TABLE UserSkills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('teach', 'learn')),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (skill_id) REFERENCES Skills(skill_id)
);

-- This table checks if a user really has the skill they claim
CREATE TABLE Verifications (
    verification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    verified_by TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (skill_id) REFERENCES Skills(skill_id)
);

-- This table stores a finished skill exchange between two people
CREATE TABLE Projects (
    project_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    description TEXT,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (skill_id) REFERENCES Skills(skill_id)
);

-- This table stores when a tutor is available to teach
CREATE TABLE Availability (
    availability_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    available_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_booked INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- This table stores when a learner books a tutor's available slot
CREATE TABLE Bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    availability_id INTEGER NOT NULL,
    learner_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (availability_id) REFERENCES Availability(availability_id),
    FOREIGN KEY (learner_id) REFERENCES Users(user_id),
    FOREIGN KEY (skill_id) REFERENCES Skills(skill_id)
);

-- This table stores chat messages sent between two users
CREATE TABLE Messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    message_text TEXT NOT NULL,
    sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES Users(user_id),
    FOREIGN KEY (receiver_id) REFERENCES Users(user_id)
);