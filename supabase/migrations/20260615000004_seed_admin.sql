-- ============================================================
-- BIKE-native — Seed: Admin user
-- הרץ פעם אחת בלבד לאחר יצירת הפרויקט
-- ============================================================

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'yk74re@gmail.com',
  crypt('Hatzala2025!', gen_salt('bf', 10)),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"מנהל"}',
  false
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'yk74re@gmail.com'
);

-- הגדר כ-admin (הטריגר יצור את הפרופיל אוטומטית, רק צריך לשנות role)
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'yk74re@gmail.com');
