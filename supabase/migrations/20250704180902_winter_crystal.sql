/*
  # Fix RLS policies for scraped_results table

  1. Security Updates
    - Drop existing policies that use incorrect uid() function
    - Create new policies using correct auth.uid() function
    - Ensure proper user isolation for all CRUD operations

  2. Policy Changes
    - Users can only view their own scraped results
    - Users can only insert results with their own user_id
    - Users can only update their own scraped results
    - Users can only delete their own scraped results
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own scraped results" ON scraped_results;
DROP POLICY IF EXISTS "Users can insert their own scraped results" ON scraped_results;
DROP POLICY IF EXISTS "Users can update their own scraped results" ON scraped_results;
DROP POLICY IF EXISTS "Users can delete their own scraped results" ON scraped_results;

-- Create new policies with correct auth.uid() function
CREATE POLICY "Users can view their own scraped results"
  ON scraped_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scraped results"
  ON scraped_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scraped results"
  ON scraped_results
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scraped results"
  ON scraped_results
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);