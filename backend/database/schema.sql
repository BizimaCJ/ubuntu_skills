-- Ubuntu Skills database schema
-- This file is the single source of truth for the data model.
-- Only backend/services/database_service ever opens this database directly.

PRAGMA foreign_keys = ON;

CREATE TABLE Degrees (
    degree_id INTEGER PRIMARY KEY AUTOINCREMENT,
    degree_name TEXT NOT NULL UNIQUE
);

CREATE TABLE Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    degree_id INTEGER REFERENCES Degrees(degree_id),
    class_year INTEGER,
    verification_method TEXT NOT NULL CHECK (verification_method IN ('school_email', 'document')),
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_document_path TEXT,
    credits_average REAL NOT NULL DEFAULT 0,
    credits_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE SkillCategories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name TEXT NOT NULL UNIQUE
);

CREATE TABLE UserSkills (
    user_skill_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES Users(user_id),
    category_id INTEGER NOT NULL REFERENCES SkillCategories(category_id),
    description TEXT NOT NULL,
    skill_type TEXT NOT NULL CHECK (skill_type IN ('teach', 'learn')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE Sessions (
    session_id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL REFERENCES Users(user_id),
    learner_id INTEGER NOT NULL REFERENCES Users(user_id),
    user_skill_id INTEGER NOT NULL REFERENCES UserSkills(user_skill_id),
    scheduled_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'cancelled', 'completed')),
    cancelled_by INTEGER REFERENCES Users(user_id),
    completed_by_teacher INTEGER NOT NULL DEFAULT 0,
    completed_by_learner INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE Reviews (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL UNIQUE REFERENCES Sessions(session_id),
    reviewer_id INTEGER NOT NULL REFERENCES Users(user_id),
    reviewee_id INTEGER NOT NULL REFERENCES Users(user_id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    weight REAL NOT NULL DEFAULT 1.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE GroupSessions (
    group_session_id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL REFERENCES Users(user_id),
    category_id INTEGER NOT NULL REFERENCES SkillCategories(category_id),
    topic TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 5,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE GroupSessionMembers (
    group_session_id INTEGER NOT NULL REFERENCES GroupSessions(group_session_id),
    user_id INTEGER NOT NULL REFERENCES Users(user_id),
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (group_session_id, user_id)
);

CREATE TABLE Conversations (
    conversation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    is_group INTEGER NOT NULL DEFAULT 0,
    group_session_id INTEGER REFERENCES GroupSessions(group_session_id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE ConversationParticipants (
    conversation_id INTEGER NOT NULL REFERENCES Conversations(conversation_id),
    user_id INTEGER NOT NULL REFERENCES Users(user_id),
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE Messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL REFERENCES Conversations(conversation_id),
    sender_id INTEGER NOT NULL REFERENCES Users(user_id),
    message_text TEXT NOT NULL,
    sent_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE Notifications (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES Users(user_id),
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'session_requested',
        'session_approved',
        'session_declined',
        'session_cancelled',
        'session_reminder',
        'review_prompt',
        'group_session_announced',
        'new_message'
    )),
    message TEXT NOT NULL,
    related_session_id INTEGER REFERENCES Sessions(session_id),
    related_group_session_id INTEGER REFERENCES GroupSessions(group_session_id),
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);