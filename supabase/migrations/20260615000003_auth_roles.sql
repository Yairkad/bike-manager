-- ============================================================
-- BIKE-native — Auth Roles
-- מוסיף role לטבלת profiles + trigger ליצירת פרופיל אוטומטי
-- ============================================================

-- ── Add role column to profiles ───────────────────────────────

ALTER TABLE profiles
  ADD COLUMN role text NOT NULL DEFAULT 'viewer'
  CHECK (role IN ('admin', 'viewer'));

-- ── Trigger: auto-create profile on user signup ───────────────
-- runs as SECURITY DEFINER so it can bypass RLS

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'viewer')
  )
  ON CONFLICT (id) DO UPDATE
    SET name       = EXCLUDED.name,
        role       = EXCLUDED.role,
        updated_at = now();
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Helper function: get current user's role ──────────────────
-- used by RLS policies below

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ── Update RLS: viewer = SELECT only, admin = full access ─────

-- Drop existing permissive policies
DROP POLICY IF EXISTS "auth full access" ON bikes;
DROP POLICY IF EXISTS "auth full access" ON return_events;
DROP POLICY IF EXISTS "auth full access" ON fault_events;
DROP POLICY IF EXISTS "auth full access" ON sales;
DROP POLICY IF EXISTS "auth full access" ON loans;
DROP POLICY IF EXISTS "auth full access" ON category_changes;
DROP POLICY IF EXISTS "auth full access" ON identity_changes;

-- bikes
CREATE POLICY "authenticated read"  ON bikes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin write"         ON bikes FOR INSERT WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "admin update"        ON bikes FOR UPDATE USING (public.current_user_role() = 'admin');
CREATE POLICY "admin delete"        ON bikes FOR DELETE USING (public.current_user_role() = 'admin');

-- return_events
CREATE POLICY "authenticated read"  ON return_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin write"         ON return_events FOR INSERT WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "admin update"        ON return_events FOR UPDATE USING (public.current_user_role() = 'admin');

-- fault_events
CREATE POLICY "authenticated read"  ON fault_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin write"         ON fault_events FOR INSERT WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "admin update"        ON fault_events FOR UPDATE USING (public.current_user_role() = 'admin');

-- sales
CREATE POLICY "authenticated read"  ON sales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin write"         ON sales FOR INSERT WITH CHECK (public.current_user_role() = 'admin');

-- loans
CREATE POLICY "authenticated read"  ON loans FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin write"         ON loans FOR INSERT WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "admin update"        ON loans FOR UPDATE USING (public.current_user_role() = 'admin');

-- category_changes
CREATE POLICY "authenticated read"  ON category_changes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin write"         ON category_changes FOR INSERT WITH CHECK (public.current_user_role() = 'admin');

-- identity_changes
CREATE POLICY "authenticated read"  ON identity_changes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin write"         ON identity_changes FOR INSERT WITH CHECK (public.current_user_role() = 'admin');

-- profiles: admin יכול לקרוא את כל הפרופילים (לתצוגת שם הצפייה בהגדרות)
DROP POLICY IF EXISTS "own profile select" ON profiles;
CREATE POLICY "read profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR public.current_user_role() = 'admin'
  );
