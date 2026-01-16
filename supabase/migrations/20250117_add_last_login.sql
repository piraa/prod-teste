-- Add last_login column to profiles table
-- This column tracks when the user last logged into the system
-- NULL means the user has never logged in

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT NULL;

-- Add comment to the column for documentation
COMMENT ON COLUMN profiles.last_login IS 'Timestamp of the user''s last login. NULL if never logged in.';
