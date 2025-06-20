/*
  # Create Gallery Tables

  1. New Tables
    - `captures`
      - `id` (uuid, primary key)
      - `filename` (text)
      - `file_path` (text)
      - `file_size` (bigint)
      - `mime_type` (text)
      - `captured_at` (timestamp)
      - `description` (text, optional)
      - `tags` (text array, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `captures` table
    - Add policies for public read access (since this is for RC car captures)
    - Add policies for authenticated users to create/update/delete
*/

CREATE TABLE IF NOT EXISTS captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint DEFAULT 0,
  mime_type text DEFAULT 'image/jpeg',
  captured_at timestamptz DEFAULT now(),
  description text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE captures ENABLE ROW LEVEL SECURITY;

-- Allow public read access for gallery viewing
CREATE POLICY "Allow public read access"
  ON captures
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert captures
CREATE POLICY "Allow authenticated users to insert"
  ON captures
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update their captures
CREATE POLICY "Allow authenticated users to update"
  ON captures
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete captures
CREATE POLICY "Allow authenticated users to delete"
  ON captures
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_captures_updated_at
  BEFORE UPDATE ON captures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_captures_captured_at ON captures(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_captures_tags ON captures USING GIN(tags);