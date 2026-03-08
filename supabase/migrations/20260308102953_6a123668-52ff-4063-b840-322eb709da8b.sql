
-- =============================================
-- IILM ClubSync Database Schema
-- =============================================

-- 1. App Roles Enum
CREATE TYPE public.app_role AS ENUM ('admin', 'president', 'vice_president', 'secretary', 'social_media_head', 'member');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  programme TEXT,
  section TEXT,
  year TEXT,
  semester TEXT,
  roll_no TEXT,
  phone TEXT,
  avatar_url TEXT,
  about TEXT,
  social_github TEXT,
  social_linkedin TEXT,
  social_twitter TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. User Roles table (separate as required)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Roles viewable by authenticated" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Clubs table
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  about TEXT,
  logo_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clubs viewable by all authenticated" ON public.clubs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage clubs" ON public.clubs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Club Members table
CREATE TABLE public.club_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members viewable by authenticated" ON public.club_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage club members" ON public.club_members
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'president'));

CREATE POLICY "Admins can update club members" ON public.club_members
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'president'));

CREATE POLICY "Admins can delete club members" ON public.club_members
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'president'));

-- 6. Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'Workshop',
  category TEXT NOT NULL DEFAULT 'Optional',
  access_type TEXT NOT NULL DEFAULT 'Open to Club',
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  qr_token TEXT UNIQUE,
  qr_ttl_minutes INTEGER DEFAULT 180,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events viewable by authenticated" ON public.events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Club admins can manage events" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = events.club_id
      AND user_id = auth.uid()
      AND role IN ('president', 'vice_president', 'secretary')
    )
  );

CREATE POLICY "Club admins can update events" ON public.events
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = events.club_id
      AND user_id = auth.uid()
      AND role IN ('president', 'vice_president', 'secretary')
    )
  );

CREATE POLICY "Club admins can delete events" ON public.events
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = events.club_id
      AND user_id = auth.uid()
      AND role IN ('president', 'vice_president', 'secretary')
    )
  );

-- 7. Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'present',
  manually_added BOOLEAN DEFAULT false,
  added_by UUID REFERENCES auth.users(id),
  UNIQUE (event_id, student_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.club_members cm ON cm.club_id = e.club_id
      WHERE e.id = attendance.event_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('president', 'vice_president', 'secretary')
    )
  );

CREATE POLICY "Attendance can be inserted by student or admin" ON public.attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.club_members cm ON cm.club_id = e.club_id
      WHERE e.id = attendance.event_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('president', 'vice_president', 'secretary')
    )
  );

CREATE POLICY "Admins can update attendance" ON public.attendance
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.club_members cm ON cm.club_id = e.club_id
      WHERE e.id = attendance.event_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('president', 'vice_president', 'secretary')
    )
  );

CREATE POLICY "Admins can delete attendance" ON public.attendance
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.club_members cm ON cm.club_id = e.club_id
      WHERE e.id = attendance.event_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('president', 'vice_president', 'secretary')
    )
  );

-- 8. Event Participants (for restricted events)
CREATE TABLE public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants viewable by authenticated" ON public.event_participants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage participants" ON public.event_participants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. Audit log for manual attendance changes
CREATE TABLE public.attendance_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attendance_id UUID REFERENCES public.attendance(id) ON DELETE SET NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON public.attendance_audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit log" ON public.attendance_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (performed_by = auth.uid());

-- 10. Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, programme, section, year, semester, roll_no, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'programme', ''),
    COALESCE(NEW.raw_user_meta_data->>'section', ''),
    COALESCE(NEW.raw_user_meta_data->>'year', ''),
    COALESCE(NEW.raw_user_meta_data->>'semester', ''),
    COALESCE(NEW.raw_user_meta_data->>'roll_no', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  -- Default role: member
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Indexes for performance
CREATE INDEX idx_club_members_club ON public.club_members(club_id);
CREATE INDEX idx_club_members_user ON public.club_members(user_id);
CREATE INDEX idx_events_club ON public.events(club_id);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_qr_token ON public.events(qr_token);
CREATE INDEX idx_attendance_event ON public.attendance(event_id);
CREATE INDEX idx_attendance_student ON public.attendance(student_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
