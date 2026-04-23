-- Chat and Notifications Feature Setup
-- Run this in Supabase SQL Editor

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'danger', 'chat')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS is disabled for now (matching current project pattern)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE notifications IS 'Stores system notifications and admin-to-user chat messages';

-- Grant permissions
GRANT ALL ON notifications TO authenticated, anon, service_role;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO authenticated, anon, service_role;
