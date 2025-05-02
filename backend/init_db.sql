-- Drop existing tables if they exist (in correct order)
DROP TABLE IF EXISTS notification_read_status CASCADE;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS notification_groups;
DROP TABLE IF EXISTS user_groups;
DROP TABLE IF EXISTS template_groups CASCADE;
DROP TABLE IF EXISTS notification_templates;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS groups;

-- Create groups table
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_role_group BOOLEAN DEFAULT false
);

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('tudeng', 'programmijuht')),
  password VARCHAR(255) NOT NULL
);

-- Create user_groups table (many-to-many relationship)
CREATE TABLE user_groups (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES groups(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, group_id)
);

-- Create notifications table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category VARCHAR(50),
  priority VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- Create notification_templates table
CREATE TABLE notification_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  priority VARCHAR(20),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create template_groups table (many-to-many relationship)
CREATE TABLE template_groups (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES notification_templates(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES groups(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(template_id, group_id)
);

-- Create notification_groups table (many-to-many relationship)
CREATE TABLE notification_groups (
  id SERIAL PRIMARY KEY,
  notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES groups(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(notification_id, group_id)
);

-- Create favorites table
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, notification_id)
);

-- Create notification_read_status table
CREATE TABLE notification_read_status (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  notification_id INTEGER REFERENCES notifications(id),
  read BOOLEAN DEFAULT false,
  UNIQUE(user_id, notification_id)
);

-- Create role-based groups
INSERT INTO groups (name, description, is_role_group) VALUES
('Tudeng', 'All students', true),
('Programmijuht', 'All program managers', true);

-- Create regular groups
INSERT INTO groups (name, description) VALUES
('Grupp 1', 'Esimene õpperühm'),
('Grupp 2', 'Teine õpperühm'),
('Grupp 3', 'Kolmas õpperühm');

-- Insert users with password: password123
-- This password is: password123 (for testing)
INSERT INTO users (name, email, role, password) VALUES
('Õpilane', 'opilane@example.com', 'tudeng', '$2b$10$sGn5opMCNdlrzU7LfQP6/OVKdxJo32xWf5axiD.h1ahrgV0UIsD7m'),
('Teine Õpilane', 'opilane2@example.com', 'tudeng', '$2b$10$sGn5opMCNdlrzU7LfQP6/OVKdxJo32xWf5axiD.h1ahrgV0UIsD7m'),
('Programmijuht', 'programmijuht@example.com', 'programmijuht', '$2b$10$sGn5opMCNdlrzU7LfQP6/OVKdxJo32xWf5axiD.h1ahrgV0UIsD7m');

-- Assign users to role groups
INSERT INTO user_groups (user_id, group_id) VALUES
(1, 1), -- Õpilane to Tudeng group
(2, 1), -- Teine Õpilane to Tudeng group
(3, 2); -- Programmijuht to Programmijuht group

-- Assign users to regular groups
INSERT INTO user_groups (user_id, group_id) VALUES
(1, 3), -- Õpilane to Grupp 1
(2, 4), -- Teine Õpilane to Grupp 2
(1, 4); -- Õpilane also to Grupp 2 