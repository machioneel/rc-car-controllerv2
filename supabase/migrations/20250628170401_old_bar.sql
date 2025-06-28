/*
  # Create Device Logs Table

  1. New Tables
    - `device_logs`
      - `id` (uuid, primary key)
      - `timestamp` (timestamptz, when log was received)
      - `level` (text, log level: INFO, WARNING, ERROR, DEBUG)
      - `message` (text, log message content)
      - `device_id` (text, optional device identifier)
      - `created_at` (timestamptz, record creation time)

  2. Security
    - Enable RLS on `device_logs` table
    - Add policy for authenticated users to insert logs
    - Add policy for authenticated users to read logs
    - Add policy for authenticated users to delete logs (for cleanup)

  3. Indexes
    - Index on timestamp for efficient querying
    - Index on level for filtering
*/

CREATE TABLE IF NOT EXISTS device_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  level text NOT NULL DEFAULT 'INFO',
  message text NOT NULL,
  device_id text DEFAULT 'esp32_car',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE device_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert logs
CREATE POLICY "Allow authenticated users to insert logs"
  ON device_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to read logs
CREATE POLICY "Allow authenticated users to read logs"
  ON device_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to delete logs (for cleanup)
CREATE POLICY "Allow authenticated users to delete logs"
  ON device_logs
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_logs_timestamp ON device_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_logs_level ON device_logs(level);
CREATE INDEX IF NOT EXISTS idx_device_logs_device_id ON device_logs(device_id);

-- Create function to automatically delete old logs (keep only last 1000 entries)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM device_logs 
  WHERE id NOT IN (
    SELECT id FROM device_logs 
    ORDER BY timestamp DESC 
    LIMIT 1000
  );
END;
$$ LANGUAGE plpgsql;