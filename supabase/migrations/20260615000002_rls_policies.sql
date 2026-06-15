-- ============================================================
-- BIKE-native — Row Level Security
-- כל משתמש מאומת יכול לקרוא ולכתוב את כל הנתונים
-- (אפליקציה ארגונית — צוות אחד, מכשירים מרובים)
-- ============================================================

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bikes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE fault_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales            ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans            ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_changes ENABLE ROW LEVEL SECURITY;

-- ── profiles: כל משתמש רואה ומעדכן רק את הפרופיל שלו ─────────

CREATE POLICY "own profile select" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "own profile insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "own profile update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── שאר הטבלאות: כל משתמש מאומת ────────────────────────────

CREATE POLICY "auth full access" ON bikes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth full access" ON return_events
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth full access" ON fault_events
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth full access" ON sales
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth full access" ON loans
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth full access" ON category_changes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth full access" ON identity_changes
  FOR ALL USING (auth.role() = 'authenticated');
