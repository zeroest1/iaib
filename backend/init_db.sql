-- Drop existing tables if they exist (in correct order)
DROP TABLE IF EXISTS notification_read_status CASCADE;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'programmijuht')),
  password VARCHAR(255) NOT NULL
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

-- Insert a student user
INSERT INTO users (name, email, role, password) VALUES
('Õpilane', 'opilane@example.com', 'student', '$2b$10$sGn5opMCNdlrzU7LfQP6/OVKdxJo32xWf5axiD.h1ahrgV0UIsD7m');

-- Insert a programmijuht user
INSERT INTO users (name, email, role, password) VALUES
('Programmijuht', 'programmijuht@example.com', 'programmijuht', '$2b$10$sGn5opMCNdlrzU7LfQP6/OVKdxJo32xWf5axiD.h1ahrgV0UIsD7m'); 