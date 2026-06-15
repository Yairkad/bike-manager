ALTER TABLE bikes
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS year integer,
  ADD COLUMN IF NOT EXISTS has_digital_display boolean;
