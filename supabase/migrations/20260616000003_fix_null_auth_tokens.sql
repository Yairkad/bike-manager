-- ============================================================
-- Fix: users created via direct `INSERT INTO auth.users` (e.g.
-- 20260615000004_seed_admin.sql) leave token columns NULL instead of
-- ''. GoTrue's Go driver can't scan NULL into these string fields,
-- causing every login for that user to fail with
-- "Database error querying schema" (500) — not an app/RLS bug.
-- Going forward, prefer creating users via the Supabase Dashboard
-- "Add user" flow, which sets these correctly.
-- ============================================================

UPDATE auth.users SET
  confirmation_token         = COALESCE(confirmation_token, ''),
  recovery_token             = COALESCE(recovery_token, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change               = COALESCE(email_change, ''),
  phone_change                = COALESCE(phone_change, ''),
  phone_change_token          = COALESCE(phone_change_token, ''),
  reauthentication_token      = COALESCE(reauthentication_token, '')
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change_token_new IS NULL
   OR email_change_token_current IS NULL
   OR email_change IS NULL
   OR phone_change IS NULL
   OR phone_change_token IS NULL
   OR reauthentication_token IS NULL;
