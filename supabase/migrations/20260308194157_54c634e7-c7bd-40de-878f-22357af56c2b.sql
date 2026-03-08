
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS social_instagram text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_gmail text DEFAULT NULL;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS social_twitter,
  DROP COLUMN IF EXISTS social_github;
