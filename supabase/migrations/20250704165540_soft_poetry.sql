/*
  # Create scraped results table

  1. New Tables
    - `scraped_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `url` (text, the scraped website URL)
      - `title` (text, website title)
      - `headings` (jsonb, array of headings)
      - `links` (jsonb, array of link objects)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `scraped_results` table
    - Add policy for authenticated users to manage their own scraped results
*/

CREATE TABLE IF NOT EXISTS scraped_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text,
  headings jsonb DEFAULT '[]'::jsonb,
  links jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE scraped_results ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS scraped_results_user_id_idx ON scraped_results(user_id);
CREATE INDEX IF NOT EXISTS scraped_results_created_at_idx ON scraped_results(created_at DESC);