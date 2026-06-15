-- ============================================================
-- BIKE-native — Auth Roles  (idempotent — safe to re-run)
-- ============================================================

-- ── Add role column (safe if already exists) ──────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'viewer'
  CHECK (role IN ('admin', 'viewer'));

-- ── Trigger function (CREATE OR REPLACE = idempotent) ─────────
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Helper: current user role (CREATE OR REPLACE = idempotent) ─
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ── RLS: drop all old policies before recreating ──────────────

-- bikes
DROP POLICY IF EXISTS "auth full access"   ON bikes;
DROP POLICY IF EXISTS "authenticated read" ON bikes;
DROP POLICY IF EXISTS "admin write"        ON bikes;
DROP POLICY IF EXISTS "admin update"       ON bikes;
DROP POLICY IF EXISTS "admin delete"       ON bikes;

CREATE POLICY "authenticated read" ON bikes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin write"        ON bikes FOR INSERT WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "admin update"       ON bikes FOR UPDATE USING (public.current_user_role() = 'admin');
CREATE POLICY "admin delete"       ON bikes FOR DELETE USING (public.current_user_role() = 'admin');

-- return_events
DROP POLICY IF EXISTS "auth full access"   ON return_events;
DROP POLICY IF EXISTS "authenticated read" ON return_events;
DROP POLICY IF EXISTS "admin write"        ON return_events;
DROP POLICY IF EXISTS "admin update"       ON return_events;

CREATE POLICY "authenticated read" ON return_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin write"        ON return_events FOR INSERT WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "admin update"       ON return_events FOR UPDATE USING (public.current_user_role() = 'admin');

-- fault_events
DROP POLICY IF EXISTS "auth full access"   ON fault_events;
DROP POLICY IF EXISTS "authenticated read" ON fault_events;
DROP POLICY IF EXISTS "admin write"        ON fault_events;
DROP POLICY IF EXISTS "admin update"       ON fault_events;

CREATE POLICY "authenticated read" ON fault_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin write"        ON fault_events FOR INSERT WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "admin update"       ON fault_events FOR UPDATE USING (public.current_user_role() = 'admin');

-- sales
DROP POLICY IF EXISTS "auth full access"   ON sales;
DROP POLICY IF EXISTS "authenticated read" ON sales;
DROP POLICY IF EXISTS "admin write"        ON sales;

CREATE POLICY "authenticated read" ON sales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin write"        ON sales FOR INSERT WITH CHECK (public.current_user_role() = 'admin');

-- loans
DROP POLICY IF EXISTS "auth full access"   ON loans;
DROP POLICY IF EXISTS "authenticated read" ON loans;
DROP POLICY IF EXISTS "admin write"        ON loans;
DROP POLICY IF EXISTS "admin update"       ON loans;

CREATE POLICY "authenticated read" ON loans FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin write"        ON loans FOR INSERT WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "admin update"       ON loans FOR UPDATE USING (public.current_user_role() = 'admin');

-- category_changes
DROP POLICY IF EXISTS "auth full access"   ON category_changes;
DROP POLICY IF EXISTS "authenticated read" ON category_changes;
DROP POLICY IF EXISTS "admin write"        ON category_changes;

CREATE POLICY "authenticated read" ON category_changes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin write"        ON category_changes FOR INSERT WITH CHECK (public.current_user_role() = 'admin');

-- identity_changes
DROP POLICY IF EXISTS "auth full access"   ON identity_changes;
DROP POLICY IF EXISTS "authenticated read" ON identity_changes;
DROP POLICY IF EXISTS "admin write"        ON identity_changes;

CREATE POLICY "authenticated read" ON identity_changes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin write"        ON identity_changes FOR INSERT WITH CHECK (public.current_user_role() = 'admin');

-- profiles
DROP POLICY IF EXISTS "own profile select" ON profiles;
DROP POLICY IF EXISTS "read profiles"      ON profiles;
DROP POLICY IF EXISTS "auth full access"   ON profiles;

CREATE POLICY "read profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR public.current_user_role() = 'admin'
  );
