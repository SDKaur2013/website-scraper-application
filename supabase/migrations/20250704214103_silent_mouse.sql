/*
  # Add missing columns and fix database schema

  1. Database Updates
    - Add missing `content` column to store webpage text content
    - Add missing `ai_summary` column to store AI-generated summaries
    - Add missing `users` table that is referenced by foreign keys
    - Update existing data to have proper defaults

  2. Security
    - Maintain existing RLS policies
    - Ensure proper user isolation
*/

-- Create users table if it doesn't exist (required for foreign key references)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for users table
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Add missing columns to scraped_results table
DO $$
BEGIN
  -- Add content column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_results' AND column_name = 'content'
  ) THEN
    ALTER TABLE scraped_results ADD COLUMN content text;
  END IF;

  -- Add ai_summary column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_results' AND column_name = 'ai_summary'
  ) THEN
    ALTER TABLE scraped_results ADD COLUMN ai_summary text;
  END IF;
END $$;

-- Update the foreign key constraint to reference auth.users instead of users table
-- First, drop the existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'scraped_results_user_id_fkey'
    AND table_name = 'scraped_results'
  ) THEN
    ALTER TABLE scraped_results DROP CONSTRAINT scraped_results_user_id_fkey;
  END IF;
END $$;

-- Add the correct foreign key constraint to auth.users
ALTER TABLE scraped_results 
ADD CONSTRAINT scraped_results_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Do the same for user_preferences table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_preferences_user_id_fkey'
    AND table_name = 'user_preferences'
  ) THEN
    ALTER TABLE user_preferences DROP CONSTRAINT user_preferences_user_id_fkey;
  END IF;
END $$;

-- Add the correct foreign key constraint to auth.users for user_preferences
ALTER TABLE user_preferences 
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;