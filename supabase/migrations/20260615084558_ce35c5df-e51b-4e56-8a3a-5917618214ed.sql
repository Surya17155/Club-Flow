ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS face_descriptor jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS face_enrolled_at timestamptz;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS method text NOT NULL DEFAULT 'qr';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS attendance_mode text NOT NULL DEFAULT 'qr';