/*
  # Enhance AI analysis capabilities

  1. New Columns
    - `markdown_content` (text) - Store markdown version of content
    - `ai_insights` (jsonb) - Store additional AI-generated insights
    - `keywords` (jsonb) - Store extracted keywords
    - `sentiment` (text) - Store sentiment analysis
    - `firecrawl_metadata` (jsonb) - Store metadata from enhanced scraping

  2. Updates
    - Add check constraint for analysis_status values
    - Ensure all new columns have proper defaults
*/

-- Add new columns for enhanced AI analysis
DO $$
BEGIN
  -- Add markdown_content column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_results' AND column_name = 'markdown_content'
  ) THEN
    ALTER TABLE scraped_results ADD COLUMN markdown_content text;
  END IF;

  -- Add ai_insights column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_results' AND column_name = 'ai_insights'
  ) THEN
    ALTER TABLE scraped_results ADD COLUMN ai_insights jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Add keywords column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_results' AND column_name = 'keywords'
  ) THEN
    ALTER TABLE scraped_results ADD COLUMN keywords jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add sentiment column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_results' AND column_name = 'sentiment'
  ) THEN
    ALTER TABLE scraped_results ADD COLUMN sentiment text;
  END IF;

  -- Add analysis_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_results' AND column_name = 'analysis_status'
  ) THEN
    ALTER TABLE scraped_results ADD COLUMN analysis_status text DEFAULT 'pending';
  END IF;

  -- Add firecrawl_metadata column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_results' AND column_name = 'firecrawl_metadata'
  ) THEN
    ALTER TABLE scraped_results ADD COLUMN firecrawl_metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add check constraint for analysis_status if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'scraped_results_analysis_status_check'
    AND table_name = 'scraped_results'
  ) THEN
    ALTER TABLE scraped_results 
    ADD CONSTRAINT scraped_results_analysis_status_check 
    CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed'));
  END IF;
END $$;