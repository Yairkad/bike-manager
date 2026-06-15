-- ============================================================
-- BIKE-native — Initial Schema
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────

CREATE TYPE bike_category AS ENUM (
  'new',       -- חדש
  'out',       -- יצא לרוכב
  'returned',  -- חזר מרוכב
  'for_sale',  -- למכירה
  'sold'       -- נמכר
);

CREATE TYPE bike_status AS ENUM ('ok', 'faulty');

CREATE TYPE vehicle_mode AS ENUM (
  'limited',   -- מוגבל מהירות (תקין)
  'unlocked'   -- פרוץ (תקלה)
);

CREATE TYPE ituran_status AS ENUM ('new', 'old', 'none');

-- ── Profiles (extends Supabase Auth) ─────────────────────────

CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Bikes ─────────────────────────────────────────────────────

CREATE TABLE bikes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_number   text        NOT NULL,
  frame_number text,
  license_plate text,
  manufacturer text,
  category     bike_category NOT NULL DEFAULT 'new',
  status       bike_status   NOT NULL DEFAULT 'ok',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  repaired_at  timestamptz,
  created_by   uuid REFERENCES profiles(id)
);

-- org_number unique among non-sold bikes
-- (sold bikes free up the number for reuse)
CREATE UNIQUE INDEX idx_bikes_org_number_active
  ON bikes(org_number)
  WHERE category != 'sold';

CREATE INDEX idx_bikes_category   ON bikes(category);
CREATE INDEX idx_bikes_status     ON bikes(status);
CREATE INDEX idx_bikes_org_number ON bikes(org_number);

-- ── Return Events (קליטה מרוכב) ──────────────────────────────

CREATE TABLE return_events (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id                      uuid NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  received_at                  timestamptz NOT NULL DEFAULT now(),
  battery_returned             boolean NOT NULL DEFAULT false,
  charger_returned             boolean NOT NULL DEFAULT false,
  chain_returned               boolean NOT NULL DEFAULT false,
  lock_returned                boolean NOT NULL DEFAULT false,
  seat_lock_returned           boolean NOT NULL DEFAULT false,
  all_keys_returned            boolean NOT NULL DEFAULT false,
  missing_keys                 text[]  NOT NULL DEFAULT '{}',
  missing_keys_other           text,
  medical_equipment_returned   boolean NOT NULL DEFAULT false,
  medical_equipment_description text
);

CREATE INDEX idx_return_events_bike_id ON return_events(bike_id);

-- ── Fault Events (בדיקת תקינות) ──────────────────────────────

CREATE TABLE fault_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id             uuid NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  brake_pads_front    boolean NOT NULL DEFAULT false,
  brake_pads_rear     boolean NOT NULL DEFAULT false,
  brake_discs_front   boolean NOT NULL DEFAULT false,
  brake_discs_rear    boolean NOT NULL DEFAULT false,
  brake_oil_front     boolean NOT NULL DEFAULT false,
  brake_oil_rear      boolean NOT NULL DEFAULT false,
  front_tire          boolean NOT NULL DEFAULT false,
  rear_tire           boolean NOT NULL DEFAULT false,
  front_puncture      boolean NOT NULL DEFAULT false,
  rear_puncture       boolean NOT NULL DEFAULT false,
  front_light         boolean NOT NULL DEFAULT false,
  rear_light          boolean NOT NULL DEFAULT false,
  front_blinker       boolean NOT NULL DEFAULT false,
  rear_blinker        boolean NOT NULL DEFAULT false,
  horn                boolean NOT NULL DEFAULT false,
  motor_fault         boolean NOT NULL DEFAULT false,
  controller_fault    boolean NOT NULL DEFAULT false,
  display_fault       boolean NOT NULL DEFAULT false,
  vehicle_mode        vehicle_mode   NOT NULL DEFAULT 'limited',
  ituran              ituran_status  NOT NULL DEFAULT 'none',
  notes               text,
  resolved_at         timestamptz
);

CREATE INDEX idx_fault_events_bike_id  ON fault_events(bike_id);
CREATE INDEX idx_fault_events_open     ON fault_events(bike_id) WHERE resolved_at IS NULL;

-- ── Sales (מכירות) ────────────────────────────────────────────

CREATE TABLE sales (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id          uuid NOT NULL REFERENCES bikes(id) ON DELETE RESTRICT,
  sold_at          timestamptz NOT NULL DEFAULT now(),
  price            numeric(10, 2) NOT NULL,
  notes            text,
  buyer_name       text NOT NULL,
  buyer_id_number  text NOT NULL,
  buyer_phone      text NOT NULL
);

CREATE INDEX idx_sales_bike_id ON sales(bike_id);

-- ── Loans (השאלות) ────────────────────────────────────────────

CREATE TABLE loans (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id                 uuid NOT NULL REFERENCES bikes(id) ON DELETE RESTRICT,
  loaned_at               timestamptz NOT NULL DEFAULT now(),
  return_due_date         date        NOT NULL,
  returned_at             timestamptz,
  alert_days_before       integer     NOT NULL DEFAULT 3,
  borrower_name           text NOT NULL,
  borrower_id_number      text NOT NULL,
  borrower_phone          text NOT NULL,
  notes                   text,
  -- ציוד שיצא עם הכלי
  loaned_battery          boolean NOT NULL DEFAULT false,
  loaned_charger          boolean NOT NULL DEFAULT false,
  loaned_chain            boolean NOT NULL DEFAULT false,
  loaned_lock             boolean NOT NULL DEFAULT false,
  loaned_seat_lock        boolean NOT NULL DEFAULT false,
  loaned_all_keys         boolean NOT NULL DEFAULT false,
  loaned_missing_keys     text[]  NOT NULL DEFAULT '{}',
  loaned_missing_keys_other text,
  loaned_medical          boolean NOT NULL DEFAULT false,
  loaned_medical_desc     text
);

CREATE INDEX idx_loans_bike_id ON loans(bike_id);
CREATE INDEX idx_loans_active  ON loans(bike_id)           WHERE returned_at IS NULL;
CREATE INDEX idx_loans_due     ON loans(return_due_date)   WHERE returned_at IS NULL;

-- ── Category Changes (log) ────────────────────────────────────

CREATE TABLE category_changes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id       uuid NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  changed_at    timestamptz  NOT NULL DEFAULT now(),
  from_category bike_category,
  to_category   bike_category NOT NULL,
  changed_by    uuid REFERENCES profiles(id)
);

CREATE INDEX idx_category_changes_bike_id ON category_changes(bike_id);

-- ── Identity Changes (log) ────────────────────────────────────

CREATE TABLE identity_changes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id    uuid NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  changed_at timestamptz NOT NULL DEFAULT now(),
  field      text NOT NULL CHECK (field IN ('org_number', 'frame_number', 'license_plate', 'manufacturer')),
  old_value  text,
  new_value  text,
  changed_by uuid REFERENCES profiles(id)
);

CREATE INDEX idx_identity_changes_bike_id ON identity_changes(bike_id);

-- ── Triggers — auto-update updated_at ─────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bikes_updated_at
  BEFORE UPDATE ON bikes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Trigger — auto-create profile on signup ───────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
